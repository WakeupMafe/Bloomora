import { useLayoutEffect } from 'react'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { useBloomoraProfile } from '@/hooks/useBloomoraProfile'
import {
  applyThemePreference,
  clearBloomoraThemeCssVars,
  clearStoredBloomoraTheme,
  parseThemePreference,
  readStoredThemePreference,
} from '@/theme/bloomoraAppThemes'

/**
 * Sincroniza preferred_theme (fijo o auto:claro:oscuro) con CSS vars.
 * Respeta localStorage mientras llega el perfil; escucha prefers-color-scheme.
 */
export function BloomoraThemeSync() {
  const { phone } = useUserPhone()
  const { data: profile } = useBloomoraProfile(phone)

  useLayoutEffect(() => {
    if (!phone) {
      clearStoredBloomoraTheme()
      clearBloomoraThemeCssVars()
      return
    }

    const pref = profile
      ? parseThemePreference(profile.preferred_theme)
      : readStoredThemePreference()

    if (!pref) return

    applyThemePreference(pref)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const current = profile
        ? parseThemePreference(profile.preferred_theme)
        : (readStoredThemePreference() ?? pref)
      if (current.kind !== 'auto') return
      applyThemePreference(current)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [phone, profile, profile?.preferred_theme])

  return null
}
