import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { BackButton } from '@/components/navigation/BackButton'
import { Card } from '@/components/ui/Card'
import { useBloomoraAlert } from '@/contexts/BloomoraAlertContext'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { NoteEditor } from '@/features/notes/NoteEditor'
import { NoteShortcutHelpDialog } from '@/features/notes/NoteToolbar'
import { createDraftEnglishNote, englishNoteToInput, isDraftNoteId, mergeEnglishNotePatch } from '@/features/notes/noteDraftUtils'
import { noteDisplayTitle } from '@/features/notes/noteEditorUtils'
import { useNotesLayout } from '@/features/notes/useNotesLayout'
import bloomoraLogo from '@/assets/logos/bloomora_navbar_flor.png'
import '@/styles/englishNotesWorkspace.css'
import { useBloomoraEnglishNotes, useEnglishNoteDetail, useEnglishNoteMutations } from '@/hooks/useBloomoraEnglishNotes'
import { messageFromSupabaseError } from '@/lib/supabaseError'
import { getSupabaseBrowserClient } from '@/services/supabase/client'
import type { EnglishNote, EnglishNoteInput } from '@/types/englishNote'

type NotePatch = Partial<EnglishNoteInput>
const folderColors = ['#e8a0b0', '#c3a8e0', '#a8c3a0', '#f5b89a', '#f5d98a', '#9fc5e8']

