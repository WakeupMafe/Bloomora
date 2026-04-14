import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BloomoraLogo } from '@/components/brand/BloomoraLogo'
import { BackButton } from '@/components/navigation/BackButton'
import { Button } from '@/components/ui/Button'
import { GoalTrackerPanel } from '@/features/goals/GoalTrackerPanel'
import { getCompletedDaysForMonth } from '@/features/goals/goalTrackerUtils'
import { useGoalTaskTemplates } from '@/hooks/useGoalTaskTemplates'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import {
  useBloomoraGoals,
  useToggleGoalDayMutation,
  useUpdateGoalFieldsMutation,
  useUpdateGoalTrackerColorMutation,
} from '@/hooks/useBloomoraGoals'

export function GoalTrackerPage() {
  const { goalId } = useParams<{ goalId: string }>()
  const { cedula } = useUserPhone()
  const { isTemplate, toggleTemplate } = useGoalTaskTemplates(cedula)
  const { data: goals = [], isLoading } = useBloomoraGoals(cedula)
  const toggleGoalDayMut = useToggleGoalDayMutation(cedula)
  const setTrackerMut = useUpdateGoalTrackerColorMutation(cedula)
  const updateFieldsMut = useUpdateGoalFieldsMutation(cedula)

  const goal = goals.find((g) => g.id === goalId)
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
  const [viewMonthIndex0, setViewMonthIndex0] = useState(
    () => new Date().getMonth(),
  )
  const [titleDraft, setTitleDraft] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)

  useEffect(() => {
    if (goal) setTitleDraft(goal.title)
  }, [goal])

  const shiftMonth = useCallback((delta: number) => {
    const d = new Date(viewYear, viewMonthIndex0 + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonthIndex0(d.getMonth())
  }, [viewYear, viewMonthIndex0])

  if (isLoading) {
    return (
      <div className="app-shell-padding app-content-fluid mx-auto py-12">
        <p className="text-bloomora-text-muted">Cargando…</p>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="app-shell-padding app-content-fluid mx-auto">
        <p className="text-bloomora-text-muted">Meta no encontrada.</p>
        <BackButton to="/app" label="Volver al inicio" className="mt-4" />
      </div>
    )
  }

  const saveTitle = () => {
    const t = titleDraft.trim()
    if (!t || t === goal.title) {
      setEditingTitle(false)
      setTitleDraft(goal.title)
      return
    }
    updateFieldsMut.mutate(
      { goalId: goal.id, patch: { title: t } },
      {
        onSettled: () => setEditingTitle(false),
      },
    )
  }

  return (
    <div className="app-shell-padding app-content-fluid mx-auto flex min-h-dvh flex-col gap-6 bg-bloomora-snow pb-16">
      <header className="flex items-center justify-between gap-4">
        <BloomoraLogo size="sm" />
        <BackButton />
      </header>

      {editingTitle ? (
        <div className="flex flex-wrap items-end gap-2 rounded-[18px] bg-white/80 p-3 ring-1 ring-bloomora-line/30">
          <label className="min-w-0 flex-1 text-xs font-semibold text-bloomora-text-muted">
            Nombre de la meta
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="mt-1 w-full rounded-xl border border-bloomora-line/50 px-3 py-2 text-sm font-semibold text-bloomora-deep"
              autoFocus
            />
          </label>
          <Button
            type="button"
            size="sm"
            onClick={saveTitle}
            disabled={updateFieldsMut.isPending}
          >
            Guardar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setTitleDraft(goal.title)
              setEditingTitle(false)
            }}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="w-fit text-left text-xs font-semibold text-bloomora-violet underline-offset-2 hover:underline"
          >
            Editar nombre de la meta
          </button>
          <button
            type="button"
            onClick={() => toggleTemplate(goal.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
              isTemplate(goal.id)
                ? 'bg-bloomora-lavender-50 text-bloomora-deep ring-bloomora-lilac/45'
                : 'bg-white/85 text-bloomora-violet ring-bloomora-line/40 hover:bg-bloomora-blush/55'
            }`}
          >
            {isTemplate(goal.id)
              ? '✅ Guardado como formato de tarea'
              : '¿Guardar como formato de tarea?'}
          </button>
        </div>
      )}

      <GoalTrackerPanel
        title={goal.title}
        accent={goal.accent}
        trackerColorId={goal.trackerColorId}
        allCompletedDaysByMonth={goal.completedDaysByMonth}
        goalStartDate={goal.fecha_inicio}
        onTrackerColorChange={(id) =>
          setTrackerMut.mutate({ goalId: goal.id, trackerColorId: id })
        }
        year={viewYear}
        monthIndex0={viewMonthIndex0}
        completedDays={getCompletedDaysForMonth(goal, viewYear, viewMonthIndex0)}
        onToggleDay={(day) =>
          toggleGoalDayMut.mutate({
            goalId: goal.id,
            year: viewYear,
            monthIndex0: viewMonthIndex0,
            day,
          })
        }
        monthNavigation={{
          onPrev: () => shiftMonth(-1),
          onNext: () => shiftMonth(1),
        }}
      />
    </div>
  )
}
