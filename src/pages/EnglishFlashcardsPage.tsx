import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BackButton } from '@/components/navigation/BackButton'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { EnglishFlashcardForm } from '@/features/flashcards/EnglishFlashcardForm'
import { EnglishFlashcardList } from '@/features/flashcards/EnglishFlashcardList'
import { EnglishFlashcardQuickForm } from '@/features/flashcards/EnglishFlashcardQuickForm'
import { FlashcardCreateModeBar } from '@/features/flashcards/FlashcardCreateModeBar'
import { DownloadIcon, SparkleIcon } from '@/features/flashcards/FlashcardIcons'
import { exportFlashcardsPdf } from '@/features/flashcards/flashcardPdfExport'
import {
  evaluateQuickFlashcardQuota,
  isQuickFlashcardComplete,
  isQuickFlashcardDraft,
  quickQuotaMessage,
  type FlashcardCreateMode,
} from '@/features/flashcards/flashcardQuickMode'
import { useBloomoraAlert } from '@/contexts/BloomoraAlertContext'
import {
  useBloomoraEnglishFlashcards,
  useEnglishFlashcardMutations,
} from '@/hooks/useBloomoraEnglishFlashcards'
import { messageFromSupabaseError } from '@/lib/supabaseError'
import type { EnglishFlashcard, EnglishFlashcardInput } from '@/types/englishFlashcard'

type ViewMode = 'list' | 'form'

