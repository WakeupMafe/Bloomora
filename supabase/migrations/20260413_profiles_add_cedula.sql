-- Añade cédula / documento al perfil (registro modo simple).
alter table public.profiles add column if not exists cedula text;

comment on column public.profiles.cedula is 'Documento de identidad (solo dígitos recomendado).';
