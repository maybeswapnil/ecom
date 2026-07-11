-- 012_featured_products.sql
--
-- Lets admins choose which products show in the home page's "From the
-- collection" section, instead of it always being the 3 most recent.
-- featured_order controls display order; enforced to at most 6 featured
-- products (any count from 1 to 6) at the application layer (admin action),
-- not via a DB constraint, since "at most 6" isn't cleanly expressible as one.

alter table products add column is_featured boolean not null default false;
alter table products add column featured_order int;

create index products_featured_idx on products (featured_order) where is_featured;
