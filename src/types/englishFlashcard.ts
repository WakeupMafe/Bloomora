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
  createdAt: string
  updatedAt: string
}

export type EnglishFlashcardInput = {
  englishWord: string
  pronunciation: string | null
  shortMeaning: string | null
  spanishMeaning: string
  exampleEnglish: string | null
  exampleSpanish: string | null
  imageUrl: string
  category: string | null
}

export const FLASHCARD_IMAGE_REQUIRED_MESSAGE =
  'Para guardar esta palabra necesitas asociarla con una imagen. Esto ayuda a memorizar mejor.'
