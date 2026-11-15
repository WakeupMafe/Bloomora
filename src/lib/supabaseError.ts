import type { PostgrestError } from '@supabase/supabase-js'

const ENGLISH_NOTES_SCHEMA_HINT =
  'Ejecuta en Supabase → SQL Editor el archivo supabase/migrations/20260528_fix_english_notes.sql. ' +
  'Luego en Project Settings → API pulsa "Reload schema" (o espera 1 minuto) y recarga Bloomora.'

const FLASHCARDS_QUICK_MODE_SCHEMA_HINT =
  'Ejecuta en Supabase → SQL Editor el archivo supabase/migrations/20260531_flashcards_quick_mode_fix.sql. ' +
  'Luego en Project Settings → API pulsa "Reload schema" (o espera 1 minuto) y recarga Bloomora.'

/** Mensaje legible para toasts / errores de mutación. */
export function messageFromSupabaseError(err: unknown): string {
  const raw =
    err && typeof err === 'object' && 'message' in err
      ? String((err as PostgrestError).message ?? '')
      : err instanceof Error
        ? err.message
        : ''

  if (/content_html/i.test(raw) && /schema cache/i.test(raw)) {
    return `La tabla english_notes en Supabase no tiene la columna content_html. ${ENGLISH_NOTES_SCHEMA_HINT}`
  }
  if (/english_notes/i.test(raw) && /schema cache/i.test(raw)) {
    return `La tabla english_notes está desactualizada en Supabase. ${ENGLISH_NOTES_SCHEMA_HINT}`
  }
  if (
    /schema cache/i.test(raw) &&
    (/entry_mode/i.test(raw) || /is_quick_draft/i.test(raw) || /flashcards_english/i.test(raw))
  ) {
    return `La tabla flashcards_english en Supabase no tiene las columnas de modo rápido. ${FLASHCARDS_QUICK_MODE_SCHEMA_HINT}`
  }

  if (err && typeof err === 'object' && 'message' in err) {
    const e = err as PostgrestError
    const parts = [e.message, e.details, e.hint].filter(Boolean)
    if (parts.length > 0) return parts.join(' — ')
  }
  if (err instanceof Error) return err.message
  return 'Error desconocido al conectar con Supabase.'
}
