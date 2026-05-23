-- Bloomora · Reparar flashcards_english (error 400 al crear flashcard)
-- Ejecutar en Supabase → SQL Editor si POST .../flashcards_english devuelve 400.

-- 1) Tabla base (si no existe)
create table if not exists public.flashcards_english (
  id bigint generated always as identity primary key,
  user_cedula text not null,
  english_word text not null,
  pronunciation text,
  short_meaning text,
  spanish_meaning text not null,
  example_english text,
  example_spanish text,
  image_url text not null,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Columna id (la app hace .select('id') tras insertar)
alter table public.flashcards_english
  add column if not exists id bigint generated always as identity;

-- Si la tabla no tenía PK, asignarla a id
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'flashcards_english'
      and c.contype = 'p'
  ) then
    alter table public.flashcards_english add primary key (id);
  end if;
exception
  when others then
    raise notice 'PK id: %', sqlerrm;
end $$;

-- 3) Columnas que la app envía (por si faltan)
alter table public.flashcards_english add column if not exists user_cedula text;
alter table public.flashcards_english add column if not exists english_word text;
alter table public.flashcards_english add column if not exists pronunciation text;
alter table public.flashcards_english add column if not exists short_meaning text;
alter table public.flashcards_english add column if not exists spanish_meaning text;
alter table public.flashcards_english add column if not exists example_english text;
alter table public.flashcards_english add column if not exists example_spanish text;
alter table public.flashcards_english add column if not exists image_url text;
alter table public.flashcards_english add column if not exists category text;
alter table public.flashcards_english add column if not exists created_at timestamptz not null default now();
alter table public.flashcards_english add column if not exists updated_at timestamptz not null default now();

-- 4) FK a profiles (solo si existe la tabla profiles)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    alter table public.flashcards_english
      drop constraint if exists flashcards_english_user_cedula_fkey;
    alter table public.flashcards_english
      add constraint flashcards_english_user_cedula_fkey
      foreign key (user_cedula) references public.profiles(cedula) on delete cascade;
  end if;
end $$;

-- 5) Trigger updated_at (función usada en el resto de Bloomora)
drop trigger if exists trg_flashcards_updated_at on public.flashcards_english;
create trigger trg_flashcards_updated_at
before update on public.flashcards_english
for each row
execute function public.set_updated_at();

-- 6) RLS + permisos (modo simple anon)
alter table public.flashcards_english enable row level security;

drop policy if exists "flashcards_english_anon_all" on public.flashcards_english;
create policy "flashcards_english_anon_all"
on public.flashcards_english
for all
using (true)
with check (true);

grant select, insert, update, delete on table public.flashcards_english to anon, authenticated;

do $$
begin
  grant usage, select on sequence public.flashcards_english_id_seq to anon, authenticated;
exception
  when undefined_table then
    null;
end $$;

-- 7) Recargar caché de la API REST
notify pgrst, 'reload schema';
