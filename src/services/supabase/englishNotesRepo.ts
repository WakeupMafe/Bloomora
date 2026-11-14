import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { messageFromSupabaseError } from '@/lib/supabaseError'
import { requireExistingProfileByCedula } from '@/services/supabase/profilesRepo'
import type {
  EnglishNoteColor,
  EnglishNoteInput,
  EnglishNotePageSize,
  EnglishNotePatch,
  EnglishNotesListScope,
  EnglishNoteTitleFont,
} from '@/types/englishNote'

function throwRepoError(error: PostgrestError | null): never {
  throw new Error(messageFromSupabaseError(error))
}

export type EnglishNoteRow = {
  id: number
  user_cedula: string
  title: string
  category: string | null
  title_font: string
  title_color: string
  page_size: string
  page_number_enabled: boolean
  two_columns: boolean
  content_html: string
  plain_text: string
  cover_image_url: string | null
  is_favorite: boolean | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

/** Columnas ligeras para la lista (sin HTML pesado). */
export type EnglishNoteListRow = Omit<EnglishNoteRow, 'content_html' | 'plain_text'>

const ENGLISH_NOTE_LIST_COLUMNS =
  'id, user_cedula, title, category, title_font, title_color, page_size, page_number_enabled, two_columns, cover_image_url, is_favorite, deleted_at, created_at, updated_at'

/** Soft-deleted notes older than this are treated as expired (permanent purge). */
export const ENGLISH_NOTES_TRASH_RETENTION_DAYS = 30

function trashCutoffIso(now = Date.now()): string {
  return new Date(
    now - ENGLISH_NOTES_TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()
}

function trimOrNull(v: string | null | undefined): string | null {
  if (v == null) return null
  const t = v.trim()
  return t === '' ? null : t
}

function toRowPayload(input: EnglishNotePatch) {
  const patch: Record<string, unknown> = {}
  if (input.title !== undefined) patch.title = input.title
  if (input.category !== undefined) patch.category = trimOrNull(input.category)
  if (input.titleFont !== undefined) patch.title_font = input.titleFont
  if (input.titleColor !== undefined) patch.title_color = input.titleColor
  if (input.pageSize !== undefined) patch.page_size = input.pageSize
  if (input.pageNumberEnabled !== undefined) {
    patch.page_number_enabled = input.pageNumberEnabled
  }
  if (input.twoColumns !== undefined) patch.two_columns = input.twoColumns
  if (input.contentHtml !== undefined) patch.content_html = input.contentHtml
  if (input.plainText !== undefined) patch.plain_text = input.plainText
  if (input.coverImageUrl !== undefined) {
    patch.cover_image_url = trimOrNull(input.coverImageUrl)
  }
  if (input.isFavorite !== undefined) patch.is_favorite = input.isFavorite
  if (input.deletedAt !== undefined) patch.deleted_at = input.deletedAt
  return patch
}

const DEFAULT_NOTE_INPUT: EnglishNoteInput = {
  title: '',
  category: null,
  titleFont: 'popis',
  titleColor: 'black',
  pageSize: 'letter',
  pageNumberEnabled: false,
  twoColumns: false,
  contentHtml: '<p><br /></p>',
  plainText: '',
  coverImageUrl: null,
  isFavorite: false,
  deletedAt: null,
}

export async function listEnglishNotes(
  sb: SupabaseClient,
  userCedula: string,
  scope: EnglishNotesListScope = 'active',
): Promise<EnglishNoteListRow[]> {
  const cedula = userCedula.trim()
  let query = sb
    .from('english_notes')
    .select(ENGLISH_NOTE_LIST_COLUMNS)
    .eq('user_cedula', cedula)

  if (scope === 'trash') {
    const cutoff = trashCutoffIso()
    query = query
      .not('deleted_at', 'is', null)
      .gte('deleted_at', cutoff)
      .order('deleted_at', { ascending: false })
  } else {
    query = query.is('deleted_at', null).order('updated_at', { ascending: false })
  }

  const { data, error } = await query
  if (error) throwRepoError(error)
  return (data ?? []) as EnglishNoteListRow[]
}

export async function getEnglishNoteById(
  sb: SupabaseClient,
  userCedula: string,
  noteId: number,
): Promise<EnglishNoteRow> {
  const { data, error } = await sb
    .from('english_notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_cedula', userCedula.trim())
    .single()
  if (error) throwRepoError(error)
  return data as EnglishNoteRow
}

export async function insertEnglishNote(
  sb: SupabaseClient,
  userCedula: string,
  input?: Partial<EnglishNoteInput>,
): Promise<number> {
  await requireExistingProfileByCedula(sb, userCedula)
  const merged = { ...DEFAULT_NOTE_INPUT, ...input, deletedAt: null }
  const { data, error } = await sb
    .from('english_notes')
    .insert({
      user_cedula: userCedula.trim(),
      ...toRowPayload(merged),
    })
    .select('id')
    .single()
  if (error) throwRepoError(error)
  const row = data as { id: number } | null
  if (!row?.id) {
    throw new Error(
      'La tabla english_notes no devolvió id. Ejecuta la migración en Supabase.',
    )
  }
  return row.id
}

export async function updateEnglishNote(
  sb: SupabaseClient,
  noteId: number,
  userCedula: string,
  patch: EnglishNotePatch,
): Promise<void> {
  const payload = toRowPayload(patch)
  if (Object.keys(payload).length === 0) return
  const { error } = await sb
    .from('english_notes')
    .update(payload)
    .eq('id', noteId)
    .eq('user_cedula', userCedula.trim())
  if (error) throwRepoError(error)
}

export async function softDeleteEnglishNote(
  sb: SupabaseClient,
  noteId: number,
  userCedula: string,
): Promise<void> {
  await updateEnglishNote(sb, noteId, userCedula, {
    deletedAt: new Date().toISOString(),
  })
}

export async function restoreEnglishNote(
  sb: SupabaseClient,
  noteId: number,
  userCedula: string,
): Promise<void> {
  await updateEnglishNote(sb, noteId, userCedula, { deletedAt: null })
}

export async function deleteEnglishNote(
  sb: SupabaseClient,
  noteId: number,
  userCedula: string,
): Promise<void> {
  const { error } = await sb
    .from('english_notes')
    .delete()
    .eq('id', noteId)
    .eq('user_cedula', userCedula.trim())
  if (error) throwRepoError(error)
}

/** Borra de forma permanente apuntes en papelera con más de 30 días. */
export async function purgeExpiredTrashedEnglishNotes(
  sb: SupabaseClient,
  userCedula: string,
): Promise<number> {
  const { data, error } = await sb
    .from('english_notes')
    .delete()
    .eq('user_cedula', userCedula.trim())
    .not('deleted_at', 'is', null)
    .lt('deleted_at', trashCutoffIso())
    .select('id')
  if (error) throwRepoError(error)
  return data?.length ?? 0
}

export function rowToEnglishNote(row: EnglishNoteRow) {
  return {
    id: String(row.id),
    userCedula: row.user_cedula,
    title: row.title,
    category: row.category,
    titleFont: row.title_font as EnglishNoteTitleFont,
    titleColor: row.title_color as EnglishNoteColor,
    pageSize: row.page_size as EnglishNotePageSize,
    pageNumberEnabled: row.page_number_enabled,
    twoColumns: row.two_columns,
    contentHtml: row.content_html,
    plainText: row.plain_text,
    coverImageUrl: row.cover_image_url,
    isFavorite: !!row.is_favorite,
    deletedAt: row.deleted_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function rowToEnglishNoteListItem(row: EnglishNoteListRow) {
  return rowToEnglishNote({
    ...row,
    content_html: '',
    plain_text: '',
  })
}
