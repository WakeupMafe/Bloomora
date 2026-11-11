export const NOTE_LINE_HEIGHTS = [1, 1.15, 1.5, 2]
export const NOTE_SPACING_AFTER = [0, 6, 8, 12]
export const NOTE_DEFAULT_LINE_HEIGHT = 1.15
export const NOTE_DEFAULT_SPACING_AFTER = 8

const SPACING_BLOCKS = new Set(['P', 'H1', 'H2', 'H3', 'LI'])
const EMPTY_TEXT = /^[\s\u00a0\u200b]*(?:&nbsp;|&#160;|&#xA0;)?[\s\u00a0\u200b]*$/i

function nearest(value, choices, fallback) {
  const numeric = Number.parseFloat(value)
  if (!Number.isFinite(numeric)) return fallback
  return choices.reduce((best, current) =>
    Math.abs(current - numeric) < Math.abs(best - numeric) ? current : best, choices[0])
}

function cleanStyle(styleValue) {
  const kept = []
  for (const declaration of (styleValue ?? '').split(';')) {
    const colon = declaration.indexOf(':')
    if (colon < 0) continue
    const name = declaration.slice(0, colon).trim().toLowerCase()
    const value = declaration.slice(colon + 1).trim()
    if (!name || !value) continue
    if (name === 'line-height' || name.startsWith('margin') || name.startsWith('padding') || name === 'height' || name === 'min-height' || name === 'max-height' || name === 'block-size' || name === 'min-block-size' || name === 'max-block-size') continue
    kept.push(`${name}: ${value}`)
  }
  return kept.join('; ')
}

function hasContent(node) {
  if (node.nodeType === 3) return !EMPTY_TEXT.test(node.nodeValue ?? '')
  if (node.nodeType !== 1) return false
  if (node.matches('img,hr,video,audio,canvas,[data-note-block="true"],[data-note-page-break="true"]')) return true
  return [...node.childNodes].some(hasContent)
}

function lineHeightFromBlock(block) {
  const stored = block.getAttribute('data-line-height')
  if (stored) return nearest(stored, NOTE_LINE_HEIGHTS, NOTE_DEFAULT_LINE_HEIGHT)
  const own = block.style.lineHeight
  if (own) return nearest(own, NOTE_LINE_HEIGHTS, NOTE_DEFAULT_LINE_HEIGHT)
  const inline = block.querySelector('[style*="line-height"]')
  return inline?.style.lineHeight
    ? nearest(inline.style.lineHeight, NOTE_LINE_HEIGHTS, NOTE_DEFAULT_LINE_HEIGHT)
    : NOTE_DEFAULT_LINE_HEIGHT
}

function spacingFromBlock(block) {
  const stored = block.getAttribute('data-spacing')
  if (stored != null) return nearest(stored, NOTE_SPACING_AFTER, NOTE_DEFAULT_SPACING_AFTER)
  const margin = block.style.marginBottom || block.style.margin
  if (!margin) return NOTE_DEFAULT_SPACING_AFTER
  const values = margin.trim().split(/\s+/).map((part) => Number.parseFloat(part))
  const bottom = values.length >= 3 ? values[2] : values.length === 2 ? values[0] : values[0]
  return Number.isFinite(bottom) ? nearest(bottom, NOTE_SPACING_AFTER, NOTE_DEFAULT_SPACING_AFTER) : NOTE_DEFAULT_SPACING_AFTER
}

function textContentOfParts(parts) {
  return parts.flatMap((node) => node.nodeType === 3 ? [node.nodeValue ?? ''] : node.nodeType === 1 ? [node.textContent ?? ''] : []).join('').replace(/[\u200b\u00a0]/g, ' ').trim()
}

function splitDeep(node) {
  if (node.nodeType === 3) return { segments: [[node.cloneNode()]], breaks: [] }
  if (node.nodeType !== 1) return { segments: [[node.cloneNode(true)]], breaks: [] }
  if (node.tagName === 'BR') return { segments: [[], []], breaks: [node.getAttribute('data-note-soft-break') === 'true' ? 'soft' : 'legacy'] }

  const segments = [[]]
  const breaks = []
  for (const child of [...node.childNodes]) {
    const split = splitDeep(child)
    segments[segments.length - 1].push(...split.segments[0])
    for (let i = 0; i < split.breaks.length; i += 1) {
      breaks.push(split.breaks[i])
      segments.push(split.segments[i + 1])
    }
  }
  return {
    segments: segments.map((children) => {
      if (node.tagName === 'SPAN' && children.length === 0) return []
      const clone = node.cloneNode(false)
      children.forEach((child) => clone.appendChild(child))
      return [clone]
    }),
    breaks,
  }
}

function splitParagraph(paragraph) {
  const split = { segments: [[]], breaks: [] }
  for (const child of [...paragraph.childNodes]) {
    const childSplit = splitDeep(child)
    split.segments[split.segments.length - 1].push(...childSplit.segments[0])
    for (let i = 0; i < childSplit.breaks.length; i += 1) {
      split.breaks.push(childSplit.breaks[i])
      split.segments.push(childSplit.segments[i + 1])
    }
  }

  const lineHeight = lineHeightFromBlock(paragraph)
  const spacing = spacingFromBlock(paragraph)
  const result = []
  let current = []
  const flush = () => {
    const p = paragraph.ownerDocument.createElement(paragraph.tagName.toLowerCase())
    for (const attr of [...paragraph.attributes]) p.setAttribute(attr.name, attr.value)
    p.replaceChildren(...current)
    p.dataset.lineHeight = String(lineHeight)
    p.dataset.spacing = String(spacing)
    result.push(p)
    current = []
  }

  for (let i = 0; i < split.segments.length; i += 1) {
    current.push(...split.segments[i])
    if (i >= split.breaks.length) continue
    const previousText = textContentOfParts(split.segments[i])
    const nextText = textContentOfParts(split.segments[i + 1])
    const separateParagraph = split.breaks[i] !== 'soft'
    if (separateParagraph) {
      if (current.some(hasContent)) flush()
      while (split.segments[i + 1]?.length === 0 && i + 1 < split.breaks.length) i += 1
    } else {
      const softBreak = paragraph.ownerDocument.createElement('br')
      softBreak.dataset.noteSoftBreak = 'true'
      current.push(softBreak)
    }
  }
  if (current.some(hasContent) || result.length === 0) flush()
  return result
}

function normalizeElement(node, doc) {
  if (node.nodeType === 3) return EMPTY_TEXT.test(node.nodeValue ?? '') ? [] : [doc.createTextNode(node.nodeValue ?? '')]
  if (node.nodeType !== 1) return []
  const tag = node.tagName
  if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'SVG', 'VIDEO', 'AUDIO'].includes(tag)) return []
  if (node.dataset.notePageBreak === 'true') return [node.cloneNode(true)]

  const clone = node.cloneNode(false)
  clone.removeAttribute('data-line-height')
  clone.removeAttribute('data-spacing')
  const style = cleanStyle(node.getAttribute('style'))
  if (style) clone.setAttribute('style', style)
  else clone.removeAttribute('style')

  if (SPACING_BLOCKS.has(tag)) {
    clone.dataset.lineHeight = String(lineHeightFromBlock(node))
    clone.dataset.spacing = String(spacingFromBlock(node))
  }

  const children = [...node.childNodes].flatMap((child) => normalizeElement(child, doc))
  if (tag === 'DIV') {
    if (children.some((child) => child.nodeType === 1 && ['P', 'H1', 'H2', 'H3', 'LI', 'UL', 'OL', 'BLOCKQUOTE'].includes(child.tagName))) return children
    const p = doc.createElement('p')
    p.replaceChildren(...children)
    p.dataset.lineHeight = String(lineHeightFromBlock(node))
    p.dataset.spacing = String(spacingFromBlock(node))
    return splitParagraph(p)
  }
  clone.replaceChildren(...children)
  if (SPACING_BLOCKS.has(tag)) return tag === 'P' ? splitParagraph(clone) : [clone]
  return [clone]
}

