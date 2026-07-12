-- 016_hero_image.sql
--
-- Home-page hero image, uploaded and cropped from /admin/settings. Stored in
-- the product-images bucket under site/. Empty string means "use the bundled
-- default" (/images/hero-framed-print.jpg), so the storefront never breaks if
-- this is unset.

alter table company_settings
  add column hero_image_url text not null default '';
