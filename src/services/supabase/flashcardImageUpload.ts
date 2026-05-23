import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'flashcard-images'

/**
 * Sube imagen de flashcard al bucket público `flashcard-images`
 * (ruta `{cedula}/{timestamp}.ext`). Requiere políticas de Storage para `anon`.
 */
export async function uploadFlashcardImage(
  sb: SupabaseClient,
  userCedula: string,
  file: File,
): Promise<string> {
  const ext =
    (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') ||
    'jpg'
  const safeCedula = userCedula.replace(/\D/g, '') || 'user'
  const path = `${safeCedula}/${Date.now()}.${ext}`
  const { error } = await sb.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || 'image/jpeg',
  })
  if (error) throw error
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
