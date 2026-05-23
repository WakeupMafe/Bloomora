-- Bloomora · English Flashcards (vocabulario con memoria visual)

create table if not exists public.flashcards_english (
  id bigint generated always as identity primary key,
  user_cedula text not null references public.profiles(cedula) on delete cascade,

  english_word text not null,
  pronunciation text,
  short_meaning text,
  spanish_meaning text not null,

  example_english text,
  example_spanish text,

  image_url text not null,
  category text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint flashcards_english_word_not_blank check (btrim(english_word) <> ''),
  constraint flashcards_spanish_not_blank check (btrim(spanish_meaning) <> ''),
  constraint flashcards_image_not_blank check (btrim(image_url) <> '')
);

create index if not exists idx_flashcards_user_cedula
  on public.flashcards_english(user_cedula);

create index if not exists idx_flashcards_english_word
  on public.flashcards_english(english_word);

create index if not exists idx_flashcards_spanish_meaning
  on public.flashcards_english(spanish_meaning);

create index if not exists idx_flashcards_category
  on public.flashcards_english(category);

drop trigger if exists trg_flashcards_updated_at on public.flashcards_english;
create trigger trg_flashcards_updated_at
before update on public.flashcards_english
for each row
execute function public.set_updated_at();

alter table public.flashcards_english enable row level security;

drop policy if exists "flashcards_english_anon_all" on public.flashcards_english;
create policy "flashcards_english_anon_all"
on public.flashcards_english
for all
using (true)
with check (true);

grant select, insert, update, delete on table public.flashcards_english to anon, authenticated;
grant usage, select on sequence public.flashcards_english_id_seq to anon, authenticated;
