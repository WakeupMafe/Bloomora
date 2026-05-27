import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  BloomoraAlertDialog,
  type BloomoraAlertDialogTone,
} from '@/components/ui/BloomoraAlertDialog'

export type BloomoraConfirmOptions = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: BloomoraAlertDialogTone
}

export type BloomoraAlertOptions = {
  title: string
  description?: string
  confirmLabel?: string
  tone?: BloomoraAlertDialogTone
}

type PendingDialog = {
  variant: 'confirm' | 'alert'
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: BloomoraAlertDialogTone
  resolve: (confirmed: boolean) => void
}

type BloomoraAlertContextValue = {
  /** Sustituto de `window.confirm`. Resuelve `true` si el usuario confirma. */
  confirm: (options: BloomoraConfirmOptions) => Promise<boolean>
  /** Sustituto de `window.alert`. Cierra al pulsar Aceptar. */
  alert: (options: BloomoraAlertOptions) => Promise<void>
}

const BloomoraAlertContext = createContext<BloomoraAlertContextValue | null>(
  null,
)

export function BloomoraAlertProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<PendingDialog | null>(null)
  const queueRef = useRef<PendingDialog[]>([])

  const dequeue = useCallback(() => {
    const next = queueRef.current.shift()
    setActive(next ?? null)
  }, [])

  const enqueue = useCallback((item: PendingDialog) => {
    setActive((current) => {
      if (!current) return item
      queueRef.current.push(item)
      return current
    })
  }, [])

  const confirm = useCallback(
    (options: BloomoraConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        enqueue({
          variant: 'confirm',
          ...options,
          resolve,
        })
      }),
    [enqueue],
  )

  const alert = useCallback(
    (options: BloomoraAlertOptions) =>
      new Promise<void>((resolve) => {
        enqueue({
          variant: 'alert',
          ...options,
          resolve: () => resolve(),
        })
      }),
    [enqueue],
  )

  const closeWith = useCallback(
    (confirmed: boolean) => {
      if (!active) return
      active.resolve(confirmed)
      dequeue()
    },
    [active, dequeue],
  )

  const value = useMemo(
    () => ({ confirm, alert }),
    [confirm, alert],
  )

  return (
    <BloomoraAlertContext.Provider value={value}>
      {children}
      <BloomoraAlertDialog
        open={!!active}
        variant={active?.variant ?? 'confirm'}
        title={active?.title ?? ''}
        description={active?.description}
        confirmLabel={active?.confirmLabel}
        cancelLabel={active?.cancelLabel}
        tone={active?.tone}
        onConfirm={() => closeWith(true)}
        onCancel={() => closeWith(false)}
      />
    </BloomoraAlertContext.Provider>
  )
}

export function useBloomoraAlert(): BloomoraAlertContextValue {
  const ctx = useContext(BloomoraAlertContext)
  if (!ctx) {
    throw new Error('useBloomoraAlert debe usarse dentro de BloomoraAlertProvider')
  }
  return ctx
}
