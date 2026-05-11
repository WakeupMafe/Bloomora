-- Alinear public.goals con el cliente Bloomora cuando la tabla proviene de migraciones
-- antiguas (p. ej. 20260415: solo user_phone y sin columnas de progreso).
-- Idempotente: seguro ejecutar varias veces.

alter table public.goals add column if not exists user_cedula text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'goals'
      and c.column_name = 'user_phone'
  ) then
    execute $u$
      update public.goals g
      set user_cedula = coalesce(nullif(btrim(g.user_cedula), ''), p.cedula)
      from public.profiles p
      where p.numero_celular = g.user_phone
        and (g.user_cedula is null or btrim(g.user_cedula) = '')
    $u$;
  end if;
end $$;

alter table public.goals add column if not exists description text;
alter table public.goals add column if not exists goal_type text not null default 'habit';
alter table public.goals add column if not exists target_value numeric(10,2);
alter table public.goals add column if not exists current_value numeric(10,2) not null default 0;
alter table public.goals add column if not exists unit text;
alter table public.goals add column if not exists frequency text;
alter table public.goals add column if not exists auto_match_enabled boolean not null default true;
alter table public.goals add column if not exists prioridad text default 'Media';

do $$
begin
  if exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'goals'
      and c.column_name = 'user_phone'
  ) then
    execute $fn$
      create or replace function public.trg_goals_sync_user_phone_from_cedula()
      returns trigger
      language plpgsql
      as $body$
      declare
        phone text;
      begin
        if new.user_cedula is null or btrim(new.user_cedula) = '' then
          return new;
        end if;
        if new.user_phone is not null and btrim(new.user_phone) <> '' then
          return new;
        end if;
        select p.numero_celular
          into phone
        from public.profiles p
        where p.cedula = new.user_cedula
        limit 1;
        if phone is not null then
          new.user_phone := phone;
        end if;
        return new;
      end;
      $body$;
    $fn$;
    execute 'drop trigger if exists trg_goals_sync_user_phone on public.goals';
    execute $tr$
      create trigger trg_goals_sync_user_phone
      before insert or update on public.goals
      for each row
      execute function public.trg_goals_sync_user_phone_from_cedula();
    $tr$;
    alter table public.goals alter column user_phone drop not null;
  end if;
end $$;
