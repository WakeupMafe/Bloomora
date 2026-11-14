import type {
  NoteBodyFont,
  NoteFontWeight,
  NoteParagraphStyle,
  NoteTextAlign,
  NoteTextCase,
  NoteTypingDefaults,
} from '@/features/notes/noteTypingDefaults'
import { parseNotePagesHtmlList } from '@/features/notes/notePageLayoutUtils'
import type { EnglishNoteColor, EnglishNotePageSize, EnglishNoteTitleFont } from '@/types/englishNote'
import { ENGLISH_NOTE_COLORS } from '@/types/englishNote'
import { noteBodyFontFamily } from '@/features/notes/noteFontUtils'
import { normalizeSpacing, setBlockSpacing, NOTE_DEFAULT_LINE_HEIGHT, NOTE_DEFAULT_SPACING_AFTER, NOTE_LINE_HEIGHTS, NOTE_SPACING_AFTER } from '@/features/notes/noteSpacingModel.mjs'

export function notePageSheetClass(pageSize: EnglishNotePageSize): string {
  return pageSize === 'letter'
    ? 'english-note-sheet english-note-sheet--letter'
    : 'english-note-sheet english-note-sheet--a4'
}

export function notePrintPageCss(
  pageSize: EnglishNotePageSize,
  pageNumberEnabled = false,
): string {
  const size = pageSize === 'letter' ? 'letter' : 'A4'
  const pageMargin =
    pageSize === 'letter' ? '16mm 14mm 22mm 14mm' : '16mm 24mm 22mm 24mm'
  const pageNumberRule = pageNumberEnabled
    ? `@bottom-right { content: counter(page); color: #c5c5ca; font-size: 9pt; font-family: Arial, sans-serif; }`
    : ''
  return `@page { size: ${size}; margin: ${pageMargin}; ${pageNumberRule} }`
}

export function noteTitleFontClass(font: EnglishNoteTitleFont): string {
  switch (font) {
    case 'arial':
      return 'english-note-title--arial'
    case 'cursive':
      return 'english-note-title--cursive'
    case 'cursive2':
      return 'english-note-title--cursive2'
    default:
      return 'english-note-title--popis'
  }
}

export const NOTE_EDITOR_DEFAULT_FONT_SIZE_PX = 15
export const NOTE_FONT_SIZE_STEP_PX = 10
export const NOTE_FONT_SIZE_MIN_PX = 10
export const NOTE_FONT_SIZE_MAX_PX = 96

function getRangeFontSizePx(editor: HTMLElement, range: Range): number {
  let el: HTMLElement | null =
    range.startContainer.nodeType === Node.TEXT_NODE
      ? (range.startContainer.parentElement as HTMLElement | null)
      : (range.startContainer as HTMLElement)

  while (el && el !== editor) {
    const inline = el.style.fontSize
    if (inline.endsWith('px')) {
      const n = parseFloat(inline)
      if (!Number.isNaN(n)) return Math.round(n)
    }
    el = el.parentElement
  }

  const target =
    range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : (range.startContainer as HTMLElement)
  if (!target) return NOTE_EDITOR_DEFAULT_FONT_SIZE_PX
  const parsed = parseFloat(window.getComputedStyle(target).fontSize)
  return Number.isNaN(parsed) ? NOTE_EDITOR_DEFAULT_FONT_SIZE_PX : Math.round(parsed)
}

export function applyNoteFontSizeToSelection(
  editor: HTMLElement,
  sizePx: number,
): boolean {
  editor.focus({ preventScroll: true })
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return false
  if (!sel.toString().trim()) return false

  const clamped = Math.min(
    NOTE_FONT_SIZE_MAX_PX,
    Math.max(NOTE_FONT_SIZE_MIN_PX, Math.round(sizePx)),
  )

  try {
    const fragment = range.extractContents()
    const textNodes: Text[] = []
    const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const textNode = walker.currentNode as Text
      if (textNode.data) textNodes.push(textNode)
    }
    for (const textNode of textNodes) {
      const span = document.createElement('span')
      span.style.fontSize = `${clamped}px`
      textNode.parentNode?.replaceChild(span, textNode)
      span.appendChild(textNode)
    }
    const firstInserted = fragment.firstChild
    const lastInserted = fragment.lastChild
    if (!firstInserted || !lastInserted) return false
    range.insertNode(fragment)
    const selected = document.createRange()
    selected.setStartBefore(firstInserted)
    selected.setEndAfter(lastInserted)
    sel.removeAllRanges()
    sel.addRange(selected)
    return true
  } catch {
    return false
  }
}

/** Aumenta o reduce el tamaño del texto seleccionado en pasos de 10px. */
export function adjustNoteSelectionFontSize(
  editor: HTMLElement,
  deltaPx: number,
): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return false
  if (!sel.toString().trim()) return false

  const current = getRangeFontSizePx(editor, range)
  return applyNoteFontSizeToSelection(editor, current + deltaPx)
}

function getBlockInEditor(node: Node, editor: HTMLElement): HTMLElement | null {
  let el: HTMLElement | null =
    node.nodeType === Node.TEXT_NODE ? (node.parentElement as HTMLElement) : (node as HTMLElement)
  while (el && el !== editor) {
    const tag = el.tagName
    if (tag === 'P' || tag === 'DIV' || tag === 'LI' || tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'BLOCKQUOTE' || tag === 'PRE') {
      return el
    }
    el = el.parentElement
  }
  return null
}

function isNoteBlockElement(el: HTMLElement): boolean {
  const tag = el.tagName
  return tag === 'P' || tag === 'DIV' || tag === 'LI' || tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'BLOCKQUOTE' || tag === 'PRE'
}

