import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { messageFromSupabaseError } from '@/lib/supabaseError'
import type { EnglishFlashcardInput } from '@/types/englishFlashcard'
import { FLASHCARD_NO_IMAGE_PLACEHOLDER } from '@/types/englishFlashcard'
import { requireExistingProfileByCedula } from '@/services/supabase/profilesRepo'

function throwRepoError(error: PostgrestError | null): never {
  throw new Error(messageFromSupabaseError(error))
}

export type FlashcardEnglishRow = {
  id: number
  user_cedula: string
  english_word: string
  pronunciation: string | null
  short_meaning: string | null
  spanish_meaning: string
  example_english: string | null
  example_spanish: string | null
  image_url: string
  category: string | null
  entry_mode?: string | null
  is_quick_draft?: boolean | null
  created_at: string
  updated_at: string
}

function trimOrNull(v: string | null | undefined): string | null {
  if (v == null) return null
  const t = v.trim()
  return t === '' ? null : t
}

const QUICK_MODE_COLUMNS = ['entry_mode', 'is_quick_draft'] as const

function toRowPayload(
  input: EnglishFlashcardInput,
  options?: { omitQuickModeColumns?: boolean },
) {
  const payload: Record<string, unknown> = {
    english_word: input.englishWord.trim(),
    pronunciation: trimOrNull(input.pronunciation ?? undefined),
    short_meaning: trimOrNull(input.shortMeaning ?? undefined),
    spanish_meaning: input.spanishMeaning.trim(),
    example_english: trimOrNull(input.exampleEnglish ?? undefined),
    example_spanish: trimOrNull(input.exampleSpanish ?? undefined),
    image_url: input.imageUrl.trim() || FLASHCARD_NO_IMAGE_PLACEHOLDER,
    category: trimOrNull(input.category ?? undefined),
  }

  if (!options?.omitQuickModeColumns) {
    if (input.entryMode !== undefined) payload.entry_mode = input.entryMode
    if (input.isQuickDraft !== undefined) {
      payload.is_quick_draft = input.isQuickDraft
    }
  }

  // #region agent log
  fetch('http://127.0.0.1:7456/ingest/594cd47e-fee9-409f-a398-14304ffe61d5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9d7052'},body:JSON.stringify({sessionId:'9d7052',runId:'post-fix',hypothesisId:'A',location:'flashcardsEnglishRepo.ts:toRowPayload',message:'flashcard row payload keys',data:{keys:Object.keys(payload),hasEntryMode:Object.prototype.hasOwnProperty.call(payload,'entry_mode'),hasQuickDraft:Object.prototype.hasOwnProperty.call(payload,'is_quick_draft'),entryMode:payload.entry_mode ?? null,isQuickDraft:payload.is_quick_draft ?? null,omitQuickModeColumns:!!options?.omitQuickModeColumns},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return payload
}

function isMissingQuickModeColumnError(error: PostgrestError | null): boolean {
  if (!error?.message) return false
  const msg = error.message
  return (
    /schema cache/i.test(msg) &&
    (/entry_mode/i.test(msg) || /is_quick_draft/i.test(msg))
  )
}

function stripQuickModeColumns(payload: Record<string, unknown>) {
  const next = { ...payload }
  for (const key of QUICK_MODE_COLUMNS) delete next[key]
  return next
}

export async function listFlashcardsEnglish(
  sb: SupabaseClient,
  userCedula: string,
): Promise<FlashcardEnglishRow[]> {
  const { data, error } = await sb
    .from('flashcards_english')
    .select('*')
    .eq('user_cedula', userCedula)
    .order('created_at', { ascending: false })
  if (error) throwRepoError(error)
  return (data ?? []) as FlashcardEnglishRow[]
}

export type FlashcardEnglishPreviewRow = Pick<
  FlashcardEnglishRow,
  'id' | 'english_word' | 'category' | 'image_url'
>

/** Vista ligera para el dashboard (evita traer todas las columnas/filas). */
export async function listFlashcardsEnglishPreview(
  sb: SupabaseClient,
  userCedula: string,
  limit: number,
): Promise<FlashcardEnglishPreviewRow[]> {
  const { data, error } = await sb
    .from('flashcards_english')
    .select('id, english_word, category, image_url')
    .eq('user_cedula', userCedula)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throwRepoError(error)
  return (data ?? []) as FlashcardEnglishPreviewRow[]
}

export async function listFlashcardsEnglishCategories(
  sb: SupabaseClient,
  userCedula: string,
): Promise<(string | null)[]> {
  const { data, error } = await sb
    .from('flashcards_english')
    .select('category')
    .eq('user_cedula', userCedula)
  if (error) throwRepoError(error)
  return (data ?? []).map((r) => (r as { category: string | null }).category)
}

export async function countFlashcardsEnglish(
  sb: SupabaseClient,
  userCedula: string,
): Promise<number> {
  const { count, error } = await sb
    .from('flashcards_english')
    .select('id', { count: 'exact', head: true })
    .eq('user_cedula', userCedula)
  if (error) throwRepoError(error)
  return count ?? 0
}

export async function insertFlashcardEnglish(
  sb: SupabaseClient,
  userCedula: string,
  input: EnglishFlashcardInput,
): Promise<number> {
  await requireExistingProfileByCedula(sb, userCedula)
  let payload: Record<string, unknown> = {
    user_cedula: userCedula.trim(),
    ...toRowPayload(input),
  }
  let { data, error } = await sb
    .from('flashcards_english')
    .insert(payload)
    .select('id')
    .single()

  // BD sin migración de modo rápido: reintentar sin entry_mode / is_quick_draft.
  if (error && isMissingQuickModeColumnError(error)) {
    payload = stripQuickModeColumns(payload)
    // #region agent log
    fetch('http://127.0.0.1:7456/ingest/594cd47e-fee9-409f-a398-14304ffe61d5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9d7052'},body:JSON.stringify({sessionId:'9d7052',runId:'post-fix',hypothesisId:'F',location:'flashcardsEnglishRepo.ts:insertFlashcardEnglish',message:'retry insert without quick-mode columns',data:{firstError:error.message,retryKeys:Object.keys(payload)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    ;({ data, error } = await sb
      .from('flashcards_english')
      .insert(payload)
      .select('id')
      .single())
  }

  // #region agent log
  fetch('http://127.0.0.1:7456/ingest/594cd47e-fee9-409f-a398-14304ffe61d5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9d7052'},body:JSON.stringify({sessionId:'9d7052',runId:'post-fix',hypothesisId:'B',location:'flashcardsEnglishRepo.ts:insertFlashcardEnglish',message:'insert result',data:{ok:!error,errorMessage:error?.message ?? null,errorCode:(error as {code?:string}|null)?.code ?? null,errorDetails:error?.details ?? null,payloadKeys:Object.keys(payload)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (error) throwRepoError(error)
  const row = data as { id: number } | null
  if (!row?.id) {
    throw new Error(
      'La tabla flashcards_english no devolvió id. Ejecuta el SQL de reparación en Supabase.',
    )
  }
  return row.id
}

export async function updateFlashcardEnglish(
  sb: SupabaseClient,
  id: number,
  userCedula: string,
  input: EnglishFlashcardInput,
) {
  let payload = toRowPayload(input)
  let { error } = await sb
    .from('flashcards_english')
    .update(payload)
    .eq('id', id)
    .eq('user_cedula', userCedula.trim())

  if (error && isMissingQuickModeColumnError(error)) {
    payload = stripQuickModeColumns(payload)
    // #region agent log
    fetch('http://127.0.0.1:7456/ingest/594cd47e-fee9-409f-a398-14304ffe61d5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9d7052'},body:JSON.stringify({sessionId:'9d7052',runId:'post-fix',hypothesisId:'F',location:'flashcardsEnglishRepo.ts:updateFlashcardEnglish',message:'retry update without quick-mode columns',data:{firstError:error.message,retryKeys:Object.keys(payload)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    ;({ error } = await sb
      .from('flashcards_english')
      .update(payload)
      .eq('id', id)
      .eq('user_cedula', userCedula.trim()))
  }

  // #region agent log
  fetch('http://127.0.0.1:7456/ingest/594cd47e-fee9-409f-a398-14304ffe61d5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9d7052'},body:JSON.stringify({sessionId:'9d7052',runId:'post-fix',hypothesisId:'C',location:'flashcardsEnglishRepo.ts:updateFlashcardEnglish',message:'update result',data:{ok:!error,errorMessage:error?.message ?? null,errorCode:(error as {code?:string}|null)?.code ?? null,payloadKeys:Object.keys(payload)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (error) throwRepoError(error)
}

export async function deleteFlashcardEnglish(
  sb: SupabaseClient,
  id: number,
  userCedula: string,
) {
  const { error } = await sb
    .from('flashcards_english')
    .delete()
    .eq('id', id)
    .eq('user_cedula', userCedula.trim())
  if (error) throwRepoError(error)
}
