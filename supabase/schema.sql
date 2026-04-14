-- =========================================
-- BLOOMORA · ESQUEMA SIMPLE
-- Supabase / PostgreSQL
-- Cedula como PK funcional del usuario
-- UUID solo donde Supabase lo exige
-- =========================================

create extension if not exists pgcrypto;

-- =========================================
-- FUNCION GENERICA updated_at
-- =========================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================
-- 1) PROFILES
-- auth_user_id = UUID de Supabase
-- cedula = PK funcional del negocio
-- =========================================
create table if not exists public.profiles (
  cedula text primary key,
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text unique,
  username text unique,
  full_name text,
  avatar_url text,
  timezone text not null default 'America/Bogota',
  locale text not null default 'es-CO',
  onboarding_completed boolean not null default false,
  preferred_theme text not null default 'bloomora_pastel',
  mascot_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_cedula_not_blank check (btrim(cedula) <> '')
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- =========================================
-- 2) CATEGORIES
-- =========================================
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  user_cedula text not null references public.profiles(cedula) on delete cascade,
  name text not null,
  slug text not null,
  color text,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_blank check (btrim(name) <> ''),
  constraint categories_slug_not_blank check (btrim(slug) <> '')
);

create unique index if not exists ux_categories_user_slug
  on public.categories(user_cedula, slug);

create unique index if not exists ux_categories_user_name
  on public.categories(user_cedula, lower(name));

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

-- =========================================
-- 3) DAILY_PLANS
-- Un plan por usuario por fecha
-- =========================================
create table if not exists public.daily_plans (
  id bigint generated always as identity primary key,
  user_cedula text not null references public.profiles(cedula) on delete cascade,
  plan_date date not null,
  title text,
  notes text,
  mood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_plans_unique unique (user_cedula, plan_date)
);

create index if not exists ix_daily_plans_user_date
  on public.daily_plans(user_cedula, plan_date);

drop trigger if exists trg_daily_plans_updated_at on public.daily_plans;
create trigger trg_daily_plans_updated_at
before update on public.daily_plans
for each row
execute function public.set_updated_at();

-- =========================================
-- 4) GOALS
-- =========================================
create table if not exists public.goals (
  id bigint generated always as identity primary key,
  user_cedula text not null references public.profiles(cedula) on delete cascade,
  category_id bigint references public.categories(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'active',
  goal_type text not null default 'habit',
  target_value numeric(10,2),
  current_value numeric(10,2) not null default 0,
  unit text,
  frequency text,
  start_date date,
  end_date date,
  color text,
  icon text,
  auto_match_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_title_not_blank check (btrim(title) <> ''),
  constraint goals_status_valid check (status in ('active','paused','completed','archived')),
  constraint goals_type_valid check (goal_type in ('habit','target','milestone','project'))
);

create index if not exists ix_goals_user_id on public.goals(user_cedula);
create index if not exists ix_goals_user_status on public.goals(user_cedula, status);

drop trigger if exists trg_goals_updated_at on public.goals;
create trigger trg_goals_updated_at
before update on public.goals
for each row
execute function public.set_updated_at();

-- =========================================
-- 5) GOAL_MATCH_RULES
-- Reglas simples para enlace automatico
-- =========================================
create table if not exists public.goal_match_rules (
  id bigint generated always as identity primary key,
  user_cedula text not null references public.profiles(cedula) on delete cascade,
  goal_id bigint not null references public.goals(id) on delete cascade,
  rule_type text not null default 'keyword',
  pattern text not null,
  priority integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goal_match_rules_type_valid check (rule_type in ('keyword','contains','exact'))
);

create index if not exists ix_goal_match_rules_user_id
  on public.goal_match_rules(user_cedula);

create index if not exists ix_goal_match_rules_goal_id
  on public.goal_match_rules(goal_id);

drop trigger if exists trg_goal_match_rules_updated_at on public.goal_match_rules;
create trigger trg_goal_match_rules_updated_at
before update on public.goal_match_rules
for each row
execute function public.set_updated_at();

-- =========================================
-- 6) TASKS
-- =========================================
create table if not exists public.tasks (
  id bigint generated always as identity primary key,
  user_cedula text not null references public.profiles(cedula) on delete cascade,
  daily_plan_id bigint references public.daily_plans(id) on delete cascade,
  category_id bigint references public.categories(id) on delete set null,
  title text not null,
  description text,
  notes text,
  status text not null default 'pending',
  priority text not null default 'medium',
  task_type text not null default 'simple',
  source text not null default 'manual',
  color text,
  estimated_minutes integer,
  actual_minutes integer,
  is_all_day boolean not null default false,
  is_focus_block boolean not null default false,
  is_repeatable boolean not null default false,
  auto_goal_matching_enabled boolean not null default true,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_not_blank check (btrim(title) <> ''),
  constraint tasks_status_valid check (status in ('pending','in_progress','completed','cancelled','archived')),
  constraint tasks_priority_valid check (priority in ('low','medium','high','urgent')),
  constraint tasks_type_valid check (task_type in ('simple','block','milestone')),
  constraint tasks_source_valid check (source in ('manual','suggested','recurring','system')),
  constraint tasks_estimated_minutes_valid check (estimated_minutes is null or estimated_minutes >= 0),
  constraint tasks_actual_minutes_valid check (actual_minutes is null or actual_minutes >= 0)
);

