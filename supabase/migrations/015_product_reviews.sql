-- 015_product_reviews.sql
--
-- Star ratings/reviews, restricted to customers with a delivered order that
-- actually contains the product. Submission is gated at the application
-- layer (order status = 'delivered' + order_items match + receipt token),
-- not by a DB constraint, since that check spans multiple tables.
--
-- Reviews start 'pending' and only 'approved' rows are readable by anon —
-- keeps unmoderated text off the public product page and out of JSON-LD.

create table product_reviews (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products,
  order_id      uuid not null references orders,
  rating        int not null check (rating between 1 and 5),
  body          text,
  reviewer_name text not null,
  status        text not null default 'pending', -- pending | approved | rejected
  created_at    timestamptz not null default now()
);

-- One review per product per order — resubmission overwrites via upsert, not duplicate rows.
create unique index product_reviews_one_per_order on product_reviews (order_id, product_id);
create index product_reviews_product_idx on product_reviews (product_id) where status = 'approved';

alter table product_reviews enable row level security;

create policy anon_read_approved_reviews on product_reviews
  for select to anon using (status = 'approved');
-- Inserts/updates (submission, moderation) go through the service-role client only.
