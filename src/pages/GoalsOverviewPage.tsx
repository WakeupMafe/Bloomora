import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BloomoraLogo } from '@/components/brand/BloomoraLogo'
import { BackButton } from '@/components/navigation/BackButton'
import { Button } from '@/components/ui/Button'
import ConejoBoy from '@/assets/ConejoBoy.png'
import type { MockGoalRow } from '@/data/dashboardMock'
import { GoalTrackerGrid } from '@/features/goals/GoalTrackerGrid'
import { MonthNavPill } from '@/features/goals/MonthNavPill'
import { getCompletedDaysForMonth } from '@/features/goals/goalTrackerUtils'
import { TrackerColorMenu } from '@/features/goals/TrackerColorMenu'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import {
  useBloomoraGoals,
  useClearGoalsMutation,
  useToggleGoalDayMutation,
  useUpdateGoalTrackerColorMutation,
} from '@/hooks/useBloomoraGoals'

type GoalsViewMode = 'lista' | 'tablero' | 'calendario'

function priorityClasses(priority: MockGoalRow['prioridad']) {
  if (priority === 'Alta') return 'bg-rose-100 text-rose-700 ring-rose-200'
  if (priority === 'Baja') return 'bg-sky-100 text-sky-700 ring-sky-200'
  return 'bg-violet-100 text-violet-700 ring-violet-200'
}

function statusClasses(status: MockGoalRow['estado']) {
  if (status === 'Completada') return 'bg-emerald-100 text-emerald-700 ring-emerald-200'
  if (status === 'Pausada') return 'bg-amber-100 text-amber-700 ring-amber-200'
  return 'bg-lime-100 text-lime-700 ring-lime-200'
}

