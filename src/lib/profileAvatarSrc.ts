import conejoAvatar from '@/assets/ConejoAvatar.png'
import conejitaGirl from '@/assets/ConejitaGirl.png'
import conejoBoy from '@/assets/ConejoBoy.png'
import conejoLofi from '@/assets/ConejoLofi.png'
import type { ProfileRow } from '@/services/supabase/profilesRepo'

const PRESET: Record<string, string> = {
  bunny: conejoAvatar,
  conejoBoy,
  conejoLofi,
  conejitaGirl,
}

export function profileAvatarSrc(profile: ProfileRow | null | undefined): string {
  if (!profile) return conejoAvatar
  const custom = profile.avatar_public_url || profile.avatar_url
  if (custom) return custom
  const id = profile.avatar_preset
  if (id && PRESET[id]) return PRESET[id]
  return conejoAvatar
}

/**
 * Saludo en pantalla: como máximo los **dos primeros** nombres (separados por espacios).
 * Ej. "Maria Fernanda Saavedra Grimaldo" → "Maria Fernanda".
 */
export function formatProfileGreeting(
  fullName: string | null | undefined,
  fallback: string,
): string {
  const n = fullName?.trim()
  if (!n) return fallback
  const parts = n.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return fallback
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1]}`
}

export function profileFirstName(
  profile: ProfileRow | null | undefined,
  fallback: string,
): string {
  return formatProfileGreeting(profile?.full_name ?? null, fallback)
}