function isNoteContentRoot(el: HTMLElement, editor: HTMLElement): boolean {
  return el === editor || el.classList.contains('english-note-content')
}

/** Quita line-height inline en descendientes para que aplique el del párrafo. */
function stripDescendantLineHeight(block: HTMLElement): void {
  block.querySelectorAll('*').forEach((node) => {
    const el = node as HTMLElement
    if (el.style.lineHeight) {
      el.style.lineHeight = ''
    }
  })
}

function getBlocksTouchingRange(range: Range, editor: HTMLElement): HTMLElement[] {
  const blocks = new Set<HTMLElement>()
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_ELEMENT)
  let node = walker.nextNode()
  while (node) {
    const el = node as HTMLElement
    if (
      isNoteBlockElement(el) &&
      !isNoteContentRoot(el, editor) &&
      range.intersectsNode(el)
    ) {
      blocks.add(el)
    }
    node = walker.nextNode()
  }
  if (blocks.size === 0) {
    const block = getBlockInEditor(range.startContainer, editor)
    if (block && !isNoteContentRoot(block, editor)) {
      blocks.add(block)
    }
  }
  return [...blocks]
}

function applyLineHeightToBlocks(
  blocks: HTMLElement[],
  lineHeight: number,
  editor: HTMLElement,
): void {
  const lh = Number(lineHeight)
  for (const block of blocks) {
    if (isNoteContentRoot(block, editor)) continue
    setBlockSpacing(block, { lineHeight: lh })
    stripDescendantLineHeight(block)
  }
}

export function applyNoteParagraphSpacing(
  editor: HTMLElement,
  spacingPx: number,
): boolean {
  editor.focus({ preventScroll: true })
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false
  const range = selection.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return false
  const candidates = getBlocksTouchingRange(range, editor)
  const blocks = candidates.filter((block) =>
    !candidates.some((other) => other !== block && block.contains(other)),
  )
  const targetBlocks = blocks.length ? blocks : [getBlockInEditor(range.startContainer, editor)].filter((block): block is HTMLElement => !!block && !isNoteContentRoot(block, editor))
  if (targetBlocks.length === 0) return false
  const clamped = NOTE_SPACING_AFTER.reduce((best, value) =>
    Math.abs(value - spacingPx) < Math.abs(best - spacingPx) ? value : best,
  NOTE_DEFAULT_SPACING_AFTER)
  for (const block of targetBlocks) setBlockSpacing(block, { spacingAfter: clamped })
  return true
}

function resolveLineHeightAtNode(editor: HTMLElement, node: Node): number {
  const normalize = (raw: string, element: HTMLElement): number | null => {
    const value = raw.trim()
    if (!value || value === 'normal') return null
    const amount = Number.parseFloat(value)
    if (!Number.isFinite(amount)) return null
    let ratio = amount
    if (value.endsWith('%')) ratio = amount / 100
    else if (value.endsWith('px') || value.endsWith('em') || value.endsWith('rem')) {
      const fontSize = Number.parseFloat(window.getComputedStyle(element).fontSize)
      if (!Number.isFinite(fontSize) || fontSize <= 0) return null
      const px = value.endsWith('px') ? amount : amount * (value.endsWith('rem')
        ? Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16
        : fontSize)
      ratio = px / fontSize
    }
    return ratio >= 1 && ratio <= 3 ? Math.round(ratio * 100) / 100 : null
  }
  const block = getBlockInEditor(node, editor)
  if (block?.dataset.lineHeight) {
    const stored = Number(block.dataset.lineHeight)
    if (NOTE_LINE_HEIGHTS.includes(stored)) return stored
  }
  if (block && !isNoteContentRoot(block, editor) && block.style.lineHeight) {
    const fromBlock = normalize(block.style.lineHeight, block)
    if (fromBlock != null) return fromBlock
  }

  let el: HTMLElement | null =
    node.nodeType === Node.TEXT_NODE
      ? (node.parentElement as HTMLElement | null)
      : (node as HTMLElement)

  while (el && el !== editor) {
    const inline = normalize(el.style.lineHeight, el)
    if (inline != null) return inline
    el = el.parentElement
  }

  const target =
    node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)
  if (!target) return NOTE_DEFAULT_LINE_HEIGHT

  const blockStyle = block
    ? window.getComputedStyle(block)
    : window.getComputedStyle(target)
  const parsedSize = parseFloat(window.getComputedStyle(target).fontSize)
  const lineHeightRaw = parseFloat(blockStyle.lineHeight)
  if (Number.isNaN(lineHeightRaw) || blockStyle.lineHeight === 'normal') return NOTE_DEFAULT_LINE_HEIGHT
  if (Number.isNaN(parsedSize) || parsedSize <= 0) return NOTE_DEFAULT_LINE_HEIGHT
  return Math.round(Math.min(3, Math.max(1, lineHeightRaw / parsedSize)) * 100) / 100
}

function rangeSelectionHasBlockNodes(range: Range): boolean {
  const fragment = range.cloneContents()
  return !!fragment.querySelector('p, div, li, h1, h2, h3')
}

/** Posición del cursor para la barra flotante sin texto seleccionado. */
export function coordsFromEditorCaret(editor: HTMLElement): { top: number; left: number } | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return null

  const rect = range.getBoundingClientRect()
  if (rect.height > 0 || rect.width > 0) {
    return {
      top: Math.max(8, rect.bottom + 4),
      left: Math.max(8, rect.left),
    }
  }

  const marker = document.createElement('span')
  marker.textContent = '\u200b'
  range.insertNode(marker)
  const markerRect = marker.getBoundingClientRect()
  marker.remove()
  return {
    top: Math.max(8, markerRect.bottom + 4),
    left: Math.max(8, markerRect.left),
  }
}

