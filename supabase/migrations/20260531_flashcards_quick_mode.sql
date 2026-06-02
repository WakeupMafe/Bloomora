-- Bloomora · Modo flashcard rápida (palabra + significado; completar después)

alter table public.flashcards_english
  add column if not exists entry_mode text not null default 'full';

alter table public.flashcards_english
  add column if not exists is_quick_draft boolean not null default false;

update public.flashcards_english
set entry_mode = 'full', is_quick_draft = false
where entry_mode is null or is_quick_draft is null;

alter table public.flashcards_english
  drop constraint if exists flashcards_english_entry_mode_check;

alter table public.flashcards_english
  add constraint flashcards_english_entry_mode_check
  check (entry_mode in ('full', 'quick'));

create index if not exists idx_flashcards_quick_draft
  on public.flashcards_english(user_cedula, is_quick_draft)
  where is_quick_draft = true;
