import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  NoteTextOptionsPanel,
  type NoteTextOptionsValues,
} from '@/features/notes/NoteTextOptionsPanel'
import type { EnglishNoteColor } from '@/types/englishNote'
import type { NoteBodyFont } from '@/features/notes/noteTypingDefaults'
import { ENGLISH_NOTE_COLORS } from '@/types/englishNote'
import {
  captureEditorSelection,
  coordsFromBookmark,
  restoreEditorSelection,
  type EditorSelectionBookmark,
} from '@/features/notes/noteSelectionBookmark'
import { coordsFromEditorCaret } from '@/features/notes/noteEditorUtils'
import type { NoteFormatTarget } from '@/features/notes/noteTextOptionsConstants'
import type {
  NoteFontWeight,
  NoteTextAlign,
  NoteTextCase,
} from '@/features/notes/noteTypingDefaults'
import { cn } from '@/utils/cn'

export type NoteSelectionToolbarCoords = {
  top: number
  left: number
  placement: 'above' | 'below'
}

export type NoteSelectionToolbarMode = 'full' | 'options'

export type { NoteFormatTarget } from '@/features/notes/noteTextOptionsConstants'

const Z_BACKDROP = 10_060
const Z_PANEL = 10_065
const Z_FLOATING = 45
const BAR_HEIGHT = 52
const GAP_ABOVE_SELECTION = 12
const EDGE_PAD = 8
const SHOW_HIDE_DEBOUNCE_MS = 120

function hasSelectionInEditor(editor: HTMLElement): Range | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return null
  if (!sel.toString().trim()) return null
  return range
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/** Viewport-aware coords for the dark floating selection bar (~12px above / flip below). */
export function coordsFromNoteSelection(
  editor: HTMLElement,
  reserveBottomPx = 0,
): NoteSelectionToolbarCoords | null {
  const range = hasSelectionInEditor(editor)
  if (!range) return null
  const rect = range.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return null

  const vv = window.visualViewport
  const viewTop = (vv?.offsetTop ?? 0) + EDGE_PAD
  const viewLeft = (vv?.offsetLeft ?? 0) + EDGE_PAD
  const viewWidth = vv?.width ?? window.innerWidth
  const viewBottom =
    (vv ? vv.offsetTop + vv.height : window.innerHeight) - Math.max(0, reserveBottomPx) - EDGE_PAD

  const spaceAbove = rect.top - viewTop
  const spaceBelow = viewBottom - rect.bottom
  const needsFlip = spaceAbove < BAR_HEIGHT + GAP_ABOVE_SELECTION
  const placement: 'above' | 'below' =
    needsFlip && spaceBelow > spaceAbove ? 'below' : 'above'

  const top =
    placement === 'above'
      ? rect.top - GAP_ABOVE_SELECTION
      : rect.bottom + GAP_ABOVE_SELECTION

  const left = clamp(
    rect.left + rect.width / 2,
    viewLeft,
    viewLeft + viewWidth - EDGE_PAD * 2,
  )

  return { top, left, placement }
}

export type UseNoteSelectionToolbarOptions = {
  /** Hide the floating bar (e.g. while a mobile sheet is open). */
  suppressed?: boolean
  /** Extra bottom inset so the bar never covers the quick bar / keyboard dock. */
  reserveBottomPx?: number
}