/** Estilo del texto que se escribirá a partir del cursor. */
export function applyTypingDefaultsAtCaret(
  editor: HTMLElement,
  defaults: NoteTypingDefaults,
): void {
  editor.focus()
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return

  const block = getBlockInEditor(range.startContainer, editor)
  if (block && !isNoteContentRoot(block, editor)) {
    block.style.textAlign = noteTextAlignToCss(defaults.align)
    setBlockSpacing(block, { lineHeight: defaults.lineHeight, spacingAfter: defaults.paragraphSpacingPx })
    stripDescendantLineHeight(block)
  }

  if (!range.collapsed) return

  const span = document.createElement('span')
  span.style.fontFamily = noteBodyFontFamily(defaults.font)
  span.style.fontSize = `${defaults.fontSizePx}px`
  span.style.color = defaults.colorHex
  if (defaults.highlightColor) span.style.backgroundColor = defaults.highlightColor
  span.style.fontWeight =
    defaults.fontWeight === 'bold'
      ? '700'
      : defaults.fontWeight === 'medium'
        ? '500'
        : '400'
  if (defaults.textCase !== 'none') {
    span.style.textTransform = defaults.textCase
  }
  const anchor = document.createTextNode('\u200b')
  span.appendChild(anchor)
  range.insertNode(span)

  const caret = document.createRange()
  caret.setStart(anchor, 1)
  caret.collapse(true)
  sel.removeAllRanges()
  sel.addRange(caret)
}

/** Nueva línea con el formato por defecto (p. ej. tras Enter). */
export function insertParagraphWithTypingDefaults(
  editor: HTMLElement,
  defaults: NoteTypingDefaults,
): void {
  editor.focus({ preventScroll: true })
  const selection = window.getSelection()
  const previousBlock = selection?.rangeCount
    ? getBlockInEditor(selection.getRangeAt(0).startContainer, editor)
    : null
  document.execCommand('insertParagraph')
  const currentSelection = window.getSelection()
  const currentBlock = currentSelection?.rangeCount
    ? getBlockInEditor(currentSelection.getRangeAt(0).startContainer, editor)
    : null
  if (currentBlock && currentBlock !== previousBlock && currentBlock.tagName !== 'LI' && currentBlock.tagName !== 'P') {
    const paragraph = document.createElement('p')
    for (const attribute of [...currentBlock.attributes]) paragraph.setAttribute(attribute.name, attribute.value)
    while (currentBlock.firstChild) paragraph.appendChild(currentBlock.firstChild)
    currentBlock.replaceWith(paragraph)
  }
  applyTypingDefaultsAtCaret(editor, defaults)
}

export function noteTextAlignToCss(align: NoteTextAlign): string {
  switch (align) {
    case 'center':
      return 'center'
    case 'right':
      return 'right'
    case 'justify':
      return 'justify'
    default:
      return 'left'
  }
}

export function noteTextAlignExecCommand(align: NoteTextAlign): string {
  switch (align) {
    case 'center':
      return 'justifyCenter'
    case 'right':
      return 'justifyRight'
    case 'justify':
      return 'justifyFull'
    default:
      return 'justifyLeft'
  }
}

export function applyBlockAlign(editor: HTMLElement, align: NoteTextAlign): void {
  editor.focus()
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return

  const candidates = getBlocksTouchingRange(range, editor)
  const blocks = candidates.filter((block) =>
    !candidates.some((other) => other !== block && block.contains(other)),
  )
  const targets = blocks.length
    ? blocks
    : [getBlockInEditor(range.startContainer, editor)].filter((block): block is HTMLElement => !!block && !isNoteContentRoot(block, editor))
  for (const block of targets) block.style.textAlign = noteTextAlignToCss(align)
}

export function applyNoteParagraphStyle(
  editor: HTMLElement,
  style: NoteParagraphStyle,
): boolean {
  editor.focus({ preventScroll: true })
  const tag = style === 'p' ? 'P' : style.toUpperCase()
  return document.execCommand('formatBlock', false, `<${tag}>`)
}

export function readNoteParagraphStyle(editor: HTMLElement): NoteParagraphStyle {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return 'p'
  const range = selection.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return 'p'
  const block = getBlockInEditor(range.startContainer, editor)
  const tag = block?.tagName.toLowerCase()
  return tag === 'h1' || tag === 'h2' || tag === 'h3' ? tag : 'p'
}

export function readActiveNoteMarks(editor: HTMLElement) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
    return {
      bold: false,
      italic: false,
      underline: false,
      strike: false,
      bulletList: false,
      align: 'left' as NoteTextAlign,
    }
  }
  const block = getBlockInEditor(selection.getRangeAt(0).startContainer, editor)
  const alignValue = block ? window.getComputedStyle(block).textAlign : 'left'
  return {
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
    strike: document.queryCommandState('strikeThrough'),
    bulletList: document.queryCommandState('insertUnorderedList'),
    align: (alignValue === 'center' || alignValue === 'right' || alignValue === 'justify' ? alignValue : 'left') as NoteTextAlign,
  }
}

