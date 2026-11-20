import { toBlob, getFontEmbedCSS } from 'html-to-image'
import type { ShareFormat } from '@/features/share-achievement/shareAchievementTypes'
import { SHARE_EXPORT_SIZE } from '@/features/share-achievement/shareAchievementTypes'

let fontCssCache: Promise<string> | null = null

export async function cardElementToPngBlob(
  node: HTMLElement,
  format: ShareFormat,
): Promise<Blob> {
  const { width, height } = SHARE_EXPORT_SIZE[format]
  fontCssCache ??= getFontEmbedCSS(node)
  const fontEmbedCSS = await fontCssCache
  const blob = await toBlob(node, {
    width,
    height,
    pixelRatio: 1,
    cacheBust: false,
    fontEmbedCSS,
  })
  if (!blob) throw new Error('png-empty')
  return blob
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export async function shareOrDownloadPng(
  blob: Blob,
  filename: string,
): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' })
  const canShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    (!navigator.canShare || navigator.canShare({ files: [file] }))

  if (canShare) {
    try {
      await navigator.share({
        files: [file],
        title: 'Mi logro en Bloomora',
        text: 'Celebrando mi meta en Bloomora 🌸',
      })
      return 'shared'
    } catch (err) {
      // Usuario canceló o falló → fallback descarga
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err
      }
    }
  }
  downloadBlob(blob, filename)
  return 'downloaded'
}

export function slugifyShareName(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'meta'
}
