import {
  FLASHCARD_CATEGORY_OPTIONS,
  type FlashcardCategory,
} from '@/features/flashcards/flashcardCategories'
import type { EnglishFlashcard } from '@/types/englishFlashcard'

export const UNCATEGORIZED_PACK_KEY = '__uncategorized__'

export type CategoryPack = {
  key: string
  category: string | null
  label: string
  cards: EnglishFlashcard[]
}

const CATEGORY_ORDER = FLASHCARD_CATEGORY_OPTIONS.map((o) => o.value)

function packSortIndex(key: string, category: string | null): number {
  if (key === UNCATEGORIZED_PACK_KEY) return CATEGORY_ORDER.length + 1
  const idx = CATEGORY_ORDER.indexOf(category as FlashcardCategory)
  return idx === -1 ? CATEGORY_ORDER.length : idx
}

/** Agrupa flashcards filtradas en paquetes por categoría (orden fijo del menú). */
export function buildCategoryPacks(cards: EnglishFlashcard[]): CategoryPack[] {
  const map = new Map<string, EnglishFlashcard[]>()

  for (const card of cards) {
    const cat = card.category?.trim() || null
    const key = cat ?? UNCATEGORIZED_PACK_KEY
    const list = map.get(key) ?? []
    list.push(card)
    map.set(key, list)
  }

  const packs: CategoryPack[] = []

  for (const opt of FLASHCARD_CATEGORY_OPTIONS) {
    const list = map.get(opt.value)
    if (list?.length) {
      packs.push({
        key: opt.value,
        category: opt.value,
        label: opt.label,
        cards: list,
      })
      map.delete(opt.value)
    }
  }

  for (const [key, list] of map) {
    if (!list.length) continue
    packs.push({
      key,
      category: key === UNCATEGORIZED_PACK_KEY ? null : key,
      label: key === UNCATEGORIZED_PACK_KEY ? 'Sin categoría' : key,
      cards: list,
    })
  }

  packs.sort(
    (a, b) => packSortIndex(a.key, a.category) - packSortIndex(b.key, b.category),
  )

  return packs
}