export function insertNoteBlock(editor: HTMLElement): boolean {
  editor.focus({ preventScroll: true })
  const selection = window.getSelection()
  const block = document.createElement('blockquote')
  block.className = 'note-callout'
  block.dataset.noteBlock = 'true'
  const label = document.createElement('strong')
  label.className = 'note-callout__label'
  label.textContent = 'Nota'
  const body = document.createElement('p')
  body.className = 'note-callout__content'
  body.innerHTML = '<br>'
  block.append(label, body)

  const range = selection?.rangeCount ? selection.getRangeAt(0) : null
  if (range && editor.contains(range.commonAncestorContainer)) {
    range.deleteContents()
    range.insertNode(block)
  } else {
    editor.append(block)
  }

  const caret = document.createRange()
  caret.selectNodeContents(body)
  caret.collapse(false)
  selection?.removeAllRanges()
  selection?.addRange(caret)
  return true
}

/**
 * Conserva negrita/cursiva/subrayado, listas y saltos.
 * Al pegar, elimina color, background-color, font-family y font-size inline
 * (evita gris/blanco fijos que rompen Noche y Medianoche).
 */
export function sanitizePastedNoteHtml(html: string): string {
  const normalizedInput = normalizeSpacing(html)
  const doc = new DOMParser().parseFromString(normalizedInput, 'text/html')
  const allowed = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'STRIKE', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'SPAN', 'A'])

  const cleanNode = (node: Node): Node[] => {
    if (node.nodeType === Node.TEXT_NODE) return [doc.createTextNode(node.textContent ?? '')]
    if (!(node instanceof HTMLElement)) return []
    if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'SVG', 'VIDEO', 'AUDIO'].includes(node.tagName)) return []
    const children = [...node.childNodes].flatMap(cleanNode)
    if (!allowed.has(node.tagName)) return children

    const clean = doc.createElement(node.tagName.toLowerCase())
    if (node.tagName === 'BLOCKQUOTE' && node.dataset.noteBlock === 'true') {
      clean.className = 'note-callout'
      clean.dataset.noteBlock = 'true'
    }
    if (node.tagName === 'SPAN' || node.tagName === 'P' || node.tagName === 'DIV' || /^H[1-3]$/.test(node.tagName) || node.tagName === 'LI') {
      if (node.dataset.lineHeight && ['P', 'H1', 'H2', 'H3', 'LI'].includes(node.tagName)) clean.dataset.lineHeight = node.dataset.lineHeight
      if (node.dataset.spacing && ['P', 'H1', 'H2', 'H3', 'LI'].includes(node.tagName)) clean.dataset.spacing = node.dataset.spacing
      const align = node.style.textAlign
      if (['left', 'center', 'right', 'justify'].includes(align)) clean.style.textAlign = align
      // Never keep pasted color / background / font-family / font-size.
    }
    if (node.tagName === 'A') {
      const href = node.getAttribute('href')
      if (href && /^https?:\/\//i.test(href)) clean.setAttribute('href', href)
    }
    children.forEach((child) => clean.appendChild(child))
    return [clean]
  }

  const root = doc.createElement('div')
  ;[...doc.body.childNodes].flatMap(cleanNode).forEach((node) => root.appendChild(node))
  return normalizeSpacing(root.innerHTML.trim() || '<p><br></p>', { renderStyles: true })
}

export function applyNoteFontWeightToSelection(
  editor: HTMLElement,
  weight: 'normal' | 'medium' | 'bold',
): boolean {
  editor.focus({ preventScroll: true })
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return false

  if (weight === 'bold') {
    document.execCommand('bold', false)
    return true
  }

  const span = document.createElement('span')
  span.style.fontWeight = weight === 'medium' ? '500' : '400'
  try {
    const fragment = range.extractContents()
    span.appendChild(fragment)
    range.insertNode(span)
    const selected = document.createRange()
    selected.selectNodeContents(span)
    sel.removeAllRanges()
    sel.addRange(selected)
    return true
  } catch {
    return false
  }
}

export function applyNoteLineHeightToSelection(
  editor: HTMLElement,
  lineHeight: number,
): boolean {
  editor.focus({ preventScroll: true })
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return false

  const blocks = getBlocksTouchingRange(range, editor)

  if (blocks.length > 0) {
    applyLineHeightToBlocks(blocks, lineHeight, editor)
    return true
  }

  if (!sel.isCollapsed && sel.toString().trim() && !rangeSelectionHasBlockNodes(range)) {
    const paragraph = document.createElement('p')
    try {
      const fragment = range.extractContents()
      paragraph.appendChild(fragment)
      setBlockSpacing(paragraph, { lineHeight })
      range.insertNode(paragraph)
      const selected = document.createRange()
      selected.selectNodeContents(paragraph)
      sel.removeAllRanges()
      sel.addRange(selected)
      return true
    } catch {
      return false
    }
  }

  return false
}

export function applyNoteTextCaseToSelection(
  editor: HTMLElement,
  textCase: 'none' | 'uppercase' | 'lowercase' | 'capitalize',
): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return false

  const span = document.createElement('span')
  span.style.textTransform = textCase === 'none' ? 'none' : textCase
  try {
    const fragment = range.extractContents()
    span.appendChild(fragment)
    range.insertNode(span)
    const selected = document.createRange()
    selected.selectNodeContents(span)
    sel.removeAllRanges()
    sel.addRange(selected)
    return true
  } catch {
    return false
  }
}

export function clearNoteSelectionHighlight(editor: HTMLElement): void {
  editor.focus()
  document.execCommand('hiliteColor', false, 'transparent')
  document.execCommand('backColor', false, 'transparent')
}

