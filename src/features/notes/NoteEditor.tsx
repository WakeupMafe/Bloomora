import { useCallback, useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { bloomoraInputClass, bloomoraPanelCardClass } from '@/components/ui/formControls'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { NotePageNumbers } from '@/features/notes/NotePageNumbers'
import {
  NoteSelectionToolbar,
  useNoteSelectionToolbar,
} from '@/features/notes/NoteSelectionToolbar'
import { isDraftNoteId } from '@/features/notes/noteDraftUtils'
import { NoteToolbar } from '@/features/notes/NoteToolbar'
import {
  BODY_TYPING_DEFAULTS,
  type NoteTypingDefaults,
} from '@/features/notes/noteTypingDefaults'
import {
  applyBlockAlign,
  applyNoteFontToSelection,
  adjustNoteSelectionFontSize,
  applyTypingDefaultsAtCaret,
  attachNoteImageDragHandlers,
  buildNotePrintDocumentHtml,
  enhanceNoteImages,
  insertImageInEditor,
  insertParagraphWithTypingDefaults,
  NOTE_FONT_SIZE_MAX_PX,
  NOTE_FONT_SIZE_MIN_PX,
  NOTE_FONT_SIZE_STEP_PX,
  notePageSheetClass,
  printNoteDocument,
} from '@/features/notes/noteEditorUtils'
import type {
  EnglishNote,
  EnglishNoteColor,
  EnglishNotePageSize,
  EnglishNoteTitleFont,
} from '@/types/englishNote'
import { cn } from '@/utils/cn'

type NoteEditorProps = {
  note: EnglishNote | null
  onPatch: (
    noteId: string,
    patch: Partial<{
      title: string
      category: string | null
      titleFont: EnglishNoteTitleFont
      titleColor: EnglishNoteColor
      pageSize: EnglishNotePageSize
      pageNumberEnabled: boolean
      twoColumns: boolean
      contentHtml: string
      plainText: string
      coverImageUrl: string | null
    }>,
  ) => Promise<boolean>
  isNotesLoading?: boolean
  hasSavedNotes?: boolean
  isDraft?: boolean
}

export function NoteEditor({
  note,
  onPatch,
  isNotesLoading = false,
  hasSavedNotes = false,
  isDraft = false,
}: NoteEditorProps) {
  const { showToast } = useBloomoraToast()
  const editorRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLElement>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)
  const [saveLabel, setSaveLabel] = useState(
    isDraft ? 'Apunte nuevo · pulsa Ctrl+G para guardar' : 'Pulsa Guardar o Ctrl+G para guardar',
  )
  const [titleDraft, setTitleDraft] = useState('')
  const [categoryDraft, setCategoryDraft] = useState('')
  const [pageSizeDraft, setPageSizeDraft] = useState<EnglishNotePageSize>('letter')
  const [pageNumberEnabledDraft, setPageNumberEnabledDraft] = useState(false)
  const [twoColumnsDraft, setTwoColumnsDraft] = useState(false)
  const noteRef = useRef(note)
  const titleDraftRef = useRef(titleDraft)
  const categoryDraftRef = useRef(categoryDraft)
  const pageSizeDraftRef = useRef(pageSizeDraft)
  const pageNumberEnabledDraftRef = useRef(pageNumberEnabledDraft)
  const twoColumnsDraftRef = useRef(twoColumnsDraft)
  const onPatchRef = useRef(onPatch)
  const typingDefaultsRef = useRef<NoteTypingDefaults>({ ...BODY_TYPING_DEFAULTS })

  noteRef.current = note
  titleDraftRef.current = titleDraft
  categoryDraftRef.current = categoryDraft
  pageSizeDraftRef.current = pageSizeDraft
  pageNumberEnabledDraftRef.current = pageNumberEnabledDraft
  twoColumnsDraftRef.current = twoColumnsDraft
  onPatchRef.current = onPatch

  const markUnsaved = useCallback(() => {
    setSaveLabel('Cambios sin guardar')
  }, [])

  const {
    coords: selectionCoords,
    mode: selectionMode,
    formatTarget,
    openFormatting,
    dismiss: dismissSelectionToolbar,
    preserveSelectionApply,
  } = useNoteSelectionToolbar(editorRef)

  const applyTypingFormat = useCallback(
    (patch: Partial<NoteTypingDefaults>) => {
      const editor = editorRef.current
      if (!editor) return
      typingDefaultsRef.current = { ...typingDefaultsRef.current, ...patch }
      applyTypingDefaultsAtCaret(editor, typingDefaultsRef.current)
      markUnsaved()
    },
    [markUnsaved],
  )

  useEffect(() => {
    if (!note) return
    setTitleDraft(note.title)
    setCategoryDraft(note.category ?? '')
    setPageSizeDraft(note.pageSize)
    setPageNumberEnabledDraft(note.pageNumberEnabled)
    setTwoColumnsDraft(note.twoColumns)
    setSaveLabel(
      isDraftNoteId(note.id)
        ? 'Apunte nuevo · pulsa Ctrl+G para guardar'
        : 'Pulsa Guardar o Ctrl+G para guardar',
    )
    typingDefaultsRef.current = { ...BODY_TYPING_DEFAULTS }
  }, [note?.id])

  useEffect(() => {
    if (!note || !editorRef.current) return
    editorRef.current.innerHTML = note.contentHtml || '<p><br /></p>'
    enhanceNoteImages(editorRef.current)
  }, [note?.id])

  const readEditorPayload = () => {
    const el = editorRef.current
    if (!el) return null
    const html = el.innerHTML
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return {
      contentHtml: html,
      plainText: el.innerText,
      coverImageUrl: doc.querySelector('img')?.getAttribute('src') ?? null,
    }
  }

  const saveNow = useCallback(async (): Promise<boolean> => {
    const current = noteRef.current
    if (!current || !editorRef.current) return false

    setSaveLabel('Guardando en Supabase...')

    const payload = readEditorPayload()
    if (!payload) return false

    const ok = await onPatchRef.current(current.id, {
      title: titleDraftRef.current,
      category: categoryDraftRef.current.trim() || null,
      pageSize: pageSizeDraftRef.current,
      pageNumberEnabled: pageNumberEnabledDraftRef.current,
      twoColumns: twoColumnsDraftRef.current,
      ...payload,
    })
    if (ok) {
      setSaveLabel('Guardado en Supabase')
      showToast('Apunte guardado en Supabase')
    } else {
      setSaveLabel('Error al guardar')
    }
    return ok
  }, [showToast])

  useEffect(() => {
    const el = editorRef.current
    if (!el || !note) return
    enhanceNoteImages(el)
    return attachNoteImageDragHandlers(el, markUnsaved)
  }, [note?.id, markUnsaved])

  useEffect(() => {
    if (!note) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        void saveNow()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [note?.id, saveNow])

  const cmd = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    markUnsaved()
  }

  const applySelectionFormat = (fn: () => void) => {
    if (formatTarget === 'selection') {
      preserveSelectionApply(fn)
    } else {
      fn()
    }
    markUnsaved()
  }

  const insertImageAtCursor = async (file: File | undefined) => {
    if (!file || !editorRef.current) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result ?? '')
      if (!src) return
      const inserted = insertImageInEditor(editorRef.current!, src)
      if (inserted) {
        markUnsaved()
        showToast('Imagen insertada. Arrastrala y pulsa Ctrl+G para guardar.')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void insertImageAtCursor(e.target.files?.[0])
    e.target.value = ''
  }

  const openPrintWindow = (forPdf: boolean) => {
    if (!note) return
    const html = editorRef.current?.innerHTML ?? note.contentHtml
    const w = window.open('', '_blank')
    if (!w) return
    const docTitle = titleDraft.trim() || 'Apunte'
    w.document.open()
    w.document.write(
      buildNotePrintDocumentHtml({
        bodyHtml: html,
        docTitle,
        pageSize: pageSizeDraft,
        pageNumberEnabled: pageNumberEnabledDraft,
        twoColumns: twoColumnsDraft,
      }),
    )
    w.document.close()
    void printNoteDocument(w, () => {
      if (forPdf) showToast('En la ventana de impresion elige Guardar como PDF.')
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const editor = editorRef.current
    const ctrlZoomIn =
      e.ctrlKey &&
      !e.altKey &&
      (e.key === '+' ||
        e.key === '=' ||
        e.code === 'Equal' ||
        e.code === 'NumpadAdd')
    const ctrlZoomOut =
      e.ctrlKey &&
      !e.altKey &&
      (e.key === '-' || e.code === 'Minus' || e.code === 'NumpadSubtract')

    if (ctrlZoomIn && editor) {
      e.preventDefault()
      preserveSelectionApply(() => {
        adjustNoteSelectionFontSize(editor, NOTE_FONT_SIZE_STEP_PX)
      })
      markUnsaved()
      return
    }
    if (ctrlZoomOut && editor) {
      e.preventDefault()
      preserveSelectionApply(() => {
        adjustNoteSelectionFontSize(editor, -NOTE_FONT_SIZE_STEP_PX)
      })
      markUnsaved()
      return
    }
    if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'o') {
      e.preventDefault()
      if (!editorRef.current) return
      openFormatting('options')
      return
    }
    if (e.key === 'Enter' && !e.shiftKey && editor) {
      e.preventDefault()
      insertParagraphWithTypingDefaults(editor, typingDefaultsRef.current)
      markUnsaved()
      return
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      cmd('bold')
      return
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'y') {
      e.preventDefault()
      cmd('redo')
      return
    }
    if (e.key === ';') {
      e.preventDefault()
      cmd('insertText', '→')
    }
  }

  if (!note) {
    return (
      <Card variant="glass" className={cn(bloomoraPanelCardClass, 'p-8 text-center text-bloomora-text-muted')}>
        {isNotesLoading
          ? 'Cargando apuntes...'
          : hasSavedNotes
            ? 'Selecciona un apunte de la lista.'
            : 'No hay apuntes guardados.'}
      </Card>
    )
  }

  return (
    <Card variant="glass" className={cn(bloomoraPanelCardClass, 'space-y-4 p-4 sm:p-5')}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-bloomora-text-muted">
          Nombre del apunte
          <input
            type="text"
            value={titleDraft}
            onChange={(e) => {
              setTitleDraft(e.target.value)
              markUnsaved()
            }}
            placeholder="Ej. Verbos irregulares"
            aria-label="Nombre del apunte"
            className={cn(bloomoraInputClass, 'mt-1 !min-h-10 rounded-xl px-3 py-2')}
          />
          <span className="mt-1 block text-[0.65rem] font-normal text-bloomora-text-muted/90">
            Solo identifica el archivo en tu lista. Escribe titulos en la hoja como texto normal.
          </span>
        </label>
        <label className="text-xs font-semibold text-bloomora-text-muted">
          Categoria (opcional)
          <input
            value={categoryDraft}
            onChange={(e) => {
              setCategoryDraft(e.target.value)
              markUnsaved()
            }}
            className={cn(bloomoraInputClass, 'mt-1 !min-h-10 rounded-xl px-3 py-2')}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-bloomora-text-muted">
        <span>Creado: {new Date(note.createdAt).toLocaleString('es-CO')}</span>
        <span>Ultima edicion: {new Date(note.updatedAt).toLocaleString('es-CO')}</span>
        <span className="text-emerald-600">{saveLabel}</span>
      </div>

      <NoteToolbar
        onBold={() => cmd('bold')}
        onUnderline={() => cmd('underline')}
        onBulletList={() => cmd('insertUnorderedList')}
        onNumberedList={() => cmd('insertOrderedList')}
        onAlignCenter={() => cmd('justifyCenter')}
        onAlignLeft={() => cmd('justifyLeft')}
        onInsertImage={() => imgInputRef.current?.click()}
        onUndo={() => cmd('undo')}
        onRedo={() => cmd('redo')}
        onExportPdf={() => openPrintWindow(true)}
        onPrint={() => openPrintWindow(false)}
        pageSize={pageSizeDraft}
        onPageSizeChange={(v) => {
          setPageSizeDraft(v)
          markUnsaved()
        }}
        pageNumberEnabled={pageNumberEnabledDraft}
        onPageNumberEnabledChange={(enabled) => {
          setPageNumberEnabledDraft(enabled)
          markUnsaved()
        }}
        twoColumns={twoColumnsDraft}
        onTwoColumnsChange={(enabled) => {
          setTwoColumnsDraft(enabled)
          markUnsaved()
        }}
        onSave={() => void saveNow()}
      />

      <NoteSelectionToolbar
        coords={selectionCoords}
        mode={selectionMode}
        formatTarget={formatTarget}
        onClose={dismissSelectionToolbar}
        onApplyTextoPreset={() => {
          typingDefaultsRef.current = { ...BODY_TYPING_DEFAULTS }
          if (editorRef.current) {
            applyTypingDefaultsAtCaret(editorRef.current, typingDefaultsRef.current)
          }
          markUnsaved()
          showToast('Formato Texto: Poppins, gris, alineado a la izquierda.')
        }}
        onTextColor={(hex, colorId) => {
          if (formatTarget === 'typing') {
            applyTypingFormat({ colorHex: hex, color: colorId })
            return
          }
          applySelectionFormat(() => document.execCommand('foreColor', false, hex))
        }}
        onHighlight={(hex) => {
          applySelectionFormat(() => document.execCommand('hiliteColor', false, hex))
        }}
        onAlignCenter={() => {
          const editor = editorRef.current
          if (!editor) return
          if (formatTarget === 'typing') {
            applyTypingFormat({ align: 'center' })
            applyBlockAlign(editor, 'center')
            return
          }
          editor.focus()
          cmd('justifyCenter')
        }}
        onAlignLeft={() => {
          const editor = editorRef.current
          if (!editor) return
          if (formatTarget === 'typing') {
            applyTypingFormat({ align: 'left' })
            applyBlockAlign(editor, 'left')
            return
          }
          editor.focus()
          cmd('justifyLeft')
        }}
        onFontChange={(font) => {
          if (!editorRef.current) return
          if (formatTarget === 'typing') {
            applyTypingFormat({ font })
            return
          }
          applySelectionFormat(() => {
            applyNoteFontToSelection(editorRef.current!, font)
          })
        }}
        onFontSizeChange={(delta) => {
          if (!editorRef.current) return
          if (formatTarget === 'typing') {
            const next = Math.min(
              NOTE_FONT_SIZE_MAX_PX,
              Math.max(
                NOTE_FONT_SIZE_MIN_PX,
                typingDefaultsRef.current.fontSizePx + delta,
              ),
            )
            applyTypingFormat({ fontSizePx: next })
            return
          }
          applySelectionFormat(() => {
            adjustNoteSelectionFontSize(editorRef.current!, delta)
          })
        }}
      />

      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageInputChange}
      />

      <article
        ref={sheetRef}
        className={cn(
          notePageSheetClass(pageSizeDraft),
        'rounded-[22px] bg-white shadow-[0_20px_54px_-24px_rgba(91,74,140,0.35)] ring-1 ring-bloomora-line/30',
        )}
      >
        <NotePageNumbers
          enabled={pageNumberEnabledDraft}
          pageSize={pageSizeDraft}
          sheetRef={sheetRef}
          contentRef={editorRef}
        />
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={markUnsaved}
          onKeyDown={handleKeyDown}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            markUnsaved()
          }}
          className={cn(
            'english-note-content min-h-[200px] rounded-2xl bg-white/80 p-2 text-[15px] text-[#1f1f1f] outline-none',
            twoColumnsDraft && 'english-note-content--two-columns',
          )}
          data-placeholder="Escribe aqui tu apunte, titulos, listas..."
        />
      </article>
    </Card>
  )
}
