import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { bloomoraInputClass, bloomoraPanelCardClass } from '@/components/ui/formControls'
import { useBloomoraAlert } from '@/contexts/BloomoraAlertContext'
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
import type { NoteBodyFont, NoteParagraphStyle } from '@/features/notes/noteTypingDefaults'
import { stepNoteFontSize } from '@/features/notes/noteFontUtils'
import { captureEditorSelection, restoreEditorSelection, type EditorSelectionBookmark } from '@/features/notes/noteSelectionBookmark'
import {
  applyBlockAlign,
  applyNoteParagraphStyle,
  applyNoteFontSizeToSelection,
  applyNoteFontToSelection,
  applyNoteFontWeightToSelection,
  applyNoteLineHeightToSelection,
  applyNoteParagraphSpacing,
  applyNoteTextCaseToSelection,
  adjustNoteSelectionFontSize,
  applyTypingDefaultsAtCaret,
  buildNotePrintDocumentHtml,
  clearNoteSelectionHighlight,
  insertImageInEditor,
  insertNoteBlock,
  insertParagraphWithTypingDefaults,
  NOTE_FONT_SIZE_MAX_PX,
  NOTE_FONT_SIZE_MIN_PX,
  NOTE_FONT_SIZE_STEP_PX,
  noteTextAlignExecCommand,
  printNoteDocument,
  readFormatFromEditorSelection,
  readFormatFromEditorCaret,
  readActiveNoteMarks,
  readNoteHighlightColor,
  readNoteParagraphStyle,
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
import { ENGLISH_NOTE_COLORS } from '@/types/englishNote'
import { cn } from '@/utils/cn'
import { normalizeSpacing } from '@/features/notes/noteSpacingModel.mjs'

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
    paragraphSpacingPx: d.paragraphSpacingPx,
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
  if (read.paragraphSpacingPx != null) patch.paragraphSpacingPx = read.paragraphSpacingPx
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
  onUnsavedChange?: (dirty: boolean) => void
  /** Móvil: botón atrás a la lista. */
  showBack?: boolean
  onBack?: () => void
  /** Tablet/móvil: abrir panel Esquema. */
  showOutlineToggle?: boolean
  outlineOpen?: boolean
  onToggleOutline?: () => void
  onShare?: () => void
}

