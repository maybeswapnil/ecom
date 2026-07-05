-- 007_authenticated_catalog_read.sql
--
-- Bug: storefront catalog reads use the cookie-aware anon-key client (lib/supabase/server.ts),
-- which is also used for admin auth checks. Once a browser holds a Supabase Auth session
-- (i.e. is logged into /admin), Supabase evaluates requests as the `authenticated` role instead
-- of `anon` — but 001_core.sql only granted SELECT on live products/active variants to `anon`.
-- RLS then silently returns zero rows for any logged-in admin browsing the live storefront,
-- surfacing as empty product grids / 404s on product pages.
--
-- Fix: grant the same read policy to `authenticated`, so an admin session can still browse
-- the storefront exactly like an anonymous shopper would.

create policy authenticated_read_live_products on products
  for select to authenticated using (status = 'live');

create policy authenticated_read_active_variants on product_variants
  for select to authenticated using (
    active = true
    and exists (select 1 from products p where p.id = product_id and p.status = 'live')
  );
