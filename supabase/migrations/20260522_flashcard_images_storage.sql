-- Bloomora · Storage bucket para imágenes de English Flashcards
-- Ejecutar en Supabase → SQL Editor si la subida falla por bucket/políticas.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'flashcard-images',
  'flashcard-images',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Políticas (modo simple Bloomora: rol anon sin Supabase Auth en el cliente)
drop policy if exists "flashcard_images_anon_select" on storage.objects;
drop policy if exists "flashcard_images_anon_insert" on storage.objects;
drop policy if exists "flashcard_images_anon_update" on storage.objects;
drop policy if exists "flashcard_images_anon_delete" on storage.objects;

create policy "flashcard_images_anon_select"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'flashcard-images');

create policy "flashcard_images_anon_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'flashcard-images');

create policy "flashcard_images_anon_update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'flashcard-images')
with check (bucket_id = 'flashcard-images');

create policy "flashcard_images_anon_delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'flashcard-images');
