import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import ConejoBoy from '@/assets/ConejoBoy.png'
import { BloomoraImage } from '@/components/ui/BloomoraImage'
import type { MockGoalRow } from '@/data/dashboardMock'
import { GoalPriorityPicker } from '@/features/goals/GoalPriorityPicker'
import { GoalTrackerGrid } from '@/features/goals/GoalTrackerGrid'
import { MonthNavPill } from '@/features/goals/MonthNavPill'
import { getCompletedDaysForMonth } from '@/features/goals/goalTrackerUtils'
import { TrackerColorMenu } from '@/features/goals/TrackerColorMenu'
import { useBloomoraAlert } from '@/contexts/BloomoraAlertContext'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import {
  useBloomoraGoals,
  useClearGoalsMutation,
  useToggleGoalDayMutation,
  useUpdateGoalFieldsMutation,
  useUpdateGoalTrackerColorMutation,
} from '@/hooks/useBloomoraGoals'

type GoalsViewMode = 'lista' | 'tablero' | 'calendario'

function statusClasses(status: MockGoalRow['estado']) {
  if (status === 'Completada')
    return 'bg-[color:var(--bloomora-success-soft)] text-[color:var(--bloomora-success)] ring-[color:var(--bloomora-border)]'
  if (status === 'Pausada')
    return 'bg-[color:var(--bloomora-surface-2)] text-[color:var(--bloomora-text-muted)] ring-[color:var(--bloomora-border)]'
  return 'bg-[color:var(--bloomora-surface-2)] text-[color:var(--bloomora-accent)] ring-[color:var(--bloomora-border)]'
}

const openMetaPill =
  'inline-flex items-center rounded-full bg-[color:var(--bloomora-surface-3)] px-3 py-1.5 text-xs font-bold text-[color:var(--bloomora-text)] ring-1 ring-[color:var(--bloomora-border-strong)] transition hover:brightness-110'

