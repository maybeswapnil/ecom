-- 002_lifecycle.sql — order lifecycle columns, history, refunds, rate limiting (SPEC.md §4.7)

alter table orders
  add column client_verified_at timestamptz,
  add column idempotency_key   uuid unique,
  add column payment_attempts  jsonb not null default '[]',
  add column emails_sent       jsonb not null default '{}',
  add column effects           jsonb not null default '{}',
  add column oversold             boolean not null default false,
  add column partially_refunded   boolean not null default false,
  add column paid_after_cancel    boolean not null default false,
  add column cancelled_reason  text,
  add column internal_notes    text not null default '';

create sequence order_number_seq start 1001;

create table order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders,
  from_status text not null,
  to_status   text not null,
  actor       text not null, -- 'webhook' | 'nimbuspost' | 'system' | 'admin:<email>'
  note        text,
  created_at  timestamptz default now()
);

create table refunds (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders,
  razorpay_refund_id text unique not null,
  amount_paise       int not null,
  restocked          boolean not null default false,
  created_at         timestamptz default now()
);

create table rate_limits (
  key          text not null,
  window_start timestamptz not null,
  count        int not null default 1,
  primary key (key, window_start)
);

create or replace function check_rate_limit(p_key text, p_max int, p_window_secs int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_secs) * p_window_secs);
  v_count int;
begin
  insert into rate_limits (key, window_start, count)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start) do update set count = rate_limits.count + 1
  returning count into v_count;

  return v_count <= p_max;
end;
$$;

alter table order_status_history enable row level security;
alter table refunds enable row level security;
alter table rate_limits enable row level security;
-- no anon policies on any of the above (service-role only)
