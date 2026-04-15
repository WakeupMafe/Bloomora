import { useLayoutEffect } from 'react'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { useBloomoraProfile } from '@/hooks/useBloomoraProfile'
import {
  applyBloomoraThemeCssVars,
  clearBloomoraThemeCssVars,
  resolveAppThemeId,
} from '@/theme/bloomoraAppThemes'

/**
 * Aplica `preferred_theme` del perfil a las variables CSS de Tailwind (`--color-bloomora-*`).
 * Sin sesión restaura los valores del stylesheet por defecto.
 */
export function BloomoraThemeSync() {
  const { phone } = useUserPhone()
  const { data: profile } = useBloomoraProfile(phone)

  useLayoutEffect(() => {
    if (!phone) {
      clearBloomoraThemeCssVars()
      return
    }
    if (!profile) return
    applyBloomoraThemeCssVars(resolveAppThemeId(profile.preferred_theme))
  }, [phone, profile?.preferred_theme])

  return null
}
