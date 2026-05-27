import { useCallback, useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { bloomoraInputClass, bloomoraPanelCardClass } from '@/components/ui/formControls'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { NotePageNumbers } from '@/features/notes/NotePageNumbers'
import {
  NoteSelectionToolbar,
  coordsFromNoteSelection,
  useNoteSelectionToolbar,
} from '@/features/notes/NoteSelectionToolbar'
import { NoteToolbar } from '@/features/notes/NoteToolbar'
import {
  applyNoteFontToSelection,
  adjustNoteSelectionFontSize,
  attachNoteImageDragHandlers,
  buildNotePrintDocumentHtml,
  enhanceNoteImages,
  insertImageInEditor,
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
  ) => boolean
}

export function NoteEditor({ note, onPatch }: NoteEditorProps) {
  const { showToast } = useBloomoraToast()
  const editorRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLElement>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queueSaveRef = useRef<() => void>(() => {})
  const [saveLabel, setSaveLabel] = useState('Sin cambios pendientes')
  const [titleDraft, setTitleDraft] = useState('')
  const noteRef = useRef(note)
  const titleDraftRef = useRef(titleDraft)
  const onPatchRef = useRef(onPatch)

  noteRef.current = note
  titleDraftRef.current = titleDraft
  onPatchRef.current = onPatch

  const {
    coords: selectionCoords,
    mode: selectionMode,
    openAtSelection,
    dismiss: dismissSelectionToolbar,
  } = useNoteSelectionToolbar(editorRef)

  useEffect(() => {
    if (!note) return
    setTitleDraft(note.title)
  }, [note?.id])

  useEffect(() => {
    if (!note || !editorRef.current) return
    editorRef.current.innerHTML = note.contentHtml || '<p><br /></p>'
    enhanceNoteImages(editorRef.current)
  }, [note?.id])

  const persistNote = useCallback(
    (
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
      options?: { silent?: boolean },
    ): boolean => {
      const current = noteRef.current
      if (!current) return false
      const ok = onPatchRef.current(current.id, patch)
      if (!options?.silent) {
        setSaveLabel(ok ? 'Guardado' : 'Error al guardar')
      }
      return ok
    },
    [showToast],
  )

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

  const saveNow = useCallback(
    (options?: { silent?: boolean }): boolean => {
      const current = noteRef.current
      if (!current || !editorRef.current) return false

      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      if (titleSaveTimer.current) {
        clearTimeout(titleSaveTimer.current)
        titleSaveTimer.current = null
      }

      if (!options?.silent) setSaveLabel('Guardando...')

      const payload = readEditorPayload()
      if (!payload) return false

      const ok = persistNote(
        {
          title: titleDraftRef.current,
          ...payload,
        },
        options,
      )
      if (ok && !options?.silent) {
        showToast('Apunte guardado')
      }
      return ok
    },
    [persistNote, showToast],
  )

  const queueTitleSave = (value: string) => {
    if (!note) return
    setSaveLabel('Cambios sin guardar')
    if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current)
    titleSaveTimer.current = setTimeout(() => {
      titleSaveTimer.current = null
      persistNote({ title: value })
    }, 400)
  }

  const queueSave = () => {
    if (!note || !editorRef.current) return
    setSaveLabel('Cambios sin guardar')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null
      const payload = readEditorPayload()
      if (!payload) return
      persistNote(payload)
    }, 500)
  }

  queueSaveRef.current = queueSave

  useEffect(() => {
    const el = editorRef.current
    if (!el || !note) return
    enhanceNoteImages(el)
    return attachNoteImageDragHandlers(el, () => queueSaveRef.current())
  }, [note?.id])

  useEffect(() => {
    const flushOnLeave = () => {
      if (saveTimer.current || titleSaveTimer.current) {
        saveNow({ silent: true })
      }
    }
    window.addEventListener('pagehide', flushOnLeave)
    window.addEventListener('beforeunload', flushOnLeave)
    return () => {
      window.removeEventListener('pagehide', flushOnLeave)
      window.removeEventListener('beforeunload', flushOnLeave)
      flushOnLeave()
    }
  }, [saveNow, note?.id])

  const cmd = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    queueSave()
  }

  const applySelectionFormat = (fn: () => void) => {
    fn()
    editorRef.current?.focus()
    queueSave()
  }

  const insertImageAtCursor = async (file: File | undefined) => {
    if (!file || !editorRef.current) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result ?? '')
      if (!src) return
      const inserted = insertImageInEditor(editorRef.current!, src)
      if (inserted) {
        queueSave()
        showToast('Imagen insertada. Arrastrala con el mouse para colocarla en la hoja.')
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
        pageSize: note.pageSize,
        pageNumberEnabled: note.pageNumberEnabled,
        twoColumns: note.twoColumns,
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
      if (adjustNoteSelectionFontSize(editor, NOTE_FONT_SIZE_STEP_PX)) queueSave()
      return
    }
    if (ctrlZoomOut && editor) {
      e.preventDefault()
      if (adjustNoteSelectionFontSize(editor, -NOTE_FONT_SIZE_STEP_PX)) queueSave()
      return
    }
    if (e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'o') {
      e.preventDefault()
      const editor = editorRef.current
      if (!editor || !coordsFromNoteSelection(editor)) {
        showToast('Selecciona texto en la hoja y vuelve a pulsar Ctrl+O.')
        return
      }
      openAtSelection('options')
      return
    }
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
      e.preventDefault()
      saveNow()
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
        Selecciona o crea un apunte.
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
              queueTitleSave(e.target.value)
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
            value={note.category ?? ''}
            onChange={(e) => onPatch(note.id, { category: e.target.value || null })}
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
        pageSize={note.pageSize}
        onPageSizeChange={(v) => onPatch(note.id, { pageSize: v })}
        pageNumberEnabled={note.pageNumberEnabled}
        onPageNumberEnabledChange={(enabled) =>
          onPatch(note.id, { pageNumberEnabled: enabled })
        }
        twoColumns={note.twoColumns}
        onTwoColumnsChange={(enabled) => onPatch(note.id, { twoColumns: enabled })}
        onSave={() => saveNow()}
      />

      <NoteSelectionToolbar
        coords={selectionCoords}
        mode={selectionMode}
        onClose={dismissSelectionToolbar}
        onTextColor={(hex) => {
          applySelectionFormat(() => document.execCommand('foreColor', false, hex))
        }}
        onHighlight={(hex) => {
          applySelectionFormat(() => document.execCommand('hiliteColor', false, hex))
        }}
        onAlignCenter={() => {
          editorRef.current?.focus()
          cmd('justifyCenter')
        }}
        onAlignLeft={() => {
          editorRef.current?.focus()
          cmd('justifyLeft')
        }}
        onFontChange={(font) => {
          if (!editorRef.current) return
          applySelectionFormat(() => {
            applyNoteFontToSelection(editorRef.current!, font)
          })
        }}
        onFontSizeChange={(delta) => {
          if (!editorRef.current) return
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
          notePageSheetClass(note.pageSize),
        'rounded-[22px] bg-white shadow-[0_20px_54px_-24px_rgba(91,74,140,0.35)] ring-1 ring-bloomora-line/30',
        )}
      >
        <NotePageNumbers
          enabled={note.pageNumberEnabled}
          pageSize={note.pageSize}
          sheetRef={sheetRef}
          contentRef={editorRef}
        />
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={queueSave}
          onKeyDown={handleKeyDown}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            queueSave()
          }}
          className={cn(
            'english-note-content min-h-[200px] rounded-2xl bg-white/80 p-2 text-[15px] text-[#1f1f1f] outline-none',
            note.twoColumns && 'english-note-content--two-columns',
          )}
          data-placeholder="Escribe aqui tu apunte, titulos, listas..."
        />
      </article>
    </Card>
  )
}