/** Barra flotante al seleccionar + Ctrl+O opciones de texto. */
export function useNoteSelectionToolbar(
  editorRef: React.RefObject<HTMLDivElement | null>,
  onRequestDismiss?: () => void,
  options?: UseNoteSelectionToolbarOptions,
) {
  const savedSelectionRef = useRef<EditorSelectionBookmark | null>(null)
  const [panel, setPanel] = useState<{
    coords: NoteSelectionToolbarCoords
    mode: NoteSelectionToolbarMode
    target: NoteFormatTarget
  } | null>(null)
  const panelRef = useRef(panel)
  const suppressed = options?.suppressed ?? false
  const reserveBottomPx = options?.reserveBottomPx ?? 0
  const suppressedRef = useRef(suppressed)
  const reserveBottomRef = useRef(reserveBottomPx)
  const interactingRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onRequestDismissRef = useRef(onRequestDismiss)
  useLayoutEffect(() => {
    onRequestDismissRef.current = onRequestDismiss
  }, [onRequestDismiss])
  useLayoutEffect(() => {
    panelRef.current = panel
  }, [panel])
  useLayoutEffect(() => {
    suppressedRef.current = suppressed
  }, [suppressed])
  useLayoutEffect(() => {
    reserveBottomRef.current = reserveBottomPx
  }, [reserveBottomPx])

  const openFormatting = useCallback(
    (mode: NoteSelectionToolbarMode): boolean => {
      const editor = editorRef.current
      if (!editor) return false

      const selectionCoords = coordsFromNoteSelection(editor, reserveBottomRef.current)
      if (selectionCoords) {
        savedSelectionRef.current = captureEditorSelection(editor)
        setPanel({ coords: selectionCoords, mode, target: 'selection' })
        return true
      }

      savedSelectionRef.current = null
      const caretCoords = coordsFromEditorCaret(editor)
      if (!caretCoords) return false
      setPanel({
        coords: { ...caretCoords, placement: 'above' },
        mode,
        target: 'typing',
      })
      return true
    },
    [editorRef],
  )

  const dismiss = useCallback(() => {
    setPanel(null)
    savedSelectionRef.current = null
  }, [])

  const requestDismiss = useCallback(() => {
    if (onRequestDismissRef.current) {
      onRequestDismissRef.current()
      return
    }
    dismiss()
  }, [dismiss])

  const requestDismissRef = useRef(requestDismiss)
  useLayoutEffect(() => {
    requestDismissRef.current = requestDismiss
  }, [requestDismiss])

  const preserveSelectionApply = useCallback(
    (fn: () => void) => {
      const editor = editorRef.current
      if (!editor) {
        fn()
        return
      }
      const snapshot = savedSelectionRef.current ?? captureEditorSelection(editor)
      if (snapshot) {
        restoreEditorSelection(editor, snapshot)
      }
      fn()
      requestAnimationFrame(() => {
        const next = captureEditorSelection(editor)
        if (next) {
          savedSelectionRef.current = next
          return
        }
        if (snapshot) {
          restoreEditorSelection(editor, snapshot)
        }
      })
    },
    [editorRef],
  )

  const syncFloatingFromSelection = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    const current = panelRef.current
    if (current?.mode === 'options') {
      const next =
        coordsFromNoteSelection(editor, reserveBottomRef.current) ??
        (savedSelectionRef.current
          ? (() => {
              const fromBookmark = coordsFromBookmark(editor, savedSelectionRef.current)
              return fromBookmark
                ? ({ ...fromBookmark, placement: 'above' } as NoteSelectionToolbarCoords)
                : null
            })()
          : null)
      if (next) {
        setPanel((prev) => (prev ? { ...prev, coords: next } : null))
      }
      return
    }

    if (suppressedRef.current || interactingRef.current) return

    const next = coordsFromNoteSelection(editor, reserveBottomRef.current)
    if (next) {
      savedSelectionRef.current = captureEditorSelection(editor)
      setPanel({ coords: next, mode: 'full', target: 'selection' })
      return
    }

    if (current?.mode === 'full') {
      setPanel(null)
    }
  }, [editorRef])

  const scheduleSync = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      syncFloatingFromSelection()
    }, SHOW_HIDE_DEBOUNCE_MS)
  }, [syncFloatingFromSelection])

  useEffect(() => {
    if (suppressed) {
      setPanel((prev) => (prev?.mode === 'full' ? null : prev))
      return
    }
    scheduleSync()
  }, [suppressed, scheduleSync])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const onSelectionChange = () => scheduleSync()
    document.addEventListener('selectionchange', onSelectionChange)

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (target instanceof Element && target.closest('[data-note-selection-toolbar]')) {
        interactingRef.current = true
        return
      }
      if (target instanceof Element && target.closest('[data-bloomora-modal-backdrop], [role="dialog"], [data-note-bottom-sheet]')) {
        return
      }
      interactingRef.current = false
      if (!editor.contains(target)) {
        const current = panelRef.current
        if (current?.mode === 'options') {
          requestDismissRef.current()
          return
        }
        if (current?.mode === 'full') {
          scheduleSync()
        }
      }
    }

    const onPointerUp = () => {
      if (interactingRef.current) {
        requestAnimationFrame(() => {
          interactingRef.current = false
          scheduleSync()
        })
      }
    }

    const onBlur = () => {
      window.setTimeout(() => {
        if (interactingRef.current) return
        if (suppressedRef.current) return
        const active = document.activeElement
        if (active instanceof Element && active.closest('[data-note-selection-toolbar], [role="dialog"], [data-note-bottom-sheet]')) {
          return
        }
        const current = panelRef.current
        if (current?.mode === 'full' && !hasSelectionInEditor(editor)) {
          setPanel(null)
        }
      }, SHOW_HIDE_DEBOUNCE_MS)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('pointerup', onPointerUp)
    editor.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointerup', onPointerUp)
      editor.removeEventListener('blur', onBlur)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [editorRef, scheduleSync])

  useEffect(() => {
    if (!panel) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (document.querySelector('[data-bloomora-modal-backdrop]')) return
      e.preventDefault()
      if (panel.mode === 'options') {
        requestDismissRef.current()
        return
      }
      dismiss()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [panel, dismiss])

  useEffect(() => {
    if (!panel || panel.mode !== 'options') return

    const prevBody = document.body.style.overflow
    const prevHtml = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevBody
      document.documentElement.style.overflow = prevHtml
    }
  }, [panel])

  useEffect(() => {
    if (!panel || panel.mode !== 'full') return
    const editor = editorRef.current
    if (!editor) return

    const update = () => {
      const next = coordsFromNoteSelection(editor, reserveBottomRef.current)
      if (next) {
        setPanel((prev) => (prev?.mode === 'full' ? { ...prev, coords: next } : prev))
        return
      }
      if (savedSelectionRef.current) {
        const fromBookmark = coordsFromBookmark(editor, savedSelectionRef.current)
        if (fromBookmark) {
          setPanel((prev) =>
            prev?.mode === 'full'
              ? { ...prev, coords: { ...fromBookmark, placement: prev.coords.placement } }
              : prev,
          )
        }
      }
    }

    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    const vv = window.visualViewport
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
    }
  }, [panel, editorRef, reserveBottomPx])

  const prepareSelectionForFormat = useCallback(() => {
    const editor = editorRef.current
    if (!editor || !savedSelectionRef.current) return false
    return restoreEditorSelection(editor, savedSelectionRef.current)
  }, [editorRef])

  return {
    coords: panel?.coords ?? null,
    mode: panel?.mode ?? 'options',
    formatTarget: panel?.target ?? 'selection',
    openFormatting,
    dismiss,
    preserveSelectionApply,
    prepareSelectionForFormat,
  }
}

