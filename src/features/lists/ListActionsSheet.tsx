import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { cn } from '@/utils/cn'

export type ListActionId =
  | 'postit'
  | 'rename'
  | 'emoji'
  | 'select'
  | 'copy-text'
  | 'copy-image'
  | 'duplicate'
  | 'clear'
  | 'delete'

type Props = {
  open: boolean
  title: string
  emoji: string
  done: number
  total: number
  canPostit: boolean
  postitOpen: boolean
  exportBusy?: boolean
  onClose: () => void
  onAction: (id: ListActionId) => void
}

const ACTIONS: Array<{
  id: ListActionId
  label: string
  icon: string
  danger?: boolean
}> = [
  { id: 'postit', label: 'Abrir como post-it', icon: '📄' },
  { id: 'rename', label: 'Renombrar lista', icon: '✏️' },
  { id: 'emoji', label: 'Cambiar emoji', icon: '😊' },
  { id: 'select', label: 'Seleccionar ítems', icon: '☑️' },
  { id: 'copy-text', label: 'Copiar como texto', icon: '📋' },
  { id: 'copy-image', label: 'Copiar / guardar imagen', icon: '🖼️' },
  { id: 'duplicate', label: 'Duplicar lista', icon: '⧉' },
  { id: 'clear', label: 'Limpiar hechos', icon: '🧹' },
  { id: 'delete', label: 'Eliminar lista', icon: '🗑️', danger: true },
]

export function ListActionsSheet({
  open,
  title,
  emoji,
  done,
  total,
  canPostit,
  postitOpen,
  exportBusy = false,
  onClose,
  onAction,
}: Props) {
  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="bloomora-lists-sheet" role="presentation">
      <button
        type="button"
        className="bloomora-lists-sheet__backdrop"
        aria-label="Cerrar menú"
        data-backdrop
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-label={`Acciones de ${title}`}
        className="bloomora-lists-sheet__panel"
      >
        <div className="bloomora-lists-sheet__handle" aria-hidden />
        <div className="mb-3 flex items-center gap-3 px-1">
          <span className="grid size-11 place-items-center rounded-2xl bg-bloomora-blush text-xl">
            {emoji}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-bloomora-deep">{title}</p>
            <p className="text-sm text-bloomora-text-muted">
              {done} de {total} hechos
            </p>
          </div>
        </div>
        <ul className="space-y-1">
          {ACTIONS.map((a) => {
            const disabled =
              (a.id === 'postit' && (!canPostit || postitOpen)) ||
              (a.id === 'clear' && done === 0) ||
              ((a.id === 'copy-text' || a.id === 'copy-image') && exportBusy)
            return (
              <li key={a.id}>
                {a.id === 'delete' ? (
                  <div className="my-2 border-t border-bloomora-line/40" />
                ) : null}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onAction(a.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition',
                    a.danger
                      ? 'text-[#d64062] hover:bg-[#fff0f3]'
                      : 'text-bloomora-deep hover:bg-bloomora-mist/80',
                    disabled && 'opacity-45',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-10 place-items-center rounded-xl text-lg',
                      a.danger ? 'bg-[#ffe4ea]' : 'bg-bloomora-mist',
                    )}
                    aria-hidden
                  >
                    {a.icon}
                  </span>
                  <span className="font-bold">
                    {a.id === 'postit' && postitOpen
                      ? 'Ya en post-it'
                      : a.id === 'copy-image' && exportBusy
                        ? 'Generando imagen…'
                        : a.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 flex min-h-12 w-full items-center justify-center rounded-pill border border-bloomora-line bg-bloomora-white font-bold text-bloomora-violet"
        >
          Cancelar
        </button>
      </div>
    </div>,
    document.body,
  )
}
