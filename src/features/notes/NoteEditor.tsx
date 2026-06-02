import { useCallback, useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { bloomoraInputClass, bloomoraPanelCardClass } from '@/components/ui/formControls'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { NotePagesEditor } from '@/features/notes/NotePagesEditor'
import {
  collectPagesHtmlFromRefs,
  parseNotePagesFromHtml,
  serializeNotePagesHtml,
  type NotePageSlice,
} from '@/features/notes/notePageLayoutUtils'
import {
  NoteSelectionToolbar,
  useNoteSelectionToolbar,
} from '@/features/notes/NoteSelectionToolbar'
import {
  optimizeNoteHtmlForDisplay,
  restoreNoteHtmlImageSources,
  uploadImagesInNoteHtml,
} from '@/features/notes/noteHtmlImages'
import { isDraftNoteId } from '@/features/notes/noteDraftUtils'
import { uploadEnglishNoteImage } from '@/services/supabase/englishNoteImageUpload'
import { requireSupabase } from '@/services/supabase/typedClient'
import { NoteToolbar } from '@/features/notes/NoteToolbar'
import {
  BODY_TYPING_DEFAULTS,
  type NoteTypingDefaults,
} from '@/features/notes/noteTypingDefaults'
import {
  applyBlockAlign,
  applyNoteFontSizeToSelection,
  applyNoteFontToSelection,
  applyNoteFontWeightToSelection,
  applyNoteLineHeightToSelection,
  applyNoteTextCaseToSelection,
  adjustNoteSelectionFontSize,
  applyTypingDefaultsAtCaret,
  buildNotePrintDocumentHtml,
  clearNoteSelectionHighlight,
  insertImageInEditor,
  insertParagraphWithTypingDefaults,
  NOTE_FONT_SIZE_MAX_PX,
  NOTE_FONT_SIZE_MIN_PX,
  NOTE_FONT_SIZE_STEP_PX,
  noteTextAlignExecCommand,
  printNoteDocument,
  readFormatFromEditorSelection,
  readFormatFromEditorCaret,
  runEditorCommand,
} from '@/features/notes/noteEditorUtils'
import type { NoteTextOptionsValues } from '@/features/notes/NoteTextOptionsPanel'
import type { NoteFontWeight, NoteTextAlign, NoteTextCase } from '@/features/notes/noteTypingDefaults'
import type {
  EnglishNote,
  EnglishNoteColor,
  EnglishNotePageSize,
  EnglishNoteTitleFont,
} from '@/types/englishNote'
import { cn } from '@/utils/cn'

function defaultsToPanelFormat(
  d: NoteTypingDefaults,
  highlight: string | null,
): NoteTextOptionsValues {
  return {
    font: d.font,
    fontSizePx: d.fontSizePx,
    colorId: d.color,
    align: d.align,
    fontWeight: d.fontWeight,
    lineHeight: d.lineHeight,
    textCase: d.textCase,
    highlightColor: highlight,
  }
}

function readToPanelFormatPatch(
  read: Partial<NoteTypingDefaults>,
): Partial<NoteTextOptionsValues> {
  const patch: Partial<NoteTextOptionsValues> = {}
  if (read.font) patch.font = read.font
  if (read.fontSizePx != null) patch.fontSizePx = read.fontSizePx
  if (read.color) patch.colorId = read.color
  if (read.align) patch.align = read.align
  if (read.fontWeight) patch.fontWeight = read.fontWeight
  if (read.lineHeight != null) patch.lineHeight = read.lineHeight
  if (read.textCase) patch.textCase = read.textCase
  return patch
}

type NoteEditorProps = {
  note: EnglishNote | null
  userCedula: string | null
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
  isNoteContentLoading?: boolean
  hasSavedNotes?: boolean
  isDraft?: boolean
}

export function NoteEditor({
  note,
  userCedula,
  onPatch,
  isNotesLoading = false,
  isNoteContentLoading = false,
  hasSavedNotes = false,
  isDraft = false,
}: NoteEditorProps) {
  const { showToast } = useBloomoraToast()
  const editorRef = useRef<HTMLDivElement>(null)
  const pageContentRefsRef = useRef<Array<HTMLDivElement | null>>([])
  const insertPageBreakRef = useRef<(() => void) | null>(null)
  const [pages, setPages] = useState<NotePageSlice[]>([
    { id: 'page-initial', html: '<p><br /></p>' },
  ])
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
  const [typingDefaults, setTypingDefaults] = useState<NoteTypingDefaults>({
    ...BODY_TYPING_DEFAULTS,
  })
  const [highlightColor, setHighlightColor] = useState<string | null>(null)
  const [panelFormat, setPanelFormat] = useState<NoteTextOptionsValues>(() =>
    defaultsToPanelFormat(BODY_TYPING_DEFAULTS, null),
  )
  const typingDefaultsRef = useRef<NoteTypingDefaults>({ ...BODY_TYPING_DEFAULTS })
  typingDefaultsRef.current = typingDefaults

  const patchPanelFormat = useCallback((patch: Partial<NoteTextOptionsValues>) => {
    setPanelFormat((prev) => ({ ...prev, ...patch }))
  }, [])

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
    prepareSelectionForFormat,
  } = useNoteSelectionToolbar(editorRef)

  const applyTypingFormat = useCallback(
    (patch: Partial<NoteTypingDefaults>) => {
      const editor = editorRef.current
      if (!editor) return
      const next = { ...typingDefaultsRef.current, ...patch }
      typingDefaultsRef.current = next
      setTypingDefaults(next)
      applyTypingDefaultsAtCaret(editor, next)
      markUnsaved()
    },
    [markUnsaved],
  )

  const applySelectionFormat = useCallback(
    (fn: () => void) => {
      const editor = editorRef.current
      if (!editor) return
      if (formatTarget === 'selection') {
        preserveSelectionApply(() => {
          editor.focus({ preventScroll: true })
          fn()
        })
      } else {
        editor.focus({ preventScroll: true })
        fn()
      }
      markUnsaved()
    },
    [formatTarget, preserveSelectionApply, markUnsaved],
  )

  useEffect(() => {
    if (!selectionCoords || selectionMode !== 'options') return
    const editor = editorRef.current
    if (!editor) return
    if (formatTarget === 'selection') {
      prepareSelectionForFormat()
    }
    const read =
      formatTarget === 'selection'
        ? readFormatFromEditorSelection(editor)
        : readFormatFromEditorCaret(editor)
    if (read) {
      setPanelFormat((prev) => ({ ...prev, ...readToPanelFormatPatch(read) }))
    } else {
      setPanelFormat(defaultsToPanelFormat(typingDefaultsRef.current, highlightColor))
    }
  }, [selectionCoords, selectionMode, formatTarget, prepareSelectionForFormat])

  const optionValues = panelFormat

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
    if (!note) return
    const displayHtml = optimizeNoteHtmlForDisplay(note.contentHtml)
    setPages(parseNotePagesFromHtml(displayHtml))
  }, [note?.id, note?.contentHtml])

  const readEditorPayload = () => {
    const pageHtmlList = collectPagesHtmlFromRefs(pageContentRefsRef.current)
    const html = restoreNoteHtmlImageSources(serializeNotePagesHtml(pageHtmlList))
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const plainRoot = doc.body
    return {
      contentHtml: html,
      plainText: plainRoot.textContent ?? '',
      coverImageUrl: doc.querySelector('img')?.getAttribute('src') ?? null,
    }
  }

  const preparePayloadForSave = useCallback(
    async (payload: ReturnType<typeof readEditorPayload>) => {
      if (!userCedula) return payload
      const sb = requireSupabase()
      const contentHtml = await uploadImagesInNoteHtml(
        sb,
        userCedula,
        payload.contentHtml,
      )
      return { ...payload, contentHtml }
    },
    [userCedula],
  )

  const saveNow = useCallback(async (): Promise<boolean> => {
    const current = noteRef.current
    if (!current) return false

    setSaveLabel('Guardando en Supabase...')

    let payload = readEditorPayload()
    if (userCedula) {
      if (payload.contentHtml.includes('data:image/')) {
        setSaveLabel('Optimizando imágenes...')
      }
      payload = await preparePayloadForSave(payload)
    }

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
  }, [preparePayloadForSave, showToast, userCedula])

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
    const editor = editorRef.current
    if (!editor) return
    runEditorCommand(editor, command, value)
    markUnsaved()
  }

  const editorHasTextSelection = (editor: HTMLElement) => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false
    if (!editor.contains(sel.getRangeAt(0).commonAncestorContainer)) return false
    return !!sel.toString().trim()
  }

  const insertImageAtCursor = async (file: File | undefined) => {
    if (!file || !editorRef.current) return
    if (!file.type.startsWith('image/')) {
      showToast('Elige un archivo de imagen.')
      return
    }
    if (!userCedula) {
      showToast('Inicia sesión para subir imágenes.')
      return
    }

    setSaveLabel('Subiendo imagen...')
    try {
      const url = await uploadEnglishNoteImage(requireSupabase(), userCedula, file)
      const inserted = insertImageInEditor(editorRef.current, url)
      if (inserted) {
        markUnsaved()
        setSaveLabel('Cambios sin guardar')
        showToast('Imagen insertada (comprimida). Pulsa Ctrl+G para guardar el apunte.')
      }
    } catch {
      showToast('No se pudo subir la imagen. Ejecuta la migración english-note-images en Supabase.')
      setSaveLabel('Error al subir imagen')
    }
  }

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void insertImageAtCursor(e.target.files?.[0])
    e.target.value = ''
  }

  const openPrintWindow = (forPdf: boolean) => {
    if (!note) return
    const html =
      restoreNoteHtmlImageSources(
        serializeNotePagesHtml(collectPagesHtmlFromRefs(pageContentRefsRef.current)),
      ) || note.contentHtml
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
      if (editorHasTextSelection(editor)) {
        preserveSelectionApply(() => {
          adjustNoteSelectionFontSize(editor, NOTE_FONT_SIZE_STEP_PX)
        })
      } else {
        const next = Math.min(
          NOTE_FONT_SIZE_MAX_PX,
          typingDefaultsRef.current.fontSizePx + NOTE_FONT_SIZE_STEP_PX,
        )
        applyTypingFormat({ fontSizePx: next })
      }
      markUnsaved()
      return
    }
    if (ctrlZoomOut && editor) {
      e.preventDefault()
      if (editorHasTextSelection(editor)) {
        preserveSelectionApply(() => {
          adjustNoteSelectionFontSize(editor, -NOTE_FONT_SIZE_STEP_PX)
        })
      } else {
        const next = Math.max(
          NOTE_FONT_SIZE_MIN_PX,
          typingDefaultsRef.current.fontSizePx - NOTE_FONT_SIZE_STEP_PX,
        )
        applyTypingFormat({ fontSizePx: next })
      }
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
    if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      cmd(e.shiftKey ? 'redo' : 'undo')
      return
    }
    if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      cmd('bold')
      return
    }
    if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'y') {
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

  if (isNoteContentLoading) {
    return (
      <Card variant="glass" className={cn(bloomoraPanelCardClass, 'p-8 text-center text-bloomora-text-muted')}>
        Cargando contenido del apunte…
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
        onInsertPageBreak={() => insertPageBreakRef.current?.()}
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
        optionValues={optionValues}
        onClose={dismissSelectionToolbar}
        onPrepareSelection={prepareSelectionForFormat}
        onApplyTextoPreset={() => {
          const next = { ...BODY_TYPING_DEFAULTS }
          typingDefaultsRef.current = next
          setTypingDefaults(next)
          setPanelFormat(defaultsToPanelFormat(next, null))
          if (editorRef.current) {
            applyTypingDefaultsAtCaret(editorRef.current, next)
          }
          markUnsaved()
          showToast('Formato Texto: Poppins, gris, alineado a la izquierda.')
        }}
        onTextColor={(hex, colorId) => {
          patchPanelFormat({ colorId })
          if (formatTarget === 'typing') {
            applyTypingFormat({ colorHex: hex, color: colorId })
          } else {
            const editor = editorRef.current
            if (!editor) return
            applySelectionFormat(() => runEditorCommand(editor, 'foreColor', hex))
          }
        }}
        onCustomTextColor={(hex) => {
          patchPanelFormat({ colorId: 'black' })
          if (formatTarget === 'typing') {
            applyTypingFormat({ colorHex: hex, color: 'black' })
          } else {
            const editor = editorRef.current
            if (!editor) return
            applySelectionFormat(() => runEditorCommand(editor, 'foreColor', hex))
          }
        }}
        onHighlight={(hex) => {
          setHighlightColor(hex)
          patchPanelFormat({ highlightColor: hex })
          const editor = editorRef.current
          if (!editor) return
          applySelectionFormat(() => runEditorCommand(editor, 'hiliteColor', hex))
        }}
        onClearHighlight={() => {
          setHighlightColor(null)
          patchPanelFormat({ highlightColor: null })
          const editor = editorRef.current
          if (!editor) return
          applySelectionFormat(() => clearNoteSelectionHighlight(editor))
        }}
        onFontWeight={(weight: NoteFontWeight) => {
          patchPanelFormat({ fontWeight: weight })
          if (formatTarget === 'typing') {
            applyTypingFormat({ fontWeight: weight })
          } else {
            const editor = editorRef.current
            if (!editor) return
            applySelectionFormat(() => applyNoteFontWeightToSelection(editor, weight))
          }
        }}
        onAlign={(align: NoteTextAlign) => {
          patchPanelFormat({ align })
          const editor = editorRef.current
          if (!editor) return
          if (formatTarget === 'typing') {
            applyTypingFormat({ align })
            applyBlockAlign(editor, align)
          } else {
            applySelectionFormat(() => {
              runEditorCommand(editor, noteTextAlignExecCommand(align), undefined)
              applyBlockAlign(editor, align)
            })
          }
        }}
        onLineHeight={(lineHeight) => {
          patchPanelFormat({ lineHeight })
          const editor = editorRef.current
          if (!editor) return

          const applyLineHeight = () => {
            if (formatTarget === 'typing') {
              const next = { ...typingDefaultsRef.current, lineHeight }
              typingDefaultsRef.current = next
              setTypingDefaults(next)
            }
            applyNoteLineHeightToSelection(editor, lineHeight)
            markUnsaved()
          }

          if (formatTarget === 'selection') {
            applySelectionFormat(applyLineHeight)
          } else {
            applyLineHeight()
          }
        }}
        onTextCase={(textCase: NoteTextCase) => {
          patchPanelFormat({ textCase })
          if (formatTarget === 'typing') {
            applyTypingFormat({ textCase })
          } else {
            const editor = editorRef.current
            if (!editor) return
            applySelectionFormat(() => applyNoteTextCaseToSelection(editor, textCase))
          }
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
          patchPanelFormat({ font })
          const editor = editorRef.current
          if (!editor) return
          if (formatTarget === 'typing') {
            applyTypingFormat({ font })
          } else {
            applySelectionFormat(() => {
              applyNoteFontToSelection(editor, font)
            })
          }
        }}
        onFontSizeSet={(px) => {
          const clamped = Math.min(
            NOTE_FONT_SIZE_MAX_PX,
            Math.max(NOTE_FONT_SIZE_MIN_PX, px),
          )
          patchPanelFormat({ fontSizePx: clamped })
          if (formatTarget === 'typing') {
            applyTypingFormat({ fontSizePx: clamped })
          } else {
            const editor = editorRef.current
            if (!editor) return
            applySelectionFormat(() => applyNoteFontSizeToSelection(editor, clamped))
          }
        }}
        onFontSizeChange={(delta) => {
          if (!editorRef.current) return
          if (formatTarget === 'typing') {
            const next = Math.min(
              NOTE_FONT_SIZE_MAX_PX,
              Math.max(
                NOTE_FONT_SIZE_MIN_PX,
                panelFormat.fontSizePx + delta,
              ),
            )
            patchPanelFormat({ fontSizePx: next })
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

      <NotePagesEditor
        pages={pages}
        onPagesChange={setPages}
        pageSize={pageSizeDraft}
        pageNumberEnabled={pageNumberEnabledDraft}
        twoColumns={twoColumnsDraft}
        activeEditorRef={editorRef}
        pageContentRefsRef={pageContentRefsRef}
        insertPageBreakRef={insertPageBreakRef}
        documentKey={note.id}
        onPageInput={markUnsaved}
        onKeyDown={handleKeyDown}
      />
    </Card>
  )
}
