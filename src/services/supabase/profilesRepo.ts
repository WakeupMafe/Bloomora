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
  /** Hash bcrypt (pgcrypto). NULL = sin contraseña aún (legacy). No comparar en cliente. */
  password_hash?: string | null
  /** Tabatas guardados (jsonb array). Ausente/null → []. */
  tabatas?: unknown
  created_at: string
  updated_at: string
}

/** Mínimo alineado a RPC `set_profile_password` (password_too_short). */
export const PROFILE_PASSWORD_MIN_LENGTH = 6

const SYSTEM_ERROR_INTRO =
  'Algo falló de nuestro lado. Debes comunicarte con el desarrollador e indicarle este error:'

export type FormattedAuthError = {
  /** Mensaje amable / intro para el usuario. */
  message: string
  /** true = fallo de sistema/infra; pedir contacto al desarrollador. */
  isSystem: boolean
  /** Detalle técnico corto (solo sistema). */
  technical?: string
  /**
   * Acción concreta para el desarrollador (migración / SQL).
   * Se muestra junto al detalle técnico en alertas de sistema.
   */
  remediation?: string
  /** Texto listo para inline / toast (incluye técnico si aplica). */
  fullText: string
}

function rawErrorText(err: unknown): string {
  if (err && typeof err === 'object') {
    const o = err as {
      message?: unknown
      details?: unknown
      hint?: unknown
      code?: unknown
    }
    const parts = [o.message, o.details, o.hint, o.code]
      .map((p) => (p == null ? '' : String(p).trim()))
      .filter(Boolean)
    if (parts.length) return parts.join(' — ')
  }
  if (err instanceof Error) return err.message
  return String(err ?? '').trim()
}

function shortenTechnical(raw: string, max = 160): string {
  const oneLine = raw.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= max) return oneLine
  return `${oneLine.slice(0, max - 1)}…`
}

function isSystemAuthError(raw: string): boolean {
  if (
    /gen_salt/i.test(raw) ||
    /\bcrypt\b/i.test(raw) ||
    /function .+ does not exist/i.test(raw) ||
    /could not find the function/i.test(raw) ||
    /PGRST202/i.test(raw) ||
    /schema cache/i.test(raw) ||
    /search_path/i.test(raw) ||
    /pgcrypto/i.test(raw) ||
    /extensions\.(crypt|gen_salt)/i.test(raw) ||
    /permission denied for (function|schema)/i.test(raw) ||
    /\b500\b|internal server error|unexpected/i.test(raw) ||
    /failed to fetch|networkerror|load failed/i.test(raw)
  ) {
    return true
  }
  return (
    /set_profile_password|verify_profile_password/i.test(raw) &&
    /does not exist|not find|undefined/i.test(raw)
  )
}

/** Pistas accionables cuando el fallo es de infra conocida (p. ej. RPC antigua en Supabase). */
function remediationForSystemAuthError(raw: string): string | undefined {
  if (/gen_salt|pgcrypto|extensions\.(crypt|gen_salt)/i.test(raw)) {
    return (
      'Causa típica: RPC set_profile_password antigua (search_path sin extensions). ' +
      'En Supabase → SQL Editor ejecuta: supabase/migrations/20260603_fix_password_rpc_pgcrypto.sql'
    )
  }
  if (
    /PGRST202|schema cache|could not find the function/i.test(raw) ||
    (/set_profile_password|verify_profile_password/i.test(raw) &&
      /does not exist|not find|undefined/i.test(raw))
  ) {
    return (
      'Falta o está desactualizada la RPC de contraseña. ' +
      'Ejecuta en orden: 20260602_profiles_password_rpc.sql y 20260603_fix_password_rpc_pgcrypto.sql'
    )
  }
  return undefined
}

/**
 * Centraliza mensajes de auth (registro / entrar / set-verify password).
 * Usuario: mensaje simple. Sistema: intro + detalle técnico corto.
 */
export function formatAuthUserError(err: unknown): FormattedAuthError {
  const raw = rawErrorText(err)

  if (/password_too_short/i.test(raw)) {
    const message = `La contraseña debe tener al menos ${PROFILE_PASSWORD_MIN_LENGTH} caracteres.`
    return { message, isSystem: false, fullText: message }
  }
  if (/password_too_long/i.test(raw)) {
    const message = 'La contraseña es demasiado larga (máximo 200 caracteres).'
    return { message, isSystem: false, fullText: message }
  }
  if (/cedula_required/i.test(raw)) {
    const message = 'Falta la cédula para guardar la contraseña.'
    return { message, isSystem: false, fullText: message }
  }
  if (/profile_not_found/i.test(raw)) {
    const message = 'No encontramos ese perfil. Revisa la cédula o regístrate.'
    return { message, isSystem: false, fullText: message }
  }
  if (/duplicate key|unique constraint|already exists/i.test(raw)) {
    const message =
      'Ya existe una cuenta con esos datos. Prueba entrar o usa otro celular/cédula.'
    return { message, isSystem: false, fullText: message }
  }

  if (!raw) {
    const message = 'No se pudo guardar o verificar la contraseña. Inténtalo de nuevo.'
    return { message, isSystem: false, fullText: message }
  }

  if (isSystemAuthError(raw)) {
    const technical = shortenTechnical(raw)
    const remediation = remediationForSystemAuthError(raw)
    const fullText = remediation
      ? `${SYSTEM_ERROR_INTRO}\n${technical}\n\n${remediation}`
      : `${SYSTEM_ERROR_INTRO}\n${technical}`
    return {
      message: SYSTEM_ERROR_INTRO,
      isSystem: true,
      technical,
      remediation,
      fullText,
    }
  }

  // Mensajes cortos de la app (validación / negocio): mostrar tal cual.
  const looksTechnical =
    raw.length > 140 ||
    /[\[\]{}]|SQLSTATE|postgres|PGRST|stack|exception/i.test(raw)
  if (!looksTechnical) {
    return { message: raw, isSystem: false, fullText: raw }
  }

  const technical = shortenTechnical(raw)
  return {
    message: SYSTEM_ERROR_INTRO,
    isSystem: true,
    technical,
    fullText: `${SYSTEM_ERROR_INTRO}\n${technical}`,
  }
}

/** @deprecated Preferir `formatAuthUserError`; se mantiene por compat. */
export function messageFromPasswordRpcError(err: unknown): string {
  return formatAuthUserError(err).fullText
}

export async function setProfilePassword(
  sb: SupabaseClient,
  cedula: string,
  password: string,
): Promise<void> {
  const { error } = await sb.rpc('set_profile_password', {
    p_cedula: cedula.trim(),
    p_password: password,
  })
  if (error) throw error
}

export async function verifyProfilePassword(
  sb: SupabaseClient,
  cedulaOrPhone: string,
  password: string,
): Promise<boolean> {
  const { data, error } = await sb.rpc('verify_profile_password', {
    p_cedula_or_phone: cedulaOrPhone,
    p_password: password,
  })
  if (error) throw error
  return data === true
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
  const { data, error } = await sb
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('numero_celular', phone)
    .select('numero_celular')
  if (error) throw error
  if (!data?.length) {
    throw new Error('No se pudo guardar, revisa permisos')
  }
}
