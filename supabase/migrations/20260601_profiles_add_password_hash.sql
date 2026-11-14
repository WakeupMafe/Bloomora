-- Bloomora · auth sencilla por contraseña (paso 1: esquema)
-- Añade almacenamiento de hash en profiles. NO guarda plaintext.
-- pgcrypto ya se usa en el proyecto; se asegura por si el proyecto no lo tiene.
-- NULL permitido: perfiles existentes siguen funcionando hasta que definan contraseña.
-- RLS: no se toca. En modo simple (profiles_anon_all) la columna queda accesible
-- como el resto del perfil; el hasheo/verificación se hará en la app (paso siguiente).

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists password_hash text;

comment on column public.profiles.password_hash is
  'Hash de contraseña (p.ej. bcrypt). Nunca guardar plaintext. NULL = sin contraseña aún.';