create index if not exists ix_tasks_user_id on public.tasks(user_cedula);
create index if not exists ix_tasks_daily_plan_id on public.tasks(daily_plan_id);
create index if not exists ix_tasks_user_status on public.tasks(user_cedula, status);
create index if not exists ix_tasks_user_sort_order on public.tasks(user_cedula, sort_order);

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

-- =========================================
-- 7) TASK_BLOCKS
-- Bloques horarios visuales
-- =========================================
create table if not exists public.task_blocks (
  id bigint generated always as identity primary key,
  task_id bigint not null references public.tasks(id) on delete cascade,
  user_cedula text not null references public.profiles(cedula) on delete cascade,
  block_date date not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  color text,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_blocks_time_valid check (end_at > start_at)
);

create index if not exists ix_task_blocks_task_id on public.task_blocks(task_id);
create index if not exists ix_task_blocks_user_date on public.task_blocks(user_cedula, block_date);

drop trigger if exists trg_task_blocks_updated_at on public.task_blocks;
create trigger trg_task_blocks_updated_at
before update on public.task_blocks
for each row
execute function public.set_updated_at();

-- =========================================
-- 8) SUBTASKS
-- =========================================
create table if not exists public.subtasks (
  id bigint generated always as identity primary key,
  task_id bigint not null references public.tasks(id) on delete cascade,
  user_cedula text not null references public.profiles(cedula) on delete cascade,
  title text not null,
  notes text,
  status text not null default 'pending',
  sort_order integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subtasks_title_not_blank check (btrim(title) <> ''),
  constraint subtasks_status_valid check (status in ('pending','completed','cancelled'))
);

create index if not exists ix_subtasks_task_id on public.subtasks(task_id);
create index if not exists ix_subtasks_user_id on public.subtasks(user_cedula);

drop trigger if exists trg_subtasks_updated_at on public.subtasks;
create trigger trg_subtasks_updated_at
before update on public.subtasks
for each row
execute function public.set_updated_at();

-- =========================================
-- 9) TASK_GOAL_LINKS
-- =========================================
create table if not exists public.task_goal_links (
  id bigint generated always as identity primary key,
  user_cedula text not null references public.profiles(cedula) on delete cascade,
  task_id bigint not null references public.tasks(id) on delete cascade,
  goal_id bigint not null references public.goals(id) on delete cascade,
  source text not null default 'manual',
  confidence numeric(5,2),
  weight numeric(10,2) not null default 1,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_goal_links_source_valid check (source in ('manual','auto_text','rule','suggestion_accepted')),
  constraint task_goal_links_confidence_valid check (confidence is null or (confidence >= 0 and confidence <= 100)),
  constraint task_goal_links_weight_valid check (weight >= 0)
);

create unique index if not exists ux_task_goal_links_task_goal
  on public.task_goal_links(task_id, goal_id);

create index if not exists ix_task_goal_links_user_id
  on public.task_goal_links(user_cedula);

create index if not exists ix_task_goal_links_goal_id
  on public.task_goal_links(goal_id);

drop trigger if exists trg_task_goal_links_updated_at on public.task_goal_links;
create trigger trg_task_goal_links_updated_at
before update on public.task_goal_links
for each row
execute function public.set_updated_at();

-- =========================================
-- 10) PROGRESS_LOGS
-- =========================================
create table if not exists public.progress_logs (
  id bigint generated always as identity primary key,
  user_cedula text not null references public.profiles(cedula) on delete cascade,
  goal_id bigint not null references public.goals(id) on delete cascade,
  task_id bigint references public.tasks(id) on delete set null,
  subtask_id bigint references public.subtasks(id) on delete set null,
  log_date date not null default current_date,
  value_delta numeric(10,2) not null default 1,
  source text not null default 'task_completion',
  note text,
  created_at timestamptz not null default now(),
  constraint progress_logs_source_valid check (source in ('task_completion','subtask_completion','manual_adjustment','system'))
);

create index if not exists ix_progress_logs_user_id on public.progress_logs(user_cedula);
create index if not exists ix_progress_logs_goal_id on public.progress_logs(goal_id);
create index if not exists ix_progress_logs_goal_date on public.progress_logs(goal_id, log_date);

