import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { messageFromSupabaseError } from '@/lib/supabaseError'
import type { EnglishFlashcardInput } from '@/types/englishFlashcard'
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
  created_at: string
  updated_at: string
}

function trimOrNull(v: string | null | undefined): string | null {
  if (v == null) return null
  const t = v.trim()
  return t === '' ? null : t
}

function toRowPayload(input: EnglishFlashcardInput) {
  return {
    english_word: input.englishWord.trim(),
    pronunciation: trimOrNull(input.pronunciation ?? undefined),
    short_meaning: trimOrNull(input.shortMeaning ?? undefined),
    spanish_meaning: input.spanishMeaning.trim(),
    example_english: trimOrNull(input.exampleEnglish ?? undefined),
    example_spanish: trimOrNull(input.exampleSpanish ?? undefined),
    image_url: input.imageUrl.trim(),
    category: trimOrNull(input.category ?? undefined),
  }
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

export async function insertFlashcardEnglish(
  sb: SupabaseClient,
  userCedula: string,
  input: EnglishFlashcardInput,
): Promise<number> {
  await requireExistingProfileByCedula(sb, userCedula)
  const { data, error } = await sb
    .from('flashcards_english')
    .insert({ user_cedula: userCedula.trim(), ...toRowPayload(input) })
    .select('id')
    .single()
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
  input: EnglishFlashcardInput,
) {
  const { error } = await sb
    .from('flashcards_english')
    .update(toRowPayload(input))
    .eq('id', id)
  if (error) throwRepoError(error)
}

export async function deleteFlashcardEnglish(sb: SupabaseClient, id: number) {
  const { error } = await sb.from('flashcards_english').delete().eq('id', id)
  if (error) throwRepoError(error)
}
