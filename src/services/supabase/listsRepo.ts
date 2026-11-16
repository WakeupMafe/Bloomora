import type { SupabaseClient } from '@supabase/supabase-js'

export type ListRow = {
  id: number
  user_cedula: string
  title: string
  sort_order: number
  postit_palette: string | null
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

export async function updateListPostitPalette(
  sb: SupabaseClient,
  listId: number,
  palette: string,
) {
  const { error } = await sb
    .from('lists')
    .update({ postit_palette: palette })
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

export type ListItemStats = { done: number; total: number }

/** Conteos done/total por lista (sin cambiar schema). */
export async function listItemStatsByListIds(
  sb: SupabaseClient,
  listIds: number[],
): Promise<Record<number, ListItemStats>> {
  const out: Record<number, ListItemStats> = {}
  for (const id of listIds) out[id] = { done: 0, total: 0 }
  if (listIds.length === 0) return out

  const { data, error } = await sb
    .from('list_items')
    .select('list_id, done')
    .in('list_id', listIds)
  if (error) throw error

  for (const row of data ?? []) {
    const listId = Number((row as { list_id: number }).list_id)
    const done = Boolean((row as { done: boolean }).done)
    const bucket = out[listId] ?? { done: 0, total: 0 }
    bucket.total += 1
    if (done) bucket.done += 1
    out[listId] = bucket
  }
  return out
}

export async function clearCompletedListItems(
  sb: SupabaseClient,
  listId: number,
) {
  const { error } = await sb
    .from('list_items')
    .delete()
    .eq('list_id', listId)
    .eq('done', true)
  if (error) throw error
}

export async function markListItemsDone(
  sb: SupabaseClient,
  itemIds: number[],
  done: boolean,
) {
  if (itemIds.length === 0) return
  const { error } = await sb
    .from('list_items')
    .update({ done })
    .in('id', itemIds)
  if (error) throw error
}

export async function deleteListItems(sb: SupabaseClient, itemIds: number[]) {
  if (itemIds.length === 0) return
  const { error } = await sb.from('list_items').delete().in('id', itemIds)
  if (error) throw error
}

export async function duplicateList(
  sb: SupabaseClient,
  userCedula: string,
  sourceListId: number,
  title: string,
): Promise<number> {
  const newId = await insertList(sb, userCedula, title)
  const items = await listListItems(sb, sourceListId)
  if (items.length === 0) return newId
  const { error } = await sb.from('list_items').insert(
    items.map((it) => ({
      list_id: newId,
      title: it.title,
      done: it.done,
      sort_order: it.sort_order,
    })),
  )
  if (error) throw error
  return newId
}

export async function reinsertListItem(
  sb: SupabaseClient,
  listId: number,
  title: string,
  done: boolean,
  sortOrder?: number,
): Promise<number> {
  const payload: Record<string, unknown> = {
    list_id: listId,
    title: title.trim(),
    done,
  }
  if (sortOrder != null) payload.sort_order = sortOrder
  const { data, error } = await sb
    .from('list_items')
    .insert(payload)
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: number }).id
}
