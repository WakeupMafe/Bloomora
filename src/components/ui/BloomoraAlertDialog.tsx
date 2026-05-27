import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/utils/cn'

const Z_BACKDROP = 10_070
const Z_DIALOG = 10_075

export type BloomoraAlertDialogTone = 'default' | 'danger'

export type BloomoraAlertDialogProps = {
  open: boolean
  /** `confirm`: cancelar + confirmar. `alert`: solo aceptar. */
  variant?: 'confirm' | 'alert'
  title: string
  /** Texto principal bajo el título (opcional). */
  description?: string
  cancelLabel?: string
  confirmLabel?: string
  /** Estilo del botón principal (destructivo = rojo). */
  tone?: BloomoraAlertDialogTone
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Diálogo modal al estilo Bloomora (portal + backdrop).
 * Usar `variant="alert"` para avisos con un solo botón.
 */
export function BloomoraAlertDialog({
  open,
  variant = 'confirm',
  title,
  description,
  cancelLabel = 'Cancelar',
  confirmLabel,
  tone = 'default',
  isPending,
  onConfirm,
  onCancel,
}: BloomoraAlertDialogProps) {
  const resolvedConfirmLabel =
    confirmLabel ?? (variant === 'alert' ? 'Aceptar' : 'Confirmar')
  const titleId = useId()
  const descId = useId()
  const isNarrow = useMediaQuery('(max-width: 639px)')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (variant === 'alert') onConfirm()
        else onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel, onConfirm, variant])

  if (!open || typeof document === 'undefined') return null

  const portal = createPortal(
    <>
      <button
        type="button"
        data-backdrop
        data-bloomora-modal-backdrop
        className="fixed inset-0 border-0 bg-bloomora-deep/20 p-0 backdrop-blur-[2px] transition-[background-color] duration-200 ease-out hover:bg-bloomora-deep/26 active:bg-bloomora-deep/30"
        style={{ zIndex: Z_BACKDROP }}
        aria-label="Cerrar"
        onClick={variant === 'alert' ? onConfirm : onCancel}
      />
      <div
        role="dialog"
        aria-modal={true}
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'bloomora-modal-panel fixed flex flex-col gap-4 overflow-hidden bg-bloomora-blush/[0.98] shadow-[0_16px_48px_rgba(91,74,140,0.22)] ring-1 ring-bloomora-line/40 backdrop-blur-md',
          isNarrow
            ? 'rounded-[22px] p-5'
            : 'left-1/2 top-1/2 max-w-[min(100vw-2rem,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6',
        )}
        style={
          isNarrow
            ? {
                zIndex: Z_DIALOG,
                left: 'max(12px, env(safe-area-inset-left))',
                right: 'max(12px, env(safe-area-inset-right))',
                bottom: 'max(12px, env(safe-area-inset-bottom))',
                width: 'auto',
              }
            : { zIndex: Z_DIALOG }
        }
      >
        <h2
          id={titleId}
          className="bloomora-modal-title text-base font-bold leading-snug tracking-tight text-bloomora-deep sm:text-lg"
        >
          {title}
        </h2>
        {description ? (
          <p
            id={descId}
            className="bloomora-modal-desc text-sm leading-relaxed text-bloomora-text-muted"
          >
            {description}
          </p>
        ) : null}
        <div
          className={cn(
            'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3',
            variant === 'alert' && 'sm:justify-stretch',
          )}
        >
          {variant === 'confirm' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={onCancel}
              className="sm:min-w-[6.5rem]"
            >
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isPending}
            onClick={onConfirm}
            className={cn(
              variant === 'alert' ? 'w-full sm:w-auto' : 'sm:min-w-[6.5rem]',
              tone === 'danger' &&
                'bg-gradient-to-r from-red-500 to-rose-500 shadow-[0_12px_32px_-8px_rgba(244,63,94,0.45)] hover:brightness-[1.08] hover:saturate-110 hover:shadow-[0_14px_36px_-8px_rgba(244,63,94,0.5)]',
            )}
          >
            {isPending ? '…' : resolvedConfirmLabel}
          </Button>
        </div>
      </div>
    </>,
    document.body,
  )

  return portal
}
