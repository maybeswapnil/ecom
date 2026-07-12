-- 017_hero_product_link.sql
--
-- Optional product reference for the home-page hero image: clicking the hero
-- navigates to this product. Null means the hero is not clickable. Cleared
-- automatically if the referenced product is deleted.

alter table company_settings
  add column hero_product_id uuid references products(id) on delete set null;
