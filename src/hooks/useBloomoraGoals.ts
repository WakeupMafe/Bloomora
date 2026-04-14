import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MockGoalRow } from '@/data/dashboardMock'
import { monthKey } from '@/features/goals/goalTrackerUtils'
import { dbGoalToUi } from '@/services/supabase/goalMappers'
import {
  deleteGoal,
  deleteGoalsByCedula,
  insertGoal,
  listGoals,
  updateGoalFields,
  updateGoalTrackerColor,
} from '@/services/supabase/goalsRepo'
import {
  fetchMarksByUser,
  groupMarksByGoal,
  toggleGoalDayMark,
} from '@/services/supabase/goalMarksRepo'
import { requireExistingProfileByCedula } from '@/services/supabase/profilesRepo'
import { requireSupabase } from '@/services/supabase/typedClient'

export function useBloomoraGoals(cedula: string | null) {
  return useQuery({
    queryKey: ['goals', cedula],
    enabled: !!cedula,
    queryFn: async (): Promise<MockGoalRow[]> => {
      const sb = requireSupabase()
      const c = cedula!
      await requireExistingProfileByCedula(sb, c)
      const goals = await listGoals(sb, c)
      const marks = await fetchMarksByUser(sb, c)
      const grouped = groupMarksByGoal(marks)
      return goals.map((g) =>
        dbGoalToUi(g, grouped[String(g.id)] ?? {}),
      )
    },
  })
}

export function useToggleGoalDayMutation(cedula: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: {
      goalId: string
      year: number
      monthIndex0: number
      day: number
    }) => {
      if (!cedula) throw new Error('Sin sesión')
      await toggleGoalDayMark(requireSupabase(), {
        goalId: Number(vars.goalId),
        userCedula: cedula,
        yearMonth: monthKey(vars.year, vars.monthIndex0),
        day: vars.day,
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals', cedula] })
    },
  })
}

export function useUpdateGoalTrackerColorMutation(cedula: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { goalId: string; trackerColorId: string }) => {
      await updateGoalTrackerColor(
        requireSupabase(),
        Number(vars.goalId),
        vars.trackerColorId,
      )
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals', cedula] })
    },
  })
}

export function useDeleteGoalMutation(cedula: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (goalId: string) => {
      await deleteGoal(requireSupabase(), Number(goalId))
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals', cedula] })
    },
  })
}

export function useClearGoalsMutation(cedula: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (!cedula) throw new Error('Sin sesión')
      await deleteGoalsByCedula(requireSupabase(), cedula)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals', cedula] })
    },
  })
}

export function useInsertGoalMutation(cedula: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (fields: {
      title: string
      accent?: string
      variant?: string
      progress_label?: string | null
      percent_display?: number
      goal_type?: string
      target_value?: number | null
      current_value?: number
      unit?: string | null
      frequency?: string | null
    }) => {
      if (!cedula) throw new Error('Sin sesión')
      await insertGoal(requireSupabase(), cedula, fields)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals', cedula] })
    },
  })
}

export function useUpdateGoalFieldsMutation(cedula: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: {
      goalId: string
      patch: Partial<{
        title: string
        accent: string
        variant: string
        progress_label: string | null
        percent_display: number
        tracker_color_id: string | null
      }>
    }) => {
      await updateGoalFields(
        requireSupabase(),
        Number(vars.goalId),
        vars.patch,
      )
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals', cedula] })
    },
  })
}
