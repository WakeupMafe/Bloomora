import { toPng } from 'html-to-image'
import type { UiListItem } from '@/hooks/useBloomoraListItems'

export function formatListAsText(opts: {
  title: string
  emoji: string
  items: UiListItem[]
}): string {
  const pending = opts.items.filter((i) => !i.done)
  const done = opts.items.filter((i) => i.done)
  const lines: string[] = [`${opts.emoji} ${opts.title}`, '']

  if (pending.length > 0) {
    lines.push('PENDIENTES')
    for (const it of pending) lines.push(`☐ ${it.title}`)
    lines.push('')
  }
  if (done.length > 0) {
    lines.push('HECHOS')
    for (const it of done) lines.push(`☑ ${it.title}`)
    lines.push('')
  }
  if (opts.items.length === 0) {
    lines.push('(Lista vacía)')
    lines.push('')
  }

  lines.push(`— Bloomora · ${pending.length} pendientes · ${done.length} hechos`)
  return lines.join('\n')
}

export function slugifyListName(title: string): string {
  return (
    title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'lista'
  )
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  ta.remove()
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function copyOrDownloadListImage(
  node: HTMLElement,
  filename: string,
): Promise<'copied' | 'downloaded' | 'shared'> {
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#faf8ff',
  })
  const res = await fetch(dataUrl)
  const blob = await res.blob()

  try {
    if (
      typeof ClipboardItem !== 'undefined' &&
      navigator.clipboard?.write
    ) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      return 'copied'
    }
  } catch {
    /* fallback abajo */
  }

  const file = new File([blob], filename, { type: 'image/png' })
  const canShare =
    typeof navigator.share === 'function' &&
    (!navigator.canShare || navigator.canShare({ files: [file] }))
  if (canShare) {
    try {
      await navigator.share({
        files: [file],
        title: 'Mi lista en Bloomora',
      })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
    }
  }

  downloadBlob(blob, filename)
  return 'downloaded'
}

/** Monta una tarjeta temporal, exporta PNG y la elimina. */
export async function renderAndExportListImage(opts: {
  title: string
  emoji: string
  items: UiListItem[]
}): Promise<'copied' | 'downloaded' | 'shared'> {
  const pending = opts.items.filter((i) => !i.done)
  const done = opts.items.filter((i) => i.done)

  const wrap = document.createElement('div')
  wrap.setAttribute('aria-hidden', 'true')
  wrap.style.cssText =
    'position:fixed;left:-10000px;top:0;z-index:-1;pointer-events:none;'

  const card = document.createElement('div')
  card.style.cssText = [
    'width:420px',
    'box-sizing:border-box',
    'padding:28px 24px 22px',
    'border-radius:28px',
    'background:#ffffff',
    'border:1px solid rgba(91,74,140,0.12)',
    'font-family:Quicksand,system-ui,sans-serif',
    'color:#5b4a8c',
  ].join(';')

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:16px;'
  const icon = document.createElement('div')
  icon.style.cssText =
    'width:48px;height:48px;border-radius:14px;background:#fdeef4;display:grid;place-items:center;font-size:24px;'
  icon.textContent = opts.emoji
  const titles = document.createElement('div')
  const h = document.createElement('div')
  h.style.cssText = 'font-weight:700;font-size:20px;line-height:1.2;color:#5b4a8c;'
  h.textContent = opts.title
  const sub = document.createElement('div')
  sub.style.cssText = 'font-size:13px;font-weight:600;color:#8b7fb0;margin-top:2px;'
  sub.textContent = `${pending.length} pendientes · ${done.length} hechos`
  titles.append(h, sub)
  header.append(icon, titles)

  const body = document.createElement('div')
  body.style.cssText = 'display:flex;flex-direction:column;gap:14px;'

  const section = (label: string, items: UiListItem[], mark: string) => {
    if (items.length === 0) return
    const box = document.createElement('div')
    const lab = document.createElement('div')
    lab.style.cssText =
      'font-size:11px;font-weight:700;letter-spacing:0.08em;color:#8b7fb0;margin-bottom:8px;'
    lab.textContent = `${label} · ${items.length}`
    box.append(lab)
    for (const it of items) {
      const row = document.createElement('div')
      row.style.cssText =
        'display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border-radius:12px;background:#f3f0fb;margin-bottom:6px;'
      const check = document.createElement('span')
      check.style.cssText = 'font-size:14px;line-height:1.4;'
      check.textContent = mark
      const text = document.createElement('span')
      text.style.cssText = `font-size:14px;font-weight:600;line-height:1.35;color:${
        mark === '☑' ? '#8b7fb0' : '#5b4a8c'
      };${mark === '☑' ? 'text-decoration:line-through;' : ''}`
      text.textContent = it.title
      row.append(check, text)
      box.append(row)
    }
    body.append(box)
  }

  if (opts.items.length === 0) {
    const empty = document.createElement('div')
    empty.style.cssText =
      'padding:20px;text-align:center;font-size:14px;font-weight:600;color:#8b7fb0;background:#f3f0fb;border-radius:16px;'
    empty.textContent = 'Lista vacía'
    body.append(empty)
  } else {
    section('PENDIENTES', pending, '☐')
    section('HECHOS', done, '☑')
  }

  const foot = document.createElement('div')
  foot.style.cssText =
    'margin-top:18px;padding-top:12px;border-top:1px solid rgba(91,74,140,0.1);font-size:12px;font-weight:700;color:#e89bb8;text-align:center;'
  foot.textContent = 'Bloomora'

  card.append(header, body, foot)
  wrap.append(card)
  document.body.appendChild(wrap)

  try {
    // Esperar un frame para layout/fonts
    await new Promise((r) => requestAnimationFrame(() => r(undefined)))
    return await copyOrDownloadListImage(
      card,
      `lista-${slugifyListName(opts.title)}.png`,
    )
  } finally {
    wrap.remove()
  }
}
