import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { EnglishNoteColor, EnglishNoteTitleFont } from '@/types/englishNote'
import { ENGLISH_NOTE_COLORS } from '@/types/englishNote'
import { NOTE_FONT_SIZE_STEP_PX } from '@/features/notes/noteEditorUtils'
import { cn } from '@/utils/cn'

export type NoteSelectionToolbarCoords = {
  top: number
  left: number
}

export type NoteSelectionToolbarMode = 'full' | 'options'

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

/** Barra flotante: doble clic = todo; Ctrl+O = color, resaltado y alineación. */
export function useNoteSelectionToolbar(editorRef: React.RefObject<HTMLDivElement | null>) {
  const [panel, setPanel] = useState<{
    coords: NoteSelectionToolbarCoords
    mode: NoteSelectionToolbarMode
  } | null>(null)

  const openAtSelection = useCallback(
    (mode: NoteSelectionToolbarMode): boolean => {
      const editor = editorRef.current
      if (!editor) return false
      const coords = coordsFromNoteSelection(editor)
      if (!coords) return false
      setPanel({ coords, mode })
      return true
    },
    [editorRef],
  )

  const dismiss = useCallback(() => setPanel(null), [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const onDoubleClick = () => {
      requestAnimationFrame(() => openAtSelection('full'))
    }

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (target instanceof Element && target.closest('[data-note-selection-toolbar]')) {
        return
      }
      if (!editor.contains(target)) {
        setPanel(null)
      }
    }

    editor.addEventListener('dblclick', onDoubleClick)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      editor.removeEventListener('dblclick', onDoubleClick)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [editorRef, openAtSelection])

  useEffect(() => {
    if (!panel) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setPanel(null)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [panel])

  useEffect(() => {
    if (!panel) return
    const editor = editorRef.current
    if (!editor) return

    const update = () => {
      const next = coordsFromNoteSelection(editor)
      if (!next) setPanel(null)
      else setPanel((prev) => (prev ? { ...prev, coords: next } : null))
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
    openAtSelection,
    dismiss,
  }
}

function ColorHighlightRow({
  onTextColor,
  onHighlight,
  keepSelection,
}: {
  onTextColor: (hex: string, colorId: EnglishNoteColor) => void
  onHighlight: (hex: string) => void
  keepSelection: (e: React.MouseEvent) => void
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
  )
}

export function NoteSelectionToolbar({
  coords,
  mode,
  onTextColor,
  onHighlight,
  onFontChange,
  onFontSizeChange,
  onAlignCenter,
  onAlignLeft,
  onClose,
}: {
  coords: NoteSelectionToolbarCoords | null
  mode: NoteSelectionToolbarMode
  onTextColor: (hex: string, colorId: EnglishNoteColor) => void
  onHighlight: (hex: string) => void
  onFontChange: (font: EnglishNoteTitleFont) => void
  onFontSizeChange: (deltaPx: number) => void
  onAlignCenter: () => void
  onAlignLeft: () => void
  onClose?: () => void
}) {
  if (!coords) return null

  const keepSelection = (e: React.MouseEvent) => e.preventDefault()
  const isOptions = mode === 'options'

  return (
    <div
      role="toolbar"
      data-note-selection-toolbar
      aria-label="Opciones del texto seleccionado"
      className={cn(
        'fixed z-50 -translate-x-1/2 -translate-y-full rounded-2xl border border-bloomora-line/30 bg-bloomora-white/95 px-3 py-2.5 shadow-[0_12px_36px_-10px_rgba(91,74,140,0.35)] backdrop-blur-sm',
        isOptions ? 'max-w-[min(100vw-1rem,26rem)]' : 'max-w-[min(100vw-1rem,28rem)]',
      )}
      style={{ top: coords.top, left: coords.left }}
    >
      {isOptions ? (
        <div className="flex flex-col gap-2">
          <p className="text-[0.6rem] font-semibold text-bloomora-text-muted">
            Ctrl+O · Opciones de texto
          </p>
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
                  onClose?.()
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
                onClick={() => {
                  onFontChange(f.id)
                  onClose?.()
                }}
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
            />
          </div>
        </>
      )}
    </div>
  )
}
