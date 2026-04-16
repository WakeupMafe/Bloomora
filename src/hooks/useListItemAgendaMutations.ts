import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import {
  insertAgendaSubtask,
  insertAgendaTask,
  listAgendaTasks,
} from '@/services/supabase/agendaRepo'
import { requireExistingProfileByCedula } from '@/services/supabase/profilesRepo'
import { requireSupabase } from '@/services/supabase/typedClient'

const DAY_END_MIN = 24 * 60 - 1

/** Tras la última tarea del día: empieza al minuto en que terminó la última; bloque de 30 min. Si no hay tareas, 9:00–9:30. */
export function computeNextAgendaBlockMinutes(
  tasks: { end_min: number }[],
): { startMin: number; endMin: number } {
  if (!tasks.length) {
    const s = 9 * 60
    return { startMin: s, endMin: s + 30 }
  }
  const lastEnd = Math.max(...tasks.map((t) => t.end_min))
  let startMin = lastEnd
  let endMin = startMin + 30
  if (endMin > DAY_END_MIN) {
    endMin = DAY_END_MIN
    startMin = Math.max(0, endMin - 30)
  }
  if (endMin <= startMin) {
    endMin = Math.min(DAY_END_MIN, startMin + 15)
  }
  return { startMin, endMin }
}

export function useListItemAgendaMutations(cedula: string | null) {
  const qc = useQueryClient()
  const { showToast } = useBloomoraToast()

  const invalidateAgenda = () => {
    void qc.invalidateQueries({ queryKey: ['agenda', cedula] })
    void qc.invalidateQueries({ queryKey: ['goals', cedula] })
  }

  const createTaskFromListItem = useMutation({
    mutationFn: async (vars: { dayKey: string; title: string }) => {
      if (!cedula) throw new Error('Sin sesión')
      const sb = requireSupabase()
      await requireExistingProfileByCedula(sb, cedula)
      const tasks = await listAgendaTasks(sb, cedula, vars.dayKey)
      const { startMin, endMin } = computeNextAgendaBlockMinutes(tasks)
      const id = await insertAgendaTask(sb, {
        user_cedula: cedula,
        task_date: vars.dayKey,
        title: vars.title,
        start_min: startMin,
        end_min: endMin,
      })
      return { id, dayKey: vars.dayKey }
    },
    onSuccess: () => {
      invalidateAgenda()
    },
  })

  const addSubtaskFromListItem = useMutation({
    mutationFn: async (vars: { taskId: number; title: string }) => {
      if (!cedula) throw new Error('Sin sesión')
      await insertAgendaSubtask(requireSupabase(), cedula, vars.taskId, vars.title)
    },
    onSuccess: () => {
      invalidateAgenda()
    },
  })

  return {
    createTaskFromListItem,
    addSubtaskFromListItem,
    showToast,
  }
}