export function NoteEditor({
  note,
  userCedula,
  onPatch,
  isNotesLoading = false,
  isNoteContentLoading = false,
  hasSavedNotes = false,
  isDraft = false,
  onUnsavedChange,
  showBack = false,
  onBack,
  showOutlineToggle = false,
  outlineOpen = false,
  onToggleOutline,
  onShare,
}: NoteEditorProps) {
  const { showToast } = useBloomoraToast()
  const { confirm } = useBloomoraAlert()
  const editorRef = useRef<HTMLDivElement>(null)
  const pageContentRefsRef = useRef<Array<HTMLDivElement | null>>([])
  const insertPageBreakRef = useRef<(() => void) | null>(null)
  const [pages, setPages] = useState<NotePageSlice[]>([
    { id: 'page-initial', html: '<p><br /></p>' },
  ])
  const imgInputRef = useRef<HTMLInputElement>(null)
  const [saveLabel, setSaveLabel] = useState(isDraft ? 'Apunte nuevo · sin guardar' : 'Guardado')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const optionsSessionRef = useRef<{
    pagesHtml: string
    typingDefaults: NoteTypingDefaults
    panelFormat: NoteTextOptionsValues
    highlightColor: string | null
    dirty: boolean
    changeVersion: number
    saveLabel: string
  } | null>(null)
  const optionsCloseBusyRef = useRef(false)
  const panelFormatRef = useRef<NoteTextOptionsValues>(
    defaultsToPanelFormat(BODY_TYPING_DEFAULTS, null),
  )
  const highlightColorRef = useRef<string | null>(null)
  const dismissSelectionToolbarRef = useRef<() => void>(() => {})
  const saveLabelRef = useRef(saveLabel)
  const [changeCount, setChangeCount] = useState(0)
  const dirtyRef = useRef(false)
  const changeVersionRef = useRef(0)
  const savePromiseRef = useRef<Promise<boolean> | null>(null)
  const toolbarSelectionRef = useRef<EditorSelectionBookmark | null>(null)
  const [activeMarks, setActiveMarks] = useState({ bold: false, italic: false, underline: false, strike: false, align: 'left' as NoteTextAlign })
  const [paragraphStyle, setParagraphStyle] = useState<NoteParagraphStyle>('p')
  const [titleDraft, setTitleDraft] = useState('')
  const [categoryDraft, setCategoryDraft] = useState('')
  const [metaEditorOpen, setMetaEditorOpen] = useState(false)
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
  const onUnsavedChangeRef = useRef(onUnsavedChange)
  const loadedNoteIdRef = useRef<string | null>(null)
  const lastAppliedContentRef = useRef<{ id: string; html: string } | null>(null)
  const [typingDefaults, setTypingDefaults] = useState<NoteTypingDefaults>({
    ...BODY_TYPING_DEFAULTS,
  })
  const [highlightColor, setHighlightColor] = useState<string | null>(null)
  const [panelFormat, setPanelFormat] = useState<NoteTextOptionsValues>(() =>
    defaultsToPanelFormat(BODY_TYPING_DEFAULTS, null),
  )
  const typingDefaultsRef = useRef<NoteTypingDefaults>({ ...BODY_TYPING_DEFAULTS })
  const patchPanelFormat = useCallback((patch: Partial<NoteTextOptionsValues>) => {
    setPanelFormat((prev) => {
      const next = { ...prev, ...patch }
      panelFormatRef.current = next
      return next
    })
  }, [])

  const refreshToolbarFormat = useCallback(() => {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection || selection.rangeCount === 0 || !editor.contains(selection.getRangeAt(0).commonAncestorContainer)) return
    toolbarSelectionRef.current = captureEditorSelection(editor) ?? toolbarSelectionRef.current
    setActiveMarks(readActiveNoteMarks(editor))
    setParagraphStyle(readNoteParagraphStyle(editor))
    const read = readFormatFromEditorCaret(editor)
    if (read) {
      setPanelFormat((previous) => {
        const next = { ...previous, ...readToPanelFormatPatch(read) }
        panelFormatRef.current = next
        return next
      })
    }
    const nextHighlight = readNoteHighlightColor(editor)
    highlightColorRef.current = nextHighlight
    setHighlightColor(nextHighlight)
  }, [])

  useEffect(() => {
    document.addEventListener('selectionchange', refreshToolbarFormat)
    return () => document.removeEventListener('selectionchange', refreshToolbarFormat)
  }, [refreshToolbarFormat])

  useLayoutEffect(() => {
    noteRef.current = note
    titleDraftRef.current = titleDraft
    categoryDraftRef.current = categoryDraft
    pageSizeDraftRef.current = pageSizeDraft
    pageNumberEnabledDraftRef.current = pageNumberEnabledDraft
    twoColumnsDraftRef.current = twoColumnsDraft
    onPatchRef.current = onPatch
    onUnsavedChangeRef.current = onUnsavedChange
    typingDefaultsRef.current = typingDefaults
    panelFormatRef.current = panelFormat
    highlightColorRef.current = highlightColor
    saveLabelRef.current = saveLabel
  }, [note, titleDraft, categoryDraft, pageSizeDraft, pageNumberEnabledDraft, twoColumnsDraft, onPatch, onUnsavedChange, typingDefaults, panelFormat, highlightColor, saveLabel])

  const markUnsaved = useCallback(() => {
    changeVersionRef.current += 1
    setChangeCount((count) => count + 1)
    dirtyRef.current = true
    setHasUnsavedChanges(true)
    onUnsavedChangeRef.current?.(true)
    setSaveLabel('Cambios sin guardar')
  }, [])

  const captureOptionsSession = useCallback(() => {
    optionsSessionRef.current = {
      pagesHtml: serializeNotePagesHtml(
        collectPagesHtmlFromRefs(pageContentRefsRef.current),
      ),
      typingDefaults: { ...typingDefaultsRef.current },
      panelFormat: { ...panelFormatRef.current },
      highlightColor: highlightColorRef.current,
      dirty: dirtyRef.current,
      changeVersion: changeVersionRef.current,
      saveLabel: saveLabelRef.current,
    }
  }, [])

  const optionsSessionIsDirty = useCallback(() => {
    const snap = optionsSessionRef.current
    if (!snap) return false
    const pagesHtml = serializeNotePagesHtml(
      collectPagesHtmlFromRefs(pageContentRefsRef.current),
    )
    if (pagesHtml !== snap.pagesHtml) return true
    if (JSON.stringify(typingDefaultsRef.current) !== JSON.stringify(snap.typingDefaults)) {
      return true
    }
    if (JSON.stringify(panelFormatRef.current) !== JSON.stringify(snap.panelFormat)) {
      return true
    }
    return highlightColorRef.current !== snap.highlightColor
  }, [])

  const restoreOptionsSession = useCallback(() => {
    const snap = optionsSessionRef.current
    if (!snap) return
    setPages(parseNotePagesFromHtml(optimizeNoteHtmlForDisplay(snap.pagesHtml)))
    typingDefaultsRef.current = { ...snap.typingDefaults }
    setTypingDefaults({ ...snap.typingDefaults })
    panelFormatRef.current = { ...snap.panelFormat }
    setPanelFormat({ ...snap.panelFormat })
    highlightColorRef.current = snap.highlightColor
    setHighlightColor(snap.highlightColor)
    dirtyRef.current = snap.dirty
    changeVersionRef.current = snap.changeVersion
    setHasUnsavedChanges(snap.dirty)
    onUnsavedChangeRef.current?.(snap.dirty)
    setSaveLabel(
      snap.dirty
        ? 'Cambios sin guardar'
        : snap.saveLabel === 'Cambios sin guardar'
          ? isDraftNoteId(noteRef.current?.id ?? '')
            ? 'Apunte nuevo · sin guardar'
            : 'Guardado'
          : snap.saveLabel,
    )
  }, [])

  const handleRequestDismissTextOptions = useCallback(async () => {
    if (optionsCloseBusyRef.current) return
    optionsCloseBusyRef.current = true
    try {
      if (optionsSessionRef.current && optionsSessionIsDirty()) {
        const apply = await confirm({
          title: '¿Aplicar los cambios?',
          description:
            'Detectamos cambios en Opciones de texto. Puedes aplicarlos o cancelarlos y volver al estilo anterior.',
          confirmLabel: 'Aplicar',
          cancelLabel: 'Cancelar cambios',
        })
        if (!apply) {
          restoreOptionsSession()
        }
      }
      optionsSessionRef.current = null
      dismissSelectionToolbarRef.current()
    } finally {
      optionsCloseBusyRef.current = false
    }
  }, [confirm, optionsSessionIsDirty, restoreOptionsSession])

  const {
    coords: selectionCoords,
    mode: selectionMode,
    formatTarget,
    openFormatting,
    dismiss: dismissSelectionToolbar,
    preserveSelectionApply,
    prepareSelectionForFormat,
  } = useNoteSelectionToolbar(editorRef, handleRequestDismissTextOptions)

  useLayoutEffect(() => {
    dismissSelectionToolbarRef.current = dismissSelectionToolbar
  }, [dismissSelectionToolbar])

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
    if (!selectionCoords || selectionMode !== 'options') {
      optionsSessionRef.current = null
      return
    }
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
      setPanelFormat((prev) => {
        const next = { ...prev, ...readToPanelFormatPatch(read) }
        panelFormatRef.current = next
        return next
      })
    } else {
      const next = defaultsToPanelFormat(typingDefaultsRef.current, highlightColor)
      panelFormatRef.current = next
      setPanelFormat(next)
    }
    const frame = window.requestAnimationFrame(() => {
      if (!optionsSessionRef.current) captureOptionsSession()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [
    selectionCoords,
    selectionMode,
    formatTarget,
    prepareSelectionForFormat,
    highlightColor,
    captureOptionsSession,
  ])

  const optionValues = panelFormat

  useEffect(() => {
    if (!note) return
    if (loadedNoteIdRef.current === note.id && dirtyRef.current) return
    if (loadedNoteIdRef.current !== note.id) {
      loadedNoteIdRef.current = note.id
      changeVersionRef.current += 1
      dirtyRef.current = false
      setChangeCount(0)
      setHasUnsavedChanges(false)
      onUnsavedChangeRef.current?.(false)
    }
    setTitleDraft(note.title)
    setCategoryDraft(note.category ?? '')
    setPageSizeDraft(note.pageSize)
    setPageNumberEnabledDraft(note.pageNumberEnabled)
    setTwoColumnsDraft(note.twoColumns)
    setSaveLabel(isDraftNoteId(note.id) ? 'Apunte nuevo · sin guardar' : 'Guardado')
    typingDefaultsRef.current = { ...BODY_TYPING_DEFAULTS }
    setTypingDefaults({ ...BODY_TYPING_DEFAULTS })
    setHighlightColor(null)
    setPanelFormat(defaultsToPanelFormat(BODY_TYPING_DEFAULTS, null))
  }, [note])

  useEffect(() => {
    if (!note) return
    if (loadedNoteIdRef.current !== note.id || dirtyRef.current) return
    if (lastAppliedContentRef.current?.id === note.id && lastAppliedContentRef.current.html === note.contentHtml) return
    const displayHtml = optimizeNoteHtmlForDisplay(note.contentHtml)
    setPages(parseNotePagesFromHtml(displayHtml))
    lastAppliedContentRef.current = { id: note.id, html: note.contentHtml }
  }, [note?.id, note?.contentHtml])

  const readEditorPayload = () => {
    const pageHtmlList = collectPagesHtmlFromRefs(pageContentRefsRef.current)
    const html = normalizeSpacing(restoreNoteHtmlImageSources(serializeNotePagesHtml(pageHtmlList)))
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

  const saveNow = useCallback(async (notify = false): Promise<boolean> => {
    if (savePromiseRef.current) return savePromiseRef.current
    const current = noteRef.current
    if (!current) return false

    const saveVersion = changeVersionRef.current
    const title = titleDraftRef.current
    const category = categoryDraftRef.current.trim() || null
    const pageSize = pageSizeDraftRef.current
    const pageNumberEnabled = pageNumberEnabledDraftRef.current
    const twoColumns = twoColumnsDraftRef.current
    setIsSaving(true)
    setSaveLabel('Guardando…')

    const saveTask = (async () => {
      try {
        let payload = readEditorPayload()
        if (userCedula) {
          if (payload.contentHtml.includes('data:image/')) setSaveLabel('Guardando imágenes…')
          payload = await preparePayloadForSave(payload)
        }

        const ok = await onPatchRef.current(current.id, {
          title,
          category,
          pageSize,
          pageNumberEnabled,
          twoColumns,
          ...payload,
        })
        if (!ok) {
          setSaveLabel('No se pudo guardar; se volverá a intentar')
          return false
        }

        lastAppliedContentRef.current = { id: current.id, html: payload.contentHtml }

        if (changeVersionRef.current === saveVersion) {
          dirtyRef.current = false
          setHasUnsavedChanges(false)
          setChangeCount(0)
          onUnsavedChangeRef.current?.(false)
          setSaveLabel('Guardado')
        } else {
          setSaveLabel('Hay cambios nuevos por guardar')
        }
        if (notify) showToast('Apunte guardado en Supabase')
        return true
      } catch (error) {
        setSaveLabel('No se pudo guardar; se volverá a intentar')
        if (notify) showToast(error instanceof Error ? error.message : 'No se pudo guardar el apunte.')
        return false
      }
    })()
    savePromiseRef.current = saveTask
    const result = await saveTask
    if (savePromiseRef.current === saveTask) savePromiseRef.current = null
    setIsSaving(false)
    return result
  }, [preparePayloadForSave, showToast, userCedula])

  useEffect(() => {
    if (!note || !hasUnsavedChanges || isSaving || changeCount === 0) return
    // Keep the browser's contentEditable undo stack intact while a user is
    // actively editing. Save after three edits and a short quiet period; if
    // there are fewer edits, save them after a longer idle period.
    const delay = changeCount >= 3 ? 3800 : 12000
    const timer = window.setTimeout(() => void saveNow(false), delay)
    return () => window.clearTimeout(timer)
  }, [changeCount, hasUnsavedChanges, isSaving, note?.id, saveNow])

  useEffect(() => {
    if (!note) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target
      const withinEditor = target instanceof Element && !!target.closest('[data-note-editor]')
      if (withinEditor && e.ctrlKey && !e.altKey && ['g', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        void saveNow(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [note, saveNow])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

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

  const restoreToolbarSelection = useCallback((editor: HTMLElement) => {
    if (toolbarSelectionRef.current) restoreEditorSelection(editor, toolbarSelectionRef.current)
  }, [])

  const runToolbarCommand = useCallback((command: string, value?: string) => {
    const editor = editorRef.current
    if (!editor) return
    restoreToolbarSelection(editor)
    runEditorCommand(editor, command, value)
    markUnsaved()
    requestAnimationFrame(refreshToolbarFormat)
  }, [markUnsaved, refreshToolbarFormat, restoreToolbarSelection])

  const applyToolbarSelectionOrTyping = useCallback((
    onSelection: (editor: HTMLElement) => void,
    onTyping: (editor: HTMLElement) => void,
  ) => {
    const editor = editorRef.current
    if (!editor) return
    restoreToolbarSelection(editor)
    if (editorHasTextSelection(editor)) {
      onSelection(editor)
      markUnsaved()
    } else {
      onTyping(editor)
    }
    requestAnimationFrame(refreshToolbarFormat)
  }, [markUnsaved, refreshToolbarFormat, restoreToolbarSelection])

  const insertImageAtCursor = async (file: File | undefined) => {
    const editor = editorRef.current
    if (!file || !editor) return
    const noteId = note?.id
    toolbarSelectionRef.current = captureEditorSelection(editor) ?? toolbarSelectionRef.current
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
      if (note?.id !== noteId || editorRef.current !== editor) return
      restoreToolbarSelection(editor)
      const inserted = insertImageInEditor(editor, url)
      if (inserted) {
        markUnsaved()
        setSaveLabel('Cambios sin guardar')
        showToast('Imagen insertada. Se guardará automáticamente.')
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
      normalizeSpacing(restoreNoteHtmlImageSources(
        serializeNotePagesHtml(collectPagesHtmlFromRefs(pageContentRefsRef.current)),
      ) || note.contentHtml, { renderStyles: true })
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
    if (e.ctrlKey && !e.altKey && ['home', 'end'].includes(e.key.toLowerCase())) {
      const pages = pageContentRefsRef.current.filter((page): page is HTMLDivElement => !!page)
      const target = e.key.toLowerCase() === 'home' ? pages[0] : pages.at(-1)
      if (target) {
        e.preventDefault()
        target.focus({ preventScroll: true })
        const range = document.createRange()
        range.selectNodeContents(target)
        range.collapse(e.key.toLowerCase() === 'home')
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
        toolbarSelectionRef.current = captureEditorSelection(target)
        requestAnimationFrame(refreshToolbarFormat)
        return
      }
    }
    if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'a') {
      // Each hoja is a separate contentEditable, but browsers can otherwise
      // extend Ctrl+A to the surrounding app when focus moved between sheets.
      e.preventDefault()
      const pageEditor = e.currentTarget
      pageEditor.focus({ preventScroll: true })
      const selection = window.getSelection()
      if (selection) {
        const range = document.createRange()
        range.selectNodeContents(pageEditor)
        selection.removeAllRanges()
        selection.addRange(range)
        toolbarSelectionRef.current = captureEditorSelection(pageEditor)
        requestAnimationFrame(refreshToolbarFormat)
      }
      return
    }
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
        const next = stepNoteFontSize(typingDefaultsRef.current.fontSizePx, 1)
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
        const next = stepNoteFontSize(typingDefaultsRef.current.fontSizePx, -1)
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
      const activeFormat = readFormatFromEditorCaret(editor)
      const paragraphDefaults = { ...typingDefaultsRef.current, ...activeFormat }
      typingDefaultsRef.current = paragraphDefaults
      setTypingDefaults(paragraphDefaults)
      insertParagraphWithTypingDefaults(editor, paragraphDefaults)
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
    if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'i') {
      e.preventDefault()
      cmd('italic')
      return
    }
    if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'u') {
      e.preventDefault()
      cmd('underline')
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

  const statusText = isSaving
    ? 'Guardando…'
    : hasUnsavedChanges
      ? 'Sin guardar'
      : saveLabel === 'Guardado'
        ? 'Guardado'
        : saveLabel

  return (
    <Card data-note-editor variant="glass" className={cn(bloomoraPanelCardClass, 'mx-auto w-full min-w-0 max-w-full space-y-3 overflow-x-hidden overflow-y-visible p-0 sm:space-y-4 sm:p-5')}>
      <header className="notes-editor-header">
        {showBack ? (
          <button
            type="button"
            className="notes-editor-back"
            onClick={onBack}
            aria-label="Volver a la lista de apuntes"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : null}
        <div className="notes-editor-title-block">
          <button
            type="button"
            className="notes-editor-title-btn"
            onClick={() => setMetaEditorOpen(true)}
            aria-label="Editar nombre y categoría del apunte"
            title="Toca para editar nombre y categoría"
          >
            <span className="notes-editor-title-text">
              {titleDraft.trim() || 'Sin título'}
            </span>
            <svg className="notes-editor-title-edit" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
          <div className="notes-editor-meta-row">
            {categoryDraft.trim() ? (
              <span className="notes-chip">{categoryDraft.trim()}</span>
            ) : (
              <span className="notes-chip notes-chip--muted">Sin carpeta</span>
            )}
            <span
              role="status"
              aria-live="polite"
              className={cn(
                'notes-save-state',
                isSaving && 'notes-save-state--busy',
                !isSaving && hasUnsavedChanges && 'notes-save-state--dirty',
                !isSaving && !hasUnsavedChanges && 'notes-save-state--ok',
              )}
            >
              {statusText}
            </span>
          </div>
        </div>
        <div className="notes-editor-header-actions">
          {showOutlineToggle ? (
            <button
              type="button"
              className="notes-inspector-toggle"
              aria-expanded={outlineOpen}
              aria-controls="notes-inspector-panel"
              onClick={onToggleOutline}
            >
              ☷ <span>Esquema</span>
            </button>
          ) : null}
          {onShare ? (
            <button
              type="button"
              className="notes-icon-btn"
              onClick={onShare}
              aria-label="Compartir apunte"
              title="Compartir"
            >
              ♧
            </button>
          ) : null}
          <button
            type="button"
            className="notes-save-button"
            disabled={isSaving}
            onClick={() => void saveNow(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <path d="M17 21v-8H7v8M7 3v5h8" />
            </svg>
            <span>Guardar</span>
          </button>
        </div>
      </header>

      {metaEditorOpen ? (
        <div
          className="notes-meta-scrim"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMetaEditorOpen(false)
          }}
        >
          <form
            className="notes-meta-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notes-meta-dialog-title"
            onSubmit={(event) => {
              event.preventDefault()
              setMetaEditorOpen(false)
            }}
          >
            <h2 id="notes-meta-dialog-title">Nombre y carpeta</h2>
            <label className="notes-meta-field">
              Nombre del apunte
              <input
                type="text"
                value={titleDraft}
                autoFocus
                onChange={(e) => {
                  setTitleDraft(e.target.value)
                  markUnsaved()
                }}
                placeholder="Ej. Verbos irregulares"
                aria-label="Nombre del apunte"
                className={cn(bloomoraInputClass, 'mt-1 !min-h-11 w-full rounded-xl px-3')}
              />
            </label>
            <label className="notes-meta-field">
              Categoría (opcional)
              <input
                value={categoryDraft}
                onChange={(e) => {
                  setCategoryDraft(e.target.value)
                  markUnsaved()
                }}
                placeholder="Ej. Inglés"
                aria-label="Categoría del apunte"
                className={cn(bloomoraInputClass, 'mt-1 !min-h-11 w-full rounded-xl px-3')}
              />
            </label>
            <div className="notes-meta-actions">
              <button type="button" className="notes-meta-cancel" onClick={() => setMetaEditorOpen(false)}>
                Cerrar
              </button>
              <button type="submit" className="notes-save-button notes-save-button--dialog">
                Listo
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <NoteToolbar
        onBeforeControl={() => { if (editorRef.current) toolbarSelectionRef.current = captureEditorSelection(editorRef.current) ?? toolbarSelectionRef.current }}
        onBold={() => runToolbarCommand('bold')}
        onItalic={() => runToolbarCommand('italic')}
        onUnderline={() => runToolbarCommand('underline')}
        onStrike={() => runToolbarCommand('strikeThrough')}
        onBulletList={() => runToolbarCommand('insertUnorderedList')}
        onNumberedList={() => runToolbarCommand('insertOrderedList')}
        onAlign={(align) => applyToolbarSelectionOrTyping(
          (editor) => applyBlockAlign(editor, align),
          (editor) => { applyTypingFormat({ align }); applyBlockAlign(editor, align) },
        )}
        onInsertNote={() => {
          applyToolbarSelectionOrTyping(
            (editor) => { insertNoteBlock(editor); markUnsaved() },
            (editor) => { insertNoteBlock(editor); markUnsaved() },
          )
        }}
        onFontChange={(font: NoteBodyFont) => applyToolbarSelectionOrTyping(
          (editor) => applyNoteFontToSelection(editor, font),
          () => applyTypingFormat({ font }),
        )}
        onFontSizeChange={(fontSizePx) => applyToolbarSelectionOrTyping(
          (editor) => applyNoteFontSizeToSelection(editor, fontSizePx),
          () => applyTypingFormat({ fontSizePx }),
        )}
        onFontSizeStep={(direction) => {
          const next = stepNoteFontSize(panelFormat.fontSizePx, direction)
          applyToolbarSelectionOrTyping(
            (editor) => applyNoteFontSizeToSelection(editor, next),
            () => applyTypingFormat({ fontSizePx: next }),
          )
        }}
        onParagraphStyleChange={(style: NoteParagraphStyle) => applyToolbarSelectionOrTyping(
          (editor) => { applyNoteParagraphStyle(editor, style); markUnsaved() },
          (editor) => { applyNoteParagraphStyle(editor, style); markUnsaved() },
        )}
        onTextColor={(hex) => applyToolbarSelectionOrTyping(
          (editor) => runEditorCommand(editor, 'foreColor', hex),
          () => {
            const color = ENGLISH_NOTE_COLORS.find((item) => item.value === hex)?.id ?? 'black'
            applyTypingFormat({ colorHex: hex, color })
          },
        )}
        onHighlight={(hex) => {
          setHighlightColor(hex)
          patchPanelFormat({ highlightColor: hex })
          applyToolbarSelectionOrTyping(
            (editor) => hex ? runEditorCommand(editor, 'hiliteColor', hex) : clearNoteSelectionHighlight(editor),
            () => applyTypingFormat({ highlightColor: hex }),
          )
        }}
        onOpenTextOptions={() => {
          if (!editorRef.current) return
          openFormatting('options')
        }}
        onLineHeightChange={(lineHeight) => {
          patchPanelFormat({ lineHeight })
          applyToolbarSelectionOrTyping(
            (editor) => {
              applyNoteLineHeightToSelection(editor, lineHeight)
              markUnsaved()
            },
            (editor) => {
              applyTypingFormat({ lineHeight })
              applyNoteLineHeightToSelection(editor, lineHeight)
            },
          )
        }}
        active={activeMarks}
        font={panelFormat.font}
        fontSizePx={panelFormat.fontSizePx}
        paragraphStyle={paragraphStyle}
        textColor={ENGLISH_NOTE_COLORS.find((color) => color.id === panelFormat.colorId)?.value ?? '#111111'}
        highlightColor={highlightColor}
        lineHeight={panelFormat.lineHeight}
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
        onSave={() => void saveNow(true)}
      />

      <NoteSelectionToolbar
        coords={selectionCoords}
        mode={selectionMode}
        formatTarget={formatTarget}
        optionValues={optionValues}
        onClose={() => {
          void handleRequestDismissTextOptions()
        }}
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
        onParagraphSpacingChange={(spacingPx) => {
          patchPanelFormat({ paragraphSpacingPx: spacingPx })
          const editor = editorRef.current
          if (!editor) return
          if (formatTarget === 'typing') {
            applyTypingFormat({ paragraphSpacingPx: spacingPx })
          } else {
            applySelectionFormat(() => { applyNoteParagraphSpacing(editor, spacingPx); markUnsaved() })
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
          const next = stepNoteFontSize(panelFormat.fontSizePx, delta < 0 ? -1 : 1)
          if (formatTarget === 'typing') {
            patchPanelFormat({ fontSizePx: next })
            applyTypingFormat({ fontSizePx: next })
            return
          }
          applySelectionFormat(() => {
            applyNoteFontSizeToSelection(editorRef.current!, next)
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
        onPagesChange={(nextPages) => { setPages(nextPages); markUnsaved() }}
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
