const PINK_BOLD_CLASS = 'flashcard-pink-bold'
export const NUMBERED_LIST_CLASS = 'flashcard-numbered-list'
export const NO_AUTO_LIST_ATTR = 'data-no-auto-list'

const PARAGRAPH_BREAK_RE = /(?:<br\s*\/?>\s*){2,}/gi

type NumberedSegment =
  | { type: 'text'; html: string }
  | { type: 'item'; html: string }

export type EditorCaretBookmark = { start: number; end: number }

function hasNumberedEnumeration(source: string): boolean {
  const matches = source.match(/\d+\.\s*\S/g)
  return (matches?.length ?? 0) >= 2
}

function splitHtmlParagraphs(html: string): string[] {
  const chunks = html.split(PARAGRAPH_BREAK_RE).map((c) => c.trim()).filter(Boolean)
  return chunks.length > 0 ? chunks : [html]
}

function formatNumberedParagraph(html: string): string {
  const trimmed = html.trim()
  if (!trimmed || !hasNumberedEnumeration(trimmed)) return html
  return segmentsToListHtml(parseNumberedSegments(trimmed))
}

function formatNumberedListsInChunk(html: string): string {
  const paragraphs = splitHtmlParagraphs(html)
  if (paragraphs.length <= 1) return formatNumberedParagraph(html)
  return paragraphs.map(formatNumberedParagraph).join('<br><br>')
}

function parseNumberedSegments(html: string): NumberedSegment[] {
  const parts = html.split(/(?=\d+\.\s*)/)
  const segments: NumberedSegment[] = []

  for (const part of parts) {
    if (!part) continue
    const itemMatch = part.match(/^(\d+)\.\s*([\s\S]*)/)
    if (itemMatch) {
      const body = itemMatch[2]?.trim() ?? ''
      if (body) segments.push({ type: 'item', html: body })
    } else {
      segments.push({ type: 'text', html: part })
    }
  }

  const itemCount = segments.filter((s) => s.type === 'item').length
  if (itemCount < 2) return [{ type: 'text', html }]

  return segments
}

function segmentsToListHtml(segments: NumberedSegment[]): string {
  let out = ''
  let listOpen = false

  for (const seg of segments) {
    if (seg.type === 'text') {
      if (listOpen) {
        out += '</ol>'
        listOpen = false
      }
      out += seg.html
    } else {
      if (!listOpen) {
        out += `<ol class="${NUMBERED_LIST_CLASS}">`
        listOpen = true
      }
      out += `<li>${seg.html}</li>`
    }
  }

  if (listOpen) out += '</ol>'
  return out
}

export function saveEditorCaret(root: HTMLElement): EditorCaretBookmark | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return null

  const offsetInRoot = (container: Node, offset: number) => {
    const r = document.createRange()
    r.selectNodeContents(root)
    try {
      r.setEnd(container, offset)
    } catch {
      return 0
    }
    return r.toString().length
  }

  return {
    start: offsetInRoot(range.startContainer, range.startOffset),
    end: offsetInRoot(range.endContainer, range.endOffset),
  }
}

export function restoreEditorCaret(
  root: HTMLElement,
  mark: EditorCaretBookmark | null,
): void {
  const sel = window.getSelection()
  if (!sel || !mark) return

  const range = document.createRange()
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let charCount = 0
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0

  let current: Node | null
  while ((current = walker.nextNode())) {
    const text = current as Text
    const len = text.data.length
    if (!startNode && charCount + len >= mark.start) {
      startNode = text
      startOffset = mark.start - charCount
    }
    if (!endNode && charCount + len >= mark.end) {
      endNode = text
      endOffset = mark.end - charCount
      break
    }
    charCount += len
  }

  if (!startNode) {
    range.selectNodeContents(root)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)
    return
  }

  range.setStart(startNode, Math.min(startOffset, startNode.data.length))
  range.setEnd(
    endNode ?? startNode,
    Math.min(endOffset, (endNode ?? startNode).data.length),
  )
  sel.removeAllRanges()
  sel.addRange(range)
}

