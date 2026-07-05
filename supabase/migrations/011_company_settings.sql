-- 011_company_settings.sql
--
-- Single-row table for company/address details used in emails and invoices.
-- Editable from /admin/settings. Read only via the service-role client
-- (same pattern as everything else in the admin panel) — no RLS policies
-- needed since anon/authenticated never query this table directly.

create table company_settings (
  id             int primary key default 1,
  company_name   text not null default 'Prints Company',
  address_line1  text not null default '',
  address_line2  text not null default '',
  city           text not null default '',
  state          text not null default '',
  pincode        text not null default '',
  support_email  text not null default 'info@printscompany.in',
  support_phone  text not null default '',
  updated_at     timestamptz not null default now(),
  constraint company_settings_singleton check (id = 1)
);

insert into company_settings (id) values (1);
