import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { EnglishNoteColor, EnglishNoteTitleFont } from '@/types/englishNote'
import { ENGLISH_NOTE_COLORS } from '@/types/englishNote'
import { NOTE_FONT_SIZE_STEP_PX } from '@/features/notes/noteEditorUtils'
import { coordsFromEditorCaret } from '@/features/notes/noteEditorUtils'
import {
  captureEditorSelection,
  coordsFromBookmark,
  restoreEditorSelection,
  type EditorSelectionBookmark,
} from '@/features/notes/noteSelectionBookmark'
import { cn } from '@/utils/cn'

export type NoteSelectionToolbarCoords = {
  top: number
  left: number
}

export type NoteSelectionToolbarMode = 'full' | 'options'

export type NoteFormatTarget = 'selection' | 'typing'

const NOTE_FONTS: Array<{ id: EnglishNoteTitleFont; label: string }> = [
  { id: 'popis', label: 'Poppins' },
  { id: 'arial', label: 'Arial' },
  { id: 'cursive', label: 'Cursiva' },
  { id: 'cursive2', label: 'Cursiva 2' },
]

function hasSelectionInEditor(editor: HTMLElement): Range | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return null
  if (!sel.toString().trim()) return null
  return range
}

export function coordsFromNoteSelection(editor: HTMLElement): NoteSelectionToolbarCoords | null {
  const range = hasSelectionInEditor(editor)
  if (!range) return null
  const rect = range.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return null
  return {
    top: Math.max(8, rect.top - 10),
    left: rect.left + rect.width / 2,
  }
}

/** Barra flotante: Ctrl+O = formato con selección o al escribir. */
export function useNoteSelectionToolbar(editorRef: React.RefObject<HTMLDivElement | null>) {
  const savedSelectionRef = useRef<EditorSelectionBookmark | null>(null)
  const [panel, setPanel] = useState<{
    coords: NoteSelectionToolbarCoords
    mode: NoteSelectionToolbarMode
    target: NoteFormatTarget
  } | null>(null)

  const openFormatting = useCallback(
    (mode: NoteSelectionToolbarMode): boolean => {
      const editor = editorRef.current
      if (!editor) return false

      const selectionCoords = coordsFromNoteSelection(editor)
      if (selectionCoords) {
        savedSelectionRef.current = captureEditorSelection(editor)
        setPanel({ coords: selectionCoords, mode, target: 'selection' })
        return true
      }

      savedSelectionRef.current = null
      const caretCoords = coordsFromEditorCaret(editor)
      if (!caretCoords) return false
      setPanel({ coords: caretCoords, mode, target: 'typing' })
      return true
    },
    [editorRef],
  )

  const dismiss = useCallback(() => {
    setPanel(null)
    savedSelectionRef.current = null
  }, [])

  const dismissRef = useRef(dismiss)
  dismissRef.current = dismiss

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

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (target instanceof Element && target.closest('[data-note-selection-toolbar]')) {
        return
      }
      if (!editor.contains(target)) {
        dismissRef.current()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [editorRef])

  useEffect(() => {
    if (!panel) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        dismissRef.current()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [panel])

  useEffect(() => {
    if (!panel || panel.target !== 'selection') return
    const editor = editorRef.current
    if (!editor) return

    const update = () => {
      const next = coordsFromNoteSelection(editor)
      if (next) {
        setPanel((prev) => (prev ? { ...prev, coords: next } : null))
        return
      }
      if (savedSelectionRef.current) {
        const fromBookmark = coordsFromBookmark(editor, savedSelectionRef.current)
        if (fromBookmark) {
          setPanel((prev) => (prev ? { ...prev, coords: fromBookmark } : null))
        }
      }
    }

    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [panel, editorRef])

  return {
    coords: panel?.coords ?? null,
    mode: panel?.mode ?? 'options',
    formatTarget: panel?.target ?? 'selection',
    openFormatting,
    dismiss,
    preserveSelectionApply,
  }
}

function ColorHighlightRow({
  onTextColor,
  onHighlight,
  keepSelection,
  showHighlight,
}: {
  onTextColor: (hex: string, colorId: EnglishNoteColor) => void
  onHighlight: (hex: string) => void
  keepSelection: (e: React.MouseEvent) => void
  showHighlight: boolean
}) {
  return (
    <>
      <span className="text-[0.65rem] font-bold uppercase tracking-wide text-bloomora-violet">
        Color
      </span>
      {ENGLISH_NOTE_COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          title={c.label}
          aria-label={`Color de texto: ${c.label}`}
          className="size-7 rounded-full border-2 border-white shadow-sm transition hover:scale-110"
          style={{ backgroundColor: c.value }}
          onMouseDown={keepSelection}
          onClick={() => onTextColor(c.value, c.id)}
        />
      ))}
      {showHighlight ? (
        <>
          <span className="mx-0.5 h-6 w-px bg-bloomora-line/40" aria-hidden />
          <span className="text-[0.65rem] font-bold uppercase tracking-wide text-bloomora-violet">
            Resaltar
          </span>
          {ENGLISH_NOTE_COLORS.map((c) => (
            <button
              key={`hl-${c.id}`}
              type="button"
              title={`Resaltar: ${c.label}`}
              aria-label={`Resaltar: ${c.label}`}
              className="size-6 rounded-md border border-bloomora-line/30 ring-1 ring-inset ring-white/50 transition hover:scale-110"
              style={{ backgroundColor: c.value }}
              onMouseDown={keepSelection}
              onClick={() => onHighlight(c.value)}
            />
          ))}
        </>
      ) : null}
    </>
  )
}

