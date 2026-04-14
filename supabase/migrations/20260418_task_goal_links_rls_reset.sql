-- Bloomora modo simple: asegurar INSERT/SELECT en task_goal_links para anon.
-- Si esta tabla conserva políticas auth.uid(), vincular tarea-meta devuelve 401.

do $$
declare
  pol text;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'task_goal_links'
  loop
    execute format('drop policy if exists %I on public.task_goal_links', pol);
  end loop;
end$$;

alter table public.task_goal_links enable row level security;

create policy task_goal_links_anon_all
on public.task_goal_links
for all
using (true)
with check (true);

grant select, insert, update, delete on table public.task_goal_links to anon, authenticated;
grant usage, select on sequence public.task_goal_links_id_seq to anon, authenticated;
