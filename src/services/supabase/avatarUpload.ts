import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'avatars'

/**
 * Sube a bucket público `avatars` (ruta `{phone}/{timestamp}.ext`).
 * Requiere políticas de Storage que permitan insert/select a `anon`.
 */
export async function uploadUserAvatar(
  sb: SupabaseClient,
  phone: string,
  file: File,
): Promise<string> {
  const ext =
    (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') ||
    'jpg'
  const safePhone = phone.replace(/\D/g, '')
  const path = `${safePhone}/${Date.now()}.${ext}`
  const { error } = await sb.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || 'image/jpeg',
  })
  if (error) throw error
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