export function formatNumberedListsInHtmlString(html: string): string {
  const trimmed = html.trim()
  if (!trimmed || !/\d+\./.test(trimmed)) return html
  if (/<ol\b/i.test(trimmed)) return html
  if (!hasNumberedEnumeration(trimmed)) return html

  if (typeof document === 'undefined') {
    return segmentsToListHtml(parseNumberedSegments(trimmed))
  }

  const wrap = document.createElement('div')
  wrap.innerHTML = trimmed

  const blocks = wrap.children.length > 0 ? [...wrap.children] : [wrap]

  for (const block of blocks) {
    const el = block as HTMLElement
    if (el.querySelector(`ol.${NUMBERED_LIST_CLASS}`)) continue
    if (el.getAttribute(NO_AUTO_LIST_ATTR) === 'true') continue
    const inner = el.innerHTML
    if (!hasNumberedEnumeration(inner)) continue
    el.innerHTML = formatNumberedListsInChunk(inner)
  }

  return wrap.innerHTML
}

/** Reformatea listas solo si hace falta; devuelve si cambió el DOM. */
export function applyNumberedListsInEditor(root: HTMLElement): boolean {
  if (typeof document === 'undefined') return false

  const mark = saveEditorCaret(root)
  let changed = false

  const blocks = root.children.length > 0 ? [...root.children] : [root]

  for (const block of blocks) {
    const el = block as HTMLElement
    if (el.tagName === 'OL') continue
    if (el.getAttribute(NO_AUTO_LIST_ATTR) === 'true') continue
    if (el.querySelector(`ol.${NUMBERED_LIST_CLASS}`)) continue
    const inner = el.innerHTML
    if (!hasNumberedEnumeration(inner)) continue
    const next = formatNumberedListsInChunk(inner)
    if (next !== inner) {
      el.innerHTML = next
      changed = true
    }
  }

  if (changed) restoreEditorCaret(root, mark)
  return changed
}

const ALLOWED_BLOCK = new Set(['div', 'p'])

export function sanitizeFlashcardHtml(dirty: string): string {
  if (!dirty.trim()) return ''
  if (typeof document === 'undefined') {
    return dirty.replace(/<(?!\/?(?:strong|b|br|ol|li|div|p)\b)[^>]*>/gi, '')
  }

  const doc = new DOMParser().parseFromString(dirty, 'text/html')
  const body = doc.body

  const cleanNode = (node: Node): void => {
    const children = [...node.childNodes]
    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE) continue

      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.parentNode?.removeChild(child)
        continue
      }

      const el = child as HTMLElement
      const tag = el.tagName.toLowerCase()

      if (tag === 'br') continue

      for (const attr of [...el.attributes]) {
        if (
          attr.name.startsWith('data-') &&
          attr.name !== NO_AUTO_LIST_ATTR
        ) {
          el.removeAttribute(attr.name)
        }
      }

      if (tag === 'strong' || tag === 'b') {
        el.removeAttribute('style')
        el.className = PINK_BOLD_CLASS
        cleanNode(el)
        continue
      }

      if (tag === 'ol') {
        el.removeAttribute('style')
        el.className = NUMBERED_LIST_CLASS
        cleanNode(el)
        continue
      }

      if (tag === 'li') {
        el.removeAttribute('style')
        cleanNode(el)
        continue
      }

      if (ALLOWED_BLOCK.has(tag)) {
        el.removeAttribute('style')
        el.removeAttribute('class')
        if (el.getAttribute(NO_AUTO_LIST_ATTR) !== 'true') {
          el.removeAttribute(NO_AUTO_LIST_ATTR)
        }
        cleanNode(el)
        continue
      }

      const parent = el.parentNode
      if (!parent) continue
      while (el.firstChild) parent.insertBefore(el.firstChild, el)
      parent.removeChild(el)
    }
  }

  cleanNode(body)
  return body.innerHTML.replace(/<br\s*\/?>/gi, '<br>').trim()
}

export function prepareFlashcardRichHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return ''
  const withLists = formatNumberedListsInHtmlString(trimmed)
  return sanitizeFlashcardHtml(withLists)
}

export function isFlashcardRichHtml(value: string): boolean {
  return (
    /<(?:strong|b|ol|li|div|p|br)\b/i.test(value) ||
    value.includes(NUMBERED_LIST_CLASS)
  )
}

export function plainTextFromFlashcardHtml(html: string): string {
  const raw = html.trim()
  if (!raw) return ''
  if (!/<[a-z]/i.test(raw)) return raw
  if (typeof document === 'undefined') {
    return raw.replace(/<[^>]*>/g, '').trim()
  }
  return (
    new DOMParser().parseFromString(raw, 'text/html').body.textContent ?? ''
  ).trim()
}

