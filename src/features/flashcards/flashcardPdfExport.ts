import { isGrammarCategory, isVerbsCategory } from '@/features/flashcards/flashcardCategories'
import { buildCategoryPacks } from '@/features/flashcards/groupFlashcardsByCategory'
import {
  isFlashcardRichHtml,
  prepareFlashcardRichHtml,
} from '@/features/flashcards/flashcardRichText'
import { printNoteDocument } from '@/features/notes/noteEditorUtils'
import type { EnglishFlashcard } from '@/types/englishFlashcard'
import {
  primaryEnglishDisplay,
  resolveVerbForms,
  VERB_FORM_LABELS,
} from '@/features/flashcards/verbFormsCodec'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function capitalizeWord(w: string): string {
  if (!w) return w
  return w.charAt(0).toUpperCase() + w.slice(1)
}

function renderTextField(html: string, className: string): string {
  const trimmed = html.trim()
  if (!trimmed) return ''

  const prepared = prepareFlashcardRichHtml(trimmed)
  if (isFlashcardRichHtml(trimmed) || prepared.includes('<ol')) {
    return `<div class="flashcard-rich-content ${className}">${prepared}</div>`
  }

  return `<p class="${className}">${escapeHtml(trimmed)}</p>`
}

function sortCards(cards: EnglishFlashcard[]): EnglishFlashcard[] {
  return [...cards].sort((a, b) =>
    primaryEnglishDisplay(a.englishWord, a.category).localeCompare(
      primaryEnglishDisplay(b.englishWord, b.category),
      'es',
      { sensitivity: 'base' },
    ),
  )
}

function renderFlashcardEntry(card: EnglishFlashcard): string {
  const isGrammar = isGrammarCategory(card.category)
  const title = escapeHtml(
    capitalizeWord(primaryEnglishDisplay(card.englishWord, card.category)),
  )
  const verbForms =
    isVerbsCategory(card.category) && card.verbForms
      ? card.verbForms
      : resolveVerbForms(card.englishWord, card.category)

  const lines: string[] = ['<li class="entry">']

  if (isGrammar) {
    lines.push(`<div class="entry-head"><span class="english">${title}</span></div>`)
    const explanation = card.shortMeaning?.trim()
    if (explanation) {
      lines.push(renderTextField(explanation, 'grammar-note'))
    }
  } else {
    const spanish = escapeHtml(card.spanishMeaning.trim())
    lines.push(
      `<div class="entry-head"><span class="english">${title}</span>` +
        (spanish ? `<span class="spanish"> — ${spanish}</span>` : '') +
        `</div>`,
    )

    const pronunciation = card.pronunciation?.trim()
    if (pronunciation) {
      lines.push(`<p class="pronunciation">${escapeHtml(pronunciation)}</p>`)
    }

    if (verbForms && (verbForms.v1 || verbForms.v2 || verbForms.v3)) {
      const parts = [
        verbForms.v1 ? `${VERB_FORM_LABELS.v1}: ${verbForms.v1}` : '',
        verbForms.v2 ? `${VERB_FORM_LABELS.v2}: ${verbForms.v2}` : '',
        verbForms.v3 ? `${VERB_FORM_LABELS.v3}: ${verbForms.v3}` : '',
      ].filter(Boolean)
      lines.push(`<p class="verb-forms">${escapeHtml(parts.join(' · '))}</p>`)
    }

    const shortMeaning = card.shortMeaning?.trim()
    if (shortMeaning) {
      lines.push(renderTextField(shortMeaning, 'short-meaning'))
    }

    if (card.exampleEnglish?.trim() || card.exampleSpanish?.trim()) {
      lines.push('<div class="example">')
      if (card.exampleEnglish?.trim()) {
        lines.push(`<p class="ex-en">${escapeHtml(card.exampleEnglish.trim())}</p>`)
      }
      if (card.exampleSpanish?.trim()) {
        lines.push(`<p class="ex-es">${escapeHtml(card.exampleSpanish.trim())}</p>`)
      }
      lines.push('</div>')
    }
  }

  lines.push('</li>')
  return lines.join('')
}

function formatGeneratedDate(): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date())
}

