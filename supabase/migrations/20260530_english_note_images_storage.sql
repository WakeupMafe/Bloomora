-- Bloomora · Storage para imágenes inline de English Notes (URLs en content_html)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'english-note-images',
  'english-note-images',
  true,
  3145728,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "english_note_images_anon_select" on storage.objects;
drop policy if exists "english_note_images_anon_insert" on storage.objects;
drop policy if exists "english_note_images_anon_update" on storage.objects;
drop policy if exists "english_note_images_anon_delete" on storage.objects;

create policy "english_note_images_anon_select"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'english-note-images');

create policy "english_note_images_anon_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'english-note-images');

create policy "english_note_images_anon_update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'english-note-images')
with check (bucket_id = 'english-note-images');

create policy "english_note_images_anon_delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'english-note-images');
