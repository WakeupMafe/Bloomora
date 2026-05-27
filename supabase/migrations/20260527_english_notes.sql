-- Bloomora · Apuntes de inglés (editor rich text)

create table if not exists public.english_notes (
  id bigint generated always as identity primary key,
  user_cedula text not null references public.profiles(cedula) on delete cascade,

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
  updated_at timestamptz not null default now(),

  constraint english_notes_page_size_check
    check (page_size in ('a4', 'letter')),
  constraint english_notes_title_font_check
    check (title_font in ('popis', 'arial', 'cursive', 'cursive2')),
  constraint english_notes_title_color_check
    check (title_color in ('coral', 'violet', 'babyBlue', 'gray', 'black'))
);

create index if not exists idx_english_notes_user_cedula
  on public.english_notes(user_cedula);

create index if not exists idx_english_notes_updated_at
  on public.english_notes(user_cedula, updated_at desc);

drop trigger if exists trg_english_notes_updated_at on public.english_notes;
create trigger trg_english_notes_updated_at
before update on public.english_notes
for each row
execute function public.set_updated_at();

alter table public.english_notes enable row level security;

drop policy if exists "english_notes_anon_all" on public.english_notes;
create policy "english_notes_anon_all"
on public.english_notes
for all
using (true)
with check (true);

grant select, insert, update, delete on table public.english_notes to anon, authenticated;
grant usage, select on sequence public.english_notes_id_seq to anon, authenticated;