export function NoteSelectionToolbar({
  coords,
  mode,
  formatTarget,
  onTextColor,
  onHighlight,
  onFontChange,
  onFontSizeChange,
  onAlignCenter,
  onAlignLeft,
  onApplyTextoPreset,
  onClose,
}: {
  coords: NoteSelectionToolbarCoords | null
  mode: NoteSelectionToolbarMode
  formatTarget: NoteFormatTarget
  onTextColor: (hex: string, colorId: EnglishNoteColor) => void
  onHighlight: (hex: string) => void
  onFontChange: (font: EnglishNoteTitleFont) => void
  onFontSizeChange: (deltaPx: number) => void
  onAlignCenter: () => void
  onAlignLeft: () => void
  onApplyTextoPreset?: () => void
  onClose?: () => void
}) {
  if (!coords) return null

  const keepSelection = (e: React.MouseEvent) => e.preventDefault()
  const isOptions = mode === 'options'
  const isTyping = formatTarget === 'typing'
  const closeOnPick = isTyping

  return (
    <div
      role="toolbar"
      data-note-selection-toolbar
      onMouseDown={keepSelection}
      aria-label={
        isTyping ? 'Formato del texto que vas a escribir' : 'Opciones del texto seleccionado'
      }
      className={cn(
        'fixed z-50 -translate-y-full rounded-2xl border border-bloomora-line/30 bg-bloomora-white/95 px-3 py-2.5 shadow-[0_12px_36px_-10px_rgba(91,74,140,0.35)] backdrop-blur-sm',
        isOptions ? 'max-w-[min(100vw-1rem,26rem)]' : 'max-w-[min(100vw-1rem,28rem)]',
        isTyping ? '-translate-x-0' : '-translate-x-1/2',
      )}
      style={{ top: coords.top, left: coords.left }}
    >
      {isOptions ? (
        <div className="flex flex-col gap-2">
          <p className="text-[0.6rem] font-semibold text-bloomora-text-muted">
            {isTyping
              ? 'Ctrl+O · Formato para el texto que escribas (sin selección)'
              : 'Ctrl+O · Opciones de texto'}
          </p>
          {isTyping && onApplyTextoPreset ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="!min-h-8 px-3 text-xs"
                onMouseDown={keepSelection}
                onClick={() => {
                  onApplyTextoPreset()
                  if (closeOnPick) onClose?.()
                }}
              >
                Texto
              </Button>
              <span className="text-[0.65rem] text-bloomora-text-muted">
                Poppins, gris, izquierda, 15px
              </span>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[0.65rem] font-bold uppercase tracking-wide text-bloomora-violet">
              Fuente
            </span>
            {NOTE_FONTS.map((f) => (
              <Button
                key={f.id}
                type="button"
                variant="secondary"
                size="sm"
                className="!min-h-8 px-2.5 text-xs"
                onMouseDown={keepSelection}
                onClick={() => {
                  onFontChange(f.id)
                  if (closeOnPick) onClose?.()
                }}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-bloomora-line/20 pt-2">
            <ColorHighlightRow
              onTextColor={onTextColor}
              onHighlight={onHighlight}
              keepSelection={keepSelection}
              showHighlight={!isTyping}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 border-t border-bloomora-line/20 pt-2">
            <span className="text-[0.65rem] font-bold uppercase tracking-wide text-bloomora-text-muted">
              Alinear
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="!min-h-8 px-2.5 text-xs"
              title="Centrar párrafo"
              onMouseDown={keepSelection}
              onClick={onAlignCenter}
            >
              Centrar
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="!min-h-8 px-2.5 text-xs"
              title="Alinear a la izquierda"
              onMouseDown={keepSelection}
              onClick={onAlignLeft}
            >
              Izquierda
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[0.6rem] font-bold uppercase tracking-wide text-bloomora-violet">
              Fuente
            </span>
            {NOTE_FONTS.map((f) => (
              <Button
                key={f.id}
                type="button"
                variant="secondary"
                size="sm"
                className="!min-h-8 px-2.5 text-xs"
                onMouseDown={keepSelection}
                onClick={() => onFontChange(f.id)}
              >
                {f.label}
              </Button>
            ))}
            <span className="mx-0.5 h-5 w-px bg-bloomora-line/40" aria-hidden />
            <span className="text-[0.6rem] font-bold uppercase tracking-wide text-bloomora-violet">
              Tamaño
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="!min-h-8 px-2 text-xs font-bold"
              onMouseDown={keepSelection}
              onClick={() => onFontSizeChange(-NOTE_FONT_SIZE_STEP_PX)}
            >
              A−
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="!min-h-8 px-2 text-xs font-bold"
              onMouseDown={keepSelection}
              onClick={() => onFontSizeChange(NOTE_FONT_SIZE_STEP_PX)}
            >
              A+
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="!min-h-8 px-2.5 text-xs"
              onMouseDown={keepSelection}
              onClick={onAlignCenter}
            >
              Centrar
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-bloomora-line/20 pt-2">
            <ColorHighlightRow
              onTextColor={onTextColor}
              onHighlight={onHighlight}
              keepSelection={keepSelection}
              showHighlight
            />
          </div>
        </>
      )}
    </div>
  )
}
