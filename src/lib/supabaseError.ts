import type { PostgrestError } from '@supabase/supabase-js'

/** Mensaje legible para toasts / errores de mutación. */
export function messageFromSupabaseError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const e = err as PostgrestError
    const parts = [e.message, e.details, e.hint].filter(Boolean)
    if (parts.length > 0) return parts.join(' — ')
  }
  if (err instanceof Error) return err.message
  return 'Error desconocido al conectar con Supabase.'
}
