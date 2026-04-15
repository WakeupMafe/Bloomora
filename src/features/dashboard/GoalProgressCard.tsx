import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type MockGoalRow } from '@/data/dashboardMock'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { GoalActionsMenu } from '@/features/dashboard/GoalActionsMenu'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import {
  useBloomoraGoals,
  useDeleteGoalMutation,
} from '@/hooks/useBloomoraGoals'
import { cn } from '@/utils/cn'

function averagePercent(goals: MockGoalRow[]): number {
  if (goals.length === 0) return 0
  const sum = goals.reduce((acc, g) => acc + g.percent, 0)
  return sum / goals.length
}

const accentBar: Record<MockGoalRow['accent'], string> = {
  lavender: 'bg-bloomora-lilac/80',
  green: 'bg-emerald-400/85',
  sky: 'bg-sky-400/80',
}

const accentCheck: Record<MockGoalRow['accent'], string> = {
  lavender: 'text-bloomora-lilac/90',
  green: 'text-emerald-600/90',
  sky: 'text-sky-600/90',
}

const ringIndicator: Record<MockGoalRow['accent'], string> = {
  lavender: 'text-bloomora-lilac',
  green: 'text-emerald-400',
  sky: 'text-sky-400',
}

const ringTrack: Record<MockGoalRow['accent'], string> = {
  lavender: 'text-bloomora-lavender-100',
  green: 'text-emerald-100',
  sky: 'text-sky-100',
}

const ringValueText: Record<MockGoalRow['accent'], string> = {
  lavender: 'text-bloomora-deep',
  green: 'text-emerald-700',
  sky: 'text-sky-800',
}

/** Línea bajo el anillo: etiqueta explícita o resumen según tipo de meta. */
function goalProgressDetailLine(goal: MockGoalRow): string {
  const trimmed = goal.label?.trim()
  if (trimmed) return trimmed
  switch (goal.variant) {
    case 'days':
      return `${Math.round(goal.percent)}% de la meta por días`
    case 'pages':
      return `${Math.round(goal.percent)}% de la meta por páginas`
    default:
      return `${Math.round(goal.percent)}% de avance en el mes`
  }
}

