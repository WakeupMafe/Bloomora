-- Bloomora · auth sencilla por contraseña (paso 2a: RPC pgcrypto)
-- Hashea y verifica en Postgres; la app NO debe comparar hashes en cliente.
-- Requiere: public.profiles.password_hash (migración 20260601).
-- pgcrypto: crypt() / gen_salt('bf').
--
-- Comportamiento NULL (perfiles legacy sin contraseña):
--   verify_profile_password → false
--   En UI (paso 2b): primer login pide crear contraseña vía set_profile_password.
--
-- EJECUTAR en SQL Editor de Supabase si no aplicas migraciones por CLI.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- set_profile_password(cedula, password)
-- Guarda bcrypt en profiles.password_hash. Solo por cédula (PK de registro).
-- pgcrypto en Supabase suele estar en schema `extensions` (ver también 20260603).
-- ---------------------------------------------------------------------------
create or replace function public.set_profile_password(
  p_cedula text,
  p_password text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_cedula text := btrim(coalesce(p_cedula, ''));
  v_password text := coalesce(p_password, '');
begin
  if v_cedula = '' then
    raise exception 'cedula_required';
  end if;

  if char_length(v_password) < 6 then
    raise exception 'password_too_short';
  end if;

  if char_length(v_password) > 200 then
    raise exception 'password_too_long';
  end if;

  update public.profiles
  set
    password_hash = extensions.crypt(v_password, extensions.gen_salt('bf'::text)),
    updated_at = now()
  where cedula = v_cedula;

  if not found then
    raise exception 'profile_not_found';
  end if;
end;
$$;

comment on function public.set_profile_password(text, text) is
  'Guarda hash bcrypt de contraseña en profiles.password_hash (por cédula).';

-- ---------------------------------------------------------------------------
-- verify_profile_password(cedula_or_phone, password) → boolean
-- Identificador como QuickEntry: celular o cédula (solo dígitos recomendado).
-- false si no hay perfil, password_hash NULL, o contraseña incorrecta.
-- ---------------------------------------------------------------------------
create or replace function public.verify_profile_password(
  p_cedula_or_phone text,
  p_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id text := regexp_replace(coalesce(p_cedula_or_phone, ''), '\D', '', 'g');
  v_password text := coalesce(p_password, '');
  v_hash text;
  v_found boolean := false;
begin
  if v_id = '' or v_password = '' then
    return false;
  end if;

  -- Mismo criterio que QuickEntry: celular primero si ≥10 dígitos; si no, cédula; fallback.
  if char_length(v_id) >= 10 then
    select p.password_hash into v_hash
    from public.profiles p
    where p.numero_celular = v_id
    limit 1;
    v_found := found;

    if not v_found then
      select p.password_hash into v_hash
      from public.profiles p
      where p.cedula = v_id
      limit 1;
      v_found := found;
    end if;
  else
    select p.password_hash into v_hash
    from public.profiles p
    where p.cedula = v_id
    limit 1;
    v_found := found;

    if not v_found then
      select p.password_hash into v_hash
      from public.profiles p
      where p.numero_celular = v_id
      limit 1;
      v_found := found;
    end if;
  end if;

  -- Sin perfil o sin contraseña aún (NULL) → false (UI pedirá set en paso 2b).
  if not v_found or v_hash is null then
    return false;
  end if;

  return extensions.crypt(v_password, v_hash) = v_hash;
end;
$$;

comment on function public.verify_profile_password(text, text) is
  'Verifica contraseña contra profiles.password_hash (cédula o celular). false si NULL/inexistente/incorrecta.';

revoke all on function public.set_profile_password(text, text) from public;
revoke all on function public.verify_profile_password(text, text) from public;
grant execute on function public.set_profile_password(text, text) to anon, authenticated;
grant execute on function public.verify_profile_password(text, text) to anon, authenticated;
