-- 001_core.sql — catalog, orders, webhook idempotency ledger (PLAN.md §4)

create extension if not exists pgcrypto;

create table products (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  description text,
  story       text,
  tags        text[] default '{}',
  images      jsonb not null default '[]',
  status      text not null default 'draft', -- draft | live | archived
  created_at  timestamptz default now()
);

create table product_variants (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references products,
  sku              text unique not null,
  size_label       text not null,
  frame_finish     text not null,
  price_paise      int  not null,
  compare_at_paise int,
  stock_qty        int  not null default 0,
  weight_g         int,
  width_mm         int,
  height_mm        int,
  depth_mm         int,
  active           boolean not null default true
);

create table orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text unique not null,
  status              text not null default 'pending',
  email               text not null,
  phone               text not null,
  shipping_address    jsonb not null,
  subtotal_paise      int not null,
  shipping_paise      int not null default 0,
  discount_paise      int not null default 0,
  total_paise         int not null,
  razorpay_order_id   text unique,
  razorpay_payment_id text,
  purchase_event_id   text not null,
  attribution         jsonb default '{}',
  created_at          timestamptz default now(),
  paid_at             timestamptz
);

create table order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders,
  variant_id       uuid not null references product_variants,
  title_snapshot   text not null,
  sku_snapshot     text not null,
  unit_price_paise int not null,
  qty              int not null
);

create table webhook_events (
  id           text primary key,
  payload      jsonb not null,
  processed_at timestamptz default now()
);

-- Row Level Security
alter table products enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table webhook_events enable row level security;

create policy anon_read_live_products on products
  for select to anon using (status = 'live');

create policy anon_read_active_variants on product_variants
  for select to anon using (
    active = true
    and exists (select 1 from products p where p.id = product_id and p.status = 'live')
  );

-- orders / order_items / webhook_events: no anon policies (service-role only, per SPEC.md §10)
