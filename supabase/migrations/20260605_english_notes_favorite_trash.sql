-- Bloomora · Favoritos + Papelera (soft-delete 30 días) en english_notes
-- Ejecutar en Supabase → SQL Editor → Run
-- Luego: Project Settings → API → Reload schema (o notify pgrst abajo)

alter table public.english_notes
  add column if not exists is_favorite boolean not null default false;

alter table public.english_notes
  add column if not exists deleted_at timestamptz;

create index if not exists idx_english_notes_active
  on public.english_notes(user_cedula, updated_at desc)
  where deleted_at is null;

create index if not exists idx_english_notes_favorites
  on public.english_notes(user_cedula, updated_at desc)
  where deleted_at is null and is_favorite = true;

create index if not exists idx_english_notes_trash
  on public.english_notes(user_cedula, deleted_at desc)
  where deleted_at is not null;

notify pgrst, 'reload schema';
