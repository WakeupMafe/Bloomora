import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DashboardList } from '@/types/dashboardLists'
import {
  insertList,
  listLists,
  type ListRow,
} from '@/services/supabase/listsRepo'
import { requireExistingProfileByCedula } from '@/services/supabase/profilesRepo'
import { requireSupabase } from '@/services/supabase/typedClient'

function rowToDashboardList(r: ListRow): DashboardList {
  return { id: String(r.id), title: r.title }
}

export function useBloomoraLists(cedula: string | null) {
  return useQuery({
    queryKey: ['lists', cedula],
    enabled: !!cedula,
    queryFn: async (): Promise<DashboardList[]> => {
      const sb = requireSupabase()
      await requireExistingProfileByCedula(sb, cedula!)
      const rows = await listLists(sb, cedula!)
      return rows.map(rowToDashboardList)
    },
  })
}

export function useAddListMutation(cedula: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (title: string) => {
      if (!cedula) throw new Error('Sin sesión')
      await insertList(requireSupabase(), cedula, title)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lists', cedula] })
    },
  })
}
