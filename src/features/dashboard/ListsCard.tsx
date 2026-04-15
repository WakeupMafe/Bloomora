import { type FormEvent, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { Button } from '@/components/ui/Button'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import {
  useAddListMutation,
  useBloomoraLists,
} from '@/hooks/useBloomoraLists'
import { cn } from '@/utils/cn'

export function ListsCard() {
  const { cedula } = useUserPhone()
  const { data: lists = [], isLoading } = useBloomoraLists(cedula)
  const addListMut = useAddListMutation(cedula)

  const [expanded, setExpanded] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  const count = lists.length
  const countLabel = count === 1 ? '1 lista' : `${count} listas`

  const openPanel = () => {
    setExpanded(true)
    requestAnimationFrame(() => {
      panelRef.current?.querySelector('input')?.focus()
    })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const t = draftTitle.trim()
    if (!t) return
    addListMut.mutate(t)
    setDraftTitle('')
  }

  return (
    <DashboardCard className="bg-gradient-to-br from-bloomora-white via-bloomora-blush/25 to-bloomora-mist/40 p-4 shadow-[0_8px_28px_rgba(91,74,140,0.07)] ring-1 ring-bloomora-line/25 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="text-lg font-bold tracking-tight text-bloomora-deep sm:text-xl">
              Tus listas
            </h2>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-bloomora-violet ring-1 ring-bloomora-line/35 transition hover:bg-white hover:ring-bloomora-lilac/35"
              aria-expanded={expanded}
            >
              {countLabel}
            </button>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-bloomora-text-muted">
            Organiza listas para cualquier cosa
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-end lg:gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={openPanel}>
            Crear lista
          </Button>
          <Link
            to="/app/lists"
            className="text-xs font-semibold text-bloomora-violet underline-offset-2 hover:underline"
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
          className="mt-4 flex flex-wrap gap-2 sm:mt-5"
          aria-label="Vista previa de listas"
        >
          {lists.map((list) => (
            <li key={list.id}>
              <span className="inline-flex max-w-[min(100%,16rem)] items-center gap-1.5 rounded-full bg-white/90 py-1.5 pl-2 pr-3 text-sm font-medium text-bloomora-deep shadow-sm ring-1 ring-bloomora-line/30 sm:max-w-[14rem]">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-violet-100 text-[0.75rem]"
                  aria-hidden
                >
                  🌷
                </span>
                <span className="min-w-0 truncate">{list.title}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : !isLoading ? (
        <p className="mt-5 text-sm text-bloomora-text-muted">
          No se han creado aún listas.
        </p>
      ) : null}

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div ref={panelRef} className="pt-5">
            <div className="rounded-[18px] bg-white/80 p-4 ring-1 ring-bloomora-line/25 sm:p-5">
              <h3 className="text-sm font-bold text-bloomora-deep">Nueva lista</h3>
              <form
                onSubmit={handleSubmit}
                className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <label className="min-w-0 flex-1 text-xs font-medium text-bloomora-text-muted">
                  Nombre
                  <input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Ej. Compras, Viaje, Ideas…"
                    className="mt-1 w-full rounded-xl border border-bloomora-line/50 bg-bloomora-white px-3 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/25 focus:ring-2"
                  />
                </label>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!draftTitle.trim() || addListMut.isPending}
                >
                  Añadir
                </Button>
              </form>
              {count > 0 ? (
                <p className="mt-3 text-xs text-bloomora-text-muted">
                  Gestiona todo en la{' '}
                  <Link
                    to="/app/lists"
                    className="font-semibold text-bloomora-violet hover:underline"
                  >
                    vista completa de listas
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {count === 0 && !expanded ? (
        <div className="mt-4">
          <Button type="button" variant="primary" size="sm" onClick={openPanel}>
            Crea una lista
          </Button>
        </div>
      ) : null}
    </DashboardCard>
  )
}