/** Strips pasted presentation styles (color / bg / font) from the current selection or caret block. */
export function clearNoteInlinePresentationStyles(editor: HTMLElement): void {
  editor.focus({ preventScroll: true })
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  const range = selection.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return

  const roots: HTMLElement[] = []
  if (selection.isCollapsed) {
    let el: HTMLElement | null =
      range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : (range.startContainer as HTMLElement)
    while (el && el !== editor) {
      if (['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'BLOCKQUOTE'].includes(el.tagName)) {
        roots.push(el)
        break
      }
      el = el.parentElement
    }
    if (roots.length === 0) roots.push(editor)
  } else {
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node) {
          if (!(node instanceof HTMLElement)) return NodeFilter.FILTER_REJECT
          if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT
          return NodeFilter.FILTER_ACCEPT
        },
      },
    )
    if (range.commonAncestorContainer instanceof HTMLElement) {
      roots.push(range.commonAncestorContainer)
    }
    let current = walker.nextNode()
    while (current) {
      if (current instanceof HTMLElement) roots.push(current)
      current = walker.nextNode()
    }
  }

  const seen = new Set<HTMLElement>()
  for (const root of roots) {
    const nodes = [root, ...root.querySelectorAll<HTMLElement>('*')]
    for (const el of nodes) {
      if (seen.has(el) || !editor.contains(el)) continue
      seen.add(el)
      el.style.removeProperty('color')
      el.style.removeProperty('background-color')
      el.style.removeProperty('background')
      el.style.removeProperty('font-family')
      el.style.removeProperty('font-size')
      if (el.getAttribute('style')?.trim() === '') el.removeAttribute('style')
    }
  }

  document.execCommand('removeFormat', false)
  document.execCommand('foreColor', false, 'inherit')
  clearNoteSelectionHighlight(editor)
}

export function readNoteHighlightColor(editor: HTMLElement): string | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !editor.contains(selection.getRangeAt(0).commonAncestorContainer)) return null
  let el: HTMLElement | null = selection.getRangeAt(0).startContainer.nodeType === Node.TEXT_NODE
    ? selection.getRangeAt(0).startContainer.parentElement
    : selection.getRangeAt(0).startContainer as HTMLElement
  while (el && el !== editor) {
    const background = el.style.backgroundColor
    if (background && background !== 'transparent' && background !== 'rgba(0, 0, 0, 0)') {
      return cssColorToHex(background)
    }
    el = el.parentElement
  }
  return null
}

export function applyNoteFontToSelection(
  editor: HTMLElement,
  font: NoteBodyFont,
): boolean {
  editor.focus({ preventScroll: true })
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return false

  try {
    const fragment = range.extractContents()
    const textNodes: Text[] = []
    const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const textNode = walker.currentNode as Text
      if (textNode.data) textNodes.push(textNode)
    }
    for (const textNode of textNodes) {
      const span = document.createElement('span')
      span.style.fontFamily = noteBodyFontFamily(font)
      textNode.parentNode?.replaceChild(span, textNode)
      span.appendChild(textNode)
    }
    const firstInserted = fragment.firstChild
    const lastInserted = fragment.lastChild
    if (!firstInserted || !lastInserted) return false
    range.insertNode(fragment)
    const selected = document.createRange()
    selected.setStartBefore(firstInserted)
    selected.setEndAfter(lastInserted)
    sel.removeAllRanges()
    sel.addRange(selected)
    return true
  } catch {
    return false
  }
}

const NOTE_IMAGE_WRAP_CLASS = 'english-note-image-wrap'

export function createNoteImageElement(src: string): HTMLImageElement {
  const img = document.createElement('img')
  img.src = src
  img.alt = 'Imagen del apunte'
  img.draggable = false
  img.className = 'english-note-inline-image'
  img.setAttribute('contenteditable', 'false')
  return img
}

function createNoteImageWrap(img: HTMLImageElement): HTMLSpanElement {
  const wrap = document.createElement('span')
  wrap.className = NOTE_IMAGE_WRAP_CLASS
  wrap.setAttribute('contenteditable', 'false')
  wrap.draggable = false
  wrap.appendChild(img)
  return wrap
}

function editorOffsetForRect(editor: HTMLElement, rect: DOMRect) {
  const editorRect = editor.getBoundingClientRect()
  return {
    left: rect.left - editorRect.left + editor.scrollLeft,
    top: rect.top - editorRect.top + editor.scrollTop,
  }
}

function clampImageWrapPosition(
  editor: HTMLElement,
  wrap: HTMLElement,
  left: number,
  top: number,
) {
  const maxLeft = Math.max(0, editor.clientWidth - wrap.offsetWidth)
  const maxTop = Math.max(0, editor.clientHeight - wrap.offsetHeight)
  return {
    left: Math.min(Math.max(0, left), maxLeft),
    top: Math.min(Math.max(0, top), maxTop),
  }
}

function applyWrapPosition(wrap: HTMLElement, left: number, top: number) {
  wrap.style.position = 'absolute'
  wrap.style.left = `${Math.round(left)}px`
  wrap.style.top = `${Math.round(top)}px`
}

/** Coloca el contenedor de imagen en coordenadas absolutas sobre la hoja. */
export function positionNoteImageWrap(
  wrap: HTMLElement,
  editor: HTMLElement,
  left: number,
  top: number,
) {
  const clamped = clampImageWrapPosition(editor, wrap, left, top)
  applyWrapPosition(wrap, clamped.left, clamped.top)
}

function migrateInlineImageToWrap(img: HTMLImageElement, editor: HTMLElement): HTMLSpanElement {
  const existing = img.closest(`.${NOTE_IMAGE_WRAP_CLASS}`) as HTMLSpanElement | null
  if (existing) return existing

  const rect = img.getBoundingClientRect()
  const { left, top } = editorOffsetForRect(editor, rect)
  const host = img.parentElement

  const wrap = createNoteImageWrap(img)
  editor.appendChild(wrap)

  if (
    host &&
    host !== editor &&
    host.tagName === 'P' &&
    !host.textContent?.replace(/\u00a0/g, '').trim() &&
    host.childElementCount === 0
  ) {
    host.remove()
  }

  requestAnimationFrame(() => {
    positionNoteImageWrap(wrap, editor, left, top)
  })
  return wrap
}

