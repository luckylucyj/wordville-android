-- Wordville private image storage. Apply only to the Wordville project.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wordville-images', 'wordville-images', false, 5242880,
 array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "wordville_images_select_own" on storage.objects for select to authenticated
using (bucket_id = 'wordville-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "wordville_images_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'wordville-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "wordville_images_update_own" on storage.objects for update to authenticated
using (bucket_id = 'wordville-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'wordville-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "wordville_images_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'wordville-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
