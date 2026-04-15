import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AgendaSubtask, AgendaTask } from '@/data/dashboardMock'
import {
  deleteAgendaSubtask,
  deleteAgendaTask,
  insertAgendaSubtask,
  insertAgendaTask,
  listAgendaTasks,
  listSubtasksForTaskIds,
  markLinkedGoalsDoneForDay,
  setAgendaSubtaskCompleted,
  updateAgendaSubtaskTitle,
  updateAgendaTask,
  type AgendaSubtaskRow,
  type AgendaTaskRow,
} from '@/services/supabase/agendaRepo'
import { requireExistingProfileByCedula } from '@/services/supabase/profilesRepo'
import { requireSupabase } from '@/services/supabase/typedClient'

function rowToAgendaTask(r: AgendaTaskRow, subtasks: AgendaSubtask[]): AgendaTask {
  return {
    id: String(r.id),
    title: r.title,
    startMin: r.start_min,
    endMin: r.end_min,
    completed: r.completed,
    subtasks,
  }
}

export function useBloomoraAgenda(cedula: string | null, dayKey: string) {
  return useQuery({
    queryKey: ['agenda', cedula, dayKey],
    enabled: !!cedula && !!dayKey,
    queryFn: async (): Promise<AgendaTask[]> => {
      const sb = requireSupabase()
      await requireExistingProfileByCedula(sb, cedula!)
      const rows = await listAgendaTasks(sb, cedula!, dayKey)
      const taskIds = rows.map((r) => r.id)
      const subRows = await listSubtasksForTaskIds(sb, cedula!, taskIds)
      const byTask = new Map<number, AgendaSubtaskRow[]>()
      for (const s of subRows) {
        const arr = byTask.get(s.task_id) ?? []
        arr.push(s)
        byTask.set(s.task_id, arr)
      }
      return rows.map((r) => {
        const subs = byTask.get(r.id) ?? []
        const subtasks: AgendaSubtask[] = subs.map((s) => ({
          id: String(s.id),
          title: s.title,
          completed: s.status === 'completed',
        }))
        return rowToAgendaTask(r, subtasks)
      })
    },
  })
}

