-- 004_order_number_rpc.sql — RPC wrapper so PostgREST can call nextval() on order_number_seq.

create or replace function nextval_order_number()
returns text
language sql
security definer
set search_path = public
as $$
  select 'FP-' || nextval('order_number_seq')::text;
$$;
