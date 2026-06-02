import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BackButton } from '@/components/navigation/BackButton'
import { Card } from '@/components/ui/Card'
import { buttonClassName } from '@/components/ui/buttonRecipe'
import { bloomoraPanelCardClass } from '@/components/ui/formControls'
import { useBloomoraAlert } from '@/contexts/BloomoraAlertContext'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { NoteEditor } from '@/features/notes/NoteEditor'
import {
  createDraftEnglishNote,
  englishNoteToInput,
  isDraftNoteId,
  mergeEnglishNotePatch,
} from '@/features/notes/noteDraftUtils'
import { NotesList } from '@/features/notes/NotesList'
import {
  useBloomoraEnglishNotes,
  useEnglishNoteDetail,
  useEnglishNoteMutations,
} from '@/hooks/useBloomoraEnglishNotes'
import { messageFromSupabaseError } from '@/lib/supabaseError'
import { getSupabaseBrowserClient } from '@/services/supabase/client'
import type { EnglishNote, EnglishNoteInput } from '@/types/englishNote'
import { cn } from '@/utils/cn'

type NotePatch = Partial<EnglishNoteInput>

export function EnglishNotesPage() {
  const { cedula } = useUserPhone()
  const { showToast } = useBloomoraToast()
  const { confirm } = useBloomoraAlert()
  const supabaseReady = !!getSupabaseBrowserClient()

  const { data: notes = [], isLoading, isError, error } = useBloomoraEnglishNotes(cedula)
  const { insertMut, updateMut, deleteMut } = useEnglishNoteMutations(cedula)

  const [draftNote, setDraftNote] = useState<EnglishNote | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const detailNoteId =
    activeId && !isDraftNoteId(activeId) ? activeId : null
  const {
    data: activeDetail,
    isFetching: isActiveDetailLoading,
  } = useEnglishNoteDetail(cedula, detailNoteId)

  const visibleNotes = useMemo(() => {
    if (!draftNote) return notes
    return [draftNote, ...notes]
  }, [notes, draftNote])

  const active = useMemo(() => {
    if (!activeId) return null
    if (draftNote?.id === activeId) return draftNote
    const summary = visibleNotes.find((n) => n.id === activeId)
    if (!summary) return null
    if (activeDetail?.id === activeId) return activeDetail
    return summary
  }, [activeId, activeDetail, draftNote, visibleNotes])

  useEffect(() => {
    if (visibleNotes.length === 0) {
      setActiveId(null)
      return
    }
    setActiveId((curr) => {
      if (curr && visibleNotes.some((n) => n.id === curr)) return curr
      return visibleNotes[0]?.id ?? null
    })
  }, [notes, draftNote])

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

  const createNote = () => {
    if (!cedula) return
    const draft = createDraftEnglishNote(cedula)
    setDraftNote(draft)
    setActiveId(draft.id)
  }

  const deleteNote = async (id: string) => {
    if (isDraftNoteId(id)) {
      setDraftNote(null)
      setActiveId(notes[0]?.id ?? null)
      return
    }
    if (!cedula) return
    const ok = await confirm({
      title: '¿Eliminar este apunte?',
      confirmLabel: 'Eliminar',
      tone: 'danger',
    })
    if (!ok) return
    deleteMut.mutate(id, {
      onSuccess: () => {
        showToast('Apunte eliminado')
      },
      onError: (err) => showToast(messageFromSupabaseError(err), { duration: 8000 }),
    })
  }

  return (
    <div className="english-notes-shell app-shell-padding mx-auto min-h-dvh bg-bloomora-snow pb-16">
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackButton to="/app" label="Volver al inicio" />
        <div className="flex items-center gap-2">
          <Link
            to="/app/study-tools"
            className={buttonClassName({ variant: 'ghost', size: 'sm' })}
          >
            Herramientas
          </Link>
          <Link
            to="/app"
            className={buttonClassName({ variant: 'ghost', size: 'sm' })}
          >
            Inicio
          </Link>
        </div>
      </div>

      <header className="mb-6">
        <h1 className="text-[clamp(1.4rem,1.1rem+1.2vw,2rem)] font-bold text-bloomora-deep">
          Apuntes
        </h1>
      </header>

      {!cedula ? (
        <Card variant="glass" className={cn(bloomoraPanelCardClass, 'text-sm text-bloomora-text-muted')}>
          Necesitas iniciar sesion para guardar apuntes.
        </Card>
      ) : !supabaseReady ? (
        <Card variant="glass" className={cn(bloomoraPanelCardClass, 'text-sm text-bloomora-text-muted')}>
          Supabase no esta configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo
          .env.local y reinicia la app.
        </Card>
      ) : isError ? (
        <Card variant="glass" className={cn(bloomoraPanelCardClass, 'text-sm text-red-600')}>
          {messageFromSupabaseError(error)}
          <p className="mt-2 text-bloomora-text-muted">
            La tabla <strong className="font-semibold text-bloomora-deep">english_notes</strong> en
            Supabase está incompleta. En SQL Editor ejecuta{' '}
            <code className="rounded bg-bloomora-snow px-1 py-0.5 text-xs">
              supabase/migrations/20260528_fix_english_notes.sql
            </code>
            , luego en Project Settings → API pulsa <strong>Reload schema</strong> y recarga
            Bloomora.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5">
          <NotesList
            notes={visibleNotes}
            activeId={activeId}
            onSelect={setActiveId}
            onCreate={createNote}
            onDelete={deleteNote}
            isLoading={isLoading}
          />
          <NoteEditor
            note={active}
            userCedula={cedula}
            onPatch={patchNote}
            isNotesLoading={isLoading}
            isNoteContentLoading={
              !!detailNoteId && isActiveDetailLoading && !activeDetail
            }
            hasSavedNotes={notes.length > 0}
            isDraft={active ? isDraftNoteId(active.id) : false}
          />
        </div>
      )}
    </div>
  )
}