function getNoteImageWrap(img: HTMLImageElement, editor: HTMLElement): HTMLSpanElement {
  const existing = img.closest(`.${NOTE_IMAGE_WRAP_CLASS}`) as HTMLSpanElement | null
  if (existing) return existing
  return migrateInlineImageToWrap(img, editor)
}

/** Inserta una imagen en el contentEditable con la selección actual. */
export function insertImageInEditor(editor: HTMLElement, src: string): boolean {
  editor.focus({ preventScroll: true })

  const img = createNoteImageElement(src)
  const wrap = createNoteImageWrap(img)
  const sel = window.getSelection()
  let insertedAtCaret = false

  let anchorRect: DOMRect | null = null
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0)
    if (editor.contains(range.commonAncestorContainer)) {
      anchorRect = range.getBoundingClientRect()
      range.deleteContents()
      range.insertNode(wrap)
      insertedAtCaret = true
    }
  }

  if (!insertedAtCaret) editor.appendChild(wrap)

  const place = () => {
    let left = 24
    let top = 24
    if (anchorRect && anchorRect.width + anchorRect.height > 0) {
      const offset = editorOffsetForRect(editor, anchorRect)
      left = offset.left
      top = offset.top
    } else {
      left = Math.max(16, (editor.clientWidth - wrap.offsetWidth) / 2)
      top = 16
    }
    positionNoteImageWrap(wrap, editor, left, top)
  }

  if (img.complete) requestAnimationFrame(place)
  else img.addEventListener('load', () => requestAnimationFrame(place), { once: true })

  const spacer = document.createTextNode('\u00A0')
  wrap.after(spacer)
  if (sel) {
    const after = document.createRange()
    after.setStartAfter(spacer)
    after.collapse(true)
    sel.removeAllRanges()
    sel.addRange(after)
  }

  return true
}

/** Asegura envoltorio y estilos para mover imágenes sobre la hoja. */
export function enhanceNoteImages(editor: HTMLElement) {
  Array.from(editor.querySelectorAll('img')).forEach((node) => {
    const img = node as HTMLImageElement
    if (!img.classList.contains('english-note-inline-image')) {
      img.classList.add('english-note-inline-image')
    }
    img.draggable = false
    img.setAttribute('contenteditable', 'false')
    if (!img.alt) img.alt = 'Imagen del apunte'
    img.loading = 'lazy'
    img.decoding = 'async'

    const wrap = getNoteImageWrap(img, editor)
    if (!wrap.style.left || !wrap.style.top) {
      const rect = img.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        const { left, top } = editorOffsetForRect(editor, rect)
        positionNoteImageWrap(wrap, editor, left, top)
      }
    }
  })
}

type ImageDragSession = {
  wrap: HTMLElement
  pointerId: number
  startX: number
  startY: number
  startLeft: number
  startTop: number
}

/** Arrastrar imágenes con el puntero sobre la hoja (no el DnD nativo del navegador). */
export function attachNoteImageDragHandlers(
  editor: HTMLElement,
  onMoved?: () => void,
): () => void {
  let session: ImageDragSession | null = null

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    const img = (e.target as HTMLElement).closest(
      'img.english-note-inline-image',
    ) as HTMLImageElement | null
    if (!img || !editor.contains(img)) return

    e.preventDefault()
    const wrap = getNoteImageWrap(img, editor)
    if (!wrap.style.left || !wrap.style.top) {
      const rect = img.getBoundingClientRect()
      const { left, top } = editorOffsetForRect(editor, rect)
      positionNoteImageWrap(wrap, editor, left, top)
    }

    session = {
      wrap,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: parseFloat(wrap.style.left) || 0,
      startTop: parseFloat(wrap.style.top) || 0,
    }
    wrap.classList.add('is-dragging')
    wrap.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!session || e.pointerId !== session.pointerId) return
    const dx = e.clientX - session.startX
    const dy = e.clientY - session.startY
    const { left, top } = clampImageWrapPosition(
      editor,
      session.wrap,
      session.startLeft + dx,
      session.startTop + dy,
    )
    applyWrapPosition(session.wrap, left, top)
  }

  const endDrag = (e: PointerEvent) => {
    if (!session || e.pointerId !== session.pointerId) return
    session.wrap.classList.remove('is-dragging')
    try {
      session.wrap.releasePointerCapture(e.pointerId)
    } catch {
      /* ya liberado */
    }
    session = null
    onMoved?.()
  }

  editor.addEventListener('pointerdown', onPointerDown)
  editor.addEventListener('pointermove', onPointerMove)
  editor.addEventListener('pointerup', endDrag)
  editor.addEventListener('pointercancel', endDrag)

  return () => {
    editor.removeEventListener('pointerdown', onPointerDown)
    editor.removeEventListener('pointermove', onPointerMove)
    editor.removeEventListener('pointerup', endDrag)
    editor.removeEventListener('pointercancel', endDrag)
  }
}

function fontIdFromElement(el: HTMLElement): NoteBodyFont | null {
  if (el.classList.contains('english-note-title--arial')) return 'arial'
  if (el.classList.contains('english-note-title--popis')) return 'poppins'
  if (el.classList.contains('english-note-title--cursive') || el.classList.contains('english-note-title--cursive2')) return 'poppins'
  return null
}

