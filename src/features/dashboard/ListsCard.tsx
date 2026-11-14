import { Link } from 'react-router-dom'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { useBloomoraAlert } from '@/contexts/BloomoraAlertContext'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useListGadgets } from '@/contexts/ListGadgetsContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { useBloomoraLists } from '@/hooks/useBloomoraLists'
import { useDeleteListMutation } from '@/hooks/useBloomoraListItems'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/utils/cn'

const LIST_IDEAS = [
  { emoji: '✈️', label: 'Viaje' },
  { emoji: '📖', label: 'Lecturas' },
  { emoji: '🎁', label: 'Regalos' },
  { emoji: '🍳', label: 'Recetas' },
] as const

const LIST_ICONS = ['🛒', '📝', '✨', '📦'] as const

export function ListsCard() {
  const { cedula } = useUserPhone()
  const { data: lists = [], isLoading } = useBloomoraLists(cedula)
  const deleteListMut = useDeleteListMutation(cedula)
  const { confirm } = useBloomoraAlert()
  const { showToast } = useBloomoraToast()
  const { openListGadget, closeListGadget, isListGadgetOpen } = useListGadgets()
  const canUseGadgets = useMediaQuery('(min-width: 768px)')

  const count = lists.length

  const handleDeleteList = async (listId: string, title: string) => {
    const confirmed = await confirm({
      title: `¿Eliminar la lista “${title}” y sus elementos?`,
      confirmLabel: 'Eliminar',
      tone: 'danger',
    })
    if (!confirmed) return
    deleteListMut.mutate(listId, {
      onError: (error) =>
        showToast(
          error instanceof Error ? error.message : 'No se pudo eliminar la lista.',
        ),
      onSuccess: () => {
        closeListGadget(listId)
        showToast('Lista eliminada.')
      },
    })
  }

  return (
    <DashboardCard
      className={cn(
        'flex h-full min-h-0 flex-col gap-4 self-stretch bg-bloomora-white',
        'p-5 max-[599px]:p-5 min-[600px]:p-7',
      )}
    >
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-bloomora-deep min-[1024px]:text-[1.375rem]">
              Tus listas
            </h2>
            <span className="inline-flex min-h-[1.625rem] min-w-[1.625rem] items-center justify-center rounded-pill bg-bloomora-blush px-2 text-sm font-bold text-bloomora-rose-deep">
              {isLoading ? '…' : count}
            </span>
          </div>
          <p className="mt-0.5 text-[0.9375rem] text-bloomora-violet">
            Organiza listas para cualquier cosa
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/app/lists"
            className="inline-flex min-h-11 items-center justify-center rounded-pill border-2 border-bloomora-line bg-bloomora-white px-[1.125rem] text-[0.9375rem] font-bold text-bloomora-violet transition hover:bg-bloomora-mist/70"
          >
            Ver todas
          </Link>
          <Link
            to="/app/lists?crear=1"
            className="inline-flex min-h-11 items-center justify-center rounded-pill bg-bloomora-rose-deep px-[1.125rem] text-[0.9375rem] font-bold text-white shadow-[0_4px_12px_rgba(232,155,184,0.35)] transition hover:bg-bloomora-rose-deep/90"
          >
            + Nueva
          </Link>
        </div>
      </header>

      {isLoading ? (
        <p className="shrink-0 text-sm text-bloomora-text-muted">
          Cargando listas…
        </p>
      ) : null}

      {!isLoading && count > 0 ? (
        <ul
          className="grid min-h-0 flex-1 grid-cols-1 content-start gap-3 overflow-y-auto overscroll-contain pr-1"
          aria-label="Vista previa de listas"
        >
          {lists.map((list, idx) => {
            const gadgetOpen = isListGadgetOpen(list.id)
            return (
              <li
                key={list.id}
                className="group flex min-w-0 items-center gap-1 rounded-[1.125rem] border border-bloomora-line bg-bloomora-white pr-1"
              >
                <Link
                  to={`/app/lists?list=${encodeURIComponent(list.id)}`}
                  className="group flex min-h-[4.25rem] min-w-0 flex-1 items-center gap-3.5 rounded-[1.125rem] px-4 py-3 text-left transition-colors hover:bg-bloomora-mist/40"
                >
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-[0.875rem] bg-bloomora-mist text-xl"
                    aria-hidden
                  >
                    {LIST_ICONS[idx % LIST_ICONS.length]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-bold text-bloomora-deep">
                      {list.title}
                    </span>
                  </span>
                  {canUseGadgets ? (
                    <span
                      className={cn(
                        'hidden shrink-0 rounded-pill bg-bloomora-mist px-3 py-1.5 text-[0.8125rem] font-semibold text-bloomora-violet min-[600px]:inline-flex',
                        gadgetOpen && 'bg-bloomora-sky/70',
                      )}
                    >
                      📝 Post-it
                    </span>
                  ) : null}
                  <span
                    className="text-2xl leading-none text-bloomora-text-muted"
                    aria-hidden
                  >
                    ›
                  </span>
                </Link>
                {canUseGadgets ? (
                  <button
                    type="button"
                    aria-label={
                      gadgetOpen
                        ? `Lista ${list.title} ya está en post-it`
                        : `Abrir ${list.title} como post-it`
                    }
                    title={gadgetOpen ? 'Ya está en pantalla' : 'Abrir como post-it'}
                    disabled={gadgetOpen}
                    onClick={() => {
                      openListGadget(list.id)
                      showToast(
                        gadgetOpen
                          ? 'Esta lista ya está abierta como post-it.'
                          : `«${list.title}» abierta como post-it.`,
                      )
                    }}
                    className={cn(
                      'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bloomora-sky-deep/50 min-[600px]:hidden',
                      gadgetOpen
                        ? 'bg-bloomora-sky/80 text-bloomora-violet ring-1 ring-bloomora-sky-deep/45'
                        : 'bg-bloomora-sky/45 text-bloomora-violet ring-1 ring-bloomora-sky-deep/35 hover:bg-bloomora-sky/70',
                    )}
                  >
                    Post-it
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label={`Eliminar lista ${list.title}`}
                  title="Eliminar lista"
                  disabled={deleteListMut.isPending}
                  onClick={() => void handleDeleteList(list.id, list.title)}
                  className="grid size-11 shrink-0 place-items-center rounded-full text-bloomora-text-muted opacity-60 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      ) : !isLoading ? (
        <div className="flex min-h-[5rem] flex-1 items-center rounded-[1.125rem] border border-dashed border-bloomora-line px-4">
          <p className="text-sm text-bloomora-violet">
            Aún no tienes listas. Usa{' '}
            <span className="font-semibold">+ Nueva</span> o una idea de abajo.
          </p>
        </div>
      ) : null}

      <div className="mt-auto rounded-[1.125rem] border-2 border-dashed border-bloomora-line p-4">
        <p className="text-sm font-semibold text-bloomora-violet">
          Ideas para tu próxima lista
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {LIST_IDEAS.map((idea) => (
            <Link
              key={idea.label}
              to="/app/lists?crear=1"
              className="inline-flex min-h-10 items-center rounded-pill bg-bloomora-mist px-3.5 text-sm font-semibold text-bloomora-deep transition hover:bg-bloomora-lavender-50"
            >
              <span aria-hidden className="mr-1.5">
                {idea.emoji}
              </span>
              {idea.label}
            </Link>
          ))}
        </div>
      </div>
    </DashboardCard>
  )
}
