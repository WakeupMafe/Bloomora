import {
  type FormEvent,
  type MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { BackButton } from '@/components/navigation/BackButton'
import { Card } from '@/components/ui/Card'
import { useBloomoraAlert } from '@/contexts/BloomoraAlertContext'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { NoteEditor } from '@/features/notes/NoteEditor'
import { NoteOverflowMenu } from '@/features/notes/NoteOverflowMenu'
import { NoteShortcutHelpDialog } from '@/features/notes/NoteToolbar'
import {
  createDraftEnglishNote,
  englishNoteToInput,
  isDraftNoteId,
  mergeEnglishNotePatch,
} from '@/features/notes/noteDraftUtils'
import { noteDisplayTitle } from '@/features/notes/noteEditorUtils'
import { useNotesLayout } from '@/features/notes/useNotesLayout'
import bloomoraLogo from '@/assets/logos/bloomora_navbar_flor.png'
import '@/styles/englishNotesWorkspace.css'
import {
  useBloomoraEnglishNotes,
  useEnglishNoteDetail,
  useEnglishNoteMutations,
} from '@/hooks/useBloomoraEnglishNotes'
import { messageFromSupabaseError } from '@/lib/supabaseError'
import { getEnglishNoteById, rowToEnglishNote } from '@/services/supabase/englishNotesRepo'
import { getSupabaseBrowserClient } from '@/services/supabase/client'
import { requireSupabase } from '@/services/supabase/typedClient'
import type { EnglishNote, EnglishNoteInput, EnglishNotePatch } from '@/types/englishNote'

type NotePatch = EnglishNotePatch
type ListFilter = 'all' | 'favorites' | 'trash'
type NotePrompt =
  | { type: 'rename'; noteId: string; value: string }
  | { type: 'move'; noteId: string; value: string }

const folderColors = ['#e8a0b0', '#c3a8e0', '#a8c3a0', '#f5b89a', '#f5d98a', '#9fc5e8']

export function EnglishNotesPage({ embedded = false }: { embedded?: boolean }) {
  const { cedula } = useUserPhone()
  const { showToast } = useBloomoraToast()
  const { confirm } = useBloomoraAlert()
  const supabaseReady = !!getSupabaseBrowserClient()
  const [listFilter, setListFilter] = useState<ListFilter>('all')
  const notesScope = listFilter === 'trash' ? 'trash' : 'active'
  const { data: notes = [], isLoading, isError, error } = useBloomoraEnglishNotes(
    cedula,
    notesScope,
  )
  const { insertMut, updateMut, softDeleteMut, restoreMut, deleteMut } =
    useEnglishNoteMutations(cedula)
  const [draftNote, setDraftNote] = useState<EnglishNote | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string[]>([])
  const [savedFolders, setSavedFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [folderCreatorOpen, setFolderCreatorOpen] = useState(false)
  const [folderDraft, setFolderDraft] = useState('')
  const [hasPendingEdits, setHasPendingEdits] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false)
  const [narrowSurface, setNarrowSurface] = useState<'list' | 'editor'>('list')
  const [menuNoteId, setMenuNoteId] = useState<string | null>(null)
  const [promptDialog, setPromptDialog] = useState<NotePrompt | null>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const editorFlushRef = useRef<(() => Promise<boolean>) | null>(null)
  const layoutMode = useNotesLayout(workspaceRef)
  const detailNoteId = activeId && !isDraftNoteId(activeId) ? activeId : null
  const { data: activeDetail, isFetching: isActiveDetailLoading } = useEnglishNoteDetail(
    cedula,
    detailNoteId,
  )

  const visibleNotes = useMemo(() => {
    const base =
      listFilter === 'favorites'
        ? notes.filter((note) => note.isFavorite)
        : notes
    if (listFilter === 'trash') return base
    return draftNote ? [draftNote, ...base] : base
  }, [notes, draftNote, listFilter])

  const active = useMemo(() => {
    if (!activeId || listFilter === 'trash') return null
    if (draftNote?.id === activeId) return draftNote
    const summary = visibleNotes.find((n) => n.id === activeId)
    if (!summary) return null
    return activeDetail?.id === activeId ? activeDetail : summary
  }, [activeId, activeDetail, draftNote, visibleNotes, listFilter])

  const filteredNotes = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return visibleNotes
    return visibleNotes.filter((note) =>
      `${note.title} ${note.category ?? ''} ${note.plainText ?? ''}`
        .toLocaleLowerCase()
        .includes(needle),
    )
  }, [query, visibleNotes])

  const folders = useMemo(() => {
    if (listFilter === 'trash') {
      return [['Papelera', filteredNotes] as [string, EnglishNote[]]]
    }
    const groups = new Map<string, EnglishNote[]>()
    for (const note of filteredNotes) {
      const name = note.category?.trim() || 'Sin carpeta'
      groups.set(name, [...(groups.get(name) ?? []), note])
    }
    const names = new Set(groups.keys())
    if (!query.trim()) savedFolders.forEach((folder) => names.add(folder))
    return [...names].map((name) => [name, groups.get(name) ?? []] as [string, EnglishNote[]])
  }, [filteredNotes, query, savedFolders, listFilter])

  const folderOptions = useMemo(() => {
    const names = new Set<string>()
    savedFolders.forEach((folder) => names.add(folder))
    notes.forEach((note) => {
      const cat = note.category?.trim()
      if (cat) names.add(cat)
    })
    return [...names].sort((a, b) => a.localeCompare(b, 'es'))
  }, [notes, savedFolders])

  const showListSurface = layoutMode === 'narrow' && narrowSurface === 'list'
  const showEditorSurface =
    listFilter !== 'trash' && (layoutMode !== 'narrow' || narrowSurface === 'editor')

  const flushActiveEditor = useCallback(async () => {
    const flush = editorFlushRef.current
    if (!flush) return true
    try {
      return await flush()
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    if (listFilter === 'trash') {
      setActiveId(null)
      setNarrowSurface('list')
      return
    }
    if (visibleNotes.length === 0) {
      setActiveId(null)
      return
    }
    setActiveId((current) => {
      if (current && visibleNotes.some((n) => n.id === current)) return current
      if (layoutMode === 'narrow') return null
      return visibleNotes[0]?.id ?? null
    })
  }, [visibleNotes, layoutMode, listFilter])

  useEffect(() => {
    try {
      setExpanded(JSON.parse(localStorage.getItem('bloomora-notes-expanded-folders') ?? '[]'))
    } catch {
      setExpanded([])
    }
  }, [])
  useEffect(() => {
    if (!cedula) {
      setSavedFolders([])
      return
    }
    try {
      const value: unknown = JSON.parse(
        localStorage.getItem(`bloomora-notes-folders:${cedula}`) ?? '[]',
      )
      setSavedFolders(
        Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [],
      )
    } catch {
      setSavedFolders([])
    }
  }, [cedula])
  useEffect(() => {
    const openHelp = () => setShortcutsOpen(true)
    window.addEventListener('bloomora:open-notes-shortcuts', openHelp)
    return () => window.removeEventListener('bloomora:open-notes-shortcuts', openHelp)
  }, [])
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMobileInspectorOpen(false)
      setMenuNoteId(null)
      if (promptDialog) {
        setPromptDialog(null)
        return
      }
      if (layoutMode === 'narrow' && narrowSurface === 'editor') {
        void flushActiveEditor().then(() => setNarrowSurface('list'))
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [layoutMode, narrowSurface, promptDialog, flushActiveEditor])

  useEffect(() => {
    if (layoutMode === 'wide') setMobileInspectorOpen(false)
    if (layoutMode !== 'narrow') setNarrowSurface('editor')
    if (layoutMode === 'narrow' && !activeId) setNarrowSurface('list')
  }, [layoutMode, activeId])

  const toggleFolder = (folder: string) =>
    setExpanded((current) => {
      setSelectedFolder(folder === 'Sin carpeta' ? null : folder)
      const next = current.includes(folder)
        ? current.filter((item) => item !== folder)
        : [...current, folder]
      localStorage.setItem('bloomora-notes-expanded-folders', JSON.stringify(next))
      return next
    })

  const handleCreateFolder = (event: FormEvent) => {
    event.preventDefault()
    const name = folderDraft.trim()
    if (!name || !cedula) return
    const existing = new Set([
      ...savedFolders,
      ...notes.map((note) => note.category?.trim()).filter((item): item is string => !!item),
    ])
    if ([...existing].some((folder) => folder.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      showToast('Ya existe una carpeta con ese nombre.')
      return
    }
    const next = [...savedFolders, name]
    setSavedFolders(next)
    localStorage.setItem(`bloomora-notes-folders:${cedula}`, JSON.stringify(next))
    setExpanded((current) => [...new Set([...current, name])])
    setSelectedFolder(name)
    setFolderDraft('')
    setFolderCreatorOpen(false)
    showToast(`Carpeta “${name}” creada. Al crear un apunte quedará dentro de ella.`)
  }

  const patchNote = async (noteId: string, patch: NotePatch): Promise<boolean> => {
    if (!cedula) return false
    if (isDraftNoteId(noteId)) {
      if (!draftNote || draftNote.id !== noteId) return false
      const merged = mergeEnglishNotePatch(draftNote, patch)
      setDraftNote(merged)
      const isFullSave =
        patch.contentHtml !== undefined ||
        patch.title !== undefined ||
        patch.plainText !== undefined
      if (!isFullSave) return true
      try {
        const id = await insertMut.mutateAsync(englishNoteToInput(merged))
        setDraftNote(null)
        setActiveId(String(id))
        return true
      } catch (err) {
        showToast(messageFromSupabaseError(err), { duration: 8000 })
        return false
      }
    }
    try {
      await updateMut.mutateAsync({ noteId, patch })
      return true
    } catch (err) {
      showToast(messageFromSupabaseError(err), { duration: 8000 })
      return false
    }
  }

  const openNote = async (noteId: string, folder?: string | null) => {
    if (listFilter === 'trash') return
    if (noteId !== activeId) await flushActiveEditor()
    setActiveId(noteId)
    setSelectedFolder(folder ?? null)
    setMenuNoteId(null)
    if (layoutMode === 'narrow') setNarrowSurface('editor')
  }

  const createNote = async (folder?: string | null) => {
    if (!cedula || listFilter === 'trash') return
    await flushActiveEditor()
    if (listFilter !== 'all') setListFilter('all')
    const draft = createDraftEnglishNote(cedula)
    const currentFolder = folder !== undefined ? folder : selectedFolder ?? active?.category?.trim()
    if (currentFolder) draft.category = currentFolder
    setDraftNote(draft)
    setActiveId(draft.id)
    if (layoutMode === 'narrow') setNarrowSurface('editor')
  }

  const softDeleteNote = async (id: string) => {
    if (isDraftNoteId(id)) {
      setDraftNote(null)
      setActiveId(notes[0]?.id ?? null)
      if (layoutMode === 'narrow') setNarrowSurface('list')
      showToast('Borrador descartado')
      return
    }
    if (!cedula) return
    try {
      await softDeleteMut.mutateAsync(id)
      if (activeId === id) {
        setActiveId(null)
        if (layoutMode === 'narrow') setNarrowSurface('list')
      }
      showToast('Apunte enviado a la Papelera', {
        tone: 'deep',
        actionLabel: 'Deshacer',
        duration: 6000,
        onAction: () => {
          restoreMut.mutate(id, {
            onError: (err) => showToast(messageFromSupabaseError(err), { duration: 8000 }),
          })
        },
      })
    } catch (err) {
      showToast(messageFromSupabaseError(err), { duration: 8000 })
    }
  }

  const restoreNote = async (id: string) => {
    try {
      await restoreMut.mutateAsync(id)
      showToast('Apunte restaurado')
    } catch (err) {
      showToast(messageFromSupabaseError(err), { duration: 8000 })
    }
  }

  const permanentDeleteNote = async (id: string) => {
    const ok = await confirm({
      title: '¿Eliminar definitivamente?',
      description: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
    })
    if (!ok) return
    deleteMut.mutate(id, {
      onSuccess: () => showToast('Apunte eliminado definitivamente'),
      onError: (err) => showToast(messageFromSupabaseError(err), { duration: 8000 }),
    })
  }

  const toggleFavorite = async (note: EnglishNote) => {
    if (isDraftNoteId(note.id)) {
      setDraftNote((current) =>
        current?.id === note.id
          ? { ...current, isFavorite: !current.isFavorite }
          : current,
      )
      showToast(note.isFavorite ? 'Quitado de favoritos' : 'Agregado a favoritos')
      return
    }
    try {
      await updateMut.mutateAsync({
        noteId: note.id,
        patch: { isFavorite: !note.isFavorite },
      })
      showToast(note.isFavorite ? 'Quitado de favoritos' : 'Agregado a favoritos')
    } catch (err) {
      showToast(messageFromSupabaseError(err), { duration: 8000 })
    }
  }

  const duplicateNote = async (note: EnglishNote) => {
    if (!cedula) return
    try {
      let source = note
      if (!isDraftNoteId(note.id)) {
        const row = await getEnglishNoteById(requireSupabase(), cedula, Number(note.id))
        source = rowToEnglishNote(row)
      }
      const baseTitle = noteDisplayTitle(source.title)
      const copyTitle = `${baseTitle} (copia)`
      const input: Partial<EnglishNoteInput> = {
        ...englishNoteToInput(source),
        title: copyTitle,
        isFavorite: false,
        deletedAt: null,
      }
      const id = await insertMut.mutateAsync(input)
      showToast('Apunte duplicado')
      if (listFilter === 'trash') setListFilter('all')
      setActiveId(String(id))
      if (layoutMode === 'narrow') setNarrowSurface('editor')
    } catch (err) {
      showToast(messageFromSupabaseError(err), { duration: 8000 })
    }
  }

  const submitPromptDialog = async (event: FormEvent) => {
    event.preventDefault()
    if (!promptDialog) return
    const value = promptDialog.value.trim()
    if (promptDialog.type === 'rename') {
      if (!value) {
        showToast('Escribe un nombre para el apunte.')
        return
      }
      const ok = await patchNote(promptDialog.noteId, { title: value })
      if (ok) {
        showToast('Apunte renombrado')
        setPromptDialog(null)
      }
      return
    }
    const category = value || null
    const ok = await patchNote(promptDialog.noteId, { category })
    if (ok) {
      showToast(category ? `Movido a “${category}”` : 'Movido a Sin carpeta')
      setPromptDialog(null)
    }
  }

  const backToList = () => {
    void flushActiveEditor().then(() => {
      setNarrowSurface('list')
      setMobileInspectorOpen(false)
    })
  }

  const setListFilterSafe = (next: ListFilter) => {
    void flushActiveEditor().then(() => {
      setListFilter(next)
      setMenuNoteId(null)
      setSelectedFolder(null)
      if (next === 'trash') {
        setActiveId(null)
        setNarrowSurface('list')
      }
    })
  }

  const outline = useMemo(() => {
    if (!active?.contentHtml || typeof DOMParser === 'undefined') return []
    const doc = new DOMParser().parseFromString(active.contentHtml, 'text/html')
    return [...doc.querySelectorAll('h1,h2,h3')]
      .map((node, domIndex) => ({
        text: node.textContent?.replace(/\u200b/g, '').trim() ?? '',
        level: Number(node.tagName.slice(1)),
        domIndex,
      }))
      .filter((item) => item.text.length > 0)
  }, [active?.contentHtml])

  const wordCount = (active?.plainText ?? '').trim().split(/\s+/).filter(Boolean).length
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('Enlace copiado')
    } catch {
      showToast('No se pudo copiar el enlace')
    }
  }

  const formatNoteMeta = (note: EnglishNote) => {
    if (listFilter === 'trash' && note.deletedAt) {
      const deleted = new Date(note.deletedAt)
      return `Eliminado · ${deleted.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`
    }
    const when = new Date(note.updatedAt)
    const today = new Date()
    const sameDay =
      when.getFullYear() === today.getFullYear() &&
      when.getMonth() === today.getMonth() &&
      when.getDate() === today.getDate()
    const time = when.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
    const day = sameDay
      ? `Hoy, ${time}`
      : when.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
    return note.isFavorite ? `★ ${day}` : day
  }

  const renderNoteOverflow = (note: EnglishNote, triggerClassName: string) => (
    <NoteOverflowMenu
      noteTitle={noteDisplayTitle(note.title)}
      open={menuNoteId === note.id}
      mode={listFilter === 'trash' ? 'trash' : 'active'}
      isFavorite={note.isFavorite}
      onClose={() => setMenuNoteId(null)}
      onTriggerClick={() =>
        setMenuNoteId((current) => (current === note.id ? null : note.id))
      }
      triggerClassName={triggerClassName}
      onRename={() =>
        setPromptDialog({
          type: 'rename',
          noteId: note.id,
          value: note.title,
        })
      }
      onMoveFolder={() =>
        setPromptDialog({
          type: 'move',
          noteId: note.id,
          value: note.category ?? '',
        })
      }
      onToggleFavorite={() => void toggleFavorite(note)}
      onDuplicate={() => void duplicateNote(note)}
      onDelete={() => void softDeleteNote(note.id)}
      onRestore={() => void restoreNote(note.id)}
      onPermanentDelete={() => void permanentDeleteNote(note.id)}
    />
  )

  const sidebar = (
    <aside className={`notes-sidebar${showListSurface ? ' notes-sidebar--page' : ''}`}>
      {showListSurface ? (
        <div className="notes-list-top">
          {!embedded ? (
            <BackButton parentTo="/app/study-tools" parentLabel="Herramientas" />
          ) : (
            <span className="notes-list-top-spacer" />
          )}
          <h1 className="notes-list-heading">
            {listFilter === 'trash'
              ? 'Papelera'
              : listFilter === 'favorites'
                ? 'Favoritos'
                : 'Apuntes'}
          </h1>
          {listFilter !== 'trash' ? (
            <button
              className="notes-new-button notes-new-button--compact"
              onClick={() => void createNote()}
              disabled={isLoading}
            >
              ＋ <span>Nuevo</span>
            </button>
          ) : (
            <span className="notes-list-top-spacer" />
          )}
        </div>
      ) : (
        <>
          <div className="notes-brand">
            <img src={bloomoraLogo} alt="" />
            <span>Bloomora</span>
          </div>
          <button
            className="notes-new-button"
            onClick={() => void createNote()}
            disabled={isLoading || listFilter === 'trash'}
          >
            ＋ <span>Nuevo apunte</span>
          </button>
        </>
      )}
      <label className="notes-search">
        <span aria-hidden="true">⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            listFilter === 'trash'
              ? 'Buscar en la papelera'
              : showListSurface
                ? 'Buscar en tus apuntes'
                : 'Buscar apuntes…'
          }
          aria-label="Buscar apuntes"
        />
      </label>
      {!showListSurface && listFilter !== 'trash' ? (
        <div className="notes-section-title">
          <span>CARPETAS</span>
          <button
            type="button"
            onClick={() => {
              setFolderCreatorOpen((open) => !open)
              setFolderDraft('')
            }}
            aria-label="Crear carpeta"
            title="Crear carpeta"
          >
            ＋
          </button>
        </div>
      ) : showListSurface ? (
        <div className="notes-filter-chips" role="toolbar" aria-label="Filtros de apuntes">
          <button
            type="button"
            className={`notes-filter-chip${listFilter === 'all' ? ' is-on' : ''}`}
            onClick={() => setListFilterSafe('all')}
          >
            Todos
          </button>
          <button
            type="button"
            className={`notes-filter-chip${listFilter === 'favorites' ? ' is-on' : ''}`}
            onClick={() => setListFilterSafe('favorites')}
          >
            ⭐ Favoritos
          </button>
          <button
            type="button"
            className={`notes-filter-chip${listFilter === 'trash' ? ' is-on' : ''}`}
            onClick={() => setListFilterSafe('trash')}
          >
            Papelera
          </button>
          {listFilter !== 'trash'
            ? folders
                .filter(([name]) => name !== 'Sin carpeta' && name !== 'Papelera')
                .slice(0, 4)
                .map(([name]) => (
                  <button
                    key={name}
                    type="button"
                    className={`notes-filter-chip${selectedFolder === name ? ' is-on' : ''}`}
                    onClick={() => {
                      setSelectedFolder((current) => (current === name ? null : name))
                      setExpanded((current) =>
                        current.includes(name) ? current : [...current, name],
                      )
                    }}
                  >
                    📁 {name}
                  </button>
                ))
            : null}
        </div>
      ) : null}
      {folderCreatorOpen && !showListSurface && listFilter !== 'trash' ? (
        <form className="notes-folder-create" onSubmit={handleCreateFolder}>
          <input
            autoFocus
            value={folderDraft}
            onChange={(event) => setFolderDraft(event.target.value)}
            placeholder="Nombre de la carpeta"
            aria-label="Nombre de la carpeta"
            maxLength={40}
          />
          <button type="submit" disabled={!folderDraft.trim()}>
            Crear
          </button>
          <button
            type="button"
            className="notes-folder-cancel"
            onClick={() => setFolderCreatorOpen(false)}
            aria-label="Cancelar creación"
          >
            ×
          </button>
        </form>
      ) : null}
      <nav
        className={`notes-folder-list${showListSurface ? ' notes-folder-list--cards' : ''}`}
        aria-label="Carpetas y apuntes"
      >
        {folders.map(([folder, items], index) => {
          if (
            showListSurface &&
            selectedFolder &&
            listFilter !== 'trash' &&
            folder !== selectedFolder &&
            folder !== 'Sin carpeta'
          ) {
            return null
          }
          const isOpen =
            showListSurface ||
            listFilter === 'trash' ||
            expanded.includes(folder) ||
            !!query ||
            folder === (active?.category?.trim() || 'Sin carpeta')
          return (
            <section className={`notes-folder ${isOpen ? 'is-open' : ''}`} key={folder}>
              {showListSurface || listFilter === 'trash' ? (
                <div className="notes-list-section">
                  {listFilter === 'trash' ? '♧' : '📁'} {folder}{' '}
                  <span className="notes-list-count">{items.length}</span>
                </div>
              ) : (
                <button className="notes-folder-row" onClick={() => toggleFolder(folder)} title={folder}>
                  <span
                    className="notes-folder-icon"
                    style={{ backgroundColor: folderColors[index % folderColors.length] }}
                  />
                  <span className="notes-folder-name">{folder}</span>
                  <small>({items.length})</small>
                  <span className="notes-chevron">{isOpen ? '⌄' : '›'}</span>
                </button>
              )}
              {isOpen ? (
                <div className="notes-folder-children">
                  {items.map((note) =>
                    showListSurface || listFilter === 'trash' ? (
                      <div
                        className={`notes-note-card ${note.id === activeId ? 'is-active' : ''}`}
                        key={note.id}
                      >
                        <button
                          type="button"
                          className="notes-note-card-main"
                          onClick={() => void openNote(note.id, note.category?.trim() || null)}
                          title={noteDisplayTitle(note.title)}
                          disabled={listFilter === 'trash'}
                        >
                          <span className="notes-note-card-icon" aria-hidden>
                            {note.isFavorite && listFilter !== 'trash' ? '⭐' : '📝'}
                          </span>
                          <span className="notes-note-card-text">
                            <b>{noteDisplayTitle(note.title)}</b>
                            <small>{formatNoteMeta(note)}</small>
                          </span>
                        </button>
                        {renderNoteOverflow(note, 'notes-note-more')}
                      </div>
                    ) : (
                      <div
                        className={`notes-note-row ${note.id === activeId ? 'is-active' : ''}`}
                        key={note.id}
                      >
                        <button
                          type="button"
                          onClick={() => void openNote(note.id, note.category?.trim() || null)}
                          title={noteDisplayTitle(note.title)}
                        >
                          <span>{note.isFavorite ? '★' : '▱'}</span>
                          <span>{noteDisplayTitle(note.title)}</span>
                        </button>
                        {renderNoteOverflow(note, 'notes-delete')}
                      </div>
                    ),
                  )}
                </div>
              ) : null}
            </section>
          )
        })}
        {!isLoading && folders.every(([, items]) => items.length === 0) ? (
          <p className="notes-empty">
            {listFilter === 'trash'
              ? 'La papelera está vacía.'
              : listFilter === 'favorites'
                ? 'Aún no tienes favoritos.'
                : 'Aún no tienes apuntes aquí.'}
          </p>
        ) : null}
      </nav>
      <div className="notes-sidebar-bottom">
        <button
          type="button"
          className={listFilter === 'favorites' ? 'is-on' : undefined}
          aria-pressed={listFilter === 'favorites'}
          onClick={() =>
            setListFilterSafe(listFilter === 'favorites' ? 'all' : 'favorites')
          }
        >
          {listFilter === 'favorites' ? '★' : '☆'} <span>Favoritos</span>
        </button>
        <button
          type="button"
          className={listFilter === 'trash' ? 'is-on' : undefined}
          aria-pressed={listFilter === 'trash'}
          onClick={() => setListFilterSafe(listFilter === 'trash' ? 'all' : 'trash')}
        >
          ♧ <span>Papelera</span>
        </button>
      </div>
    </aside>
  )

  return (
    <div
      ref={workspaceRef}
      className={[
        'notes-workspace',
        `notes-workspace--${layoutMode}`,
        embedded ? 'notes-workspace--embedded' : '',
        showListSurface || listFilter === 'trash' ? 'notes-workspace--list' : '',
        showEditorSurface && layoutMode === 'narrow' ? 'notes-workspace--editor' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {layoutMode !== 'narrow' || showListSurface || listFilter === 'trash' ? sidebar : null}

      {showEditorSurface ? (
        <main className="notes-main">
          {!embedded && layoutMode !== 'narrow' ? (
            <div className="notes-app-nav flex items-center gap-3">
              <BackButton parentTo="/app/study-tools" parentLabel="Herramientas" />
              <span className="font-bold text-bloomora-deep">Apuntes</span>
            </div>
          ) : null}
          {!cedula ? (
            <Card variant="glass" className="notes-state-card">
              Necesitas iniciar sesión para guardar apuntes.
            </Card>
          ) : !supabaseReady ? (
            <Card variant="glass" className="notes-state-card">
              Supabase no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en
              .env.local y reinicia la app.
            </Card>
          ) : isError ? (
            <Card variant="glass" className="notes-state-card">
              {messageFromSupabaseError(error)}
              <p>
                Revisa la tabla english_notes y las migraciones en supabase/migrations (incluye
                20260605_english_notes_favorite_trash.sql).
              </p>
            </Card>
          ) : active ? (
            <NoteEditor
              note={active}
              userCedula={cedula}
              onPatch={patchNote}
              onUnsavedChange={setHasPendingEdits}
              flushSaveRef={editorFlushRef as MutableRefObject<(() => Promise<boolean>) | null>}
              isNotesLoading={isLoading}
              isNoteContentLoading={!!detailNoteId && isActiveDetailLoading && !activeDetail}
              hasSavedNotes={notes.length > 0}
              isDraft={isDraftNoteId(active.id)}
              showBack={layoutMode === 'narrow'}
              onBack={backToList}
              showOutlineToggle={layoutMode !== 'wide'}
              outlineOpen={mobileInspectorOpen}
              onToggleOutline={() => setMobileInspectorOpen((open) => !open)}
              onShare={() => void share()}
              layoutMode={layoutMode}
            />
          ) : (
            <div className="notes-welcome">
              <div className="notes-welcome-icon">✿</div>
              <h1>Aún no tienes apuntes aquí</h1>
              <p>Crea un apunte para empezar a organizar tus ideas.</p>
              <button className="notes-new-button" onClick={() => void createNote()}>
                ＋ Nuevo apunte
              </button>
            </div>
          )}
        </main>
      ) : null}

      {showEditorSurface ? (
        <aside
          id="notes-inspector-panel"
          className={`notes-inspector${mobileInspectorOpen && layoutMode !== 'wide' ? ' notes-inspector--open' : ''}`}
        >
          {layoutMode !== 'wide' ? (
            <button
              type="button"
              className="notes-inspector-close"
              onClick={() => setMobileInspectorOpen(false)}
              aria-label="Cerrar esquema"
            >
              ×
            </button>
          ) : null}
          <section className="notes-inspector-card">
            <h2>
              <span>☷</span> Esquema
            </h2>
            {outline.length ? (
              <ol>
                {outline.map((item) => (
                  <li key={item.domIndex} className={`outline-level-${item.level}`}>
                    <a
                      href={`#note-heading-${item.domIndex}`}
                      onClick={(e) => {
                        e.preventDefault()
                        const heading = document.querySelectorAll(
                          '[data-note-page] h1,[data-note-page] h2,[data-note-page] h3',
                        )[item.domIndex]
                        heading?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        setMobileInspectorOpen(false)
                      }}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ol>
            ) : (
              <p>Los títulos del documento aparecerán aquí.</p>
            )}
          </section>
          <section className="notes-inspector-card">
            <h2>
              <span>ⓘ</span> Detalles
            </h2>
            {active ? (
              <dl>
                <div>
                  <dt>Creado</dt>
                  <dd>{new Date(active.createdAt).toLocaleDateString('es-CO')}</dd>
                </div>
                <div>
                  <dt>Última edición</dt>
                  <dd>{new Date(active.updatedAt).toLocaleDateString('es-CO')}</dd>
                </div>
                <div>
                  <dt>Palabras</dt>
                  <dd>{wordCount}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{hasPendingEdits ? 'Sin guardar' : 'Guardado'}</dd>
                </div>
              </dl>
            ) : (
              <p>Selecciona un apunte.</p>
            )}
          </section>
        </aside>
      ) : null}

      {promptDialog ? (
        <div
          className="notes-meta-scrim"
          role="presentation"
          onClick={() => setPromptDialog(null)}
        >
          <form
            className="notes-meta-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notes-prompt-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => void submitPromptDialog(e)}
          >
            <h2 id="notes-prompt-title">
              {promptDialog.type === 'rename' ? 'Renombrar apunte' : 'Mover a carpeta'}
            </h2>
            <label className="notes-meta-field">
              {promptDialog.type === 'rename' ? 'Nombre' : 'Carpeta'}
              <input
                autoFocus
                value={promptDialog.value}
                onChange={(e) =>
                  setPromptDialog((current) =>
                    current ? { ...current, value: e.target.value } : current,
                  )
                }
                placeholder={
                  promptDialog.type === 'rename'
                    ? 'Nombre del apunte'
                    : 'Sin carpeta (deja vacío)'
                }
                list={promptDialog.type === 'move' ? 'notes-folder-options' : undefined}
                maxLength={80}
              />
            </label>
            {promptDialog.type === 'move' ? (
              <datalist id="notes-folder-options">
                {folderOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            ) : null}
            {promptDialog.type === 'move' ? (
              <p className="notes-prompt-hint">Vacío = Sin carpeta.</p>
            ) : null}
            <div className="notes-meta-actions">
              <button
                type="button"
                className="notes-meta-cancel"
                onClick={() => setPromptDialog(null)}
              >
                Cancelar
              </button>
              <button type="submit" className="notes-new-button notes-new-button--compact">
                Guardar
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {shortcutsOpen ? <NoteShortcutHelpDialog onClose={() => setShortcutsOpen(false)} /> : null}
    </div>
  )
}
