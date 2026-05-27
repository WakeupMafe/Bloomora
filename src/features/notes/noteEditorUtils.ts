import type { NoteTextAlign, NoteTypingDefaults } from '@/features/notes/noteTypingDefaults'
import type { EnglishNoteColor, EnglishNotePageSize, EnglishNoteTitleFont } from '@/types/englishNote'
import { ENGLISH_NOTE_COLORS } from '@/types/englishNote'

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
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return false
  if (!sel.toString().trim()) return false

  const clamped = Math.min(
    NOTE_FONT_SIZE_MAX_PX,
    Math.max(NOTE_FONT_SIZE_MIN_PX, Math.round(sizePx)),
  )

  const span = document.createElement('span')
  span.style.fontSize = `${clamped}px`

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
    if (tag === 'P' || tag === 'DIV' || tag === 'LI' || tag === 'H1' || tag === 'H2' || tag === 'H3') {
      return el
    }
    el = el.parentElement
  }
  return null
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
  if (block) {
    block.style.textAlign = defaults.align === 'center' ? 'center' : 'left'
  }

  if (!range.collapsed) return

  const span = document.createElement('span')
  span.className = noteTitleFontClass(defaults.font)
  span.style.fontFamily = noteTitleFontFamily(defaults.font)
  span.style.fontSize = `${defaults.fontSizePx}px`
  span.style.color = defaults.colorHex
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
  editor.focus()
  document.execCommand('insertParagraph')
  applyTypingDefaultsAtCaret(editor, defaults)
}

export function applyBlockAlign(editor: HTMLElement, align: NoteTextAlign): void {
  editor.focus()
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return

  const block = getBlockInEditor(range.startContainer, editor)
  if (block) {
    block.style.textAlign = align === 'center' ? 'center' : 'left'
  }
  document.execCommand(align === 'center' ? 'justifyCenter' : 'justifyLeft', false)
}

export function applyNoteFontToSelection(
  editor: HTMLElement,
  font: EnglishNoteTitleFont,
): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return false

  const span = document.createElement('span')
  span.className = noteTitleFontClass(font)
  span.style.fontFamily = noteTitleFontFamily(font)

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
  editor.focus()

  const img = createNoteImageElement(src)
  const wrap = createNoteImageWrap(img)
  const sel = window.getSelection()

  let anchorRect: DOMRect | null = null
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0)
    if (editor.contains(range.commonAncestorContainer)) {
      anchorRect = range.getBoundingClientRect()
      range.deleteContents()
    }
  }

  editor.appendChild(wrap)

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
  'https://fonts.googleapis.com/css2?family=Cedarville+Cursive&family=Poppins:wght@400;500;600;700&family=Sacramento&display=swap'

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
  const pageCss = notePrintPageCss(pageSize, pageNumberEnabled)
  const contentClass = twoColumns
    ? 'english-note-content english-note-content--two-columns'
    : 'english-note-content'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${docTitle.replace(/</g, '&lt;')}</title>
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
    li { line-height: 1.35; }
    .english-note-content--two-columns {
      column-count: 2;
      column-gap: 14mm;
    }
    .english-note-content--two-columns img {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  </style>
</head>
<body><div id="note-print-root" class="${contentClass}">${preparedHtml}</div></body>
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
