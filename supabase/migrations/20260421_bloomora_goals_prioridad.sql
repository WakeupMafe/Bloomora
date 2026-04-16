-- Prioridad por meta (Alta | Media | Baja) para listados y filtros UI.

alter table public.goals add column if not exists prioridad text;

update public.goals
set prioridad = 'Media'
where prioridad is null or btrim(prioridad) = '';

alter table public.goals alter column prioridad set default 'Media';

alter table public.goals alter column prioridad set not null;

alter table public.goals drop constraint if exists goals_prioridad_valid;

alter table public.goals
  add constraint goals_prioridad_valid
  check (prioridad in ('Alta', 'Media', 'Baja'));

comment on column public.goals.prioridad is 'UI Bloomora: Alta | Media | Baja';
