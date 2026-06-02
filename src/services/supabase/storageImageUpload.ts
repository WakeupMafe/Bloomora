import type { SupabaseClient } from '@supabase/supabase-js'
import {
  compressImageFile,
  IMAGE_COMPRESS_PRESETS,
  type ImageCompressPreset,
} from '@/utils/imageCompress'

export async function uploadCompressedImage(
  sb: SupabaseClient,
  bucket: string,
  objectPath: string,
  file: File,
  preset: ImageCompressPreset,
): Promise<string> {
  const compressed = await compressImageFile(file, IMAGE_COMPRESS_PRESETS[preset])
  const { error } = await sb.storage.from(bucket).upload(objectPath, compressed, {
    upsert: true,
    contentType: compressed.type || 'image/jpeg',
    cacheControl: '31536000',
  })
  if (error) throw error
  const { data } = sb.storage.from(bucket).getPublicUrl(objectPath)
  return data.publicUrl
}

export function storageObjectPath(
  folder: string,
  ext = 'jpg',
): string {
  const safe = folder.replace(/\D/g, '') || 'user'
  return `${safe}/${Date.now()}.${ext}`
}
