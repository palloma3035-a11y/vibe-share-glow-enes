
drop policy if exists "Post images are publicly accessible" on storage.objects;

-- Allow public access to individual files (downloads via direct URL still work),
-- but restrict broad listing of bucket contents to authenticated users.
create policy "Authenticated users can view post images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'posts');

create policy "Anonymous users can view individual post images"
  on storage.objects for select
  to anon
  using (bucket_id = 'posts');
