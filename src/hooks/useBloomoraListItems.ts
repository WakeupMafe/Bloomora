import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteList,
  deleteListItem,
  insertListItem,
  listListItems,
  updateListItem,
  updateListTitle,
  type ListItemRow,
} from '@/services/supabase/listsRepo'
import { requireSupabase } from '@/services/supabase/typedClient'

export type UiListItem = {
  id: string
  title: string
  done: boolean
}

function rowToUi(r: ListItemRow): UiListItem {
  return { id: String(r.id), title: r.title, done: r.done }
}

export function useBloomoraListItems(cedula: string | null, listId: string | null) {
  return useQuery({
    queryKey: ['listItems', cedula, listId],
    enabled: !!cedula && !!listId,
    queryFn: async (): Promise<UiListItem[]> => {
      const rows = await listListItems(
        requireSupabase(),
        Number(listId),
      )
      return rows.map(rowToUi)
    },
  })
}

export function useListItemsMutations(cedula: string | null, listId: string | null) {
  const qc = useQueryClient()
  const key = ['listItems', cedula, listId] as const
  const inv = () => {
    void qc.invalidateQueries({ queryKey: key })
    void qc.invalidateQueries({ queryKey: ['lists', cedula] })
  }

  const addItem = useMutation({
    mutationFn: async (title: string) => {
      if (!cedula || !listId) throw new Error('Sin lista')
      await insertListItem(requireSupabase(), Number(listId), title)
    },
    onSuccess: inv,
  })

  const toggleItem = useMutation({
    mutationFn: async (vars: { id: string; done: boolean }) => {
      await updateListItem(requireSupabase(), Number(vars.id), {
        done: vars.done,
      })
    },
    onSuccess: inv,
  })

  const renameItem = useMutation({
    mutationFn: async (vars: { id: string; title: string }) => {
      await updateListItem(requireSupabase(), Number(vars.id), {
        title: vars.title.trim(),
      })
    },
    onSuccess: inv,
  })

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      await deleteListItem(requireSupabase(), Number(id))
    },
    onSuccess: inv,
  })

  return { addItem, toggleItem, renameItem, removeItem }
}

export function useUpdateListTitleMutation(cedula: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { listId: string; title: string }) => {
      await updateListTitle(
        requireSupabase(),
        Number(vars.listId),
        vars.title,
      )
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lists', cedula] })
    },
  })
}

export function useDeleteListMutation(cedula: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (listId: string) => {
      await deleteList(requireSupabase(), Number(listId))
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lists', cedula] })
      void qc.invalidateQueries({ queryKey: ['listItems', cedula] })
    },
  })
}
