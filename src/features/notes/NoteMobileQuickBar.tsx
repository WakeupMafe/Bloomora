import type { MouseEvent, PointerEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useVisualViewportDock } from '@/features/notes/useVisualViewportDock'
import { cn } from '@/utils/cn'

type NoteMobileQuickBarProps = {
  active: {
    bold: boolean
    italic: boolean
    bulletList?: boolean
  }
  onUndo: () => void
  onBold: () => void
  onItalic: () => void
  onBulletList: () => void
  onOpenFormat: () => void
  onOpenInsert: () => void
  onHideKeyboard: () => void
  onShowKeyboard: () => void
}

function keepFocus(event: PointerEvent | MouseEvent) {
  event.preventDefault()
}

function QuickBtn({
  label,
  ariaLabel,
  active = false,
  accent = false,
  onClick,
  children,
}: {
  label: string
  ariaLabel?: string
  active?: boolean
  accent?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? label}
      aria-pressed={active}
      title={ariaLabel ?? label}
      onPointerDown={keepFocus}
      onMouseDown={keepFocus}
      onClick={onClick}
      className={cn(
        'note-mobile-quickbar__btn',
        active && 'note-mobile-quickbar__btn--active',
        accent && 'note-mobile-quickbar__btn--accent',
      )}
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

/** Narrow-only mini toolbar: always visible on mobile; docks above soft keyboard when open. */
export function NoteMobileQuickBar({
  active,
  onUndo,
  onBold,
  onItalic,
  onBulletList,
  onOpenFormat,
  onOpenInsert,
  onHideKeyboard,
  onShowKeyboard,
}: NoteMobileQuickBarProps) {
  const { bottomOffset, keyboardOpen } = useVisualViewportDock()

  return createPortal(
    <div
      role="toolbar"
      aria-label="Formato rápido"
      data-note-mobile-quickbar
      className="note-mobile-quickbar"
      style={{
        bottom: `${bottomOffset}px`,
      }}
    >
      <QuickBtn label="Deshacer" onClick={onUndo}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M9 14L4 9l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 9h11a5 5 0 010 10h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </QuickBtn>
      <QuickBtn label="Negrita" active={active.bold} onClick={onBold}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M7 5h6a3.5 3.5 0 010 7H7z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M7 12h7a3.5 3.5 0 010 7H7z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        </svg>
      </QuickBtn>
      <QuickBtn label="Cursiva" active={active.italic} onClick={onItalic}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M19 4h-9M14 20H5M15 4L9 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </QuickBtn>
      <QuickBtn label="Lista" active={!!active.bulletList} onClick={onBulletList}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="4.5" cy="6" r="1.2" fill="currentColor" />
          <circle cx="4.5" cy="12" r="1.2" fill="currentColor" />
          <circle cx="4.5" cy="18" r="1.2" fill="currentColor" />
        </svg>
      </QuickBtn>
      <span className="note-mobile-quickbar__sep" aria-hidden />
      <QuickBtn label="Formato" ariaLabel="Aa Formato" onClick={onOpenFormat}>
        <span className="note-mobile-quickbar__aa" aria-hidden>Aa</span>
      </QuickBtn>
      <QuickBtn label="Insertar" ariaLabel="+ Insertar" accent onClick={onOpenInsert}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </QuickBtn>
      {keyboardOpen ? (
        <QuickBtn label="Ocultar" ariaLabel="Ocultar teclado" onClick={onHideKeyboard}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="2.5" y="4" width="19" height="11" rx="2.5" stroke="currentColor" strokeWidth="2" />
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M7 11.5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 19l3 2.5 3-2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </QuickBtn>
      ) : (
        <QuickBtn label="Teclado" onClick={onShowKeyboard}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </QuickBtn>
      )}
    </div>,
    document.body,
  )
}
