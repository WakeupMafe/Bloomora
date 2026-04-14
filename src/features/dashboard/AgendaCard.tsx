import { type FormEvent, useCallback, useMemo, useState } from 'react'
import { defaultNewBlockDurationMin } from '@/data/dashboardMock'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { AgendaTaskRow } from '@/features/dashboard/AgendaTaskRow'
import { AgendaTaskSubsteps } from '@/features/dashboard/AgendaTaskSubsteps'
import { Button } from '@/components/ui/Button'
import { BloomoraConfirmDialog } from '@/components/ui/BloomoraConfirmDialog'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import {
  useAgendaMutations,
  useBloomoraAgenda,
} from '@/hooks/useBloomoraAgenda'
import { useBloomoraGoals } from '@/hooks/useBloomoraGoals'
import { useGoalTaskTemplates } from '@/hooks/useGoalTaskTemplates'
import {
  addLocalDays,
  formatMinutes12h,
  minutesFromTimeInput,
  startOfLocalDay,
  titleCaseAgendaDate,
  toDateKeyLocal,
  toTimeInputValue,
} from '@/utils/agendaTime'
import { cn } from '@/utils/cn'

/** Sugerencia por defecto para el primer bloque del día (el usuario puede cambiarla). */
const defaultEmptyDayStartMin = 7 * 60

function AgendaTrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" />
    </svg>
  )
}

type AgendaCardProps = {
  className?: string
}

