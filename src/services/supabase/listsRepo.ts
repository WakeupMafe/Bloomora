import type { SupabaseClient } from '@supabase/supabase-js'

export type ListRow = {
  id: number
  user_cedula: string
  title: string
  sort_order: number
  created_at: string
  updated_at: string
}

export type ListItemRow = {
  id: number
  list_id: number
  title: string
  done: boolean
  sort_order: number
}

export async function listLists(
  sb: SupabaseClient,
  userCedula: string,
): Promise<ListRow[]> {
  const { data, error } = await sb
    .from('lists')
    .select('*')
    .eq('user_cedula', userCedula)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw error
  return (data ?? []) as ListRow[]
}

export async function insertList(
  sb: SupabaseClient,
  userCedula: string,
  title: string,
): Promise<number> {
  const { data, error } = await sb
    .from('lists')
    .insert({ user_cedula: userCedula, title: title.trim() })
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: number }).id
}

export async function updateListTitle(
  sb: SupabaseClient,
  listId: number,
  title: string,
) {
  const { error } = await sb
    .from('lists')
    .update({ title: title.trim() })
    .eq('id', listId)
  if (error) throw error
}

export async function deleteList(sb: SupabaseClient, listId: number) {
  const { error } = await sb.from('lists').delete().eq('id', listId)
  if (error) throw error
}

export async function listListItems(
  sb: SupabaseClient,
  listId: number,
): Promise<ListItemRow[]> {
  const { data, error } = await sb
    .from('list_items')
    .select('*')
    .eq('list_id', listId)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw error
  return (data ?? []) as ListItemRow[]
}

export async function insertListItem(
  sb: SupabaseClient,
  listId: number,
  title: string,
): Promise<number> {
  const { data, error } = await sb
    .from('list_items')
    .insert({
      list_id: listId,
      title: title.trim(),
      done: false,
    })
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: number }).id
}

export async function updateListItem(
  sb: SupabaseClient,
  itemId: number,
  patch: Partial<Pick<ListItemRow, 'title' | 'done' | 'sort_order'>>,
) {
  const { error } = await sb.from('list_items').update(patch).eq('id', itemId)
  if (error) throw error
}

export async function deleteListItem(sb: SupabaseClient, itemId: number) {
  const { error } = await sb.from('list_items').delete().eq('id', itemId)
  if (error) throw error
}
