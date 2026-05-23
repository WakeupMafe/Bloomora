import { isVerbsCategory } from '@/features/flashcards/flashcardCategories'

/** Separador en `english_word` para las 3 formas verbales (misma columna en Supabase). */
export const VERB_FORMS_DELIMITER = '|'

export type VerbForms = {
  v1: string
  v2: string
  v3: string
}

export const VERB_FORM_LABELS = {
  v1: 'Presente',
  v2: 'Pasado',
  v3: 'Participio',
} as const

/** Primera letra en mayúscula (resto sin cambiar). */
export function capitalizeFirstLetter(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function normalizeVerbForms(forms: VerbForms): VerbForms {
  return {
    v1: capitalizeFirstLetter(forms.v1.trim()),
    v2: capitalizeFirstLetter(forms.v2.trim()),
    v3: capitalizeFirstLetter(forms.v3.trim()),
  }
}

export function encodeVerbFormsToEnglishWord(forms: VerbForms): string {
  const n = normalizeVerbForms(forms)
  return [n.v1, n.v2, n.v3].join(VERB_FORMS_DELIMITER)
}

export function decodeVerbFormsFromEnglishWord(
  englishWord: string,
): VerbForms | null {
  const parts = englishWord.split(VERB_FORMS_DELIMITER)
  if (parts.length < 3) return null
  const v1 = parts[0]?.trim() ?? ''
  const v2 = parts[1]?.trim() ?? ''
  const v3 = parts.slice(2).join(VERB_FORMS_DELIMITER).trim()
  if (!v1 && !v2 && !v3) return null
  return normalizeVerbForms({ v1, v2, v3 })
}

/** Formas verbales si la categoría es Verbs; si no, null. */
export function resolveVerbForms(
  englishWord: string,
  category: string | null,
): VerbForms | null {
  if (!isVerbsCategory(category)) return null
  const decoded = decodeVerbFormsFromEnglishWord(englishWord)
  if (decoded) return decoded
  const single = englishWord.trim()
  if (!single) return null
  return normalizeVerbForms({ v1: single, v2: '', v3: '' })
}

/** Texto principal en la tarjeta (primera forma o palabra simple). */
export function primaryEnglishDisplay(
  englishWord: string,
  category: string | null,
): string {
  const forms = resolveVerbForms(englishWord, category)
  if (forms) return forms.v1 || forms.v2 || forms.v3 || englishWord
  return englishWord
}

/** Cadena para búsqueda (incluye las 3 formas si es verbo). */
export function englishSearchText(
  englishWord: string,
  category: string | null,
): string {
  const forms = resolveVerbForms(englishWord, category)
  if (forms) return [forms.v1, forms.v2, forms.v3].filter(Boolean).join(' ')
  return englishWord
}
