import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DashboardList } from '@/types/dashboardLists'
import {
  duplicateList,
  insertList,
  listItemStatsByListIds,
  listLists,
  type ListRow,
} from '@/services/supabase/listsRepo'
import { requireExistingProfileByCedula } from '@/services/supabase/profilesRepo'
import { requireSupabase } from '@/services/supabase/typedClient'

function rowToDashboardList(
  r: ListRow,
  stats?: { done: number; total: number },
): DashboardList {
  return {
    id: String(r.id),
    title: r.title,
    doneCount: stats?.done ?? 0,
    totalCount: stats?.total ?? 0,
    updatedAt: r.updated_at ?? null,
  }
}

export function useBloomoraLists(cedula: string | null) {
  return useQuery({
    queryKey: ['lists', cedula],
    enabled: !!cedula,
    queryFn: async (): Promise<DashboardList[]> => {
      const sb = requireSupabase()
      await requireExistingProfileByCedula(sb, cedula!)
      const rows = await listLists(sb, cedula!)
      const stats = await listItemStatsByListIds(
        sb,
        rows.map((r) => r.id),
      )
      return rows.map((r) => rowToDashboardList(r, stats[r.id]))
    },
  })
}

export function useAddListMutation(cedula: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (title: string) => {
      if (!cedula) throw new Error('Sin sesión')
      return insertList(requireSupabase(), cedula, title)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lists', cedula] })
    },
  })
}

export function useDuplicateListMutation(cedula: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { listId: string; title: string }) => {
      if (!cedula) throw new Error('Sin sesión')
      return duplicateList(
        requireSupabase(),
        cedula,
        Number(vars.listId),
        vars.title,
      )
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lists', cedula] })
    },
  })
}
