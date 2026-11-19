import { useEffect, useState, useSyncExternalStore } from 'react'
import { BloomoraAlertDialog } from '@/components/ui/BloomoraAlertDialog'
import { Button } from '@/components/ui/Button'
import { getPwaInstallState, promptInstall, usePwaInstall } from '@/hooks/usePwaInstall'

const SHOW_DELAY_MS = 4000

const IOS_SAFARI_HELP =
  "1. Toca el botón Compartir (el cuadrito con flecha ↑) abajo en Safari. 2. Elige 'Agregar a pantalla de inicio'. 3. Toca 'Agregar'."

const IOS_OTHER_HELP =
  "Para instalarla, abre bloomora-m.netlify.app en Safari y desde ahí toca Compartir → 'Agregar a pantalla de inicio'."

const CHROME_HELP =
  "En Chrome toca ⋮ → 'Instalar app' o 'Agregar a pantalla principal'."

type InstallHelpKind = 'ios-safari' | 'ios-other' | 'chrome'

let helpKind: InstallHelpKind | null = null
const helpListeners = new Set<() => void>()

function subscribeHelp(listener: () => void) {
  helpListeners.add(listener)
  return () => {
    helpListeners.delete(listener)
  }
}

function getHelpKind() {
  return helpKind
}

function setHelpKind(next: InstallHelpKind | null) {
  helpKind = next
  for (const listener of helpListeners) listener()
}

/** Mismo flujo del banner y del menú de cuenta. Ignora el dismiss de 7 días. */
export function openInstallFlow() {
  try {
    const state = getPwaInstallState()
    if (state.canPrompt) {
      void promptInstall()
      return
    }
    if (state.isIos) {
      setHelpKind(state.isIosSafari ? 'ios-safari' : 'ios-other')
      return
    }
    setHelpKind('chrome')
  } catch {
    /* ignore */
  }
}

function helpCopy(kind: InstallHelpKind | null) {
  if (kind === 'ios-safari') return IOS_SAFARI_HELP
  if (kind === 'ios-other') return IOS_OTHER_HELP
  if (kind === 'chrome') return CHROME_HELP
  return undefined
}

export function InstallBloomoraPrompt() {
  const { isStandalone, isIos, canPrompt, isDismissed, dismiss } = usePwaInstall()
  const [delayElapsed, setDelayElapsed] = useState(false)
  const help = useSyncExternalStore(subscribeHelp, getHelpKind, () => null)

  useEffect(() => {
    const id = window.setTimeout(() => setDelayElapsed(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [])

  const showBanner =
    delayElapsed && !isStandalone && !isDismissed() && (canPrompt || isIos)

  return (
    <>
      {showBanner ? (
        <div
          className="fixed inset-x-3 z-40 rounded-[18px] bg-bloomora-white shadow-[0_14px_40px_rgba(91,74,140,0.16)] ring-1 ring-[color:var(--bloomora-border)] min-[600px]:hidden"
          style={{
            bottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 12px)',
          }}
        >
          <div className="flex items-center gap-2.5 p-3">
            <img
              src="/bloomora_favicon_192.png"
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight text-bloomora-deep">
                Instala Bloomora
              </p>
              <p className="mt-0.5 text-xs leading-snug text-bloomora-text-muted">
                Ábrela desde tu pantalla de inicio como una app
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0"
              onClick={() => openInstallFlow()}
            >
              Instalar
            </Button>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={dismiss}
              className="grid size-10 shrink-0 place-items-center rounded-full text-lg leading-none text-bloomora-text-muted transition hover:bg-bloomora-mist"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}

      <BloomoraAlertDialog
        open={help != null}
        variant="alert"
        title={
          help === 'chrome' ? 'Instalar Bloomora' : 'Agregar Bloomora a tu inicio'
        }
        description={helpCopy(help)}
        confirmLabel="Entendido"
        onConfirm={() => setHelpKind(null)}
        onCancel={() => setHelpKind(null)}
      />
    </>
  )
}
