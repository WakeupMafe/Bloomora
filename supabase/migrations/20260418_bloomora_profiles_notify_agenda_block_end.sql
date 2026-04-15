-- Preferencia: avisos al terminar un bloque de la agenda (vibración, sonido, modal, notificación del navegador).
alter table public.profiles
  add column if not exists notify_agenda_block_end boolean not null default true;

comment on column public.profiles.notify_agenda_block_end is
  'Si es true, la app puede avisar cuando termina un bloque del día (según perfil y permisos del navegador).';