function GoalRowBar({
  goal,
  selected,
  onSelect,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onDelete,
  onEdit,
}: {
  goal: MockGoalRow
  selected: boolean
  onSelect: () => void
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  return (
    <div
      className={cn(
        'flex w-full min-w-0 max-w-full overflow-hidden rounded-[14px] ring-1 transition-[box-shadow,background-color,ring-color] duration-200',
        selected
          ? 'bg-white/92 ring-2 ring-bloomora-lilac/55 shadow-[0_0_0_1px_rgba(124,107,181,0.12),0_8px_28px_-6px_rgba(124,107,181,0.35)]'
          : 'bg-white/35 ring-bloomora-line/15 hover:bg-white/55',
      )}
      data-selected={selected ? 'true' : undefined}
    >
      <div
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        aria-label={`Meta: ${goal.title}. Pulsa para ver su progreso en el anillo.`}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect()
          }
        }}
        className="flex min-h-[4.5rem] min-w-0 flex-1 cursor-pointer flex-row rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-bloomora-lilac/60 focus-visible:ring-offset-1"
      >
        <span
          className={cn(
            'shrink-0 self-stretch rounded-l-[13px] transition-[width] duration-200',
            selected
              ? 'w-1 bg-gradient-to-b from-bloomora-lilac via-bloomora-violet to-bloomora-lilac'
              : 'w-0',
          )}
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-2.5 py-3 sm:px-3 sm:py-3.5">
          <div className="min-w-0">
            <h3 className="truncate text-[0.9375rem] font-semibold leading-snug tracking-tight text-bloomora-deep sm:text-base">
              {goal.title}
            </h3>
            {goal.label ? (
              <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-medium text-bloomora-text-muted sm:text-[13px]">
                {goal.variant !== 'bar' ? (
                  <span
                    className={cn(
                      'shrink-0 text-sm leading-none',
                      accentCheck[goal.accent],
                    )}
                    aria-hidden
                  >
                    ✓
                  </span>
                ) : null}
                <span className="min-w-0 truncate">{goal.label}</span>
              </p>
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="h-1.5 overflow-hidden rounded-full bg-bloomora-lavender-50/90 ring-1 ring-bloomora-line/20">
              <div
                className={cn(
                  'pointer-events-none h-full rounded-full transition-[width] duration-500',
                  accentBar[goal.accent],
                )}
                style={{ width: `${goal.percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 justify-end self-start px-1.5 pb-2 pt-2.5 sm:px-2 sm:pb-2.5 sm:pt-3">
        <GoalActionsMenu
          goalTitle={goal.title}
          open={menuOpen}
          onClose={onCloseMenu}
          onTriggerClick={onToggleMenu}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}

type GoalProgressCardProps = {
  className?: string
}

export function GoalProgressCard({ className }: GoalProgressCardProps) {
  const navigate = useNavigate()
  const { cedula } = useUserPhone()
  const { data: goals = [], isLoading } = useBloomoraGoals(cedula)
  const deleteGoalMut = useDeleteGoalMutation(cedula)
  const overallPercent = averagePercent(goals)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [menuGoalId, setMenuGoalId] = useState<string | null>(null)

  const closeGoalMenu = () => setMenuGoalId(null)

  const selected = selectedId
    ? goals.find((g) => g.id === selectedId)
    : null
  const ringValue = selected ? selected.percent : overallPercent
  const accent = selected?.accent ?? 'lavender'

  const handleDelete = (id: string) => {
    if (!window.confirm('¿Borrar esta meta por completo?')) return
    deleteGoalMut.mutate(id)
    setMenuGoalId(null)
    if (selectedId === id) setSelectedId(null)
  }

  const handleEdit = (id: string) => {
    setMenuGoalId(null)
    navigate(`/app/goals/${id}/tracker`)
  }

  return (
    <DashboardCard
      className={cn(
        'min-h-0 min-w-0 max-w-full bg-gradient-to-br from-bloomora-white from-0% via-bloomora-lilac/[0.045] via-[48%] to-bloomora-mist to-100% p-5 sm:p-6',
        className,
      )}
    >
      <header className="flex min-w-0 shrink-0 flex-wrap items-start justify-between gap-3 border-b border-bloomora-line/15 pb-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-bloomora-deep sm:text-xl">
            Tus metas
          </h2>
          <p className="mt-0.5 text-xs text-bloomora-text-muted sm:text-sm">
            Progreso del mes
          </p>
        </div>
        <div className="flex min-w-0 shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Link
            to="/app/goals/new"
            className="text-xs font-semibold text-bloomora-violet underline-offset-2 hover:underline sm:text-sm"
          >
            Nueva meta
          </Link>
          <Link
            to="/app/goals/overview"
            className="text-xs font-semibold text-bloomora-violet/90 underline-offset-2 hover:underline sm:text-sm"
          >
            Calendarios
          </Link>
        </div>
      </header>

      <div className="mt-5 grid min-w-0 w-full max-w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(11rem,17.5rem)_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[minmax(13rem,21.25rem)_minmax(0,1fr)] xl:gap-10">
        <div className="flex w-full min-w-0 max-w-full flex-col items-center overflow-x-clip text-center lg:max-w-full lg:justify-self-center">
          {isLoading ? (
            <p className="py-6 text-sm text-bloomora-text-muted">
              Cargando metas…
            </p>
          ) : null}
          {!isLoading && selected ? (
            <>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-bloomora-text-muted">
                Meta seleccionada
              </p>
              <h3 className="mt-1.5 line-clamp-2 min-h-0 w-full max-w-[15rem] px-1 text-base font-bold leading-snug tracking-tight text-bloomora-deep sm:text-lg lg:max-w-[18rem]">
                {selected.title}
              </h3>
              <p className="mt-1 text-xs text-bloomora-text-muted sm:text-[13px]">
                Progreso actual de esta meta
              </p>
              <ProgressRing
                value={ringValue}
                size={140}
                strokeWidth={11}
                className="mx-auto mt-3 max-w-full shrink-0 drop-shadow-[0_6px_20px_rgba(124,107,181,0.1)]"
                trackClassName={ringTrack[accent]}
                indicatorClassName={ringIndicator[accent]}
                valueClassName={ringValueText[accent]}
              />
              <p className="mt-2.5 w-full max-w-[16rem] px-1 font-mono text-[0.8125rem] font-semibold tabular-nums tracking-tight text-bloomora-deep/90 sm:text-sm lg:max-w-full">
                {goalProgressDetailLine(selected)}
              </p>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="mt-4 text-center text-xs font-semibold text-bloomora-violet underline-offset-2 hover:underline sm:text-sm"
              >
                Ver resumen global
              </button>
            </>
          ) : !isLoading ? (
            <>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-bloomora-text-muted">
                Resumen global
              </p>
              <p className="mt-1 text-xs text-bloomora-text-muted sm:text-[13px]">
                Todas tus metas del mes
              </p>
              <ProgressRing
                value={ringValue}
                size={140}
                strokeWidth={11}
                className="mx-auto mt-3 max-w-full shrink-0 drop-shadow-[0_6px_20px_rgba(124,107,181,0.1)]"
                indicatorClassName={ringIndicator.lavender}
                valueClassName={ringValueText.lavender}
              />
              <p className="mt-2.5 text-sm font-semibold tabular-nums text-bloomora-deep">
                {Math.round(overallPercent)}% combinado
              </p>
              <p className="mt-3 w-full max-w-[17rem] px-1 text-xs leading-relaxed text-bloomora-text-muted sm:text-sm lg:max-w-full">
                <span className="font-medium text-bloomora-deep/80">
                  Selecciona una meta
                </span>{' '}
                en la lista para ver su nombre, su porcentaje y el detalle de
                avance.
              </p>
            </>
          ) : null}
        </div>

        <div className="relative z-[1] flex min-w-0 w-full max-w-full flex-col gap-2.5 lg:min-w-0 lg:pt-1">
          {!isLoading &&
            goals.map((g) => (
            <GoalRowBar
              key={g.id}
              goal={g}
              selected={selectedId === g.id}
              onSelect={() => setSelectedId(g.id)}
              menuOpen={menuGoalId === g.id}
              onToggleMenu={() =>
                setMenuGoalId((id) => (id === g.id ? null : g.id))
              }
              onCloseMenu={closeGoalMenu}
              onDelete={() => handleDelete(g.id)}
              onEdit={() => handleEdit(g.id)}
            />
            ))}
          {!isLoading && goals.length === 0 ? (
            <div className="rounded-xl bg-white/50 px-4 py-6 text-center ring-1 ring-bloomora-line/20">
              <p className="text-sm text-bloomora-text-muted">
                Aún no tienes metas.
              </p>
              <Link
                to="/app/goals/new"
                className="mt-3 inline-block text-sm font-semibold text-bloomora-violet hover:underline"
              >
                Crear tu primera meta
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardCard>
  )
}
