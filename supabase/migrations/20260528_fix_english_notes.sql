-- Bloomora · Reparar english_notes (error: column content_html not in schema cache)
-- Ejecutar en Supabase → SQL Editor si la app muestra ese error al abrir Apuntes.

-- 1) Tabla base (si no existe)
create table if not exists public.english_notes (
  id bigint generated always as identity primary key,
  user_cedula text not null,
  title text not null default '',
  category text,
  title_font text not null default 'popis',
  title_color text not null default 'black',
  page_size text not null default 'letter',
  page_number_enabled boolean not null default false,
  two_columns boolean not null default false,
  content_html text not null default '<p><br /></p>',
  plain_text text not null default '',
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Columnas que la app usa (por si la tabla se creó incompleta)
alter table public.english_notes add column if not exists id bigint generated always as identity;
alter table public.english_notes add column if not exists user_cedula text;
alter table public.english_notes add column if not exists title text not null default '';
alter table public.english_notes add column if not exists category text;
alter table public.english_notes add column if not exists title_font text not null default 'popis';
alter table public.english_notes add column if not exists title_color text not null default 'black';
alter table public.english_notes add column if not exists page_size text not null default 'letter';
alter table public.english_notes add column if not exists page_number_enabled boolean not null default false;
alter table public.english_notes add column if not exists two_columns boolean not null default false;
alter table public.english_notes add column if not exists content_html text not null default '<p><br /></p>';
alter table public.english_notes add column if not exists plain_text text not null default '';
alter table public.english_notes add column if not exists cover_image_url text;
alter table public.english_notes add column if not exists created_at timestamptz not null default now();
alter table public.english_notes add column if not exists updated_at timestamptz not null default now();

-- 3) PK en id (si faltaba)
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'english_notes'
      and c.contype = 'p'
  ) then
    alter table public.english_notes add primary key (id);
  end if;
exception
  when others then
    raise notice 'PK id: %', sqlerrm;
end $$;

-- 4) FK a profiles (si existe)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    alter table public.english_notes
      drop constraint if exists english_notes_user_cedula_fkey;
    alter table public.english_notes
      add constraint english_notes_user_cedula_fkey
      foreign key (user_cedula) references public.profiles(cedula) on delete cascade;
  end if;
end $$;

-- 5) Índices
create index if not exists idx_english_notes_user_cedula
  on public.english_notes(user_cedula);

create index if not exists idx_english_notes_updated_at
  on public.english_notes(user_cedula, updated_at desc);

-- 6) Trigger updated_at
drop trigger if exists trg_english_notes_updated_at on public.english_notes;
create trigger trg_english_notes_updated_at
before update on public.english_notes
for each row
execute function public.set_updated_at();

-- 7) RLS + permisos
alter table public.english_notes enable row level security;

drop policy if exists "english_notes_anon_all" on public.english_notes;
create policy "english_notes_anon_all"
on public.english_notes
for all
using (true)
with check (true);

grant select, insert, update, delete on table public.english_notes to anon, authenticated;

do $$
begin
  grant usage, select on sequence public.english_notes_id_seq to anon, authenticated;
exception
  when undefined_table then
    null;
end $$;

-- 8) Recargar caché de la API REST (PostgREST)
notify pgrst, 'reload schema';

-- Si el error persiste: Supabase Dashboard → Project Settings → API → "Reload schema"
