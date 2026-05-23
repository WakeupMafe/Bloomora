import {
  isGrammarCategory,
  isVerbsCategory,
  VERBS_CATEGORY,
} from '@/features/flashcards/flashcardCategories'
import { plainTextFromFlashcardHtml } from '@/features/flashcards/flashcardRichText'
import {
  encodeVerbFormsToEnglishWord,
  resolveVerbForms,
  type VerbForms,
} from '@/features/flashcards/verbFormsCodec'
import type { EnglishFlashcard, EnglishFlashcardInput } from '@/types/englishFlashcard'

export type FlashcardFormState = {
  englishWord: string
  verbV1: string
  verbV2: string
  verbV3: string
  pronunciation: string
  shortMeaning: string
  spanishMeaning: string
  exampleEnglish: string
  exampleSpanish: string
  category: string
  imageUrl: string
  imagePreview: string | null
}

export const emptyFlashcardFormState = (): FlashcardFormState => ({
  englishWord: '',
  verbV1: '',
  verbV2: '',
  verbV3: '',
  pronunciation: '',
  shortMeaning: '',
  spanishMeaning: '',
  exampleEnglish: '',
  exampleSpanish: '',
  category: '',
  imageUrl: '',
  imagePreview: null,
})

function verbFormsFromCard(card: EnglishFlashcard): VerbForms {
  const resolved = resolveVerbForms(card.englishWord, card.category)
  return resolved ?? { v1: card.englishWord, v2: '', v3: '' }
}

export function flashcardToFormState(card: EnglishFlashcard): FlashcardFormState {
  const isVerb = isVerbsCategory(card.category)
  const forms = isVerb ? verbFormsFromCard(card) : null

  return {
    englishWord: isVerb ? '' : card.englishWord,
    verbV1: forms?.v1 ?? '',
    verbV2: forms?.v2 ?? '',
    verbV3: forms?.v3 ?? '',
    pronunciation: card.pronunciation ?? '',
    shortMeaning: card.shortMeaning ?? '',
    spanishMeaning: card.spanishMeaning,
    exampleEnglish: card.exampleEnglish ?? '',
    exampleSpanish: card.exampleSpanish ?? '',
    category: card.category ?? '',
    imageUrl: card.imageUrl,
    imagePreview: card.imageUrl,
  }
}

export function resolveEnglishWordForSave(state: FlashcardFormState): string {
  if (isVerbsCategory(state.category)) {
    return encodeVerbFormsToEnglishWord({
      v1: state.verbV1,
      v2: state.verbV2,
      v3: state.verbV3,
    })
  }
  return state.englishWord.trim()
}

export function formStateToInput(state: FlashcardFormState): EnglishFlashcardInput {
  return {
    englishWord: resolveEnglishWordForSave(state),
    pronunciation: state.pronunciation || null,
    shortMeaning: state.shortMeaning || null,
    spanishMeaning: state.spanishMeaning,
    exampleEnglish: state.exampleEnglish || null,
    exampleSpanish: state.exampleSpanish || null,
    imageUrl: state.imageUrl,
    category: state.category || null,
  }
}

export function isVerbFormValid(state: FlashcardFormState): boolean {
  if (isVerbsCategory(state.category)) {
    return (
      !!state.verbV1.trim() &&
      !!state.verbV2.trim() &&
      !!state.verbV3.trim()
    )
  }
  if (isGrammarCategory(state.category)) {
    return (
      !!state.englishWord.trim() &&
      !!plainTextFromFlashcardHtml(state.shortMeaning)
    )
  }
  return !!state.englishWord.trim()
}

export { VERBS_CATEGORY }
