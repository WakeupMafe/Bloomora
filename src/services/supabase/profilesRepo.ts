import type { SupabaseClient } from '@supabase/supabase-js'
import { isValidCedula } from '@/lib/cedula'
import { isValidPhone } from '@/lib/userPhone'

/** Alineado a `public.profiles` en Supabase (PK = cedula, celular único). */
export type ProfileRow = {
  cedula: string
  numero_celular: string
  auth_user_id: string | null
  email: string | null
  username: string | null
  full_name: string | null
  avatar_url: string | null
  avatar_preset: string | null
  avatar_storage_path: string | null
  avatar_public_url: string | null
  timezone: string
  locale: string
  onboarding_completed: boolean
  preferred_theme: string
  mascot_name: string | null
  /** Avisos al terminar un bloque de la agenda; ausente/null se trata como activado (compat.). */
  notify_agenda_block_end?: boolean | null
  created_at: string
  updated_at: string
}

export async function fetchProfile(
  sb: SupabaseClient,
  phone: string,
): Promise<ProfileRow | null> {
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('numero_celular', phone)
    .maybeSingle()
  if (error) throw error
  return data as ProfileRow | null
}

export async function fetchProfileByCedula(
  sb: SupabaseClient,
  cedula: string,
): Promise<ProfileRow | null> {
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('cedula', cedula)
    .maybeSingle()
  if (error) throw error
  return data as ProfileRow | null
}

/**
 * Ingreso rápido: mismo valor puede ser celular o cédula (intenta celular primero si aplica).
 */
export async function findProfileForQuickEntry(
  sb: SupabaseClient,
  raw: string,
): Promise<ProfileRow | null> {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null

  if (isValidPhone(digits)) {
    const byPhone = await fetchProfile(sb, digits)
    if (byPhone) return byPhone
  }
  if (isValidCedula(digits)) {
    const byCedula = await fetchProfileByCedula(sb, digits)
    if (byCedula) return byCedula
  }
  return null
}

/**
 * Crea fila solo en registro (/phone) con cédula + celular.
 * No usar para “asegurar” sesión en el resto de la app.
 */
export async function ensureProfile(
  sb: SupabaseClient,
  phone: string,
  defaults: Pick<ProfileRow, 'cedula'> &
    Partial<Pick<ProfileRow, 'full_name' | 'email' | 'preferred_theme'>>,
): Promise<ProfileRow> {
  const existing = await fetchProfile(sb, phone)
  if (existing) return existing

  const cedula = defaults.cedula.trim()
  if (!cedula) {
    throw new Error('La cédula es obligatoria para crear el perfil.')
  }

  const row = {
    cedula,
    numero_celular: phone,
    full_name: defaults.full_name?.trim() || 'Usuario',
    email: defaults.email ?? null,
    preferred_theme: defaults.preferred_theme ?? 'bloomora_pastel',
  }
  const { data, error } = await sb
    .from('profiles')
    .insert(row)
    .select('*')
    .single()
  if (error) throw error
  return data as ProfileRow
}

/** Perfil debe existir (tras registro en /phone). */
export async function requireExistingProfile(
  sb: SupabaseClient,
  phone: string,
): Promise<ProfileRow> {
  const row = await fetchProfile(sb, phone)
  if (!row) {
    throw new Error(
      'No hay perfil para este celular. Regístrate otra vez desde la pantalla de registro.',
    )
  }
  return row
}

/** Metas, agenda y listas: filas ligadas a `profiles.cedula`. */
export async function requireExistingProfileByCedula(
  sb: SupabaseClient,
  cedula: string,
): Promise<ProfileRow> {
  const row = await fetchProfileByCedula(sb, cedula.trim())
  if (!row) {
    throw new Error(
      'No hay perfil para esta cédula. Vuelve a entrar con tu cédula o celular registrado.',
    )
  }
  return row
}

export async function updateProfile(
  sb: SupabaseClient,
  phone: string,
  patch: Partial<
    Pick<
      ProfileRow,
      | 'full_name'
      | 'cedula'
      | 'email'
      | 'avatar_url'
      | 'avatar_public_url'
      | 'avatar_storage_path'
      | 'avatar_preset'
      | 'preferred_theme'
      | 'mascot_name'
      | 'notify_agenda_block_end'
    >
  >,
): Promise<void> {
  const { error } = await sb
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('numero_celular', phone)
  if (error) throw error
}