function fontIdFromFamily(family: string): NoteBodyFont {
  const f = family.toLowerCase()
  if (f.includes('arial')) return 'arial'
  if (f.includes('times')) return 'times'
  if (f.includes('georgia')) return 'georgia'
  if (f.includes('inter')) return 'inter'
  if (f.includes('fraunces')) return 'fraunces'
  if (f.includes('quicksand')) return 'quicksand'
  return 'poppins'
}

function cssColorToHex(color: string): string {
  const trimmed = color.trim().toLowerCase()
  if (trimmed.startsWith('#')) {
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`
    }
    return trimmed.slice(0, 7)
  }
  const m = trimmed.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
  if (!m) return trimmed
  return `#${[m[1], m[2], m[3]].map((x) => parseInt(x, 10).toString(16).padStart(2, '0')).join('')}`
}

function colorIdFromCssColor(color: string): EnglishNoteColor {
  const hex = cssColorToHex(color)
  const exact = ENGLISH_NOTE_COLORS.find((c) => c.value.toLowerCase() === hex)
  if (exact) return exact.id
  return 'black'
}

function resolveFontAtNode(editor: HTMLElement, node: Node): NoteBodyFont {
  let el: HTMLElement | null =
    node.nodeType === Node.TEXT_NODE
      ? (node.parentElement as HTMLElement | null)
      : (node as HTMLElement)

  let fromClass: NoteBodyFont | null = null
  let fromInline: NoteBodyFont | null = null

  while (el && el !== editor) {
    if (!fromClass) {
      fromClass = fontIdFromElement(el)
    }
    if (!fromInline && el.style.fontFamily) {
      fromInline = fontIdFromFamily(el.style.fontFamily)
    }
    el = el.parentElement
  }

  const target =
    node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)
  if (!target) return 'poppins'

  const fromComputed = fontIdFromFamily(window.getComputedStyle(target).fontFamily)
  return fromClass ?? fromInline ?? fromComputed
}

function readFormatAtNode(editor: HTMLElement, node: Node): Partial<NoteTypingDefaults> | null {
  const target =
    node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)
  if (!target || !editor.contains(target)) return null

  const computed = window.getComputedStyle(target)
  const block = getBlockInEditor(node, editor)
  const blockStyle = block ? window.getComputedStyle(block) : computed
  const parsedSize = parseFloat(computed.fontSize)
  const colorHex = cssColorToHex(computed.color)
  const lineHeight = resolveLineHeightAtNode(editor, node)
  const paragraphBlock = getBlockInEditor(node, editor)
  const paragraphSpacingPx = paragraphBlock?.dataset.spacing
    ? Number(paragraphBlock.dataset.spacing)
    : paragraphBlock ? parseFloat(paragraphBlock.style.marginBottom) || NOTE_DEFAULT_SPACING_AFTER : NOTE_DEFAULT_SPACING_AFTER

  return {
    font: resolveFontAtNode(editor, node),
    fontSizePx: Number.isNaN(parsedSize)
      ? NOTE_EDITOR_DEFAULT_FONT_SIZE_PX
      : Math.round(parsedSize),
    colorHex,
    color: colorIdFromCssColor(computed.color),
    fontWeight: fontWeightFromComputed(computed.fontWeight),
    align: alignFromComputed(blockStyle.textAlign),
    lineHeight: Number.isNaN(lineHeight) ? NOTE_DEFAULT_LINE_HEIGHT : lineHeight,
    paragraphSpacingPx,
    textCase: textCaseFromComputed(computed.textTransform),
  }
}

function fontWeightFromComputed(weight: string): NoteFontWeight {
  const n = parseInt(weight, 10)
  if (Number.isNaN(n)) return 'normal'
  if (n >= 700) return 'bold'
  if (n >= 500) return 'medium'
  return 'normal'
}

function textCaseFromComputed(value: string): NoteTextCase {
  if (value === 'uppercase') return 'uppercase'
  if (value === 'lowercase') return 'lowercase'
  if (value === 'capitalize') return 'capitalize'
  return 'none'
}

function alignFromComputed(value: string): NoteTextAlign {
  if (value === 'center') return 'center'
  if (value === 'right') return 'right'
  if (value === 'justify') return 'justify'
  return 'left'
}

/** Lee el formato en el inicio de la selección (para el panel Ctrl+O). */
export function readFormatFromEditorSelection(
  editor: HTMLElement,
): Partial<NoteTypingDefaults> | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return null
  return readFormatAtNode(editor, range.startContainer)
}

/** Lee el formato en la posición del cursor (modo escribir). */
export function readFormatFromEditorCaret(
  editor: HTMLElement,
): Partial<NoteTypingDefaults> | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return null

  const node: Node = range.startContainer
  if (node.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
    return readFormatAtNode(editor, node)
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement
    const child = el.childNodes[range.startOffset]
    if (child) {
      return readFormatAtNode(editor, child)
    }
  }
  return readFormatAtNode(editor, node)
}

export function runEditorCommand(
  editor: HTMLElement,
  command: string,
  value?: string,
): boolean {
  editor.focus({ preventScroll: true })
  return document.execCommand(command, false, value)
}

export function noteTitleFontFamily(font: EnglishNoteTitleFont): string {
  switch (font) {
    case 'arial':
      return 'Arial, Helvetica, sans-serif'
    case 'cursive':
      return "'Cedarville Cursive', cursive"
    case 'cursive2':
      return "'Sacramento', cursive"
    default:
      return "'Poppins', sans-serif"
  }
}