type ColorPopoverKind = 'text' | 'highlight' | null

function FloatingColorPopover({
  kind,
  textColor,
  highlightColor,
  placement,
  onTextColor,
  onHighlight,
  onClearHighlight,
  keepSelection,
}: {
  kind: Exclude<ColorPopoverKind, null>
  textColor: string
  highlightColor: string | null
  placement: 'above' | 'below'
  onTextColor: (hex: string, colorId: EnglishNoteColor) => void
  onHighlight: (hex: string) => void
  onClearHighlight: () => void
  keepSelection: (e: React.MouseEvent | React.PointerEvent) => void
}) {
  return (
    <div
      role="listbox"
      aria-label={kind === 'text' ? 'Colores de texto' : 'Colores de resaltado'}
      className={cn(
        'note-selection-float__popover',
        placement === 'above'
          ? 'note-selection-float__popover--above'
          : 'note-selection-float__popover--below',
      )}
      onMouseDown={keepSelection}
      onPointerDown={keepSelection}
    >
      {kind === 'highlight' ? (
        <button
          type="button"
          role="option"
          aria-selected={!highlightColor}
          aria-label="Quitar resaltado"
          title="Quitar resaltado"
          className={cn(
            'note-selection-float__swatch note-selection-float__swatch--clear',
            !highlightColor && 'note-selection-float__swatch--on',
          )}
          onMouseDown={keepSelection}
          onClick={onClearHighlight}
        >
          /
        </button>
      ) : null}
      {ENGLISH_NOTE_COLORS.map((c) => {
        const active =
          kind === 'text' ? textColor.toLowerCase() === c.value.toLowerCase() : highlightColor === c.value
        return (
          <button
            key={c.id}
            type="button"
            role="option"
            aria-selected={active}
            aria-label={kind === 'text' ? `Color de texto: ${c.label}` : `Resaltar: ${c.label}`}
            title={c.label}
            className={cn(
              'note-selection-float__swatch',
              kind === 'highlight' && 'note-selection-float__swatch--hl',
              active && 'note-selection-float__swatch--on',
            )}
            style={{ backgroundColor: c.value }}
            onMouseDown={keepSelection}
            onClick={() => {
              if (kind === 'text') onTextColor(c.value, c.id)
              else onHighlight(c.value)
            }}
          />
        )
      })}
    </div>
  )
}

