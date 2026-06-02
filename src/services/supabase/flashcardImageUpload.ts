import type { SupabaseClient } from '@supabase/supabase-js'
import { storageObjectPath } from '@/services/supabase/storageImageUpload'
import { compressImageFile, IMAGE_COMPRESS_PRESETS } from '@/utils/imageCompress'

const BUCKET = 'flashcard-images'

export type FlashcardImageUploadResult = {
  url: string
  compressed: File
}

/**
 * Comprime y sube imagen de flashcard al bucket público `flashcard-images`.
 */
export async function uploadFlashcardImage(
  sb: SupabaseClient,
  userCedula: string,
  file: File,
): Promise<FlashcardImageUploadResult> {
  const compressed = await compressImageFile(file, IMAGE_COMPRESS_PRESETS.flashcard)
  const safeCedula = userCedula.replace(/\D/g, '') || 'user'
  const path = storageObjectPath(safeCedula, 'jpg')
  const { error } = await sb.storage.from(BUCKET).upload(path, compressed, {
    upsert: true,
    contentType: compressed.type || 'image/jpeg',
    cacheControl: '31536000',
  })
  if (error) throw error
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, compressed }
}
