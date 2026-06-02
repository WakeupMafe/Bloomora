import type { VerbForms } from '@/features/flashcards/verbFormsCodec'

export type EnglishFlashcard = {
  id: string
  /** En Supabase; para Verbs puede ser `v1|v2|v3`. */
  englishWord: string
  /** Solo si category === Verbs y hay 3 formas. */
  verbForms: VerbForms | null
  pronunciation: string | null
  shortMeaning: string | null
  spanishMeaning: string
  exampleEnglish: string | null
  exampleSpanish: string | null
  imageUrl: string
  category: string | null
  entryMode: FlashcardEntryMode
  isQuickDraft: boolean
  createdAt: string
  updatedAt: string
}

export type FlashcardEntryMode = 'full' | 'quick'

export type EnglishFlashcardInput = {
  englishWord: string
  pronunciation: string | null
  shortMeaning: string | null
  spanishMeaning: string
  exampleEnglish: string | null
  exampleSpanish: string | null
  imageUrl: string
  category: string | null
  entryMode?: FlashcardEntryMode
  isQuickDraft?: boolean
}

/** Placeholder en BD para tarjetas rápidas sin imagen aún. */
export const QUICK_FLASHCARD_PLACEHOLDER_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#f3f0fa" width="400" height="300" rx="16"/><text x="200" y="145" text-anchor="middle" fill="#7c6bb5" font-family="system-ui,sans-serif" font-size="15" font-weight="600">Pendiente</text><text x="200" y="168" text-anchor="middle" fill="#a89bc4" font-family="system-ui,sans-serif" font-size="12">Añade imagen</text></svg>',
  )

export const FLASHCARD_IMAGE_REQUIRED_MESSAGE =
  'Para guardar esta palabra necesitas asociarla con una imagen. Esto ayuda a memorizar mejor.'