function FloatingSelectionBar({
  coords,
  active,
  textColor,
  highlightColor,
  onBold,
  onItalic,
  onUnderline,
  onTextColor,
  onHighlight,
  onClearHighlight,
  onOpenMore,
  onPrepareSelection,
}: {
  coords: NoteSelectionToolbarCoords
  active: { bold: boolean; italic: boolean; underline: boolean }
  textColor: string
  highlightColor: string | null
  onBold: () => void
  onItalic: () => void
  onUnderline: () => void
  onTextColor: (hex: string, colorId: EnglishNoteColor) => void
  onHighlight: (hex: string) => void
  onClearHighlight: () => void
  onOpenMore: () => void
  onPrepareSelection?: () => void
}) {
  const [colorPopover, setColorPopover] = useState<ColorPopoverKind>(null)

  const keepSelection = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault()
    onPrepareSelection?.()
  }

  useEffect(() => {
    setColorPopover(null)
  }, [coords.top, coords.left, coords.placement])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      role="toolbar"
      data-note-selection-toolbar
      aria-label="Formato de la selección"
      className={cn(
        'note-selection-float',
        coords.placement === 'above'
          ? 'note-selection-float--above'
          : 'note-selection-float--below',
      )}
      style={{
        top: coords.top,
        left: coords.left,
        zIndex: Z_FLOATING,
        ['--ax' as string]: '50%',
      }}
      onMouseDown={keepSelection}
      onPointerDown={keepSelection}
    >
      <button
        type="button"
        aria-label="Negrita"
        aria-pressed={active.bold}
        title="Negrita"
        className={cn('note-selection-float__btn', active.bold && 'note-selection-float__btn--on')}
        onMouseDown={keepSelection}
        onPointerDown={keepSelection}
        onClick={() => {
          setColorPopover(null)
          onBold()
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M7 5h6a3.5 3.5 0 010 7H7z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M7 12h7a3.5 3.5 0 010 7H7z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Cursiva"
        aria-pressed={active.italic}
        title="Cursiva"
        className={cn('note-selection-float__btn', active.italic && 'note-selection-float__btn--on')}
        onMouseDown={keepSelection}
        onPointerDown={keepSelection}
        onClick={() => {
          setColorPopover(null)
          onItalic()
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M19 4h-9M14 20H5M15 4L9 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Subrayado"
        aria-pressed={active.underline}
        title="Subrayado"
        className={cn('note-selection-float__btn', active.underline && 'note-selection-float__btn--on')}
        onMouseDown={keepSelection}
        onPointerDown={keepSelection}
        onClick={() => {
          setColorPopover(null)
          onUnderline()
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 4v6a6 6 0 0012 0V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 21h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <span className="note-selection-float__sep" aria-hidden />

      <div className="relative">
        <button
          type="button"
          aria-label="Color del texto"
          aria-expanded={colorPopover === 'text'}
          aria-haspopup="listbox"
          title="Color del texto"
          className={cn('note-selection-float__btn', colorPopover === 'text' && 'note-selection-float__btn--on')}
          onMouseDown={keepSelection}
          onPointerDown={keepSelection}
          onClick={() => setColorPopover((k) => (k === 'text' ? null : 'text'))}
        >
          <span className="note-selection-float__letter-a">
            A
            <i style={{ backgroundColor: textColor || 'var(--color-bloomora-rose)' }} />
          </span>
        </button>
        {colorPopover === 'text' ? (
          <FloatingColorPopover
            kind="text"
            textColor={textColor}
            highlightColor={highlightColor}
            placement={coords.placement}
            onTextColor={(hex, id) => {
              onTextColor(hex, id)
              setColorPopover(null)
            }}
            onHighlight={onHighlight}
            onClearHighlight={onClearHighlight}
            keepSelection={keepSelection}
          />
        ) : null}
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Resaltar"
          aria-expanded={colorPopover === 'highlight'}
          aria-haspopup="listbox"
          title="Resaltar"
          className={cn('note-selection-float__btn', colorPopover === 'highlight' && 'note-selection-float__btn--on')}
          onMouseDown={keepSelection}
          onPointerDown={keepSelection}
          onClick={() => setColorPopover((k) => (k === 'highlight' ? null : 'highlight'))}
        >
          <span className="note-selection-float__highlight-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M9 11l-5 5v4h4l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 11l6-6 4 4-6 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
        {colorPopover === 'highlight' ? (
          <FloatingColorPopover
            kind="highlight"
            textColor={textColor}
            highlightColor={highlightColor}
            placement={coords.placement}
            onTextColor={onTextColor}
            onHighlight={(hex) => {
              onHighlight(hex)
              setColorPopover(null)
            }}
            onClearHighlight={() => {
              onClearHighlight()
              setColorPopover(null)
            }}
            keepSelection={keepSelection}
          />
        ) : null}
      </div>

      <span className="note-selection-float__sep" aria-hidden />

      <button
        type="button"
        aria-label="Más formato"
        title="Aa Más"
        className="note-selection-float__btn note-selection-float__btn--more"
        onMouseDown={keepSelection}
        onPointerDown={keepSelection}
        onClick={() => {
          setColorPopover(null)
          onOpenMore()
        }}
      >
        <span className="note-selection-float__aa">Aa</span>
        Más
      </button>
    </div>,
    document.body,
  )
}

export function NoteSelectionToolbar({
  coords,
  mode,
  formatTarget,
  optionValues,
  active,
  textColor,
  highlightColor,
  onBold,
  onItalic,
  onUnderline,
  onOpenMore,
  onTextColor,
  onHighlight,
  onClearHighlight,
  onFontChange,
  onFontSizeChange: _onFontSizeChange,
  onFontSizeSet,
  onFontWeight,
  onAlign,
  onLineHeight,
  onParagraphSpacingChange,
  onTextCase,
  onCustomTextColor,
  onAlignCenter: _onAlignCenter,
  onAlignLeft: _onAlignLeft,
  onApplyTextoPreset,
  onClose,
  onPrepareSelection,
}: {
  coords: NoteSelectionToolbarCoords | null
  mode: NoteSelectionToolbarMode
  formatTarget: NoteFormatTarget
  optionValues: NoteTextOptionsValues
  active?: { bold: boolean; italic: boolean; underline: boolean }
  textColor?: string
  highlightColor?: string | null
  onBold?: () => void
  onItalic?: () => void
  onUnderline?: () => void
  onOpenMore?: () => void
  onTextColor: (hex: string, colorId: EnglishNoteColor) => void
  onHighlight: (hex: string) => void
  onClearHighlight: () => void
  onFontChange: (font: NoteBodyFont) => void
  onFontSizeChange: (deltaPx: number) => void
  onFontSizeSet: (px: number) => void
  onFontWeight: (weight: NoteFontWeight) => void
  onAlign: (align: NoteTextAlign) => void
  onLineHeight: (value: number) => void
  onParagraphSpacingChange: (value: number) => void
  onTextCase: (textCase: NoteTextCase) => void
  onCustomTextColor: (hex: string) => void
  onAlignCenter: () => void
  onAlignLeft: () => void
  onApplyTextoPreset?: () => void
  onClose?: () => void
  onPrepareSelection?: () => void
}) {
  if (!coords) return null

  const keepSelection = (e: React.MouseEvent) => {
    e.preventDefault()
    onPrepareSelection?.()
  }
  const isOptions = mode === 'options'
  const close = onClose ?? (() => {})

  if (isOptions && typeof document !== 'undefined') {
    return createPortal(
      <>
        <button
          type="button"
          data-backdrop
          data-note-selection-toolbar
          className="fixed inset-0 border-0 bg-bloomora-deep/25 p-0 backdrop-blur-[2px]"
          style={{ zIndex: Z_BACKDROP }}
          aria-label="Cerrar opciones de texto"
          onClick={close}
        />
        <div
          className="fixed inset-0 flex items-center justify-center overflow-hidden p-3 sm:p-6 pointer-events-none"
          style={{ zIndex: Z_PANEL }}
          data-note-selection-toolbar
        >
          <div className="pointer-events-auto w-full max-w-[min(100vw-1.5rem,28rem)]">
            <NoteTextOptionsPanel
              formatTarget={formatTarget}
              values={optionValues}
              onClose={close}
              keepSelection={keepSelection}
              onFontChange={onFontChange}
              onFontSizeChange={onFontSizeSet}
              onTextColor={onTextColor}
              onCustomTextColor={onCustomTextColor}
              onHighlight={onHighlight}
              onClearHighlight={onClearHighlight}
              onFontWeight={onFontWeight}
              onAlign={onAlign}
              onLineHeight={onLineHeight}
              onParagraphSpacingChange={onParagraphSpacingChange}
              onTextCase={onTextCase}
              onApplyTextoPreset={onApplyTextoPreset}
            />
          </div>
        </div>
      </>,
      document.body,
    )
  }

  if (mode !== 'full') return null

  return (
    <FloatingSelectionBar
      coords={coords}
      active={active ?? { bold: false, italic: false, underline: false }}
      textColor={textColor ?? '#111111'}
      highlightColor={highlightColor ?? null}
      onBold={onBold ?? (() => {})}
      onItalic={onItalic ?? (() => {})}
      onUnderline={onUnderline ?? (() => {})}
      onTextColor={onTextColor}
      onHighlight={onHighlight}
      onClearHighlight={onClearHighlight}
      onOpenMore={onOpenMore ?? (() => {})}
      onPrepareSelection={onPrepareSelection}
    />
  )
}
