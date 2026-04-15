import { type FormEvent, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import {
  useAddListMutation,
  useBloomoraLists,
} from '@/hooks/useBloomoraLists'
import { cn } from '@/utils/cn'

const LIST_PREVIEW_ICONS = ['⭐', '💗', '📝'] as const

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

function GridNavIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 5a1 1 0 011-1h4a1 1 0 011v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  )
}

export function ListsCard() {
  const { cedula } = useUserPhone()
  const { data: lists = [], isLoading } = useBloomoraLists(cedula)
  const addListMut = useAddListMutation(cedula)

  const [draftTitle, setDraftTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const count = lists.length
  const countLabel = count === 1 ? '1 lista' : `${count} listas`

  const listIcons = useMemo(() => {
    return lists.map((_, i) => LIST_PREVIEW_ICONS[i % LIST_PREVIEW_ICONS.length])
  }, [lists])

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

  return (
    <DashboardCard className="overflow-hidden rounded-[clamp(1.25rem,1.05rem+1vw,1.75rem)] bg-gradient-to-br from-white via-[#fffafc] to-bloomora-lavender-50/50 p-5 shadow-[0_12px_40px_-18px_rgba(124,107,181,0.18)] ring-1 ring-bloomora-line/30 sm:p-6 sm:shadow-[0_16px_48px_-20px_rgba(124,107,181,0.2)]">
      {/* Cabecera: título + badge | CTA degradado + ver todas */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <h2 className="text-lg font-bold tracking-tight text-bloomora-deep sm:text-xl">
              Tus listas
            </h2>
            <span className="rounded-full bg-white/90 px-3 py-0.5 text-xs font-semibold text-bloomora-violet shadow-sm ring-1 ring-bloomora-lilac/30">
              {countLabel}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-bloomora-text-muted">
            Organiza listas para cualquier cosa
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:items-end">
          <button
            type="button"
            onClick={focusCreateInput}
            className={cn(
              'inline-flex w-full items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_-6px_rgba(232,155,184,0.55)] transition',
              'bg-gradient-to-r from-[#ff9eb3] via-[#e8b4ff] to-[#9b86f0] hover:brightness-[1.04] active:scale-[0.99]',
              'sm:w-auto sm:min-w-[11.5rem]',
            )}
          >
            <span aria-hidden className="text-base leading-none">
              +
            </span>
            Nueva lista
            <span aria-hidden className="text-xs opacity-90">
              ›
            </span>
          </button>
          <Link
            to="/app/lists"
            className="text-center text-xs font-semibold text-bloomora-violet underline-offset-2 transition hover:underline sm:text-right sm:text-sm"
          >
            Ver todas →
          </Link>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-5 text-sm text-bloomora-text-muted">Cargando listas…</p>
      ) : null}

      {!isLoading && count > 0 ? (
        <ul
          className="mt-4 flex flex-wrap gap-2.5 sm:mt-5"
          aria-label="Vista previa de listas"
        >
          {lists.map((list, idx) => (
            <li key={list.id}>
              <Link
                to={`/app/lists?list=${encodeURIComponent(list.id)}`}
                className="inline-flex max-w-[min(100%,18rem)] items-center gap-2 rounded-full border border-bloomora-line/40 bg-white/95 py-2 pl-2.5 pr-3.5 text-sm font-semibold text-bloomora-deep shadow-sm ring-1 ring-white/80 transition hover:border-bloomora-lilac/45 hover:bg-white hover:shadow-md sm:max-w-[16rem]"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bloomora-lavender-50 text-base shadow-inner ring-1 ring-bloomora-line/20"
                  aria-hidden
                >
                  {listIcons[idx]}
                </span>
                <span className="min-w-0 truncate">{list.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : !isLoading ? (
        <p className="mt-4 text-sm text-bloomora-text-muted sm:mt-5">
          No se han creado aún listas. Usa el formulario de abajo para la primera.
        </p>
      ) : null}

      {/* Panel “Crear una nueva lista” con borde degradado */}
      <div className="mt-6 sm:mt-7">
        <div
          className={cn(
            'rounded-[1.35rem] p-[1.5px] shadow-[0_0_32px_-8px_rgba(236,139,184,0.35)]',
            'bg-gradient-to-br from-[#ffb8d0] via-[#dcc8ff] to-[#a89cf0]',
          )}
        >
          <div className="rounded-[1.28rem] bg-[#fffefc]/[0.98] p-4 ring-1 ring-white/90 sm:p-5">
            <h3 className="text-base font-bold tracking-tight text-bloomora-deep">
              Crear una nueva lista
            </h3>
            <form onSubmit={handleSubmit} className="mt-4">
              <div
                className={cn(
                  'flex min-h-[3rem] items-stretch overflow-hidden rounded-full border border-bloomora-line/35 bg-white/95',
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-bloomora-lilac/15',
                )}
              >
                <span className="flex shrink-0 items-center pl-3.5 text-bloomora-violet">
                  <ListBulletIcon className="size-[1.125rem]" />
                </span>
                <input
                  ref={inputRef}
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Ej. Compras, Viaje, Ideas…"
                  className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pr-2 text-sm font-semibold text-bloomora-deep outline-none placeholder:text-bloomora-text-muted/70"
                  aria-label="Nombre de la nueva lista"
                />
                <button
                  type="submit"
                  disabled={!draftTitle.trim() || addListMut.isPending}
                  className={cn(
                    'm-1 shrink-0 rounded-full px-4 py-2 text-xs font-bold text-white shadow-md transition',
                    'bg-gradient-to-r from-[#ff8fab] to-[#f4a8d0] hover:brightness-[1.05] disabled:pointer-events-none disabled:opacity-45',
                  )}
                >
                  {addListMut.isPending ? '…' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-center sm:mt-6">
        <Link
          to="/app/lists"
          className="inline-flex items-center gap-2 text-sm font-semibold text-bloomora-violet transition hover:text-bloomora-deep"
        >
          <GridNavIcon className="shrink-0 opacity-80" />
          <span>Ir a la vista completa de listas</span>
          <span aria-hidden>›</span>
        </Link>
      </div>
    </DashboardCard>
  )
}