export function AgendaCard({ className }: AgendaCardProps) {
  const { showToast } = useBloomoraToast()
  const { cedula } = useUserPhone()
  const [cursorDate, setCursorDate] = useState(() => startOfLocalDay(new Date()))
  const dayKey = useMemo(() => toDateKeyLocal(cursorDate), [cursorDate])
  const headerLabel = useMemo(() => titleCaseAgendaDate(cursorDate), [cursorDate])

  const { data: tasks = [], isLoading, isError } = useBloomoraAgenda(
    cedula,
    dayKey,
  )
  const { data: goals = [] } = useBloomoraGoals(cedula)
  const { templateIds } = useGoalTaskTemplates(cedula)
  const {
    toggle,
    addTask,
    updateTask,
    removeTask,
    addSubtask,
    toggleSubtask,
    removeSubtask,
  } = useAgendaMutations(cedula, dayKey)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [createMode, setCreateMode] = useState<'normal' | 'goal'>('normal')
  const [selectedGoalId, setSelectedGoalId] = useState<string>('')
  const [draftStartTime, setDraftStartTime] = useState('')
  const [draftEndTime, setDraftEndTime] = useState('')
  const [createFormError, setCreateFormError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editFormError, setEditFormError] = useState<string | null>(null)
  const [deleteIntent, setDeleteIntent] = useState<{
    id: string
    title: string
  } | null>(null)

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => a.startMin - b.startMin),
    [tasks],
  )
  const orderedGoalOptions = useMemo(() => {
    if (!goals.length) return goals
    const templateSet = new Set(templateIds)
    const templates = goals.filter((g) => templateSet.has(g.id))
    const regular = goals.filter((g) => !templateSet.has(g.id))
    return [...templates, ...regular]
  }, [goals, templateIds])
  const selectedGoal = useMemo(
    () => orderedGoalOptions.find((g) => g.id === selectedGoalId) ?? null,
    [orderedGoalOptions, selectedGoalId],
  )

  const completedCount = sortedTasks.filter((t) => t.completed).length
  const total = sortedTasks.length
  const progressPct = total > 0 ? (completedCount / total) * 100 : 0

  const nextBlockStartMin = useCallback((list: typeof sortedTasks) => {
    if (list.length === 0) return defaultEmptyDayStartMin
    return list[list.length - 1].endMin
  }, [])

  const openCreateForm = useCallback(() => {
    if (sortedTasks.length === 0) {
      setDraftStartTime(toTimeInputValue(defaultEmptyDayStartMin))
      setDraftEndTime(
        toTimeInputValue(defaultEmptyDayStartMin + defaultNewBlockDurationMin),
      )
    } else {
      const start = nextBlockStartMin(sortedTasks)
      setDraftStartTime(toTimeInputValue(start))
      setDraftEndTime(toTimeInputValue(start + defaultNewBlockDurationMin))
    }
    setDraftTitle('')
    setCreateMode('normal')
    setSelectedGoalId(orderedGoalOptions[0]?.id ?? '')
    setCreateFormError(null)
    setShowCreateForm(true)
    setEditingId(null)
  }, [sortedTasks, nextBlockStartMin, orderedGoalOptions])

  const shiftDay = (delta: number) => {
    setCursorDate((d) => addLocalDays(d, delta))
    setShowCreateForm(false)
    setEditingId(null)
  }

  const handleSubmitCreate = (e: FormEvent) => {
    e.preventDefault()
    setCreateFormError(null)
    const title =
      createMode === 'goal' ? (selectedGoal?.title?.trim() ?? '') : draftTitle.trim()
    if (!title) {
      setCreateFormError(
        createMode === 'goal'
          ? 'Elige una meta para crear la tarea.'
          : 'Escribe un título para la tarea.',
      )
      return
    }

    const startMin = minutesFromTimeInput(draftStartTime)
    if (startMin === null) {
      setCreateFormError('Elige una hora de inicio válida.')
      return
    }
    let endMin = minutesFromTimeInput(draftEndTime)
    if (endMin === null) endMin = startMin + defaultNewBlockDurationMin
    if (endMin <= startMin) {
      setCreateFormError('La hora de fin debe ser después de la hora de inicio.')
      return
    }

    addTask.mutate(
      {
        title,
        startMin,
        endMin,
        goalId: createMode === 'goal' ? selectedGoalId : null,
      },
      {
        onSuccess: () => {
          showToast(
            createMode === 'goal'
              ? '¡Tarea creada desde meta! Se vinculará al completarla.'
              : '¡Tarea guardada!',
          )
          setShowCreateForm(false)
          setDraftTitle('')
          setCreateFormError(null)
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : 'No se pudo guardar la tarea.'
          setCreateFormError(msg)
        },
      },
    )
  }

  const openEdit = (id: string) => {
    const t = sortedTasks.find((x) => x.id === id)
    if (!t) return
    setEditingId(id)
    setEditTitle(t.title)
    setEditStartTime(toTimeInputValue(t.startMin))
    setEditEndTime(toTimeInputValue(t.endMin))
    setEditFormError(null)
    setShowCreateForm(false)
  }

  const handleSubmitEdit = (e: FormEvent) => {
    e.preventDefault()
    setEditFormError(null)
    if (!editingId) return
    const title = editTitle.trim()
    if (!title) return
    const t = sortedTasks.find((x) => x.id === editingId)
    if (!t) return

    const startMin = minutesFromTimeInput(editStartTime)
    if (startMin === null) {
      setEditFormError('Elige una hora de inicio válida.')
      return
    }
    let endMin = minutesFromTimeInput(editEndTime)
    if (endMin === null) endMin = t.endMin
    if (endMin <= startMin) {
      setEditFormError('La hora de fin debe ser después de la hora de inicio.')
      return
    }

    updateTask.mutate(
      {
        id: editingId,
        patch: { title, start_min: startMin, end_min: endMin },
      },
      {
        onSuccess: () => {
          showToast('¡Tarea actualizada!')
        },
      },
    )
    setEditingId(null)
  }

  const handleDeleteEdit = () => {
    if (!editingId) return
    const t = sortedTasks.find((x) => x.id === editingId)
    setDeleteIntent({
      id: editingId,
      title: t?.title?.trim() || 'esta tarea',
    })
  }

  const runDeleteTask = (id: string) => {
    removeTask.mutate(id, {
      onSuccess: () => {
        showToast('Tarea eliminada')
        setEditingId((prev) => (prev === id ? null : prev))
        setEditFormError(null)
        setDeleteIntent(null)
      },
    })
  }

  return (
    <DashboardCard
      className={cn(
        'min-h-0 bg-gradient-to-b from-bloomora-blush/90 via-bloomora-white/70 to-bloomora-rose/15 p-5 sm:p-6',
        className,
      )}
    >
      <BloomoraConfirmDialog
        open={deleteIntent != null}
        title="¿Eliminar esta tarea?"
        description={
          deleteIntent
            ? `“${deleteIntent.title}” se quitará del día. Esta acción no se puede deshacer.`
            : undefined
        }
        cancelLabel="Cancelar"
        confirmLabel="Eliminar"
        tone="danger"
        isPending={removeTask.isPending}
        onCancel={() => setDeleteIntent(null)}
        onConfirm={() => {
          if (!deleteIntent) return
          runDeleteTask(deleteIntent.id)
        }}
      />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-bloomora-deep sm:text-xl">
            Tareas del día
          </h2>
          <p className="mt-0.5 text-xs text-bloomora-text-muted sm:text-sm">
            Marca lo que completes
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-bloomora-violet ring-1 ring-bloomora-line/40 transition hover:bg-white/80 sm:text-sm"
        >
          Añadir tarea
        </button>
      </div>

      <div className="mb-5 flex shrink-0 justify-center sm:mb-6">
        <div className="inline-flex max-w-full items-center gap-1 rounded-full bg-bloomora-white/90 px-3 py-2.5 text-xs font-semibold text-bloomora-deep shadow-[0_4px_16px_rgba(124,107,181,0.08)] ring-1 ring-bloomora-line/50 sm:gap-2 sm:px-4 sm:text-sm">
          <button
            type="button"
            aria-label="Día anterior"
            className="rounded-full px-2.5 py-1 text-bloomora-violet transition hover:bg-bloomora-lavender-50"
            onClick={() => shiftDay(-1)}
          >
            ‹
          </button>
          <span className="min-w-0 flex-1 truncate px-1 text-center">
            {headerLabel}
          </span>
          <button
            type="button"
            aria-label="Día siguiente"
            className="rounded-full px-2.5 py-1 text-bloomora-violet transition hover:bg-bloomora-lavender-50"
            onClick={() => shiftDay(1)}
          >
            ›
          </button>
        </div>
      </div>

      {isError ? (
        <div className="space-y-1 text-center text-sm text-red-600">
          <p>No se pudieron cargar las tareas.</p>
          <p className="text-xs font-normal text-bloomora-text-muted">
            Comprueba en Supabase{' '}
            <code className="rounded bg-bloomora-lavender-50 px-1 text-bloomora-deep">
              daily_plans
            </code>
            ,{' '}
            <code className="rounded bg-bloomora-lavender-50 px-1 text-bloomora-deep">
              tasks
            </code>
            ,{' '}
            <code className="rounded bg-bloomora-lavender-50 px-1 text-bloomora-deep">
              task_blocks
            </code>
            ,{' '}
            <code className="rounded bg-bloomora-lavender-50 px-1 text-bloomora-deep">
              subtasks
            </code>{' '}
            y políticas RLS para tu usuario. Si faltan listas o marcas del tracker, ejecuta{' '}
            <code className="rounded bg-bloomora-lavender-50 px-1 text-bloomora-deep">
              20260416_bloomora_goal_marks_lists_goals_ui.sql
            </code>
            .
          </p>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-bloomora-text-muted">
            Cargando…
          </p>
        ) : null}

        {!isLoading && sortedTasks.length === 0 && !showCreateForm ? (
          <div className="flex min-h-[8rem] flex-1 flex-col items-center justify-center gap-5 px-2 py-6">
            <p className="text-center text-sm text-bloomora-text-muted">
              No hay tareas este día.
            </p>
            <Button type="button" size="lg" onClick={openCreateForm}>
              Añadir tarea
            </Button>
          </div>
        ) : null}

        {!isLoading && sortedTasks.length > 0 ? (
          <div
            className={cn(
              'agenda-task-scroll min-h-0 flex-1 rounded-xl ring-1 ring-bloomora-line/25',
              'max-h-[min(40dvh,18rem)] sm:max-h-[min(36dvh,20rem)]',
              'lg:max-h-none lg:overflow-visible lg:pr-1',
            )}
          >
            <ul className="divide-y divide-bloomora-line/30">
              {sortedTasks.map((task) => (
                <li key={task.id} className="flex flex-col">
                  <AgendaTaskRow
                    title={task.title}
                    startLabel={formatMinutes12h(task.startMin)}
                    endLabel={formatMinutes12h(task.endMin)}
                    completed={task.completed}
                    onToggle={() =>
                      toggle.mutate({
                        id: task.id,
                        completed: !task.completed,
                      })
                    }
                    onEdit={() => openEdit(task.id)}
                    onDelete={() =>
                      setDeleteIntent({
                        id: task.id,
                        title: task.title.trim() || 'esta tarea',
                      })
                    }
                  />
                  <AgendaTaskSubsteps
                    taskId={task.id}
                    subtasks={task.subtasks}
                    isAdding={
                      addSubtask.isPending &&
                      addSubtask.variables?.taskId === task.id
                    }
                    isTogglingSubtaskId={
                      toggleSubtask.isPending
                        ? (toggleSubtask.variables?.subtaskId ?? null)
                        : null
                    }
                    isRemovingSubtaskId={
                      removeSubtask.isPending
                        ? (removeSubtask.variables?.subtaskId ?? null)
                        : null
                    }
                    onAdd={(title) =>
                      addSubtask.mutate(
                        { taskId: task.id, title },
                        {
                          onSuccess: () => showToast('Paso añadido'),
                          onError: (err) =>
                            showToast(
                              err instanceof Error
                                ? err.message
                                : 'No se pudo añadir el paso.',
                            ),
                        },
                      )
                    }
                    onToggle={(subtaskId, completed) =>
                      toggleSubtask.mutate({ subtaskId, completed })
                    }
                    onRemove={(subtaskId) =>
                      removeSubtask.mutate(
                        { subtaskId },
                        {
                          onSuccess: () => showToast('Paso quitado'),
                          onError: (err) =>
                            showToast(
                              err instanceof Error
                                ? err.message
                                : 'No se pudo quitar el paso.',
                            ),
                        },
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {showCreateForm ? (
          <form
            onSubmit={handleSubmitCreate}
            className="mt-5 space-y-3 rounded-[18px] bg-bloomora-white/85 p-4 shadow-[0_6px_20px_rgba(91,74,140,0.06)] ring-1 ring-bloomora-line/40"
          >
            <p className="text-xs font-semibold text-bloomora-deep">
              {sortedTasks.length > 0 ? (
                <>
                  Nueva tarea · ajusta{' '}
                  <span className="text-bloomora-violet">inicio</span> y{' '}
                  <span className="text-bloomora-violet">fin</span> (por defecto
                  continúa después de la última).
                </>
              ) : (
                <>
                  Nueva tarea · elige a qué hora empiezas (por ejemplo 7:00 si
                  te levantas a esa hora) y cuándo termina.
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCreateMode('normal')}
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                  createMode === 'normal'
                    ? 'bg-bloomora-violet text-white ring-bloomora-violet'
                    : 'bg-white/85 text-bloomora-violet ring-bloomora-line/40 hover:bg-bloomora-blush/45'
                }`}
              >
                Entrada normal
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('goal')}
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                  createMode === 'goal'
                    ? 'bg-bloomora-violet text-white ring-bloomora-violet'
                    : 'bg-white/85 text-bloomora-violet ring-bloomora-line/40 hover:bg-bloomora-blush/45'
                }`}
              >
                Desde metas
              </button>
            </div>
            {createMode === 'goal' ? (
              <label className="block text-xs font-medium text-bloomora-text-muted">
                Meta vinculada
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-bloomora-line/60 bg-bloomora-white px-3 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/30 focus:ring-2"
                >
                  {orderedGoalOptions.length === 0 ? (
                    <option value="">No hay metas creadas</option>
                  ) : null}
                  {orderedGoalOptions.map((g) => (
                    <option key={g.id} value={g.id}>
                      {templateIds.includes(g.id) ? '⭐ ' : ''}
                      {g.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="block text-xs font-medium text-bloomora-text-muted">
              Título
              <input
                onChange={(e) => setDraftTitle(e.target.value)}
                value={createMode === 'goal' ? selectedGoal?.title ?? '' : draftTitle}
                className="mt-1.5 w-full rounded-xl border border-bloomora-line/60 bg-bloomora-white px-3 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/30 focus:ring-2"
                placeholder="Ej. Caminar 20 minutos"
                disabled={createMode === 'goal'}
                autoFocus
              />
            </label>
            <label className="block text-xs font-medium text-bloomora-text-muted">
              Hora de inicio
              <input
                type="time"
                step={300}
                value={draftStartTime}
                onChange={(e) => setDraftStartTime(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-bloomora-line/60 bg-bloomora-white px-3 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/30 focus:ring-2"
              />
            </label>
            <label className="block text-xs font-medium text-bloomora-text-muted">
              Hora de fin
              <input
                type="time"
                step={300}
                value={draftEndTime}
                onChange={(e) => setDraftEndTime(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-bloomora-line/60 bg-bloomora-white px-3 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/30 focus:ring-2"
              />
            </label>
            {createFormError ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {createFormError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={
                  addTask.isPending ||
                  (createMode === 'normal' && !draftTitle.trim()) ||
                  (createMode === 'goal' && !selectedGoalId)
                }
              >
                Guardar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false)
                  setCreateFormError(null)
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : null}

        {editingId ? (
          <form
            onSubmit={handleSubmitEdit}
            className="mt-5 space-y-3 rounded-[18px] bg-bloomora-white/85 p-4 shadow-[0_6px_20px_rgba(91,74,140,0.06)] ring-1 ring-bloomora-line/40"
          >
            <p className="text-xs font-semibold text-bloomora-deep">
              Editar tarea
            </p>
            <label className="block text-xs font-medium text-bloomora-text-muted">
              Título
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-bloomora-line/60 bg-bloomora-white px-3 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/30 focus:ring-2"
              />
            </label>
            <label className="block text-xs font-medium text-bloomora-text-muted">
              Hora de inicio
              <input
                type="time"
                step={300}
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-bloomora-line/60 bg-bloomora-white px-3 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/30 focus:ring-2"
              />
            </label>
            <label className="block text-xs font-medium text-bloomora-text-muted">
              Hora de fin
              <input
                type="time"
                step={300}
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-bloomora-line/60 bg-bloomora-white px-3 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/30 focus:ring-2"
              />
            </label>
            {editFormError ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {editFormError}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!editTitle.trim() || updateTask.isPending}
                >
                  Guardar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingId(null)
                    setEditFormError(null)
                  }}
                >
                  Cancelar
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-red-200/90 text-red-600 shadow-none hover:bg-red-50/90 hover:text-red-700"
                disabled={removeTask.isPending || updateTask.isPending}
                onClick={handleDeleteEdit}
                aria-label="Eliminar tarea"
              >
                <AgendaTrashIcon className="size-[1.125rem] shrink-0" />
                Eliminar
              </Button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="mt-5 shrink-0 sm:mt-6">
        <ProgressBar
          value={progressPct}
          label={`${completedCount} de ${total} completadas`}
        />
      </div>
    </DashboardCard>
  )
}
