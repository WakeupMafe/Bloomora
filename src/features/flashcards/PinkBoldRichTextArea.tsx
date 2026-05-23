import { useCallback, useEffect, useRef } from 'react'
import {
  applyNumberedListsInEditor,
  ensureEditorBlockStructure,
  handleEditorLineBreak,
  handleNumberedListEnter,
  handlePlainDoubleEnterNoAutoList,
  handleSemicolonToArrow,
  normalizeEditorHtml,
  prepareFlashcardRichHtml,
  togglePinkBoldOnSelection,
} from '@/features/flashcards/flashcardRichText'
import { cn } from '@/utils/cn'

type PinkBoldRichTextAreaProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export function PinkBoldRichTextArea({
  value,
  onChange,
  placeholder,
  className,
}: PinkBoldRichTextAreaProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastEmitted = useRef(value)
  const formatTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInternalSync = useRef(false)

  const syncFromValue = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    const displayHtml = value ? prepareFlashcardRichHtml(value) : ''
    if (el.innerHTML !== displayHtml) {
      isInternalSync.current = true
      el.innerHTML = displayHtml
      ensureEditorBlockStructure(el)
      isInternalSync.current = false
    }
    lastEmitted.current = value
  }, [value])

  useEffect(() => {
    syncFromValue()
  }, [syncFromValue])

  useEffect(() => {
    return () => {
      if (formatTimer.current) clearTimeout(formatTimer.current)
    }
  }, [])

  const emitChange = useCallback(
    (options?: { formatLists?: boolean }) => {
      const el = editorRef.current
      if (!el || isInternalSync.current) return

      if (options?.formatLists) {
        applyNumberedListsInEditor(el)
      }

      const html = normalizeEditorHtml(el.innerHTML)
      if (html !== lastEmitted.current) {
        lastEmitted.current = html
        onChange(html)
      }
    },
    [onChange],
  )

  const scheduleListFormat = useCallback(() => {
    if (formatTimer.current) clearTimeout(formatTimer.current)
    formatTimer.current = setTimeout(() => {
      emitChange({ formatLists: true })
    }, 700)
  }, [emitChange])

  const handleInput = () => {
    emitChange({ formatLists: false })
    scheduleListFormat()
  }

  const handleBlur = () => {
    if (formatTimer.current) clearTimeout(formatTimer.current)
    emitChange({ formatLists: true })
  }

  return (
    <div className="relative min-w-0">
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        className={cn(
          'flashcard-rich-editor bloomora-form-input min-h-[8.5rem] w-full resize-y overflow-auto rounded-lg border border-bloomora-line/50 px-4 py-3 text-sm font-medium leading-relaxed text-bloomora-deep outline-none ring-bloomora-lilac/25 focus:ring-2',
          className,
        )}
        onFocus={() => {
          const el = editorRef.current
          if (el) ensureEditorBlockStructure(el)
        }}
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          const root = editorRef.current
          if (!root) return

          if (e.key === ';' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (handleSemicolonToArrow(root, e)) {
              emitChange({ formatLists: false })
              return
            }
          }

          if (handleNumberedListEnter(root, e)) {
            emitChange({ formatLists: false })
            return
          }

          if (handlePlainDoubleEnterNoAutoList(root, e)) {
            emitChange({ formatLists: false })
            return
          }

          if (handleEditorLineBreak(root, e)) {
            emitChange({ formatLists: false })
            return
          }

          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault()
            togglePinkBoldOnSelection(root)
            emitChange({ formatLists: false })
          }
        }}
        suppressContentEditableWarning
      />
      <p className="mt-1.5 text-[11px] leading-relaxed text-bloomora-text-muted">
        <kbd className="rounded bg-bloomora-lavender-50 px-1 font-semibold">;</kbd> ={' '}
        <span className="font-semibold">→</span>.{' '}
        <kbd className="rounded bg-bloomora-lavender-50 px-1 font-semibold">Enter</kbd> = salto de
        línea.{' '}
        <span className="font-semibold">1. 2. 3.</span> en la misma sección = lista (mín. 2 ítems
        seguidos). Para salir:{' '}
        <kbd className="rounded bg-bloomora-lavender-50 px-1 font-semibold">Enter</kbd> en ítem
        vacío,{' '}
        <span className="font-semibold">dos espacios + Enter</span> al final de un ítem, o{' '}
        <kbd className="rounded bg-bloomora-lavender-50 px-1 font-semibold">Enter</kbd> dos veces
        en una línea vacía.{' '}
        <kbd className="rounded bg-bloomora-lavender-50 px-1 font-semibold">Ctrl+B</kbd> ={' '}
        <span className="font-bold text-[#ec4899]">negrilla rosa</span>.
      </p>
    </div>
  )
}
