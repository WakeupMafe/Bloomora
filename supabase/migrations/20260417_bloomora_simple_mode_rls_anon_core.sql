-- Bloomora · modo simple: anon sin JWT de Auth puede usar el mismo modelo que la app.
-- Ejecutar si ves 401/403 en POST a goals, daily_plans, tasks, etc.
-- Reemplaza políticas basadas en auth.uid() por políticas permisivas.

-- ---------- profiles ----------
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_anon_all" on public.profiles;

create policy "profiles_anon_all"
on public.profiles
for all
using (true)
with check (true);

-- ---------- categories ----------
drop policy if exists "categories_all_own" on public.categories;
drop policy if exists "categories_anon_all" on public.categories;

create policy "categories_anon_all"
on public.categories
for all
using (true)
with check (true);

-- ---------- daily_plans ----------
drop policy if exists "daily_plans_all_own" on public.daily_plans;
drop policy if exists "daily_plans_anon_all" on public.daily_plans;

create policy "daily_plans_anon_all"
on public.daily_plans
for all
using (true)
with check (true);

-- ---------- goals ----------
drop policy if exists "goals_all_own" on public.goals;
drop policy if exists "goals_anon_all" on public.goals;

create policy "goals_anon_all"
on public.goals
for all
using (true)
with check (true);

-- ---------- goal_match_rules ----------
drop policy if exists "goal_match_rules_all_own" on public.goal_match_rules;
drop policy if exists "goal_match_rules_anon_all" on public.goal_match_rules;

create policy "goal_match_rules_anon_all"
on public.goal_match_rules
for all
using (true)
with check (true);

-- ---------- tasks ----------
drop policy if exists "tasks_all_own" on public.tasks;
drop policy if exists "tasks_anon_all" on public.tasks;

create policy "tasks_anon_all"
on public.tasks
for all
using (true)
with check (true);

-- ---------- task_blocks ----------
drop policy if exists "task_blocks_all_own" on public.task_blocks;
drop policy if exists "task_blocks_anon_all" on public.task_blocks;

create policy "task_blocks_anon_all"
on public.task_blocks
for all
using (true)
with check (true);

-- ---------- subtasks ----------
drop policy if exists "subtasks_all_own" on public.subtasks;
drop policy if exists "subtasks_anon_all" on public.subtasks;

create policy "subtasks_anon_all"
on public.subtasks
for all
using (true)
with check (true);

-- ---------- task_goal_links ----------
drop policy if exists "task_goal_links_all_own" on public.task_goal_links;
drop policy if exists "task_goal_links_anon_all" on public.task_goal_links;

create policy "task_goal_links_anon_all"
on public.task_goal_links
for all
using (true)
with check (true);

-- ---------- progress_logs (triggers al completar tareas) ----------
drop policy if exists "progress_logs_all_own" on public.progress_logs;
drop policy if exists "progress_logs_anon_all" on public.progress_logs;

create policy "progress_logs_anon_all"
on public.progress_logs
for all
using (true)
with check (true);

-- ---------- task_completion_logs ----------
drop policy if exists "task_completion_logs_all_own" on public.task_completion_logs;
drop policy if exists "task_completion_logs_anon_all" on public.task_completion_logs;

create policy "task_completion_logs_anon_all"
on public.task_completion_logs
for all
using (true)
with check (true);

-- Permisos de tabla (por si el proyecto no los tenía para anon)
grant select, insert, update, delete on table public.profiles to anon, authenticated;
grant select, insert, update, delete on table public.categories to anon, authenticated;
grant select, insert, update, delete on table public.daily_plans to anon, authenticated;
grant select, insert, update, delete on table public.goals to anon, authenticated;
grant select, insert, update, delete on table public.goal_match_rules to anon, authenticated;
grant select, insert, update, delete on table public.tasks to anon, authenticated;
grant select, insert, update, delete on table public.task_blocks to anon, authenticated;
grant select, insert, update, delete on table public.subtasks to anon, authenticated;
grant select, insert, update, delete on table public.task_goal_links to anon, authenticated;
grant select, insert, update, delete on table public.progress_logs to anon, authenticated;
grant select, insert, update, delete on table public.task_completion_logs to anon, authenticated;
