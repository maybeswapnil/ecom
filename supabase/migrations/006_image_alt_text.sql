-- 006_image_alt_text.sql — migrate products.images from string[] to {url, alt}[]
-- so the admin image manager can enforce alt text per SPEC.md §6/§9.3.

update products
set images = (
  select coalesce(
    jsonb_agg(
      jsonb_build_object('url', img, 'alt', title || ' — framed photographic print')
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements_text(images) as img
)
where jsonb_typeof(images) = 'array'
  and (
    select count(*)
    from jsonb_array_elements(images) as elem
    where jsonb_typeof(elem) = 'string'
  ) > 0;