function emptyBlock(node) {
  return node.nodeType === 3 ? EMPTY_TEXT.test(node.nodeValue ?? '')
    : node.nodeType === 1 && !hasContent(node)
}

function applyRenderedStyles(root) {
  for (const block of root.querySelectorAll('[data-line-height][data-spacing]')) {
    const lineHeight = nearest(block.dataset.lineHeight, NOTE_LINE_HEIGHTS, NOTE_DEFAULT_LINE_HEIGHT)
    const spacing = nearest(block.dataset.spacing, NOTE_SPACING_AFTER, NOTE_DEFAULT_SPACING_AFTER)
    block.dataset.lineHeight = String(lineHeight)
    block.dataset.spacing = String(spacing)
    block.style.lineHeight = String(lineHeight)
    block.style.margin = `0 0 ${spacing}px 0`
    block.style.padding = '0'
    block.style.removeProperty('height')
  }
  for (const span of root.querySelectorAll('span')) {
    span.style.removeProperty('line-height')
    span.style.removeProperty('margin')
    span.style.removeProperty('padding')
    span.style.removeProperty('height')
  }
}

/** Canonicalize vertical spacing; stored data attributes are the single source of truth. */
export function normalizeSpacing(html, { renderStyles = false } = {}) {
  const doc = new DOMParser().parseFromString(`<div data-spacing-root="true">${html ?? ''}</div>`, 'text/html')
  const root = doc.querySelector('[data-spacing-root="true"]')
  if (!root) return html ?? ''

  const normalized = [...root.childNodes].flatMap((node) => normalizeElement(node, doc))
  const result = []
  let emptyParagraphCount = 0
  for (const node of normalized) {
    if (node.nodeType === 1 && node.tagName === 'P' && emptyBlock(node)) {
      emptyParagraphCount += 1
      if (emptyParagraphCount > 1) continue
    } else if (!emptyBlock(node)) emptyParagraphCount = 0
    result.push(node)
  }
  root.replaceChildren(...result)

  while (root.firstChild && emptyBlock(root.firstChild)) root.firstChild.remove()
  const first = root.firstElementChild
  if (first) {
    first.style.removeProperty('margin-top')
    first.style.removeProperty('padding-top')
    if (first.dataset.lineHeight) {
      first.dataset.lineHeight = String(nearest(first.dataset.lineHeight, NOTE_LINE_HEIGHTS, NOTE_DEFAULT_LINE_HEIGHT))
    }
  }
  if (!root.childNodes.length) {
    const p = doc.createElement('p')
    p.dataset.lineHeight = String(NOTE_DEFAULT_LINE_HEIGHT)
    p.dataset.spacing = String(NOTE_DEFAULT_SPACING_AFTER)
    p.innerHTML = '<br>'
    root.appendChild(p)
  }
  if (renderStyles) applyRenderedStyles(root)
  return root.innerHTML
}

export function setBlockSpacing(block, { lineHeight, spacingAfter } = {}) {
  const nextLine = nearest(lineHeight ?? block.dataset.lineHeight, NOTE_LINE_HEIGHTS, NOTE_DEFAULT_LINE_HEIGHT)
  const nextSpacing = nearest(spacingAfter ?? block.dataset.spacing, NOTE_SPACING_AFTER, NOTE_DEFAULT_SPACING_AFTER)
  block.dataset.lineHeight = String(nextLine)
  block.dataset.spacing = String(nextSpacing)
  block.style.lineHeight = String(nextLine)
  block.style.margin = `0 0 ${nextSpacing}px 0`
  block.style.padding = '0'
  return { lineHeight: nextLine, spacingAfter: nextSpacing }
}
