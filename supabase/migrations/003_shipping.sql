-- 003_shipping.sql — NimbusPost shipments + serviceability cache (SPEC.md §5.6)

create table shipments (
  id                     uuid primary key default gen_random_uuid(),
  order_id               uuid not null references orders,
  nimbuspost_shipment_id text,
  awb                    text unique,
  courier_id             text,
  courier_name           text,
  label_url              text,
  status                 text not null default 'booked', -- §5.5 vocabulary
  shipping_cost_paise    int,
  tracking_events        jsonb not null default '[]',
  active                 boolean not null default true,
  booked_at              timestamptz default now(),
  shipped_at             timestamptz,
  delivered_at           timestamptz
);
create unique index one_active_shipment_per_order on shipments (order_id) where active;

create table serviceability_cache (
  pincode       text not null,
  weight_bucket int  not null,
  serviceable   boolean not null,
  checked_at    timestamptz default now(),
  primary key (pincode, weight_bucket)
);

alter table shipments enable row level security;
alter table serviceability_cache enable row level security;
-- no anon policies on either (service-role only)
