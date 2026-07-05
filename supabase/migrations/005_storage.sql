-- 005_storage.sql — product-images bucket (PLAN.md §4: public read, service-role writes)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "public read product-images" on storage.objects
for select to anon, authenticated
using (bucket_id = 'product-images');

-- No insert/update/delete policies for anon/authenticated: uploads go through
-- the admin's service-role client only (SPEC.md §2.7 uploadProductImage).
