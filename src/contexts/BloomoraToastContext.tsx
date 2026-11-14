import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'

export type BloomoraToastOptions = {
  /** Duración visible en ms (por defecto ~3.8s). */
  duration?: number
  /** Etiqueta del botón de acción (p. ej. Deshacer). */
  actionLabel?: string
  /** Se ejecuta al pulsar la acción; el toast se cierra. */
  onAction?: () => void
  /**
   * `deep`: toast oscuro tipo apuntes (salto de página).
   * Por defecto mantiene el estilo rosado Bloomora.
   */
  tone?: 'default' | 'deep'
}

type ToastItem = {
  id: string
  message: string
  actionLabel?: string
  onAction?: () => void
  tone: 'default' | 'deep'
}

type BloomoraToastContextValue = {
  /** Mensaje corto en pantalla (estilo Bloomora rosadito). */
  showToast: (message: string, options?: BloomoraToastOptions) => void
}

const BloomoraToastContext = createContext<BloomoraToastContextValue | null>(
  null,
)

function newToastId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function BloomoraToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const remove = useCallback((id: string) => {
    const t = timers.current.get(id)
    if (t) clearTimeout(t)
    timers.current.delete(id)
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, options?: BloomoraToastOptions) => {
      const id = newToastId()
      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          actionLabel: options?.actionLabel,
          onAction: options?.onAction,
          tone: options?.tone ?? 'default',
        },
      ])
      const duration = options?.duration ?? (options?.actionLabel ? 5200 : 3800)
      const tid = setTimeout(() => remove(id), duration)
      timers.current.set(id, tid)
    },
    [remove],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  const portal =
    typeof document !== 'undefined'
      ? createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 bottom-[max(1.5rem,var(--spacing-safe-bottom))] z-[300] flex flex-col items-center gap-2.5 px-4 sm:bottom-10"
            aria-live="polite"
            aria-relevant="additions"
          >
            {toasts.map((t) => {
              const hasAction = Boolean(t.actionLabel && t.onAction)
              const isDeep = t.tone === 'deep'
              return (
                <div
                  key={t.id}
                  role="status"
                  className={cn(
                    'bloomora-toast-enter pointer-events-auto w-full max-w-sm',
                    isDeep
                      ? cn(
                          'flex min-h-[3.25rem] items-center gap-2 rounded-full',
                          'bg-[color:var(--bloomora-toast-bg)] text-[color:var(--bloomora-toast-fg)]',
                          'pl-5 pr-1.5 shadow-[0_8px_24px_rgba(63,52,104,0.3)]',
                          'ring-1 ring-[color:var(--bloomora-border)]',
                        )
                      : cn(
                          'rounded-[22px] border border-[color:var(--bloomora-border)]',
                          'bg-[color:var(--bloomora-toast-bg)]',
                          'px-5 py-3.5 text-center shadow-[0_14px_44px_-10px_rgba(232,155,184,0.42)]',
                          'ring-1 ring-[color:var(--bloomora-border)]',
                          hasAction && 'flex items-center gap-2 text-left',
                        ),
                  )}
                >
                  <p
                    className={cn(
                      'min-w-0 flex-1 font-semibold leading-snug tracking-tight',
                      isDeep
                        ? 'py-2 text-[0.9rem] text-[color:var(--bloomora-toast-fg)]'
                        : 'text-[0.9375rem] text-[color:var(--bloomora-toast-fg)] sm:text-base',
                      !hasAction && !isDeep && 'text-center',
                    )}
                  >
                    {!isDeep && !hasAction ? (
                      <span className="mr-1.5 inline-block" aria-hidden>
                        ✨
                      </span>
                    ) : null}
                    {t.message}
                  </p>
                  {hasAction ? (
                    <button
                      type="button"
                      className={cn(
                        'shrink-0 rounded-full font-bold transition-colors',
                        isDeep
                          ? 'h-10 px-4 text-sm text-[color:var(--bloomora-toast-fg)] bg-[color:var(--bloomora-surface-3)] hover:brightness-110'
                          : 'h-9 px-3.5 text-sm text-[color:var(--bloomora-text)] bg-[color:var(--bloomora-surface-2)] hover:bg-[color:var(--bloomora-surface-3)]',
                      )}
                      onClick={() => {
                        const action = t.onAction
                        remove(t.id)
                        action?.()
                      }}
                    >
                      {t.actionLabel}
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>,
          document.body,
        )
      : null

  return (
    <BloomoraToastContext.Provider value={value}>
      {children}
      {portal}
    </BloomoraToastContext.Provider>
  )
}

export function useBloomoraToast(): BloomoraToastContextValue {
  const ctx = useContext(BloomoraToastContext)
  if (!ctx) {
    throw new Error(
      'useBloomoraToast debe usarse dentro de BloomoraToastProvider',
    )
  }
  return ctx
}
