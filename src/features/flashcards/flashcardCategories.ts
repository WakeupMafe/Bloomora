/** Categorías fijas del módulo English Flashcards (valor = lo guardado en Supabase). */
export const FLASHCARD_CATEGORY_OPTIONS = [
  { value: 'Adjectives', label: 'Adjectives' },
  { value: 'Adverb', label: 'Adverb' },
  { value: 'Noun', label: 'Noun' },
  { value: 'Preposition', label: 'Preposition' },
  { value: 'Verbs', label: 'Verbs' },
  { value: 'Idioms', label: 'Idioms' },
  { value: 'Phrasal verb', label: 'Phrasal verb' },
  { value: 'Grammar', label: 'Grammar' },
] as const

export type FlashcardCategory = (typeof FLASHCARD_CATEGORY_OPTIONS)[number]['value']

export const VERBS_CATEGORY: FlashcardCategory = 'Verbs'
export const GRAMMAR_CATEGORY: FlashcardCategory = 'Grammar'

export const FLASHCARD_CATEGORY_VALUES: FlashcardCategory[] =
  FLASHCARD_CATEGORY_OPTIONS.map((o) => o.value)

export function isVerbsCategory(category: string | null | undefined): boolean {
  return category === VERBS_CATEGORY
}

export function isGrammarCategory(category: string | null | undefined): boolean {
  return category === GRAMMAR_CATEGORY
}
