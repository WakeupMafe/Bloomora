-- Bloomora · modo simple (sin Supabase Auth en el cliente)
-- Solo: columnas UI en goals + tablas goal_day_marks, lists, list_items + triggers.

-- Columnas UI sobre goals (tabla ya existente)
alter table public.goals add column if not exists accent text;
alter table public.goals add column if not exists variant text;
alter table public.goals add column if not exists progress_label text;
alter table public.goals add column if not exists percent_display numeric(10,2);
alter table public.goals add column if not exists tracker_color_id text;
alter table public.goals add column if not exists sort_order integer not null default 0;

comment on column public.goals.accent is 'Bloomora UI: lavender | green | sky';
comment on column public.goals.variant is 'Bloomora UI: bar | days | pages';

create table public.goal_day_marks (
  goal_id bigint not null references public.goals(id) on delete cascade,
  user_cedula text not null references public.profiles(cedula) on delete cascade,
  year_month text not null,
  day smallint not null,
  created_at timestamptz not null default now(),
  constraint goal_day_marks_day_range check (day >= 1 and day <= 31),
  constraint goal_day_marks_ym_format check (year_month ~ '^[0-9]{4}-[0-9]{2}$'),
  primary key (goal_id, year_month, day)
);

create index ix_goal_day_marks_user_cedula on public.goal_day_marks(user_cedula);

create table public.lists (
  id bigint generated always as identity primary key,
  user_cedula text not null references public.profiles(cedula) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lists_title_not_blank check (btrim(title) <> '')
);

create index ix_lists_user_cedula on public.lists(user_cedula);

drop trigger if exists trg_lists_updated_at on public.lists;
create trigger trg_lists_updated_at
before update on public.lists
for each row
execute function public.set_updated_at();

create table public.list_items (
  id bigint generated always as identity primary key,
  list_id bigint not null references public.lists(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint list_items_title_not_blank check (btrim(title) <> '')
);

create index ix_list_items_list_id on public.list_items(list_id);

drop trigger if exists trg_list_items_updated_at on public.list_items;
create trigger trg_list_items_updated_at
before update on public.list_items
for each row
execute function public.set_updated_at();

-- Quitar políticas previas si reaplicas el script
drop policy if exists "goal_day_marks_all_own" on public.goal_day_marks;
drop policy if exists "goal_day_marks_anon_all" on public.goal_day_marks;
drop policy if exists "lists_all_own" on public.lists;
drop policy if exists "lists_anon_all" on public.lists;
drop policy if exists "list_items_all_own" on public.list_items;
drop policy if exists "list_items_anon_all" on public.list_items;

alter table public.goal_day_marks enable row level security;
create policy "goal_day_marks_anon_all"
on public.goal_day_marks
for all
using (true)
with check (true);

alter table public.lists enable row level security;
create policy "lists_anon_all"
on public.lists
for all
using (true)
with check (true);

alter table public.list_items enable row level security;
create policy "list_items_anon_all"
on public.list_items
for all
using (true)
with check (true);

grant select, insert, update, delete on table public.goal_day_marks to anon, authenticated;
grant select, insert, update, delete on table public.lists to anon, authenticated;
grant select, insert, update, delete on table public.list_items to anon, authenticated;
grant usage, select on sequence public.lists_id_seq to anon, authenticated;
grant usage, select on sequence public.list_items_id_seq to anon, authenticated;
