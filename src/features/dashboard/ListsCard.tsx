import { type FormEvent, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { useBloomoraAlert } from '@/contexts/BloomoraAlertContext'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import {
  useAddListMutation,
  useBloomoraLists,
} from '@/hooks/useBloomoraLists'
import { cn } from '@/utils/cn'
import { useDeleteListMutation } from '@/hooks/useBloomoraListItems'

function ListBulletIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ListsCard() {
  const { cedula } = useUserPhone()
  const { data: lists = [], isLoading } = useBloomoraLists(cedula)
  const addListMut = useAddListMutation(cedula)
  const deleteListMut = useDeleteListMutation(cedula)
  const { confirm } = useBloomoraAlert()
  const { showToast } = useBloomoraToast()

  const [draftTitle, setDraftTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const count = lists.length
  const countLabel = count === 1 ? '1 lista' : `${count} listas`

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const t = draftTitle.trim()
    if (!t) return
    addListMut.mutate(t)
    setDraftTitle('')
  }

  const focusCreateInput = () => {
    inputRef.current?.focus({ preventScroll: false })
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const handleDeleteList = async (listId: string, title: string) => {
    const confirmed = await confirm({
      title: `¿Eliminar la lista “${title}” y sus elementos?`,
      confirmLabel: 'Eliminar',
      tone: 'danger',
    })
    if (!confirmed) return
    deleteListMut.mutate(listId, {
      onError: (error) => showToast(error instanceof Error ? error.message : 'No se pudo eliminar la lista.'),
      onSuccess: () => showToast('Lista eliminada.'),
    })
  }

  return (
    <DashboardCard
      className={cn(
        '!grid h-full min-h-0 self-stretch overflow-hidden border border-bloomora-line/50 bg-white',
        'rounded-[clamp(1.25rem,1.05rem+1vw,1.75rem)]',
        'p-[clamp(1rem,0.75rem+0.85vw,1.5rem)]',
        'shadow-[0_5px_18px_rgba(91,74,140,0.06)] ring-0',
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-lg font-bold tracking-tight text-bloomora-deep">Tus listas</h2>
          <span className="rounded-full bg-bloomora-lavender-50 px-2.5 py-1 text-[0.68rem] font-semibold text-bloomora-violet ring-1 ring-bloomora-line/30">
            {isLoading ? '…' : countLabel}
          </span>
        </div>
        <p className="order-3 w-full text-xs text-bloomora-text-muted">
          Organiza listas para cualquier cosa
        </p>
        <div className="order-2 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={focusCreateInput}
            className="text-xs"
          >
            <span aria-hidden className="text-base leading-none">
              +
            </span>
            Nueva lista
          </Button>
          <ButtonLink to="/app/lists" variant="primary" size="sm" className="gap-1 text-xs">
            Ver todas
            <span aria-hidden className="text-xs opacity-90">
              ›
            </span>
          </ButtonLink>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-bloomora-text-muted">Cargando listas…</p>
      ) : null}

      {!isLoading && count > 0 ? (
        <ul className="grid max-h-[14rem] grid-cols-1 gap-2 overflow-y-auto pr-1" aria-label="Vista previa de listas">
          {lists.map((list, idx) => (
            <li key={list.id} className="group flex min-w-0 items-center gap-1 rounded-xl border border-bloomora-line/45 bg-white pr-1">
              <Link
                to={`/app/lists?list=${encodeURIComponent(list.id)}`}
                className="group flex min-h-10 min-w-0 flex-1 items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-semibold text-bloomora-deep transition-colors hover:bg-bloomora-lavender-50/35"
              >
                <span className={cn('size-2.5 shrink-0 rounded-full', ['bg-violet-300', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400'][idx % 4])} aria-hidden>
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {list.title}
                </span>
                <span className="text-bloomora-text-muted transition-transform group-hover:translate-x-0.5" aria-hidden>›</span>
              </Link>
              <button
                type="button"
                aria-label={`Eliminar lista ${list.title}`}
                title="Eliminar lista"
                disabled={deleteListMut.isPending}
                onClick={() => void handleDeleteList(list.id, list.title)}
                className="grid size-9 shrink-0 place-items-center rounded-full text-bloomora-text-muted opacity-60 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : !isLoading ? (
        <p className="rounded-xl border border-dashed border-bloomora-line/70 px-4 py-5 text-sm text-bloomora-text-muted">
          No se han creado aún listas. Usa el formulario de abajo para la primera.
        </p>
      ) : null}

      <div
        className="rounded-2xl border border-bloomora-line/45 bg-bloomora-snow/70 p-3"
      >
        <div
          className={cn(
            'grid gap-2',
          )}
        >
          <h3 className="text-sm font-bold text-bloomora-deep">
            Crear una nueva lista
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="flex min-h-10 items-center overflow-hidden rounded-full border border-bloomora-line/50 bg-white">
              <span className="pl-3 text-bloomora-violet">
                <ListBulletIcon className="size-[clamp(1rem,0.9rem+0.25vw,1.125rem)]" />
              </span>
              <input
                ref={inputRef}
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Ej. Compras, Viaje, Ideas…"
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs text-bloomora-deep outline-none placeholder:text-bloomora-text-muted/60"
                aria-label="Nombre de la nueva lista"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!draftTitle.trim() || addListMut.isPending}
                className="m-1 !min-h-8 px-4 text-xs"
              >
                {addListMut.isPending ? '…' : 'Añadir'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <ButtonLink to="/app/lists" variant="ghost" size="sm" className="justify-self-center text-xs">
        Ver todas las listas <span aria-hidden>›</span>
      </ButtonLink>
    </DashboardCard>
  )
}
