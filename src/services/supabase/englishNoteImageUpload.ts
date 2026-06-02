import type { SupabaseClient } from '@supabase/supabase-js'
import {
  storageObjectPath,
  uploadCompressedImage,
} from '@/services/supabase/storageImageUpload'
import { compressImageFile, dataUrlToFile, IMAGE_COMPRESS_PRESETS } from '@/utils/imageCompress'

const BUCKET = 'english-note-images'

export async function uploadEnglishNoteImage(
  sb: SupabaseClient,
  userCedula: string,
  file: File,
): Promise<string> {
  const safeCedula = userCedula.replace(/\D/g, '') || 'user'
  const path = storageObjectPath(safeCedula, 'jpg')
  return uploadCompressedImage(sb, BUCKET, path, file, 'note')
}

/** Convierte data URL → comprime → sube (migración de apuntes antiguos). */
export async function uploadEnglishNoteImageFromDataUrl(
  sb: SupabaseClient,
  userCedula: string,
  dataUrl: string,
): Promise<string> {
  const raw = dataUrlToFile(dataUrl)
  const compressed = await compressImageFile(raw, IMAGE_COMPRESS_PRESETS.note)
  return uploadEnglishNoteImage(sb, userCedula, compressed)
}
