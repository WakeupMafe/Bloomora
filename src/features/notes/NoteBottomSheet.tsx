import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'

type NoteBottomSheetProps = {
  open: boolean
  title: ReactNode
  onClose: () => void
  children: ReactNode
  labelledBy?: string
  className?: string
}

/** Shared scrim + grab handle + close control for Apuntes mobile sheets. */
export function NoteBottomSheet({
  open,
  title,
  onClose,
  children,
  labelledBy,
  className,
}: NoteBottomSheetProps) {
  const titleId = useId()
  const labelId = labelledBy ?? titleId

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="note-bottom-sheet-root" role="presentation">
      <button
        type="button"
        className="note-bottom-sheet-scrim"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className={cn('note-bottom-sheet', className)}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="note-bottom-sheet__grab" aria-hidden />
        <header className="note-bottom-sheet__header">
          <h2 id={labelId} className="note-bottom-sheet__title">
            {title}
          </h2>
          <button
            type="button"
            className="note-bottom-sheet__close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="note-bottom-sheet__body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