export function GoalsOverviewPage() {
  const navigate = useNavigate()
  const { showToast } = useBloomoraToast()
  const { cedula } = useUserPhone()
  const { data: goals = [], isLoading } = useBloomoraGoals(cedula)
  const clearGoalsMut = useClearGoalsMutation(cedula)
  const toggleGoalDayMut = useToggleGoalDayMutation(cedula)
  const setTrackerMut = useUpdateGoalTrackerColorMutation(cedula)

  const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
  const [viewMonthIndex0, setViewMonthIndex0] = useState(
    () => new Date().getMonth(),
  )
  const [viewMode, setViewMode] = useState<GoalsViewMode>('calendario')

  const shiftMonth = useCallback((delta: number) => {
    const d = new Date(viewYear, viewMonthIndex0 + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonthIndex0(d.getMonth())
  }, [viewYear, viewMonthIndex0])

  const handleClearGoals = () => {
    if (goals.length === 0) return
    if (!window.confirm('¿Limpiar todas tus metas y sus marcas de progreso?')) return
    clearGoalsMut.mutate(undefined, {
      onSuccess: () => showToast('Metas limpiadas. Ahora puedes empezar desde cero.'),
    })
  }

  return (
    <div className="app-shell-padding app-shell-padding--goals-wide app-content-fluid mx-auto flex min-h-dvh flex-col gap-8 bg-bloomora-snow pb-12">
      <header className="flex items-center justify-between gap-4">
        <BloomoraLogo size="sm" />
        <BackButton to="/app" label="Volver al inicio" />
      </header>

      <div>
        <h1 className="app-fluid-title font-bold text-bloomora-deep">Todas las metas</h1>
        <p className="mt-1 text-sm text-bloomora-text-muted">
          Organiza y filtra tus metas como en un mini workspace.
        </p>
      </div>

      <section className="rounded-[18px] bg-white/75 p-3 ring-1 ring-bloomora-line/35">
        <p className="mb-2 text-sm font-semibold text-bloomora-deep">Tus metas</p>
        <div className="flex flex-wrap items-center gap-2">
          {(['lista', 'tablero', 'calendario'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition ${
                viewMode === mode
                  ? 'bg-bloomora-violet text-white ring-bloomora-violet'
                  : 'bg-white/90 text-bloomora-violet ring-bloomora-line/35 hover:bg-bloomora-blush/55'
              }`}
            >
              {mode[0].toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <MonthNavPill
          className="mb-0"
          year={viewYear}
          monthIndex0={viewMonthIndex0}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
          compact
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-rose-200 text-rose-700 hover:bg-rose-50"
          disabled={isLoading || goals.length === 0 || clearGoalsMut.isPending}
          onClick={handleClearGoals}
        >
          Limpiar todo
        </Button>
      </div>

      <div className="flex flex-col gap-10">
        {isLoading ? (
          <p className="text-center text-bloomora-text-muted">Cargando…</p>
        ) : null}
        {!isLoading && goals.length === 0 ? (
          <section className="mx-auto w-full max-w-2xl rounded-[26px] bg-gradient-to-br from-rose-50/95 via-pink-50/90 to-violet-50/90 p-6 text-center shadow-bloomora-card ring-1 ring-bloomora-line/45 sm:p-8">
            <img
              src={ConejoBoy}
              alt="Conejito Bloomora"
              className="mx-auto mb-4 h-28 w-28 rounded-full object-cover ring-2 ring-white/75 shadow-[0_10px_30px_rgba(124,107,181,0.2)] sm:h-32 sm:w-32"
            />
            <h2 className="text-xl font-bold text-bloomora-deep">
              ¿Estás lista para empezar a progresar?
            </h2>
            <p className="mt-1.5 text-sm text-bloomora-text-muted">
              Crea tu primera meta y empieza a llenar tu calendario.
            </p>
            <div className="mt-5">
              <Button type="button" size="md" onClick={() => navigate('/app/goals/new')}>
                Crear metas
              </Button>
            </div>
          </section>
        ) : null}
        {!isLoading && viewMode === 'lista' ? (
          <div className="space-y-3">
            {goals.map((goal) => (
              <article
                key={goal.id}
                className="rounded-[18px] bg-white/90 p-4 shadow-bloomora-card ring-1 ring-bloomora-line/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-bloomora-deep">{goal.title}</h2>
                    <p className="mt-1 text-sm text-bloomora-text-muted">
                      {goal.categoria} · {goal.prioridad}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-bloomora-deep/90">
                      {goal.progreso} / {goal.objetivo} dias
                    </p>
                    <p className="mt-1 text-xs font-medium text-orange-600">
                      🔥 {goal.streak} {goal.streak === 1 ? 'dia seguido' : 'dias seguidos'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${priorityClasses(goal.prioridad)}`}>
                      {goal.prioridad}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClasses(goal.estado)}`}>
                      {goal.estado}
                    </span>
                    <Link
                      to={`/app/goals/${goal.id}/tracker`}
                      className="text-xs font-semibold text-bloomora-violet hover:text-bloomora-deep"
                    >
                      Ver detalle →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!isLoading && viewMode === 'tablero' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {goals.map((goal) => (
              <article
                key={goal.id}
                className="rounded-[20px] bg-gradient-to-br from-white/95 via-bloomora-blush/45 to-bloomora-mist/70 p-4 ring-1 ring-bloomora-line/35"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-bold text-bloomora-deep">{goal.title}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusClasses(goal.estado)}`}>
                    {goal.estado}
                  </span>
                </div>
                <p className="mt-2 text-sm text-bloomora-text-muted">{goal.categoria} · {goal.prioridad}</p>
                <p className="mt-1 text-sm font-semibold text-bloomora-deep">{goal.progreso} / {goal.objetivo} dias</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-orange-600">
                    🔥 {goal.streak} {goal.streak === 1 ? 'dia' : 'dias'} seguidos
                  </span>
                  <Link
                    to={`/app/goals/${goal.id}/tracker`}
                    className="text-xs font-semibold text-bloomora-violet hover:text-bloomora-deep"
                  >
                    Abrir →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!isLoading && viewMode === 'calendario'
          ? goals.map((goal) => (
              <section
                key={goal.id}
                className="rounded-[22px] bg-bloomora-white/90 p-4 shadow-bloomora-card ring-1 ring-bloomora-line/60 sm:p-5"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-bloomora-deep">
                      {goal.title}
                    </h2>
                    <p className="mt-1 text-sm text-bloomora-text-muted">
                      {goal.categoria} · {goal.prioridad}
                    </p>
                    <p className="text-xs font-medium text-bloomora-text-muted">
                      {goal.progreso} / {goal.objetivo} dias · 🔥 {goal.streak}{' '}
                      {goal.streak === 1 ? 'dia' : 'dias'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <TrackerColorMenu
                      compact
                      value={goal.trackerColorId}
                      accent={goal.accent}
                      onChange={(id) =>
                        setTrackerMut.mutate({ goalId: goal.id, trackerColorId: id })
                      }
                    />
                    <Link
                      to={`/app/goals/${goal.id}/tracker`}
                      className="text-xs font-semibold text-bloomora-violet hover:text-bloomora-deep"
                    >
                      Abrir solo esta meta →
                    </Link>
                  </div>
                </div>
                <GoalTrackerGrid
                  compact
                  showMonthBanner={false}
                  year={viewYear}
                  monthIndex0={viewMonthIndex0}
                  accent={goal.accent}
                  trackerColorId={goal.trackerColorId}
                  minAllowedDate={goal.fecha_inicio}
                  completedDays={getCompletedDaysForMonth(
                    goal,
                    viewYear,
                    viewMonthIndex0,
                  )}
                  onToggleDay={(day) =>
                    toggleGoalDayMut.mutate({
                      goalId: goal.id,
                      year: viewYear,
                      monthIndex0: viewMonthIndex0,
                      day,
                    })
                  }
                />
              </section>
            ))
          : null}
      </div>
    </div>
  )
}
