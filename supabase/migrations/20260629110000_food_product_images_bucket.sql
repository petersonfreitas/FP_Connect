insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'food-product-images',
  'food-product-images',
  true,
  3145728,
  array['image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

drop policy if exists food_product_images_public_select on storage.objects;
create policy food_product_images_public_select
on storage.objects for select
to public
using (bucket_id = 'food-product-images');