export function EnglishFlashcardsPage() {
  const { cedula } = useUserPhone()
  const { showToast } = useBloomoraToast()
  const { alert: showAlert } = useBloomoraAlert()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: cards = [], isLoading } = useBloomoraEnglishFlashcards(cedula)
  const { insertMut, updateMut, deleteMut } = useEnglishFlashcardMutations(cedula)

  const [view, setView] = useState<ViewMode>('list')
  const [createMode, setCreateMode] = useState<FlashcardCreateMode>('full')
  const [editing, setEditing] = useState<EnglishFlashcard | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<EnglishFlashcard | null>(null)
  const [autoReviewCategory, setAutoReviewCategory] = useState<string | null>(null)

  const quickQuota = useMemo(() => evaluateQuickFlashcardQuota(cards), [cards])
  const pendingQuickCards = useMemo(
    () => cards.filter((c) => isQuickFlashcardDraft(c) && !isQuickFlashcardComplete(c)),
    [cards],
  )

  useEffect(() => {
    if (isLoading || searchParams.get('crear') !== 'rapido') return
    setSearchParams({}, { replace: true })
    void (async () => {
      const quota = evaluateQuickFlashcardQuota(cards)
      if (!quota.canCreate) {
        await showAlert({
          title: 'Modo rápido no disponible',
          description: quickQuotaMessage(quota),
        })
        return
      }
      setCreateMode('quick')
      setEditing(null)
      setView('form')
    })()
  }, [cards, isLoading, searchParams, setSearchParams, showAlert])

  useEffect(() => {
    if (isLoading) return
    const repasar = searchParams.get('repasar')
    if (!repasar) return
    setSearchParams({}, { replace: true })
    setCategoryFilter(repasar)
    setAutoReviewCategory(repasar)
  }, [isLoading, searchParams, setSearchParams])

  const tryOpenCreate = async (mode: FlashcardCreateMode) => {
    if (mode === 'quick') {
      const quota = evaluateQuickFlashcardQuota(cards)
      if (!quota.canCreate) {
        await showAlert({
          title: 'Modo rápido no disponible',
          description: quickQuotaMessage(quota),
        })
        return
      }
    }
    setCreateMode(mode)
    setEditing(null)
    setView('form')
  }

  const openEdit = (card: EnglishFlashcard) => {
    setEditing(card)
    setCreateMode('full')
    setView('form')
  }

  const closeForm = () => {
    setEditing(null)
    setView('list')
  }

  const handleSave = (input: EnglishFlashcardInput) => {
    if (!cedula) return
    if (editing) {
      updateMut.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => {
            const completed = editing.isQuickDraft && !input.isQuickDraft
            showToast(
              completed ? 'Tarjeta rápida completada' : 'Flashcard actualizada',
            )
            closeForm()
          },
          onError: (err) =>
            showToast(messageFromSupabaseError(err), { duration: 8000 }),
        },
      )
    } else {
      insertMut.mutate(input, {
        onSuccess: () => {
          showToast(
            input.entryMode === 'quick'
              ? 'Palabra guardada en modo rápido'
              : '¡Palabra guardada!',
          )
          closeForm()
        },
        onError: (err) =>
          showToast(messageFromSupabaseError(err), { duration: 8000 }),
      })
    }
  }

  const isFormPending = insertMut.isPending || updateMut.isPending

  const handleExportPdf = async () => {
    if (!cards.length) {
      await showAlert({
        title: 'Sin flashcards',
        description: 'Añade al menos una palabra para generar el listado en PDF.',
      })
      return
    }
    const ok = await exportFlashcardsPdf(cards, () => {
      showToast('En la ventana de impresión elige Guardar como PDF.')
    })
    if (!ok) {
      showToast('No se pudo abrir la ventana de impresión. Revisa el bloqueador de ventanas emergentes.')
    }
  }

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
              Aprende vocabulario en inglés con memoria visual. Usa{' '}
              <strong className="font-semibold text-bloomora-violet">Modo rápido</strong>{' '}
              para anotar palabra y significado (hasta 6 al día).
            </p>
            <button
              type="button"
              onClick={() => void handleExportPdf()}
              disabled={isLoading || cards.length === 0}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-bloomora-violet ring-1 ring-bloomora-violet/25 transition hover:bg-bloomora-lavender-50/80 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <DownloadIcon className="size-4" />
              Descargar PDF
            </button>
          </div>
          <FlashcardCreateModeBar
            mode={createMode}
            onModeChange={setCreateMode}
            quickQuota={quickQuota}
            onCreateFull={() => void tryOpenCreate('full')}
            onCreateQuick={() => void tryOpenCreate('quick')}
            layout="stack"
          />
        </header>
      ) : (
        <header>
          <h1 className="text-xl font-bold text-bloomora-deep">
            {editing
              ? editing.isQuickDraft
                ? 'Completar tarjeta rápida'
                : 'Editar palabra'
              : createMode === 'quick'
                ? 'Nueva tarjeta rápida'
                : 'Nueva palabra'}
          </h1>
          <p className="mt-1 text-sm text-bloomora-text-muted">
            {editing?.isQuickDraft
              ? 'Añade imagen y ejemplos para finalizar.'
              : createMode === 'quick'
                ? 'Solo palabra y significado por ahora.'
                : 'Completa los campos y asocia una imagen.'}
          </p>
        </header>
      )}

      {view === 'form' && cedula ? (
        <div className="mt-6">
          {!editing && createMode === 'quick' ? (
            <EnglishFlashcardQuickForm
              isPending={isFormPending}
              remainingToday={
                quickQuota.canCreate ? quickQuota.remaining : 0
              }
              onCancel={closeForm}
              onSave={handleSave}
            />
          ) : (
            <EnglishFlashcardForm
              cedula={cedula}
              editing={editing}
              isPending={isFormPending}
              onCancel={closeForm}
              onSave={handleSave}
            />
          )}
        </div>
      ) : null}

      {view === 'list' ? (
        <div className="mt-8 space-y-4">
          {pendingQuickCards.length > 0 ? (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 ring-1 ring-amber-100">
              <p className="text-sm font-semibold text-amber-950">
                {pendingQuickCards.length} tarjeta(s) rápida(s) sin completar
              </p>
              <p className="mt-1 text-xs text-amber-900/85">
                Puedes seguir añadiendo en modo rápido hasta {quickQuota.limit} al día
                {quickQuota.canCreate ? (
                  <>
                    {' '}
                    ({quickQuota.remaining} restante{quickQuota.remaining === 1 ? '' : 's'}).
                  </>
                ) : (
                  '.'
                )}{' '}
                Edítalas cuando quieras para añadir imagen y ejemplos.
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {pendingQuickCards.slice(0, 6).map((card) => (
                  <li key={card.id}>
                    <button
                      type="button"
                      onClick={() => openEdit(card)}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-950 ring-1 ring-amber-200/80 hover:bg-amber-100/80"
                    >
                      {card.englishWord || 'Sin título'} → completar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {isLoading ? (
            <p className="text-sm text-bloomora-text-muted">Cargando flashcards…</p>
          ) : (
            <EnglishFlashcardList
              cards={cards}
              search={search}
              categoryFilter={categoryFilter}
              autoReviewCategory={autoReviewCategory}
              onAutoReviewHandled={() => setAutoReviewCategory(null)}
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