const NOTE_FONT_CLASS_MAP: Record<string, string> = {
  'english-note-title--popis': "'Poppins', sans-serif",
  'english-note-title--arial': 'Arial, Helvetica, sans-serif',
  'english-note-title--cursive': "'Cedarville Cursive', cursive",
  'english-note-title--cursive2': "'Sacramento', cursive",
}

export const NOTE_PRINT_GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap'

/** Inline font-family en spans con clase para que el PDF respete las fuentes. */
export function prepareNoteHtmlForPrint(html: string): string {
  const doc = new DOMParser().parseFromString(
    `<div id="note-print-root">${html}</div>`,
    'text/html',
  )
  const root = doc.getElementById('note-print-root')
  if (!root) return html

  root.querySelectorAll('[class]').forEach((node) => {
    const el = node as HTMLElement
    for (const [className, family] of Object.entries(NOTE_FONT_CLASS_MAP)) {
      if (el.classList.contains(className)) {
        el.style.fontFamily = family
      }
    }
  })

  return root.innerHTML
}

export function buildNotePrintDocumentHtml(options: {
  bodyHtml: string
  docTitle: string
  pageSize: EnglishNotePageSize
  pageNumberEnabled: boolean
  twoColumns?: boolean
}): string {
  const { bodyHtml, docTitle, pageSize, pageNumberEnabled, twoColumns = false } = options
  const preparedHtml = prepareNoteHtmlForPrint(bodyHtml)
  const pageHtmlList = parseNotePagesHtmlList(preparedHtml)
  const pageCss = notePrintPageCss(pageSize, pageNumberEnabled)
  const contentClass = twoColumns
    ? 'english-note-content english-note-content--two-columns'
    : 'english-note-content'
  const totalPages = pageHtmlList.length
  const escapedTitle = docTitle.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character)
  const bodySections = pageHtmlList
    .map((pageHtml, index) => {
      const pageNumberMarkup = pageNumberEnabled
        ? `<div class="english-note-print-page-number">${index + 1} / ${totalPages}</div>`
        : ''
      return `<section class="english-note-print-page">${pageNumberMarkup}<div class="${contentClass}">${pageHtml}</div></section>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escapedTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${NOTE_PRINT_GOOGLE_FONTS_URL}" rel="stylesheet" />
  <style>
    ${pageCss}
    * { box-sizing: border-box; }
    body {
      font-family: 'Poppins', sans-serif;
      background: #fff;
      color: #111;
      margin: 0;
      line-height: 1.35;
      font-size: 15px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .english-note-content, #note-print-root { font-family: 'Poppins', sans-serif; }
    p, div { margin: 0 0 0.2em; line-height: 1.35; }
    p:last-child { margin-bottom: 0; }
    h1, h2, h3 { margin: 0.55em 0 0.35em; color: #5b4a8c; font-weight: 700; line-height: 1.2; break-after: avoid; page-break-after: avoid; }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.17em; }
    blockquote.note-callout { margin: 0.8em 0; padding: 0.65em 0.9em; border-left: 4px solid #e89bb8; border-radius: 0 0.65rem 0.65rem 0; background: #fff5f8; color: #4a3f6b; break-inside: avoid; page-break-inside: avoid; }
    .note-callout__label { display: block; margin-bottom: 0.2em; color: #7c6bb5; font-size: 0.82em; }
    .note-callout__content { margin: 0; }
    .english-note-title--popis { font-family: 'Poppins', sans-serif !important; }
    .english-note-title--arial { font-family: Arial, Helvetica, sans-serif !important; }
    .english-note-title--cursive {
      font-family: 'Cedarville Cursive', cursive !important;
      font-weight: 400;
    }
    .english-note-title--cursive2 {
      font-family: 'Sacramento', cursive !important;
      font-weight: 400;
    }
    .english-note-content { position: relative; }
    .english-note-image-wrap { position: absolute; z-index: 2; line-height: 0; max-width: min(100%, 320px); }
    .english-note-image-wrap img { display: block; max-width: 100%; height: auto; border-radius: 12px; margin: 0; }
    img { max-width: 100%; height: auto; border-radius: 12px; }
    ul, ol { margin: 0.25em 0; padding-left: 1.35rem; }
    ul { list-style: disc outside; }
    ol { list-style: decimal outside; }
    li { line-height: 1.35; }
    .english-note-content--two-columns {
      column-count: 2;
      column-gap: 14mm;
    }
    .english-note-content--two-columns img {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .english-note-page-break {
      break-before: page;
      page-break-before: always;
      height: 0;
      margin: 0;
      border: 0;
    }
    .english-note-print-page {
      position: relative;
      break-after: page;
      page-break-after: always;
    }
    .english-note-print-page:last-child {
      break-after: auto;
      page-break-after: auto;
    }
    .english-note-print-page-number {
      position: absolute;
      right: 0;
      bottom: 0.75rem;
      font-size: 0.75rem;
      color: #666;
    }
  </style>
</head>
<body>${bodySections}</body>
</html>`
}

export async function printNoteDocument(
  printWindow: Window,
  onPrinted?: () => void,
): Promise<void> {
  const doc = printWindow.document
  try {
    if (doc.fonts?.ready) {
      await doc.fonts.ready
    }
    await new Promise((r) => setTimeout(r, 400))
  } catch {
    /* ignorar si fonts API falla */
  }
  printWindow.focus()
  printWindow.print()
  onPrinted?.()
}

export function noteTitleColorValue(color: EnglishNoteColor): string {
  return ENGLISH_NOTE_COLORS.find((c) => c.id === color)?.value ?? '#111111'
}

export function noteDisplayTitle(title: string): string {
  const trimmed = title.trim()
  return trimmed || 'Sin titulo'
}