-- =========================================
-- 11) TASK_COMPLETION_LOGS
-- =========================================
create table if not exists public.task_completion_logs (
  id bigint generated always as identity primary key,
  user_cedula text not null references public.profiles(cedula) on delete cascade,
  task_id bigint not null references public.tasks(id) on delete cascade,
  completed_at timestamptz not null default now(),
  completion_date date not null default current_date,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  constraint task_completion_logs_source_valid check (source in ('manual','auto','system'))
);

create index if not exists ix_task_completion_logs_user_id on public.task_completion_logs(user_cedula);
create index if not exists ix_task_completion_logs_task_id on public.task_completion_logs(task_id);

-- =========================================
-- 12) SINCRONIZAR current_value DE GOALS
-- =========================================
create or replace function public.sync_goal_current_value()
returns trigger
language plpgsql
as $$
begin
  update public.goals
  set current_value = coalesce((
    select sum(pl.value_delta)
    from public.progress_logs pl
    where pl.goal_id = new.goal_id
  ), 0),
  updated_at = now()
  where id = new.goal_id;

  return new;
end;
$$;

drop trigger if exists trg_progress_logs_after_insert on public.progress_logs;
create trigger trg_progress_logs_after_insert
after insert on public.progress_logs
for each row
execute function public.sync_goal_current_value();

-- =========================================
-- 13) AL COMPLETAR TASK:
-- guarda log de tarea
-- guarda progreso en metas vinculadas
-- =========================================
create or replace function public.handle_task_completed()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and coalesce(old.status, '') <> 'completed' then
    new.completed_at = coalesce(new.completed_at, now());

    insert into public.task_completion_logs (
      user_cedula,
      task_id,
      completed_at,
      completion_date,
      source
    )
    values (
      new.user_cedula,
      new.id,
      new.completed_at,
      new.completed_at::date,
      'manual'
    );

    insert into public.progress_logs (
      user_cedula,
      goal_id,
      task_id,
      log_date,
      value_delta,
      source,
      note
    )
    select
      new.user_cedula,
      tgl.goal_id,
      new.id,
      new.completed_at::date,
      tgl.weight,
      'task_completion',
      'Progreso automático por completar tarea'
    from public.task_goal_links tgl
    where tgl.task_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_tasks_before_update_completed on public.tasks;
create trigger trg_tasks_before_update_completed
before update on public.tasks
for each row
execute function public.handle_task_completed();

-- =========================================
-- 14) RLS
-- Se valida por auth_user_id mapeado a cedula
-- =========================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.daily_plans enable row level security;
alter table public.goals enable row level security;
alter table public.goal_match_rules enable row level security;
alter table public.tasks enable row level security;
alter table public.task_blocks enable row level security;
alter table public.subtasks enable row level security;
alter table public.task_goal_links enable row level security;
alter table public.progress_logs enable row level security;
alter table public.task_completion_logs enable row level security;

-- PROFILES
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = auth_user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = auth_user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

-- TABLAS CON user_cedula
drop policy if exists "categories_all_own" on public.categories;
create policy "categories_all_own"
on public.categories
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.cedula = categories.user_cedula
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.cedula = categories.user_cedula
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "daily_plans_all_own" on public.daily_plans;
create policy "daily_plans_all_own"
on public.daily_plans
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.cedula = daily_plans.user_cedula
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.cedula = daily_plans.user_cedula
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "goals_all_own" on public.goals;
create policy "goals_all_own"
on public.goals
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.cedula = goals.user_cedula
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.cedula = goals.user_cedula
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "goal_match_rules_all_own" on public.goal_match_rules;
create policy "goal_match_rules_all_own"
on public.goal_match_rules
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.cedula = goal_match_rules.user_cedula
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.cedula = goal_match_rules.user_cedula
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "tasks_all_own" on public.tasks;
create policy "tasks_all_own"
on public.tasks
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.cedula = tasks.user_cedula
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.cedula = tasks.user_cedula
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "task_blocks_all_own" on public.task_blocks;
create policy "task_blocks_all_own"
on public.task_blocks
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.cedula = task_blocks.user_cedula
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.cedula = task_blocks.user_cedula
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "subtasks_all_own" on public.subtasks;
create policy "subtasks_all_own"
on public.subtasks
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.cedula = subtasks.user_cedula
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.cedula = subtasks.user_cedula
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "task_goal_links_all_own" on public.task_goal_links;
create policy "task_goal_links_all_own"
on public.task_goal_links
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.cedula = task_goal_links.user_cedula
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.cedula = task_goal_links.user_cedula
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "progress_logs_all_own" on public.progress_logs;
create policy "progress_logs_all_own"
on public.progress_logs
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.cedula = progress_logs.user_cedula
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.cedula = progress_logs.user_cedula
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "task_completion_logs_all_own" on public.task_completion_logs;
create policy "task_completion_logs_all_own"
on public.task_completion_logs
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.cedula = task_completion_logs.user_cedula
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.cedula = task_completion_logs.user_cedula
      and p.auth_user_id = auth.uid()
  )
);
