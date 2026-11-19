import { useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { BloomoraLogo } from '@/components/brand/BloomoraLogo'
import { BloomoraImage } from '@/components/ui/BloomoraImage'
import { BloomoraConfirmDialog } from '@/components/ui/BloomoraConfirmDialog'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { usePurgePreviousAgendaMonth } from '@/hooks/useAgendaDayOperations'
import { useBloomoraProfile } from '@/hooks/useBloomoraProfile'
import {
  formatYearMonthLabel,
  previousYearMonthLocal,
} from '@/utils/agendaTime'
import {
  formatProfileGreeting,
  profileAvatarSrc,
  profileFirstName,
} from '@/lib/profileAvatarSrc'
import { mockProfileFirstName } from '@/data/dashboardMock'
import { openInstallFlow } from '@/features/pwa/InstallBloomoraPrompt'
import { usePopoverDismiss } from '@/hooks/usePopoverDismiss'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { to: '/app', label: 'Hoy', match: 'hoy' as const },
  { to: '/app/goals/overview', label: 'Metas', match: 'metas' as const },
  { to: '/app/lists', label: 'Listas', match: 'listas' as const },
  {
    to: '/app/study-tools',
    label: 'Herramientas',
    match: 'herramientas' as const,
  },
] as const

type NavMatch = (typeof NAV_ITEMS)[number]['match']

function resolveActiveTab(pathname: string): NavMatch | null {
  if (
    pathname.startsWith('/app/study-tools') ||
    pathname.startsWith('/app/pomodoro') ||
    pathname.startsWith('/app/flashcards') ||
    pathname.startsWith('/app/english-notes')
  ) {
    return 'herramientas'
  }
  if (pathname.startsWith('/app/lists') || pathname.startsWith('/app/shopping')) {
    return 'listas'
  }
  if (pathname.startsWith('/app/goals')) {
    return 'metas'
  }
  if (
    pathname === '/app' ||
    pathname === '/app/' ||
    pathname.startsWith('/app/today') ||
    pathname.startsWith('/app/agenda') ||
    pathname.startsWith('/app/tasks')
  ) {
    return 'hoy'
  }
  return null
}

const TAB_ICONS: Record<NavMatch, string> = {
  hoy: '🏠',
  metas: '🎯',
  listas: '📋',
  herramientas: '🧰',
}

/**
 * Chrome compartido de `/app`: navbar 64px + tab bar móvil (≤599px).
 */