export function buildFlashcardsPrintDocumentHtml(cards: EnglishFlashcard[]): string {
  const packs = buildCategoryPacks(cards)
  const total = cards.length

  const sections = packs
    .map((pack) => {
      const entries = sortCards(pack.cards).map(renderFlashcardEntry).join('')
      return `<section class="category">
  <h2>${escapeHtml(pack.label)} <span class="count">(${pack.cards.length})</span></h2>
  <ol class="entries">${entries}</ol>
</section>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>English Flashcards — Listado</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      background: #fff;
      color: #1a1330;
      margin: 0;
      padding: 18mm 16mm;
      line-height: 1.45;
      font-size: 11pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .doc-header {
      margin-bottom: 1.5rem;
      padding-bottom: 0.85rem;
      border-bottom: 2px solid #e9e3f5;
    }
    .doc-header h1 {
      margin: 0;
      font-size: 1.45rem;
      font-weight: 700;
      color: #5b21b6;
    }
    .doc-meta {
      margin: 0.35rem 0 0;
      font-size: 0.82rem;
      color: #6b5f8a;
    }
    .category {
      break-inside: avoid-page;
      page-break-inside: avoid;
      margin-bottom: 1.35rem;
    }
    .category h2 {
      margin: 0 0 0.55rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: #5b21b6;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .category h2 .count {
      font-weight: 600;
      color: #8b7cb8;
      text-transform: none;
    }
    .entries {
      margin: 0;
      padding-left: 1.35rem;
    }
    .entry {
      margin-bottom: 0.65rem;
      break-inside: avoid-page;
      page-break-inside: avoid;
    }
    .entry-head {
      font-weight: 600;
    }
    .english { color: #1a1330; }
    .spanish { color: #4a3f6b; font-weight: 500; }
    .pronunciation {
      margin: 0.1rem 0 0;
      font-size: 0.88rem;
      color: #7c6bb5;
      font-style: italic;
    }
    .verb-forms,
    .short-meaning {
      margin: 0.12rem 0 0;
      font-size: 0.9rem;
      color: #4a3f6b;
    }
    .grammar-note {
      margin: 0.2rem 0 0;
      font-size: 0.9rem;
      color: #4a3f6b;
    }
    .example {
      margin-top: 0.15rem;
    }
    .ex-en {
      margin: 0;
      font-size: 0.88rem;
      color: #2d2640;
    }
    .ex-es {
      margin: 0.05rem 0 0;
      font-size: 0.85rem;
      color: #6b5f8a;
    }
    .flashcard-rich-content p,
    .flashcard-rich-content div {
      margin: 0.2rem 0 0;
    }
    .flashcard-rich-content p:first-child,
    .flashcard-rich-content div:first-child {
      margin-top: 0;
    }
    .flashcard-pink-bold {
      font-weight: 700;
      color: #ec4899;
    }
    .flashcard-rich-content ol.flashcard-numbered-list {
      margin: 0.35rem 0 0.35rem 1.1rem;
      padding-left: 1.1rem;
      list-style-type: decimal;
    }
    .flashcard-rich-content ol.flashcard-numbered-list li {
      margin: 0.25rem 0;
      padding-left: 0.15rem;
      line-height: 1.5;
    }
    .flashcard-rich-content ol.flashcard-numbered-list li::marker {
      color: #7c6bb5;
      font-weight: 700;
    }
    @media print {
      body { padding: 12mm 14mm; }
    }
  </style>
</head>
<body>
  <header class="doc-header">
    <h1>English Flashcards — Listado</h1>
    <p class="doc-meta">${total} tarjeta${total === 1 ? '' : 's'} · Generado el ${escapeHtml(formatGeneratedDate())}</p>
  </header>
  ${sections}
</body>
</html>`
}

export async function exportFlashcardsPdf(
  cards: EnglishFlashcard[],
  onPrinted?: () => void,
): Promise<boolean> {
  if (!cards.length) return false

  const printWindow = window.open('', '_blank')
  if (!printWindow) return false

  printWindow.document.open()
  printWindow.document.write(buildFlashcardsPrintDocumentHtml(cards))
  printWindow.document.close()

  await printNoteDocument(printWindow, onPrinted)
  return true
}
