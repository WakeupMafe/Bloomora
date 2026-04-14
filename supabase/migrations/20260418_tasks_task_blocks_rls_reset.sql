-- Marcar tarea hecha = PATCH a public.tasks → hace falta RLS permisiva para anon.
-- Quita cualquier política previa (aunque tenga otro nombre) y deja una sola permisiva.

do $$
declare
  pol text;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'tasks'
  loop
    execute format('drop policy if exists %I on public.tasks', pol);
  end loop;
end$$;

alter table public.tasks enable row level security;

create policy tasks_anon_all
on public.tasks
for all
using (true)
with check (true);

grant select, insert, update, delete on table public.tasks to anon, authenticated;

do $$
declare
  pol text;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'task_blocks'
  loop
    execute format('drop policy if exists %I on public.task_blocks', pol);
  end loop;
end$$;

alter table public.task_blocks enable row level security;

create policy task_blocks_anon_all
on public.task_blocks
for all
using (true)
with check (true);

grant select, insert, update, delete on table public.task_blocks to anon, authenticated;
