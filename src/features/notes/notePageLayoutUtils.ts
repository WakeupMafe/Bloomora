import type { EnglishNotePageSize } from '@/types/englishNote'
import { normalizeSpacing } from '@/features/notes/noteSpacingModel.mjs'

export type NotePageSlice = { id: string; html: string }

export const NOTE_PAGE_HEIGHT: Record<EnglishNotePageSize, string> = {
  letter: '11in',
  a4: '297mm',
}

export const NOTE_PAGE_BREAK_HTML =
  '<div class="english-note-page-break" data-note-page-break="true" contenteditable="false" aria-hidden="true"></div>'

export function newNotePageId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `page-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function hasMeaningfulContent(node: Node): boolean {
  if (node.nodeType === Node.TEXT_NODE) {
    return !!node.textContent?.replace(/[\u200b\u00a0]/g, '').trim()
  }
  if (!(node instanceof HTMLElement)) return false
  if (node.matches('img,hr,canvas,video,audio,[data-note-block="true"]')) return true
  return [...node.childNodes].some(hasMeaningfulContent)
}

function clearLegacyTopOffset(block: HTMLElement): void {
  // The page already supplies its fixed top margin. Pasted first blocks must not
  // add a second CSS margin/padding before the text.
  block.style.marginTop = '0'
  block.style.marginBlockStart = '0'
  block.style.paddingTop = '0'
  block.style.paddingBlockStart = '0'
  const firstMeaningfulChild = [...block.children].find(hasMeaningfulContent) as HTMLElement | undefined
  if (firstMeaningfulChild && /^(P|DIV|H1|H2|H3|BLOCKQUOTE)$/.test(firstMeaningfulChild.tagName)) {
    clearLegacyTopOffset(firstMeaningfulChild)
  }
}

/** Removes blank paragraphs and breaks before the first real content, including inside pasted wrappers. */
export function cleanLeadingEmptyNoteBlocks(html: string): string {
  const doc = new DOMParser().parseFromString(`<div id="note-clean-root">${html}</div>`, 'text/html')
  const root = doc.getElementById('note-clean-root')
  if (!root) return html

  const stripLeading = (container: HTMLElement): void => {
    while (container.firstChild) {
      const first = container.firstChild
      if (!hasMeaningfulContent(first)) {
        first.remove()
        continue
      }
      if (first instanceof HTMLElement && /^(P|DIV|SECTION|ARTICLE|BLOCKQUOTE)$/.test(first.tagName)) {
        stripLeading(first)
        if (!hasMeaningfulContent(first)) {
          first.remove()
          continue
        }
      }
      break
    }
  }

  stripLeading(root)
  const firstBlock = root.firstElementChild as HTMLElement | null
  if (firstBlock) clearLegacyTopOffset(firstBlock)
  return root.innerHTML || '<p><br /></p>'
}

function lengthToPx(value: string, rootFontSize: number): number {
  const n = parseFloat(value)
  if (Number.isNaN(n)) return 0
  if (value.endsWith('in')) return n * 96
  if (value.endsWith('mm')) return (n * 96) / 25.4
  if (value.endsWith('px')) return n
  if (value.endsWith('rem')) return n * rootFontSize
  return n
}

/** Altura útil del área de escritura dentro de una hoja. */
export function getNotePageContentMaxHeightPx(
  sheetEl: HTMLElement,
  pageSize: EnglishNotePageSize,
): number {
  const rootFontSize =
    parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const pageHeightPx = lengthToPx(NOTE_PAGE_HEIGHT[pageSize], rootFontSize)
  const sheetStyles = getComputedStyle(sheetEl)
  const padTop = parseFloat(sheetStyles.paddingTop) || 0
  const padBottom = parseFloat(sheetStyles.paddingBottom) || 0
  const contentStyles = sheetEl.querySelector('.english-note-content')
    ? getComputedStyle(sheetEl.querySelector('.english-note-content')!)
    : null
  const contentPadTop = contentStyles ? parseFloat(contentStyles.paddingTop) || 0 : 0
  const contentPadBottom = contentStyles ? parseFloat(contentStyles.paddingBottom) || 0 : 0
  return Math.max(
    80,
    pageHeightPx - padTop - padBottom - contentPadTop - contentPadBottom,
  )
}

export function parseNotePagesFromHtml(html: string): NotePageSlice[] {
  const normalized = normalizeSpacing(html?.trim() || '')
  if (!normalized) {
    return [{ id: newNotePageId(), html: '<p><br /></p>' }]
  }

  const doc = new DOMParser().parseFromString(
    `<div id="note-pages-root">${normalized}</div>`,
    'text/html',
  )
  const root = doc.getElementById('note-pages-root')
  if (!root) {
    return [{ id: newNotePageId(), html: normalized }]
  }

  const htmlParts: string[] = []
  let buffer = doc.createElement('div')

  const flush = () => {
    htmlParts.push(normalizeSpacing(cleanLeadingEmptyNoteBlocks(buffer.innerHTML).trim() || '<p><br /></p>', { renderStyles: true }))
    buffer = doc.createElement('div')
  }

  for (const node of [...root.childNodes]) {
    if (node instanceof HTMLElement && node.dataset.notePageBreak === 'true') {
      flush()
      continue
    }
    buffer.appendChild(node.cloneNode(true))
  }
  flush()

  return htmlParts.map((part) => ({ id: newNotePageId(), html: part }))
}

export function serializeNotePagesHtml(pageHtmlList: string[]): string {
  const cleaned = pageHtmlList.map((p) => p.trim() || '<p><br /></p>')
  if (cleaned.length <= 1) return cleaned[0] ?? '<p><br /></p>'
  return cleaned.join(NOTE_PAGE_BREAK_HTML)
}

export function isPageContentOverflowing(
  contentEl: HTMLElement,
  clipEl?: HTMLElement | null,
): boolean {
  const clip = clipEl ?? contentEl
  return contentEl.scrollHeight > clip.clientHeight + 1
}

/** Mueve el contenido que no cabe a HTML de desborde (salto de hoja). */
export function extractOverflowHtml(
  contentEl: HTMLElement,
  maxHeight?: number,
): string | null {
  const limit = maxHeight ?? contentEl.clientHeight
  if (contentEl.scrollHeight <= limit + 2) return null

  const width = contentEl.getBoundingClientRect().width
  if (width <= 0) return null

  const nodes = [...contentEl.childNodes]
  if (nodes.length === 0) return null

  const measurer = document.createElement('div')
  measurer.className = contentEl.className
  measurer.style.cssText = [
    'position:absolute',
    'left:-99999px',
    'top:0',
    'visibility:hidden',
    'pointer-events:none',
    `width:${width}px`,
    'overflow:hidden',
  ].join(';')
  document.body.appendChild(measurer)

  let splitAt = nodes.length
  for (let i = 0; i < nodes.length; i++) {
    measurer.innerHTML = ''
    for (let j = 0; j <= i; j++) {
      measurer.appendChild(nodes[j].cloneNode(true))
    }
    if (measurer.scrollHeight > limit) {
      splitAt = i
      break
    }
  }
  measurer.remove()

  if (splitAt >= nodes.length) return null

  if (splitAt === 0) {
    const overflow = contentEl.innerHTML
    contentEl.innerHTML = '<p><br /></p>'
    return overflow.trim() ? overflow : null
  }

  const overflowWrap = document.createElement('div')
  while (contentEl.childNodes.length > splitAt) {
    overflowWrap.appendChild(contentEl.childNodes[splitAt])
  }
  const overflowHtml = overflowWrap.innerHTML.trim()
  return overflowHtml || null
}

export function parseNotePagesHtmlList(html: string): string[] {
  return parseNotePagesFromHtml(html).map((p) => p.html)
}

export function collectPagesHtmlFromRefs(
  pageRefs: Array<HTMLDivElement | null>,
): string[] {
  return pageRefs.map((el) => el?.innerHTML.trim() || '<p><br /></p>')
}
