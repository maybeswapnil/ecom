-- 013_payment_hardening.sql
--
-- 1) decrement_stock(): the paid webhook previously read stock_qty and wrote back a value
--    computed from the stale read — two concurrent webhook deliveries could lose a decrement.
--    This RPC does the decrement in a single guarded UPDATE, so it is atomic. Returns true
--    when the decrement applied, null when stock was insufficient (caller flags oversold).
--
-- 2) orders.amount_mismatch: set when a captured payment's amount does not match the order
--    total (e.g. partial payments enabled on the Razorpay account). The order is left pending
--    for manual review instead of being marked paid.

alter table orders add column amount_mismatch boolean not null default false;

create or replace function decrement_stock(p_variant_id uuid, p_qty int)
returns boolean
language sql
security definer
set search_path = public
as $$
  update product_variants
  set stock_qty = stock_qty - p_qty
  where id = p_variant_id and stock_qty >= p_qty
  returning true;
$$;
