import type { FlashcardCategory } from '@/features/flashcards/flashcardCategories'

export type FlashcardCategoryTheme = {
  badge: string
  badgeClass: string
  accentText: string
  speakerClass: string
  verbBoxClass: string
  footerPillClass: string
  editBtnClass: string
}

const THEMES: Record<FlashcardCategory, FlashcardCategoryTheme> = {
  Adjectives: {
    badge: 'ADJECTIVE',
    badgeClass:
      'bg-[#fce7f3] text-[#db2777] ring-1 ring-[#fbcfe8]/80',
    accentText: 'text-[#9d174d]',
    speakerClass: 'text-[#ec4899] hover:bg-[#fce7f3]',
    verbBoxClass: 'bg-[#fdf2f8] ring-[#fbcfe8]/60',
    footerPillClass: 'bg-[#fce7f3] text-[#be185d] ring-[#fbcfe8]/70',
    editBtnClass: 'bg-[#fce7f3] text-[#db2777] hover:bg-[#fbcfe8]/80',
  },
  Adverb: {
    badge: 'ADVERB',
    badgeClass:
      'bg-[#ffe8e0] text-[#c2614f] ring-1 ring-[#ffcab8]/85',
    accentText: 'text-[#9e4a3d]',
    speakerClass: 'text-[#e07a5f] hover:bg-[#ffe8e0]',
    verbBoxClass: 'bg-[#fff5f2] ring-[#ffcab8]/65',
    footerPillClass: 'bg-[#ffe8e0] text-[#b85c4a] ring-[#ffcab8]/75',
    editBtnClass: 'bg-[#ffe8e0] text-[#c2614f] hover:bg-[#ffcab8]/55',
  },
  Noun: {
    badge: 'NOUN',
    badgeClass:
      'bg-[#e0f2fe] text-[#0369a1] ring-1 ring-[#bae6fd]/80',
    accentText: 'text-[#0c4a6e]',
    speakerClass: 'text-[#0284c7] hover:bg-[#e0f2fe]',
    verbBoxClass: 'bg-[#f0f9ff] ring-[#bae6fd]/60',
    footerPillClass: 'bg-[#e0f2fe] text-[#0369a1] ring-[#bae6fd]/70',
    editBtnClass: 'bg-[#e0f2fe] text-[#0284c7] hover:bg-[#bae6fd]/80',
  },
  Verbs: {
    badge: 'VERB',
    badgeClass:
      'bg-[#ede9fe] text-[#6d28d9] ring-1 ring-[#ddd6fe]/80',
    accentText: 'text-[#5b21b6]',
    speakerClass: 'text-[#7c3aed] hover:bg-[#ede9fe]',
    verbBoxClass: 'bg-[#f5f3ff] ring-[#ddd6fe]/70',
    footerPillClass: 'bg-[#ede9fe] text-[#6d28d9] ring-[#ddd6fe]/70',
    editBtnClass: 'bg-[#ede9fe] text-[#7c3aed] hover:bg-[#ddd6fe]/80',
  },
  Idioms: {
    badge: 'IDIOM',
    badgeClass:
      'bg-bloomora-lavender-50 text-bloomora-violet ring-1 ring-bloomora-line/30',
    accentText: 'text-bloomora-deep',
    speakerClass: 'text-bloomora-violet hover:bg-bloomora-lavender-50',
    verbBoxClass: 'bg-bloomora-lavender-50/80 ring-bloomora-line/25',
    footerPillClass:
      'bg-bloomora-lavender-50 text-bloomora-violet ring-bloomora-line/30',
    editBtnClass:
      'bg-bloomora-lavender-50 text-bloomora-violet hover:bg-bloomora-lavender-100/80',
  },
  'Phrasal verb': {
    badge: 'PHRASAL',
    badgeClass:
      'bg-[#ede9fe] text-[#7c3aed] ring-1 ring-[#ddd6fe]/80',
    accentText: 'text-[#5b21b6]',
    speakerClass: 'text-[#7c3aed] hover:bg-[#ede9fe]',
    verbBoxClass: 'bg-[#f5f3ff] ring-[#ddd6fe]/70',
    footerPillClass: 'bg-[#ede9fe] text-[#6d28d9] ring-[#ddd6fe]/70',
    editBtnClass: 'bg-[#ede9fe] text-[#7c3aed] hover:bg-[#ddd6fe]/80',
  },
  Grammar: {
    badge: 'GRAMMAR',
    badgeClass:
      'bg-[#ffedd5] text-[#c2410c] ring-1 ring-[#fed7aa]/80',
    accentText: 'text-[#9a3412]',
    speakerClass: 'text-[#ea580c] hover:bg-[#ffedd5]',
    verbBoxClass: 'bg-[#fff7ed] ring-[#fed7aa]/60',
    footerPillClass: 'bg-[#ffedd5] text-[#c2410c] ring-[#fed7aa]/70',
    editBtnClass: 'bg-[#ffedd5] text-[#ea580c] hover:bg-[#fed7aa]/80',
  },
}

const DEFAULT_THEME: FlashcardCategoryTheme = {
  badge: 'WORD',
  badgeClass:
    'bg-bloomora-lavender-50 text-bloomora-violet ring-1 ring-bloomora-line/30',
  accentText: 'text-bloomora-deep',
  speakerClass: 'text-bloomora-violet hover:bg-bloomora-lavender-50',
  verbBoxClass: 'bg-bloomora-lavender-50/80 ring-bloomora-line/25',
  footerPillClass:
    'bg-bloomora-lavender-50 text-bloomora-violet ring-bloomora-line/30',
  editBtnClass:
    'bg-bloomora-lavender-50 text-bloomora-violet hover:bg-bloomora-lavender-100/80',
}

export function getCategoryTheme(
  category: string | null | undefined,
): FlashcardCategoryTheme {
  if (!category) return DEFAULT_THEME
  return THEMES[category as FlashcardCategory] ?? DEFAULT_THEME
}
