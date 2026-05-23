import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BackButton } from '@/components/navigation/BackButton'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { EnglishFlashcardForm } from '@/features/flashcards/EnglishFlashcardForm'
import { EnglishFlashcardList } from '@/features/flashcards/EnglishFlashcardList'
import { SparkleIcon } from '@/features/flashcards/FlashcardIcons'
import { formStateToInput } from '@/features/flashcards/englishFlashcardFormUtils'
import {
  useBloomoraEnglishFlashcards,
  useEnglishFlashcardMutations,
} from '@/hooks/useBloomoraEnglishFlashcards'
import { messageFromSupabaseError } from '@/lib/supabaseError'
import type { EnglishFlashcard } from '@/types/englishFlashcard'
import { cn } from '@/utils/cn'

type ViewMode = 'list' | 'form'

export function EnglishFlashcardsPage() {
  const { cedula } = useUserPhone()
  const { showToast } = useBloomoraToast()
  const { data: cards = [], isLoading } = useBloomoraEnglishFlashcards(cedula)
  const { insertMut, updateMut, deleteMut } = useEnglishFlashcardMutations(cedula)

  const [view, setView] = useState<ViewMode>('list')
  const [editing, setEditing] = useState<EnglishFlashcard | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<EnglishFlashcard | null>(null)

  const openCreate = () => {
    setEditing(null)
    setView('form')
  }

  const openEdit = (card: EnglishFlashcard) => {
    setEditing(card)
    setView('form')
  }

  const closeForm = () => {
    setEditing(null)
    setView('list')
  }

  const handleSave = (input: ReturnType<typeof formStateToInput>) => {
    if (!cedula) return
    if (editing) {
      updateMut.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => {
            showToast('Flashcard actualizada')
            closeForm()
          },
          onError: (err) =>
            showToast(messageFromSupabaseError(err), { duration: 8000 }),
        },
      )
    } else {
      insertMut.mutate(input, {
        onSuccess: () => {
          showToast('¡Palabra guardada!')
          closeForm()
        },
        onError: (err) =>
          showToast(messageFromSupabaseError(err), { duration: 8000 }),
      })
    }
  }

  const isFormPending = insertMut.isPending || updateMut.isPending

  return (
    <div className="flashcards-page app-shell-padding app-content-fluid mx-auto min-h-dvh bg-[#f8f6fc] pb-16">
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackButton to="/app" label="Volver al inicio" />
        <Link
          to="/app"
          className="text-xs font-semibold text-bloomora-violet hover:text-bloomora-deep sm:text-sm"
        >
          Inicio
        </Link>
      </div>

      {view === 'list' ? (
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-2 text-[clamp(1.75rem,1.4rem+1.5vw,2.35rem)] font-bold leading-tight tracking-tight">
              <span className="text-[#5b21b6]">English</span>
              <span className="text-[#c084fc]">Flashcards</span>
              <SparkleIcon className="text-amber-400" />
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-bloomora-text-muted sm:text-[0.9375rem]">
              Aprende vocabulario en inglés con memoria visual.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className={cn(
              'inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-[0_8px_28px_-6px_rgba(236,72,153,0.45)] transition',
              'bg-gradient-to-r from-[#f687b3] via-[#f9a8d4] to-[#f6ad55] hover:brightness-[1.03] active:scale-[0.99]',
            )}
          >
            <span className="text-lg leading-none" aria-hidden>
              +
            </span>
            Nueva palabra
          </button>
        </header>
      ) : (
        <header>
          <h1 className="text-xl font-bold text-bloomora-deep">
            {editing ? 'Editar palabra' : 'Nueva palabra'}
          </h1>
          <p className="mt-1 text-sm text-bloomora-text-muted">
            Completa los campos y asocia una imagen.
          </p>
        </header>
      )}

      {view === 'form' && cedula ? (
        <div className="mt-6">
          <EnglishFlashcardForm
            cedula={cedula}
            editing={editing}
            isPending={isFormPending}
            onCancel={closeForm}
            onSave={handleSave}
          />
        </div>
      ) : null}

      {view === 'list' ? (
        <div className="mt-8">
          {isLoading ? (
            <p className="text-sm text-bloomora-text-muted">Cargando flashcards…</p>
          ) : (
            <EnglishFlashcardList
              cards={cards}
              search={search}
              categoryFilter={categoryFilter}
              onSearchChange={setSearch}
              onCategoryFilterChange={setCategoryFilter}
              onEdit={openEdit}
              deleteTarget={deleteTarget}
              deletePending={deleteMut.isPending}
              onRequestDelete={setDeleteTarget}
              onCancelDelete={() => setDeleteTarget(null)}
              onConfirmDelete={() => {
                if (!deleteTarget) return
                deleteMut.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    showToast('Flashcard eliminada')
                    setDeleteTarget(null)
                  },
                  onError: () => showToast('No se pudo eliminar.'),
                })
              }}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}