export function GoalsOverviewPage() {
  const navigate = useNavigate()
  const { showToast } = useBloomoraToast()
  const { confirm } = useBloomoraAlert()
  const { cedula } = useUserPhone()
  const { data: goals = [], isLoading } = useBloomoraGoals(cedula)
  const clearGoalsMut = useClearGoalsMutation(cedula)
  const toggleGoalDayMut = useToggleGoalDayMutation(cedula)
  const setTrackerMut = useUpdateGoalTrackerColorMutation(cedula)
  const updateGoalFieldsMut = useUpdateGoalFieldsMutation(cedula)

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

  const handlePriorityChange = (goalId: string, prioridad: MockGoalRow['prioridad']) => {
    updateGoalFieldsMut.mutate(
      { goalId, patch: { prioridad } },
      {
        onError: () => showToast('No se pudo actualizar la prioridad.'),
      },
    )
  }

  const handleClearGoals = async () => {
    if (goals.length === 0) return
    const ok = await confirm({
      title: '¿Limpiar todas tus metas y sus marcas de progreso?',
      confirmLabel: 'Limpiar',
      tone: 'danger',
    })
    if (!ok) return
    clearGoalsMut.mutate(undefined, {
      onSuccess: () => showToast('Metas limpiadas. Ahora puedes empezar desde cero.'),
    })
  }

  return (
    <div className="app-shell-padding app-shell-padding--goals-wide app-content-fluid mx-auto flex min-h-dvh flex-col gap-8 bg-bloomora-snow pb-12">
      <div>
        <h1 className="app-fluid-title font-bold text-bloomora-deep">Todas las metas</h1>
        <p className="mt-1 text-sm text-bloomora-text-muted">
          Organiza y filtra tus metas como en un mini workspace.
        </p>
      </div>

      <section className="rounded-[18px] bg-[color:var(--bloomora-surface-1)] p-3 ring-1 ring-[color:var(--bloomora-border)]">
        <p className="mb-2 text-sm font-semibold text-[color:var(--bloomora-text)]">Tus metas</p>
        <div className="flex flex-wrap items-center gap-2 rounded-full bg-[color:var(--bloomora-surface-2)] p-1">
          {(['lista', 'tablero', 'calendario'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition ${
                viewMode === mode
                  ? 'bg-[color:var(--bloomora-accent-bg)] text-[color:var(--bloomora-accent-on)] ring-[color:var(--bloomora-accent-bg)]'
                  : 'bg-transparent text-[color:var(--bloomora-accent)] ring-transparent hover:bg-[color:var(--bloomora-surface-3)]'
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
          className="border-[color:var(--bloomora-danger-fg)] bg-[color:var(--bloomora-danger-soft)] text-[color:var(--bloomora-danger-fg)] hover:brightness-110"
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
          <section className="mx-auto w-full max-w-2xl rounded-[26px] bg-[color:var(--bloomora-surface-1)] p-6 text-center shadow-bloomora-card ring-1 ring-[color:var(--bloomora-border)] sm:p-8">
            <BloomoraImage
              src={ConejoBoy}
              alt="Conejito Bloomora"
              size="full"
              className="mx-auto mb-4 h-28 w-28 rounded-full object-cover ring-2 ring-[color:var(--bloomora-border)] shadow-[0_10px_30px_rgba(124,107,181,0.2)] sm:h-32 sm:w-32"
            />
            <h2 className="text-xl font-bold text-[color:var(--bloomora-text)]">
              ¿Estás lista para empezar a progresar?
            </h2>
            <p className="mt-1.5 text-sm text-[color:var(--bloomora-text-muted)]">
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
                className="rounded-[18px] bg-[color:var(--bloomora-surface-1)] p-4 shadow-bloomora-card ring-1 ring-[color:var(--bloomora-border)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[color:var(--bloomora-text)]">{goal.title}</h2>
                    <p className="mt-1 text-sm text-[color:var(--bloomora-text-muted)]">{goal.categoria}</p>
                    <p className="mt-1 text-sm font-semibold text-[color:var(--bloomora-text)]">
                      {getCompletedDaysForMonth(goal, viewYear, viewMonthIndex0).length} / {goal.objetivo} días
                    </p>
                    <p className="mt-1 text-xs font-medium text-[color:var(--bloomora-accent)]">
                      🔥 {goal.streak} {goal.streak === 1 ? 'dia seguido' : 'dias seguidos'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <GoalPriorityPicker
                      value={goal.prioridad}
                      onChange={(p) => handlePriorityChange(goal.id, p)}
                      disabled={
                        updateGoalFieldsMut.isPending &&
                        updateGoalFieldsMut.variables?.goalId === goal.id
                      }
                    />
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClasses(goal.estado)}`}>
                      {goal.estado}
                    </span>
                    <Link
                      to={`/app/goals/${goal.id}/tracker`}
                      className={openMetaPill}
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
                className="rounded-[20px] bg-[color:var(--bloomora-surface-1)] p-4 ring-1 ring-[color:var(--bloomora-border)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-bold text-[color:var(--bloomora-text)]">{goal.title}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusClasses(goal.estado)}`}>
                    {goal.estado}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="text-sm text-[color:var(--bloomora-text-muted)]">{goal.categoria}</p>
                  <GoalPriorityPicker
                    value={goal.prioridad}
                    onChange={(p) => handlePriorityChange(goal.id, p)}
                    disabled={
                      updateGoalFieldsMut.isPending &&
                      updateGoalFieldsMut.variables?.goalId === goal.id
                    }
                  />
                </div>
                <p className="mt-1 text-sm font-semibold text-[color:var(--bloomora-text)]">{getCompletedDaysForMonth(goal, viewYear, viewMonthIndex0).length} / {goal.objetivo} días</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-[color:var(--bloomora-accent)]">
                    🔥 {goal.streak} {goal.streak === 1 ? 'dia' : 'dias'} seguidos
                  </span>
                  <Link
                    to={`/app/goals/${goal.id}/tracker`}
                    className={openMetaPill}
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
                className="rounded-[22px] bg-[color:var(--bloomora-surface-1)] p-4 shadow-bloomora-card ring-1 ring-[color:var(--bloomora-border)] sm:p-5"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-[color:var(--bloomora-text)]">
                      {goal.title}
                    </h2>
                    <p className="mt-1 text-sm text-[color:var(--bloomora-text-muted)]">{goal.categoria}</p>
                    <p className="text-xs font-medium text-[color:var(--bloomora-text-muted)]">
                      {getCompletedDaysForMonth(goal, viewYear, viewMonthIndex0).length} / {goal.objetivo} días · 🔥 {goal.streak}{' '}
                      {goal.streak === 1 ? 'dia' : 'dias'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <GoalPriorityPicker
                      value={goal.prioridad}
                      onChange={(p) => handlePriorityChange(goal.id, p)}
                      disabled={
                        updateGoalFieldsMut.isPending &&
                        updateGoalFieldsMut.variables?.goalId === goal.id
                      }
                    />
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
                      className={openMetaPill}
                    >
                      Abrir meta
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