export function EnglishNotesPage({ embedded = false }: { embedded?: boolean }) {
  const { cedula } = useUserPhone()
  const { showToast } = useBloomoraToast()
  const { confirm } = useBloomoraAlert()
  const supabaseReady = !!getSupabaseBrowserClient()
  const { data: notes = [], isLoading, isError, error } = useBloomoraEnglishNotes(cedula)
  const { insertMut, updateMut, deleteMut } = useEnglishNoteMutations(cedula)
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
  /** En narrow: lista a página completa vs editor. */
  const [narrowSurface, setNarrowSurface] = useState<'list' | 'editor'>('list')
  const workspaceRef = useRef<HTMLDivElement>(null)
  const layoutMode = useNotesLayout(workspaceRef)
  const detailNoteId = activeId && !isDraftNoteId(activeId) ? activeId : null
  const { data: activeDetail, isFetching: isActiveDetailLoading } = useEnglishNoteDetail(cedula, detailNoteId)
  const visibleNotes = useMemo(() => (draftNote ? [draftNote, ...notes] : notes), [notes, draftNote])
  const active = useMemo(() => {
    if (!activeId) return null
    if (draftNote?.id === activeId) return draftNote
    const summary = visibleNotes.find((n) => n.id === activeId)
    if (!summary) return null
    return activeDetail?.id === activeId ? activeDetail : summary
  }, [activeId, activeDetail, draftNote, visibleNotes])
  const filteredNotes = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return visibleNotes
    return visibleNotes.filter((note) =>
      `${note.title} ${note.category ?? ''} ${note.plainText ?? ''}`.toLocaleLowerCase().includes(needle),
    )
  }, [query, visibleNotes])
  const folders = useMemo(() => {
    const groups = new Map<string, EnglishNote[]>()
    for (const note of filteredNotes) {
      const name = note.category?.trim() || 'Sin carpeta'
      groups.set(name, [...(groups.get(name) ?? []), note])
    }
    const names = new Set(groups.keys())
    if (!query.trim()) savedFolders.forEach((folder) => names.add(folder))
    return [...names].map((name) => [name, groups.get(name) ?? []] as [string, EnglishNote[]])
  }, [filteredNotes, query, savedFolders])

  const showListSurface = layoutMode === 'narrow' && narrowSurface === 'list'
  const showEditorSurface = layoutMode !== 'narrow' || narrowSurface === 'editor'

  useEffect(() => {
    if (visibleNotes.length === 0) {
      setActiveId(null)
      return
    }
    setActiveId((current) => {
      if (current && visibleNotes.some((n) => n.id === current)) return current
      if (layoutMode === 'narrow') return null
      return visibleNotes[0]?.id ?? null
    })
  }, [visibleNotes, layoutMode])

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
      const value: unknown = JSON.parse(localStorage.getItem(`bloomora-notes-folders:${cedula}`) ?? '[]')
      setSavedFolders(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])
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
      if (layoutMode === 'narrow' && narrowSurface === 'editor') {
        setNarrowSurface('list')
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [layoutMode, narrowSurface])

  useEffect(() => {
    if (layoutMode === 'wide') setMobileInspectorOpen(false)
    if (layoutMode !== 'narrow') setNarrowSurface('editor')
    if (layoutMode === 'narrow' && !activeId) setNarrowSurface('list')
  }, [layoutMode, activeId])

  const toggleFolder = (folder: string) =>
    setExpanded((current) => {
      setSelectedFolder(folder === 'Sin carpeta' ? null : folder)
      const next = current.includes(folder) ? current.filter((item) => item !== folder) : [...current, folder]
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
        patch.contentHtml !== undefined || patch.title !== undefined || patch.plainText !== undefined
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

  const openNote = (noteId: string, folder?: string | null) => {
    setActiveId(noteId)
    setSelectedFolder(folder ?? null)
    if (layoutMode === 'narrow') setNarrowSurface('editor')
  }

  const createNote = (folder?: string | null) => {
    if (!cedula) return
    const draft = createDraftEnglishNote(cedula)
    const currentFolder = folder !== undefined ? folder : selectedFolder ?? active?.category?.trim()
    if (currentFolder) draft.category = currentFolder
    setDraftNote(draft)
    setActiveId(draft.id)
    if (layoutMode === 'narrow') setNarrowSurface('editor')
  }

  const deleteNote = async (id: string) => {
    if (isDraftNoteId(id)) {
      setDraftNote(null)
      setActiveId(notes[0]?.id ?? null)
      if (layoutMode === 'narrow') setNarrowSurface('list')
      return
    }
    if (!cedula) return
    const ok = await confirm({ title: '¿Eliminar este apunte?', confirmLabel: 'Eliminar', tone: 'danger' })
    if (!ok) return
    deleteMut.mutate(id, {
      onSuccess: () => {
        showToast('Apunte eliminado')
        if (activeId === id && layoutMode === 'narrow') setNarrowSurface('list')
      },
      onError: (err) => showToast(messageFromSupabaseError(err), { duration: 8000 }),
    })
  }

  const backToList = () => {
    setNarrowSurface('list')
    setMobileInspectorOpen(false)
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
    return day
  }

  const sidebar = (
    <aside className={`notes-sidebar${showListSurface ? ' notes-sidebar--page' : ''}`}>
      {showListSurface ? (
        <div className="notes-list-top">
          {!embedded ? (
            <BackButton parentTo="/app/study-tools" parentLabel="Herramientas" />
          ) : (
            <span className="notes-list-top-spacer" />
          )}
          <h1 className="notes-list-heading">Apuntes</h1>
          <button className="notes-new-button notes-new-button--compact" onClick={() => createNote()} disabled={isLoading}>
            ＋ <span>Nuevo</span>
          </button>
        </div>
      ) : (
        <>
          <div className="notes-brand">
            <img src={bloomoraLogo} alt="" />
            <span>Bloomora</span>
          </div>
          <button className="notes-new-button" onClick={() => createNote()} disabled={isLoading}>
            ＋ <span>Nuevo apunte</span>
          </button>
        </>
      )}
      <label className="notes-search">
        <span aria-hidden="true">⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={showListSurface ? 'Buscar en tus apuntes' : 'Buscar apuntes…'}
          aria-label="Buscar apuntes"
        />
      </label>
      {!showListSurface ? (
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
      ) : (
        <div className="notes-filter-chips" role="toolbar" aria-label="Filtros de apuntes">
          <button type="button" className="notes-filter-chip is-on">
            Todos
          </button>
          <button type="button" className="notes-filter-chip" disabled title="Favoritos llegará pronto">
            ⭐ Favoritos
          </button>
          {folders
            .filter(([name]) => name !== 'Sin carpeta')
            .slice(0, 4)
            .map(([name]) => (
              <button
                key={name}
                type="button"
                className={`notes-filter-chip${selectedFolder === name ? ' is-on' : ''}`}
                onClick={() => {
                  setSelectedFolder((current) => (current === name ? null : name))
                  setExpanded((current) => (current.includes(name) ? current : [...current, name]))
                }}
              >
                📁 {name}
              </button>
            ))}
        </div>
      )}
      {folderCreatorOpen && !showListSurface ? (
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
      <nav className={`notes-folder-list${showListSurface ? ' notes-folder-list--cards' : ''}`} aria-label="Carpetas y apuntes">
        {folders.map(([folder, items], index) => {
          if (showListSurface && selectedFolder && folder !== selectedFolder && folder !== 'Sin carpeta') {
            return null
          }
          const isOpen =
            showListSurface ||
            expanded.includes(folder) ||
            !!query ||
            folder === (active?.category?.trim() || 'Sin carpeta')
          return (
            <section className={`notes-folder ${isOpen ? 'is-open' : ''}`} key={folder}>
              {showListSurface ? (
                <div className="notes-list-section">
                  📁 {folder} <span className="notes-list-count">{items.length}</span>
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
                    showListSurface ? (
                      <div
                        className={`notes-note-card ${note.id === activeId ? 'is-active' : ''}`}
                        key={note.id}
                      >
                        <button
                          type="button"
                          className="notes-note-card-main"
                          onClick={() => openNote(note.id, note.category?.trim() || null)}
                          title={noteDisplayTitle(note.title)}
                        >
                          <span className="notes-note-card-icon" aria-hidden>
                            📝
                          </span>
                          <span className="notes-note-card-text">
                            <b>{noteDisplayTitle(note.title)}</b>
                            <small>{formatNoteMeta(note)}</small>
                          </span>
                        </button>
                        <button
                          type="button"
                          className="notes-note-more"
                          onClick={() => void deleteNote(note.id)}
                          aria-label={`Opciones de ${noteDisplayTitle(note.title)}`}
                          title="Eliminar (menú completo en una próxima versión)"
                        >
                          ⋯
                        </button>
                      </div>
                    ) : (
                      <div className={`notes-note-row ${note.id === activeId ? 'is-active' : ''}`} key={note.id}>
                        <button
                          type="button"
                          onClick={() => openNote(note.id, note.category?.trim() || null)}
                          title={noteDisplayTitle(note.title)}
                        >
                          <span>▱</span>
                          <span>{noteDisplayTitle(note.title)}</span>
                        </button>
                        <button
                          className="notes-delete"
                          onClick={() => void deleteNote(note.id)}
                          aria-label={`Eliminar ${noteDisplayTitle(note.title)}`}
                        >
                          ⋯
                        </button>
                      </div>
                    ),
                  )}
                </div>
              ) : null}
            </section>
          )
        })}
        {!isLoading && folders.length === 0 ? <p className="notes-empty">Aún no tienes apuntes aquí.</p> : null}
      </nav>
      <div className="notes-sidebar-bottom">
        <button type="button" disabled title="Favoritos estarán disponibles cuando se agregue esa función">
          ☆ <span>Favoritos</span>
        </button>
        <button type="button" disabled title="Papelera estará disponible cuando se agregue esa función">
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
        showListSurface ? 'notes-workspace--list' : '',
        showEditorSurface && layoutMode === 'narrow' ? 'notes-workspace--editor' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {layoutMode !== 'narrow' || showListSurface ? sidebar : null}

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
              Supabase no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local y
              reinicia la app.
            </Card>
          ) : isError ? (
            <Card variant="glass" className="notes-state-card">
              {messageFromSupabaseError(error)}
              <p>Revisa la tabla english_notes y la migración supabase/migrations/20260528_fix_english_notes.sql.</p>
            </Card>
          ) : active ? (
            <NoteEditor
              note={active}
              userCedula={cedula}
              onPatch={patchNote}
              onUnsavedChange={setHasPendingEdits}
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
            />
          ) : (
            <div className="notes-welcome">
              <div className="notes-welcome-icon">✿</div>
              <h1>Aún no tienes apuntes aquí</h1>
              <p>Crea un apunte para empezar a organizar tus ideas.</p>
              <button className="notes-new-button" onClick={() => createNote()}>
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
      {shortcutsOpen ? <NoteShortcutHelpDialog onClose={() => setShortcutsOpen(false)} /> : null}
    </div>
  )
}
