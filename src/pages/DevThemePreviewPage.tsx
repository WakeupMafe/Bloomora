import { useEffect, useState } from 'react'
import { BackButton } from '@/components/navigation/BackButton'
import { ThemeSelector } from '@/features/profile/ThemeSelector'
import {
  applyThemePreference,
  type AppThemeId,
  type ThemePreference,
  resolveEffectiveThemeId,
  serializeThemePreference,
} from '@/theme/bloomoraAppThemes'
import { cn } from '@/utils/cn'

/** Solo DEV: Editar perfil (Personalización) sin auth, para capturas. */
export function DevThemePreviewPage() {
  const initial =
    (new URLSearchParams(window.location.search).get('tema') as AppThemeId) ||
    'noche'
  const [themePref, setThemePref] = useState<ThemePreference>({
    kind: 'fixed',
    themeId: initial === 'bosque' || initial === 'pizarra' || initial === 'noche'
      ? initial
      : 'noche',
  })
  const [savedRaw, setSavedRaw] = useState(() =>
    serializeThemePreference({
      kind: 'fixed',
      themeId:
        initial === 'bosque' || initial === 'pizarra' || initial === 'noche'
          ? initial
          : 'noche',
    }),
  )

  useEffect(() => {
    applyThemePreference(themePref, { persist: false })
  }, [themePref])

  return (
    <div className="relative isolate min-h-dvh bg-bloomora-snow">
      <div
        className="bloomora-page-glows pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-bloomora-lavender-50/40 via-bloomora-snow to-bloomora-mist/80" />
      </div>
      <main className="app-shell-padding--dashboard mx-auto w-full max-w-[1184px] pb-8">
        <article
          className={cn(
            'bloomora-elevated-panel app-principal-card mt-6 overflow-hidden ring-1 ring-bloomora-line/25 max-[599px]:mt-4',
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <BackButton parentTo="/" parentLabel="Hoy" className="shrink-0" />
            <h1 className="app-fluid-title font-bold tracking-tight text-bloomora-deep">
              Editar perfil
            </h1>
          </div>

          <div className="mt-5 flex gap-1.5">
            <span className="flex h-10 items-center rounded-full px-4 text-[15px] font-bold text-bloomora-text-muted">
              Datos
            </span>
            <span className="flex h-10 items-center rounded-full border border-bloomora-line bg-bloomora-white px-4 text-[15px] font-bold text-bloomora-deep">
              Personalización
            </span>
            <span className="flex h-10 items-center rounded-full px-4 text-[15px] font-bold text-bloomora-text-muted">
              Avisos
            </span>
          </div>

          <div className="mt-6 rounded-[28px] border border-bloomora-line bg-bloomora-white p-6 shadow-[var(--bloomora-card-shadow)] sm:p-8">
            <ThemeSelector
              preference={themePref}
              effectiveThemeId={resolveEffectiveThemeId(themePref)}
              saved={serializeThemePreference(themePref) === savedRaw}
              onChange={(next) => {
                setThemePref(next)
                setSavedRaw(serializeThemePreference(next))
              }}
            />
          </div>
        </article>
      </main>
    </div>
  )
}