export function useAgendaMutations(cedula: string | null, dayKey: string) {
  const qc = useQueryClient()
  const agendaQueryKey = ['agenda', cedula, dayKey] as const
  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: agendaQueryKey })

  const toggle = useMutation({
    onMutate: async (vars: { id: string; completed: boolean }) => {
      await qc.cancelQueries({ queryKey: agendaQueryKey })
      const previous = qc.getQueryData<AgendaTask[]>(agendaQueryKey)
      qc.setQueryData<AgendaTask[]>(agendaQueryKey, (curr = []) =>
        curr.map((task) =>
          task.id === vars.id ? { ...task, completed: vars.completed } : task,
        ),
      )
      return { previous }
    },
    mutationFn: async (vars: { id: string; completed: boolean }) => {
      const sb = requireSupabase()
      const taskId = Number(vars.id)
      await updateAgendaTask(sb, taskId, dayKey, {
        completed: vars.completed,
      })
      if (vars.completed && cedula) {
        await markLinkedGoalsDoneForDay(sb, {
          userCedula: cedula,
          taskId,
          dayKey,
        })
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(agendaQueryKey, ctx.previous)
    },
    onSuccess: () => {
      invalidate()
      void qc.invalidateQueries({ queryKey: ['goals', cedula] })
    },
  })

  const addTask = useMutation({
    mutationFn: async (vars: {
      title: string
      startMin: number
      endMin: number
      goalId?: string | null
    }) => {
      if (!cedula) throw new Error('Sin sesión')
      const taskId = await insertAgendaTask(requireSupabase(), {
        user_cedula: cedula,
        task_date: dayKey,
        title: vars.title,
        start_min: vars.startMin,
        end_min: vars.endMin,
        goal_id: vars.goalId ? Number(vars.goalId) : undefined,
      })
      return {
        id: String(taskId),
        title: vars.title,
        startMin: vars.startMin,
        endMin: vars.endMin,
        completed: false,
        subtasks: [],
      } satisfies AgendaTask
    },
    onSuccess: (createdTask) => {
      qc.setQueryData<AgendaTask[]>(agendaQueryKey, (curr = []) => {
        if (curr.some((task) => task.id === createdTask.id)) return curr
        return [...curr, createdTask]
      })
    },
    onSettled: () => {
      invalidate()
      void qc.invalidateQueries({ queryKey: ['goals', cedula] })
    },
  })

  const updateTask = useMutation({
    onMutate: async (vars: {
      id: string
      patch: Partial<{
        title: string
        start_min: number
        end_min: number
        completed: boolean
      }>
    }) => {
      await qc.cancelQueries({ queryKey: agendaQueryKey })
      const previous = qc.getQueryData<AgendaTask[]>(agendaQueryKey)
      qc.setQueryData<AgendaTask[]>(agendaQueryKey, (curr = []) =>
        curr.map((task) =>
          task.id === vars.id
            ? {
                ...task,
                title: vars.patch.title ?? task.title,
                startMin: vars.patch.start_min ?? task.startMin,
                endMin: vars.patch.end_min ?? task.endMin,
                completed: vars.patch.completed ?? task.completed,
              }
            : task,
        ),
      )
      return { previous }
    },
    mutationFn: async (vars: {
      id: string
      patch: Partial<{
        title: string
        start_min: number
        end_min: number
        completed: boolean
      }>
    }) => {
      await updateAgendaTask(requireSupabase(), Number(vars.id), dayKey, {
        title: vars.patch.title,
        start_min: vars.patch.start_min,
        end_min: vars.patch.end_min,
        completed: vars.patch.completed,
      })
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(agendaQueryKey, ctx.previous)
    },
    onSuccess: invalidate,
  })

  const removeTask = useMutation({
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: agendaQueryKey })
      const previous = qc.getQueryData<AgendaTask[]>(agendaQueryKey)
      qc.setQueryData<AgendaTask[]>(agendaQueryKey, (curr = []) =>
        curr.filter((task) => task.id !== id),
      )
      return { previous }
    },
    mutationFn: async (id: string) => {
      await deleteAgendaTask(requireSupabase(), Number(id))
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(agendaQueryKey, ctx.previous)
    },
    onSuccess: invalidate,
  })

  const addSubtask = useMutation({
    mutationFn: async (vars: { taskId: string; title: string }) => {
      if (!cedula) throw new Error('Sin sesión')
      await insertAgendaSubtask(
        requireSupabase(),
        cedula,
        Number(vars.taskId),
        vars.title,
      )
    },
    onSuccess: invalidate,
  })

  const toggleSubtask = useMutation({
    mutationFn: async (vars: { subtaskId: string; completed: boolean }) => {
      if (!cedula) throw new Error('Sin sesión')
      await setAgendaSubtaskCompleted(
        requireSupabase(),
        cedula,
        Number(vars.subtaskId),
        vars.completed,
      )
    },
    onSuccess: invalidate,
  })

  const removeSubtask = useMutation({
    mutationFn: async (vars: { subtaskId: string }) => {
      if (!cedula) throw new Error('Sin sesión')
      await deleteAgendaSubtask(requireSupabase(), cedula, Number(vars.subtaskId))
    },
    onSuccess: invalidate,
  })

  const renameSubtask = useMutation({
    mutationFn: async (vars: { subtaskId: string; title: string }) => {
      if (!cedula) throw new Error('Sin sesión')
      await updateAgendaSubtaskTitle(
        requireSupabase(),
        cedula,
        Number(vars.subtaskId),
        vars.title,
      )
    },
    onSuccess: invalidate,
  })

  return {
    toggle,
    addTask,
    updateTask,
    removeTask,
    addSubtask,
    toggleSubtask,
    removeSubtask,
    renameSubtask,
  }
}
