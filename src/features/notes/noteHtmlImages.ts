import type { SupabaseClient } from '@supabase/supabase-js'
import { uploadEnglishNoteImageFromDataUrl } from '@/services/supabase/englishNoteImageUpload'
import { optimizeImageUrl } from '@/utils/imageUrl'

function parseNoteHtmlRoot(html: string): HTMLElement | null {
  const doc = new DOMParser().parseFromString(
    `<div id="note-html-root">${html}</div>`,
    'text/html',
  )
  return doc.getElementById('note-html-root')
}

/** Sustituye data URLs por URLs de Storage (menos peso en Postgres). */
export async function uploadImagesInNoteHtml(
  sb: SupabaseClient,
  userCedula: string,
  html: string,
): Promise<string> {
  const root = parseNoteHtmlRoot(html)
  if (!root) return html

  const images = [...root.querySelectorAll('img')]
  for (const img of images) {
    const src = img.getAttribute('src')
    if (!src?.startsWith('data:image/')) continue
    try {
      const url = await uploadEnglishNoteImageFromDataUrl(sb, userCedula, src)
      img.setAttribute('src', url)
    } catch {
      /* conservar data URL si falla la subida */
    }
  }

  return root.innerHTML
}

/** URLs transformadas de Supabase para vista en editor (no modifica HTML guardado). */
export function optimizeNoteHtmlForDisplay(html: string): string {
  if (!html || !html.includes('storage/v1/object/public/')) return html

  const root = parseNoteHtmlRoot(html)
  if (!root) return html

  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src')
    if (!src) return
    const optimized = optimizeImageUrl(src, 'note')
    if (optimized !== src) {
      img.setAttribute('data-note-src', src)
      img.setAttribute('src', optimized)
    }
    img.setAttribute('loading', 'lazy')
    img.setAttribute('decoding', 'async')
  })

  return root.innerHTML
}

/** Restaura src originales de Storage antes de guardar (quita transform de vista). */
export function restoreNoteHtmlImageSources(html: string): string {
  if (!html.includes('data-note-src')) return html

  const root = parseNoteHtmlRoot(html)
  if (!root) return html

  root.querySelectorAll('img[data-note-src]').forEach((img) => {
    const original = img.getAttribute('data-note-src')
    if (original) img.setAttribute('src', original)
    img.removeAttribute('data-note-src')
  })

  return root.innerHTML
}
