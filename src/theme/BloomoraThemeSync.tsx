import { useLayoutEffect } from 'react'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { useBloomoraProfile } from '@/hooks/useBloomoraProfile'
import {
  applyBloomoraThemeCssVars,
  clearBloomoraThemeCssVars,
  clearStoredBloomoraTheme,
  readStoredBloomoraTheme,
  resolveAppThemeId,
} from '@/theme/bloomoraAppThemes'

/**
 * Aplica `preferred_theme` del perfil a las variables CSS.
 * Antes de que llegue el perfil, respeta `localStorage` (boot en index.html).
 * Sin sesión restaura el stylesheet por defecto.
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
    if (!profile) {
      const stored = readStoredBloomoraTheme()
      if (stored) applyBloomoraThemeCssVars(stored)
      return
    }
    applyBloomoraThemeCssVars(resolveAppThemeId(profile.preferred_theme))
  }, [phone, profile, profile?.preferred_theme])

  return null
}
