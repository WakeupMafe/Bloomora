-- Tablas Bloomora (metas, agenda, listas) si aún no existen en el proyecto.
-- Requiere: public.profiles con columna numero_celular UNIQUE (no hace falta que sea PK).
-- Ejecutar en SQL Editor de Supabase si ves 404 en agenda_tasks / lists o 400 en goals.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.goals (
  id bigint generated always as identity primary key,
  user_phone text not null references public.profiles(numero_celular) on delete cascade,
  title text not null,
  description text,
  accent text not null default 'lavender',
  variant text not null default 'bar',
  progress_label text,
  percent_display numeric(5,2) not null default 0,
  tracker_color_id text,
  status text not null default 'active',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_title_not_blank check (btrim(title) <> ''),
  constraint goals_accent_valid check (accent in ('lavender','green','sky')),
  constraint goals_variant_valid check (variant in ('bar','days','pages')),
  constraint goals_status_valid check (status in ('active','paused','completed','archived'))
);

create index if not exists ix_goals_user_phone on public.goals(user_phone);
create index if not exists ix_goals_user_sort on public.goals(user_phone, sort_order, id);

drop trigger if exists trg_goals_updated_at on public.goals;
create trigger trg_goals_updated_at
before update on public.goals for each row execute function public.set_updated_at();

create table if not exists public.goal_day_marks (
  goal_id bigint not null references public.goals(id) on delete cascade,
  user_phone text not null references public.profiles(numero_celular) on delete cascade,
  year_month text not null,
  day smallint not null,
  created_at timestamptz not null default now(),
  constraint goal_day_marks_day_range check (day >= 1 and day <= 31),
  constraint goal_day_marks_ym_format check (year_month ~ '^[0-9]{4}-[0-9]{2}$'),
  primary key (goal_id, year_month, day)
);

create index if not exists ix_goal_day_marks_user on public.goal_day_marks(user_phone);

create table if not exists public.agenda_tasks (
  id bigint generated always as identity primary key,
  user_phone text not null references public.profiles(numero_celular) on delete cascade,
  task_date date not null,
  title text not null,
  start_min integer not null,
  end_min integer not null,
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agenda_tasks_title_not_blank check (btrim(title) <> ''),
  constraint agenda_tasks_time_valid check (end_min > start_min)
);

create index if not exists ix_agenda_tasks_user_date on public.agenda_tasks(user_phone, task_date);

drop trigger if exists trg_agenda_tasks_updated_at on public.agenda_tasks;
create trigger trg_agenda_tasks_updated_at
before update on public.agenda_tasks for each row execute function public.set_updated_at();

create table if not exists public.lists (
  id bigint generated always as identity primary key,
  user_phone text not null references public.profiles(numero_celular) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lists_title_not_blank check (btrim(title) <> '')
);

create index if not exists ix_lists_user on public.lists(user_phone);

drop trigger if exists trg_lists_updated_at on public.lists;
create trigger trg_lists_updated_at
before update on public.lists for each row execute function public.set_updated_at();

create table if not exists public.list_items (
  id bigint generated always as identity primary key,
  list_id bigint not null references public.lists(id) on delete cascade,
  user_phone text not null references public.profiles(numero_celular) on delete cascade,
  title text not null,
  done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint list_items_title_not_blank check (btrim(title) <> '')
);

create index if not exists ix_list_items_list on public.list_items(list_id);

drop trigger if exists trg_list_items_updated_at on public.list_items;
create trigger trg_list_items_updated_at
before update on public.list_items for each row execute function public.set_updated_at();

alter table public.goals enable row level security;
alter table public.goal_day_marks enable row level security;
alter table public.agenda_tasks enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;

drop policy if exists "phone_mode_goals_all" on public.goals;
create policy "phone_mode_goals_all" on public.goals for all using (true) with check (true);

drop policy if exists "phone_mode_goal_day_marks_all" on public.goal_day_marks;
create policy "phone_mode_goal_day_marks_all" on public.goal_day_marks for all using (true) with check (true);

drop policy if exists "phone_mode_agenda_all" on public.agenda_tasks;
create policy "phone_mode_agenda_all" on public.agenda_tasks for all using (true) with check (true);

drop policy if exists "phone_mode_lists_all" on public.lists;
create policy "phone_mode_lists_all" on public.lists for all using (true) with check (true);

drop policy if exists "phone_mode_list_items_all" on public.list_items;
create policy "phone_mode_list_items_all" on public.list_items for all using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
