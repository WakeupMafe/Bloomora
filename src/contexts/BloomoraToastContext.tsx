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
}

type ToastItem = { id: string; message: string }

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
      setToasts((prev) => [...prev, { id, message }])
      const duration = options?.duration ?? 3800
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
            {toasts.map((t) => (
              <div
                key={t.id}
                role="status"
                className={cn(
                  'bloomora-toast-enter pointer-events-auto w-full max-w-sm',
                  'rounded-[22px] border border-pink-200/90',
                  'bg-gradient-to-br from-white via-[#fff8fc] to-[#fdeef4]',
                  'px-5 py-3.5 text-center shadow-[0_14px_44px_-10px_rgba(232,155,184,0.42)]',
                  'ring-1 ring-bloomora-lilac/25',
                )}
              >
                <p className="text-[0.9375rem] font-semibold leading-snug tracking-tight text-bloomora-deep sm:text-base">
                  <span className="mr-1.5 inline-block" aria-hidden>
                    ✨
                  </span>
                  {t.message}
                </p>
              </div>
            ))}
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