function htmlHasVisibleContent(html: string): boolean {
  return plainTextFromFlashcardHtml(html).length > 0 || /<(?:br|ol|li)\b/i.test(html)
}

export function normalizeEditorHtml(html: string): string {
  if (!htmlHasVisibleContent(html)) return ''
  return prepareFlashcardRichHtml(html)
}

export function applyPinkBoldToSelection(root: HTMLElement): void {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return

  const range = sel.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return

  const strong = document.createElement('strong')
  strong.className = PINK_BOLD_CLASS

  try {
    range.surroundContents(strong)
  } catch {
    const fragment = range.extractContents()
    strong.appendChild(fragment)
    range.insertNode(strong)
  }

  range.setStartAfter(strong)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

export function togglePinkBoldOnSelection(root: HTMLElement): void {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return

  const range = sel.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return

  const node = sel.anchorNode
  const parentEl =
    node?.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : node?.parentElement

  const existing = parentEl?.closest(`strong.${PINK_BOLD_CLASS}`)
  if (existing && root.contains(existing)) {
    const text = document.createTextNode(existing.textContent ?? '')
    existing.replaceWith(text)
    return
  }

  applyPinkBoldToSelection(root)
}

function getEditableBlock(
  root: HTMLElement,
): HTMLElement | null {
  const sel = window.getSelection()
  if (!sel?.anchorNode) return null
  const node =
    sel.anchorNode.nodeType === Node.ELEMENT_NODE
      ? (sel.anchorNode as HTMLElement)
      : sel.anchorNode.parentElement
  const block = node?.closest('div, p')
  if (!block || !root.contains(block)) return null
  return block as HTMLElement
}

function isListItemEmpty(li: HTMLLIElement): boolean {
  const clone = li.cloneNode(true) as HTMLLIElement
  clone.querySelectorAll('br').forEach((br) => br.remove())
  return (clone.textContent ?? '').replace(/\u00a0/g, ' ').trim() === ''
}

function listItemEndsWithDoubleSpace(li: HTMLLIElement): boolean {
  return /\s{2}$/.test(li.textContent ?? '')
}

function trimListItemTrailingDoubleSpaces(li: HTMLLIElement): void {
  const last = li.lastChild
  if (last?.nodeType === Node.TEXT_NODE) {
    const text = last as Text
    text.data = text.data.replace(/\s{2}$/, '')
    if (!text.data) last.remove()
    return
  }
  const t = li.textContent ?? ''
  if (/\s{2}$/.test(t)) {
    li.textContent = t.replace(/\s{2}$/, '')
  }
}

function placeCaretAtStart(el: HTMLElement): void {
  const sel = window.getSelection()
  if (!sel) return
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

/** Sale de la lista numerada a un párrafo sin auto-numeración. */
export function exitNumberedList(
  root: HTMLElement,
  fromLi: HTMLLIElement,
): boolean {
  const ol = fromLi.closest(`ol.${NUMBERED_LIST_CLASS}`)
  if (!ol || !root.contains(ol)) return false

  if (isListItemEmpty(fromLi)) {
    fromLi.remove()
  } else if (listItemEndsWithDoubleSpace(fromLi)) {
    trimListItemTrailingDoubleSpaces(fromLi)
  }

  const block = document.createElement('div')
  block.setAttribute(NO_AUTO_LIST_ATTR, 'true')
  block.appendChild(document.createElement('br'))
  ol.after(block)

  if (!ol.querySelector('li')) ol.remove()

  placeCaretAtStart(block)
  return true
}

function isCaretOnEmptyLine(block: HTMLElement): boolean {
  const sel = window.getSelection()
  if (!sel?.rangeCount || !sel.anchorNode) return false
  if (!block.contains(sel.anchorNode)) return false

  const probe = document.createRange()
  probe.selectNodeContents(block)
  probe.setEnd(sel.anchorNode, sel.anchorOffset)
  const div = document.createElement('div')
  div.appendChild(probe.cloneContents())
  const before = (div.textContent ?? '').replace(/\u00a0/g, ' ')
  if (before.trim() !== '') return false

  return block.querySelector('br') !== null
}

/**
 * Fuera de lista: segundo Enter en línea vacía → párrafo sin auto-numeración.
 * (Enter una vez deja el salto; Enter otra vez en la línea vacía activa esto.)
 */
export function handlePlainDoubleEnterNoAutoList(
  root: HTMLElement,
  e: { key: string; preventDefault(): void },
): boolean {
  if (e.key !== 'Enter') return false
  if (getListItemFromSelection(root)) return false

  const block = getEditableBlock(root)
  if (!block || block.getAttribute(NO_AUTO_LIST_ATTR) === 'true') return false
  if (!isCaretOnEmptyLine(block)) return false

  e.preventDefault()

  const newBlock = document.createElement('div')
  newBlock.setAttribute(NO_AUTO_LIST_ATTR, 'true')
  newBlock.appendChild(document.createElement('br'))
  block.after(newBlock)
  placeCaretAtStart(newBlock)
  return true
}

function getListItemFromSelection(root: HTMLElement): HTMLLIElement | null {
  const sel = window.getSelection()
  if (!sel?.anchorNode) return null
  const li = (
    sel.anchorNode.nodeType === Node.ELEMENT_NODE
      ? (sel.anchorNode as HTMLElement)
      : sel.anchorNode.parentElement
  )?.closest('li')
  if (!li || !root.contains(li)) return null
  if (!li.closest(`ol.${NUMBERED_LIST_CLASS}`)) return null
  return li
}

/** Enter en lista numerada: nuevo &lt;li&gt; o salir (línea vacía / dos espacios + Enter). */
export function handleNumberedListEnter(
  root: HTMLElement,
  e: { key: string; preventDefault(): void },
): boolean {
  if (e.key !== 'Enter') return false
  const li = getListItemFromSelection(root)
  if (!li) return false

  if (isListItemEmpty(li) || listItemEndsWithDoubleSpace(li)) {
    e.preventDefault()
    exitNumberedList(root, li)
    return true
  }

  e.preventDefault()
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return true

  const range = sel.getRangeAt(0)
  const after = range.cloneRange()
  after.selectNodeContents(li)
  after.setStart(range.endContainer, range.endOffset)

  const newLi = document.createElement('li')
  const moved = after.extractContents()
  const hadContent = !!moved.textContent?.trim()

  if (hadContent) {
    newLi.appendChild(moved)
  } else {
    newLi.appendChild(document.createElement('br'))
  }

  li.after(newLi)

  const caret = document.createRange()
  if (hadContent) {
    caret.setStart(newLi, 0)
    caret.collapse(true)
  } else {
    caret.selectNodeContents(newLi)
    caret.collapse(false)
  }
  sel.removeAllRanges()
  sel.addRange(caret)

  return true
}

/** Al escribir ; inserta la flecha → en la posición del cursor. */
export function handleSemicolonToArrow(
  root: HTMLElement,
  e: { key: string; preventDefault(): void; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean },
): boolean {
  if (e.key !== ';') return false
  if (e.ctrlKey || e.metaKey || e.altKey) return false

  e.preventDefault()
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return true

  const range = sel.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return true

  range.deleteContents()
  const arrow = document.createTextNode('→')
  range.insertNode(arrow)
  range.setStartAfter(arrow)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)

  return true
}

/** Enter fuera de lista: salto de línea donde está el cursor. */
export function handleEditorLineBreak(
  root: HTMLElement,
  e: { key: string; preventDefault(): void },
): boolean {
  if (e.key !== 'Enter') return false
  if (getListItemFromSelection(root)) return false

  e.preventDefault()
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return true

  const range = sel.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return true

  range.deleteContents()

  const br = document.createElement('br')
  range.insertNode(br)

  const atEnd =
    !br.nextSibling ||
    (br.nextSibling.nodeType === Node.ELEMENT_NODE &&
      (br.nextSibling as HTMLElement).tagName === 'BR')

  if (atEnd) {
    const br2 = document.createElement('br')
    br.after(br2)
    const caret = document.createRange()
    caret.setStartBefore(br2)
    caret.collapse(true)
    sel.removeAllRanges()
    sel.addRange(caret)
  } else {
    const caret = document.createRange()
    caret.setStartAfter(br)
    caret.collapse(true)
    sel.removeAllRanges()
    sel.addRange(caret)
  }

  return true
}

/** Asegura al menos un bloque &lt;div&gt; para edición estable. */
export function ensureEditorBlockStructure(root: HTMLElement): void {
  if (root.innerHTML.trim() === '') return
  if (root.children.length > 0) return
  const div = document.createElement('div')
  while (root.firstChild) div.appendChild(root.firstChild)
  root.appendChild(div)
}
