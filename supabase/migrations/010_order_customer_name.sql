-- 010_order_customer_name.sql
--
-- Customer name was collected at checkout (used only as Razorpay prefill) but
-- never persisted, so emails couldn't personalize the greeting. Backfilled as
-- nullable since existing orders have no name on file.

alter table orders add column customer_name text;
