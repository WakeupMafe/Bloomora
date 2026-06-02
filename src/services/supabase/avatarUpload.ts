import type { SupabaseClient } from '@supabase/supabase-js'
import {
  storageObjectPath,
  uploadCompressedImage,
} from '@/services/supabase/storageImageUpload'

const BUCKET = 'avatars'

/**
 * Sube avatar comprimido al bucket público `avatars`.
 */
export async function uploadUserAvatar(
  sb: SupabaseClient,
  phone: string,
  file: File,
): Promise<string> {
  const safePhone = phone.replace(/\D/g, '') || 'user'
  const path = storageObjectPath(safePhone, 'jpg')
  return uploadCompressedImage(sb, BUCKET, path, file, 'avatar')
}
