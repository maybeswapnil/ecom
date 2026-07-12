-- 014_offers.sql
--
-- Offers become data instead of compile-time constants (lib/config.ts). Generalized table so
-- future offer types (percent_off, coupon) slot in without a redesign; today only
-- 'free_shipping' exists. Service-role only, same pattern as company_settings — the storefront
-- reads offers exclusively through server code, never directly from the browser.

create table offers (
  id                 uuid primary key default gen_random_uuid(),
  type               text not null, -- 'free_shipping' (future: 'percent_off', 'coupon')
  name               text not null,
  active             boolean not null default false,
  min_subtotal_paise int not null check (min_subtotal_paise >= 0),
  starts_at          timestamptz,
  ends_at            timestamptz,
  updated_by         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint offers_window check (starts_at is null or ends_at is null or ends_at > starts_at)
);

-- At most one active offer per type — prevents ambiguous/stacking rules at quote time.
create unique index offers_one_active_per_type on offers (type) where active;

alter table offers enable row level security;
-- no anon/authenticated policies: service-role only

-- The flat rate is a store setting, not an offer.
alter table company_settings add column shipping_flat_paise int not null default 14900;

-- Audit trail: which offer zeroed shipping on this order ("why did this ship free?").
alter table orders add column applied_offer_id uuid references offers;

-- Seed with the previously hardcoded rule so behavior is identical on deploy.
insert into offers (type, name, active, min_subtotal_paise)
values ('free_shipping', 'Free insured shipping', true, 750000);
