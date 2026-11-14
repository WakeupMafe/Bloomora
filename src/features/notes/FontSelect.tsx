import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { NoteBodyFont } from '@/features/notes/noteTypingDefaults'
import { NOTE_BODY_FONTS, noteBodyFontFamily } from '@/features/notes/noteFontUtils'

export function FontSelect({
  value,
  onChange,
  onPointerDown,
}: {
  value: NoteBodyFont
  onChange: (font: NoteBodyFont) => void
  onPointerDown?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 8, left: 8, maxHeight: 'calc(100dvh - 1rem)' })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selectedFont = NOTE_BODY_FONTS.find((font) => font.id === value) ?? NOTE_BODY_FONTS[0]

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!trigger || !menu) return
    const anchor = trigger.getBoundingClientRect()
    const viewportWidth = document.documentElement.clientWidth
    const viewportHeight = window.innerHeight
    const width = Math.min(256, viewportWidth - 24)
    const height = Math.min(menu.scrollHeight, viewportHeight - 16)
    let top = anchor.bottom + 8
    if (top + height > viewportHeight - 8) top = anchor.top - height - 8
    top = Math.max(8, Math.min(top, viewportHeight - 16))
    const left = Math.max(8, Math.min(anchor.left, viewportWidth - width - 8))
    setPosition({ top, left, maxHeight: `calc(100dvh - ${top + 8}px)` })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  return (
    <div className="shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Fuente: ${selectedFont.label}`}
        title="Elegir fuente"
        onPointerDown={onPointerDown}
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-[clamp(6.25rem,28vw,12rem)] max-w-[9.5rem] items-center justify-between gap-2 rounded-full border border-bloomora-line/50 bg-white px-3 text-xs font-medium text-bloomora-deep shadow-sm transition hover:border-bloomora-lilac/60 hover:bg-bloomora-lavender-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-bloomora-lilac sm:max-w-none"
      >
        <span className="truncate" style={{ fontFamily: noteBodyFontFamily(value) }}>{selectedFont.label}</span>
        <svg viewBox="0 0 16 16" className={`size-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" aria-hidden>
          <path d="m3.5 6 4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? createPortal(
        <div
          ref={menuRef}
          role="listbox"
          aria-label="Fuentes disponibles"
          style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 99999, width: 'min(16rem, calc(100vw - 1.5rem))', maxHeight: position.maxHeight, pointerEvents: 'auto' }}
          className="overflow-y-auto overscroll-contain rounded-2xl border border-bloomora-line/45 bg-white/95 p-2 shadow-[0_16px_48px_-18px_rgba(67,47,97,0.42)] backdrop-blur"
        >
          <p className="px-2 pb-1 pt-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-bloomora-text-muted">Fuente</p>
          <div className="grid gap-1">
            {NOTE_BODY_FONTS.map((font) => (
              <button
                key={font.id}
                type="button"
                role="option"
                aria-selected={font.id === value}
                onClick={() => {
                  onChange(font.id)
                  setOpen(false)
                  triggerRef.current?.focus()
                }}
                className={`flex min-h-10 items-center justify-between rounded-xl px-3 text-left transition ${font.id === value ? 'bg-bloomora-rose/15 text-bloomora-violet ring-1 ring-bloomora-rose/25' : 'text-bloomora-deep hover:bg-bloomora-lavender-50'}`}
              >
                <span style={{ fontFamily: noteBodyFontFamily(font.id) }} className="text-base">{font.label}</span>
                <span className="text-[0.62rem] text-bloomora-text-muted">Ag</span>
              </button>
            ))}
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  )
}