export function DashboardShellNav() {
  const location = useLocation()
  const active = resolveActiveTab(location.pathname)
  const { phone, cedula, logoutPhone } = useUserPhone()
  const { data: profile } = useBloomoraProfile(phone)
  const { showToast } = useBloomoraToast()
  const purgeMonth = usePurgePreviousAgendaMonth(cedula)
  const [purgeConfirmOpen, setPurgeConfirmOpen] = useState(false)
  const purgeTargetYm = useMemo(() => previousYearMonthLocal(), [])
  const purgeTargetLabel = useMemo(
    () => formatYearMonthLabel(purgeTargetYm),
    [purgeTargetYm],
  )

  const displayName = profileFirstName(
    profile ?? undefined,
    mockProfileFirstName,
  )
  const greetingName = formatProfileGreeting(
    profile?.full_name,
    mockProfileFirstName,
  )
  const avatarUrl = profileAvatarSrc(profile ?? undefined)

  const { isStandalone } = usePwaInstall()
  const [menuOpen, setMenuOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  usePopoverDismiss(menuOpen, triggerRef, menuRef, () => setMenuOpen(false))

  return (
    <>
      <BloomoraConfirmDialog
        open={purgeConfirmOpen}
        title={`¿Eliminar tareas de ${purgeTargetLabel}?`}
        description={`Se borrarán todas las tareas de agenda de ${purgeTargetLabel}. Tus metas y el seguimiento del tracker no se modifican.`}
        cancelLabel="Cancelar"
        confirmLabel="Sí, eliminar"
        tone="danger"
        isPending={purgeMonth.isPending}
        onCancel={() => setPurgeConfirmOpen(false)}
        onConfirm={() => {
          purgeMonth.mutate(purgeTargetYm, {
            onSuccess: (result) => {
              showToast(
                result.deletedPlans > 0
                  ? `Tareas de ${purgeTargetLabel} eliminadas.`
                  : `No había tareas guardadas en ${purgeTargetLabel}.`,
              )
              setPurgeConfirmOpen(false)
            },
            onError: (err) => {
              showToast(
                err instanceof Error
                  ? err.message
                  : 'No se pudo limpiar el mes anterior.',
              )
            },
          })
        }}
      />

      <header className="sticky top-0 z-40 border-b border-bloomora-line bg-bloomora-white/90 backdrop-blur-md">
        <div className="app-shell-nav-inner mx-auto flex h-16 max-w-[1184px] items-center gap-4 min-[600px]:gap-6 min-[1024px]:gap-8">
          <Link
            to="/app"
            className="shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloomora-lilac"
            aria-label="Bloomora — inicio"
          >
            <BloomoraLogo size="sm" priority />
          </Link>

          <nav
            className="ml-1 hidden min-w-0 flex-1 items-center gap-1 min-[600px]:flex"
            aria-label="Secciones principales"
          >
            {NAV_ITEMS.map((item) => {
              const isOn = active === item.match
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.match === 'hoy'}
                  className={cn(
                    'inline-flex h-10 min-h-10 items-center rounded-pill px-4 text-[0.9375rem] font-semibold transition',
                    isOn
                      ? 'bg-bloomora-blush text-bloomora-deep'
                      : 'text-bloomora-violet hover:bg-bloomora-mist/80 hover:text-bloomora-deep',
                  )}
                  aria-current={isOn ? 'page' : undefined}
                >
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="relative ml-auto shrink-0">
            <button
              ref={triggerRef}
              type="button"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label={`Menú de cuenta de ${greetingName}`}
              id="app-shell-profile-trigger"
              onClick={() => setMenuOpen((o) => !o)}
              className="grid size-11 place-items-center overflow-hidden rounded-full bg-bloomora-mist ring-2 ring-bloomora-white outline outline-2 outline-bloomora-line transition hover:outline-bloomora-lilac/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloomora-lilac"
            >
              <BloomoraImage
                src={avatarUrl}
                alt=""
                aria-hidden
                size="thumb"
                className="h-full w-full object-cover object-center"
              />
            </button>

            {menuOpen ? (
              <div
                ref={menuRef}
                id="app-shell-profile-menu"
                role="menu"
                aria-labelledby="app-shell-profile-trigger"
                className="absolute right-0 z-50 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-bloomora-line/30 bg-bloomora-white py-1 shadow-[0_14px_40px_rgba(91,74,140,0.16)]"
              >
                <p className="truncate px-3 py-2 text-xs font-semibold text-bloomora-text-muted">
                  {displayName}
                </p>
                <Link
                  to="/app/profile"
                  role="menuitem"
                  className="block px-3 py-2.5 text-sm font-medium text-bloomora-deep transition hover:bg-bloomora-mist/90"
                  onClick={() => setMenuOpen(false)}
                >
                  Editar perfil
                </Link>
                {!isStandalone ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2.5 text-left text-sm font-medium text-bloomora-deep transition hover:bg-bloomora-mist/90"
                    onClick={() => {
                      setMenuOpen(false)
                      openInstallFlow()
                    }}
                  >
                    Instalar Bloomora
                  </button>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2.5 text-left text-sm font-medium text-bloomora-deep transition hover:bg-bloomora-mist/90"
                  onClick={() => {
                    setMenuOpen(false)
                    setPurgeConfirmOpen(true)
                  }}
                >
                  Limpiar tareas de {purgeTargetLabel}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2.5 text-left text-sm font-medium text-bloomora-deep transition hover:bg-bloomora-mist/90"
                  onClick={() => {
                    setMenuOpen(false)
                    logoutPhone()
                    window.location.assign('/entrar')
                  }}
                >
                  Cerrar sesión
                </button>
                <Link
                  to="/"
                  role="menuitem"
                  className="block px-3 py-2.5 text-sm font-medium text-bloomora-deep transition hover:bg-bloomora-mist/90"
                  onClick={() => setMenuOpen(false)}
                >
                  Inicio
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <nav
        className="app-shell-mobile-tabs fixed inset-x-0 bottom-0 z-40 border-t border-bloomora-line bg-bloomora-white min-[600px]:hidden"
        aria-label="Navegación principal"
      >
        <div className="mx-auto flex h-[72px] max-w-[1184px] items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom,0px)]">
          {NAV_ITEMS.map((item) => {
            const isOn = active === item.match
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.match === 'hoy'}
                className={cn(
                  'flex min-h-12 min-w-[4rem] flex-1 flex-col items-center justify-center gap-0.5 text-[0.75rem] font-bold transition',
                  isOn
                    ? 'text-bloomora-rose-deep'
                    : 'text-bloomora-text-muted',
                )}
                aria-current={isOn ? 'page' : undefined}
              >
                <span className="text-[1.375rem] leading-none" aria-hidden>
                  {TAB_ICONS[item.match]}
                </span>
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}
