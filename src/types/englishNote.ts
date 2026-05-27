export type EnglishNotePageSize = 'a4' | 'letter'

export type EnglishNoteTitleFont = 'popis' | 'arial' | 'cursive' | 'cursive2'

export type EnglishNoteColor =
  | 'coral'
  | 'violet'
  | 'babyBlue'
  | 'gray'
  | 'black'

export type EnglishNote = {
  id: string
  userCedula: string
  title: string
  category: string | null
  titleFont: EnglishNoteTitleFont
  titleColor: EnglishNoteColor
  pageSize: EnglishNotePageSize
  pageNumberEnabled: boolean
  twoColumns: boolean
  contentHtml: string
  plainText: string
  coverImageUrl: string | null
  createdAt: string
  updatedAt: string
}

export type EnglishNoteInput = {
  title: string
  category: string | null
  titleFont: EnglishNoteTitleFont
  titleColor: EnglishNoteColor
  pageSize: EnglishNotePageSize
  pageNumberEnabled: boolean
  twoColumns: boolean
  contentHtml: string
  plainText: string
  coverImageUrl: string | null
}

export const ENGLISH_NOTE_PAGE_SIZES: Array<{
  id: EnglishNotePageSize
  label: string
  shortLabel: string
}> = [
  { id: 'letter', label: 'Carta (8.5 × 11 in)', shortLabel: 'Carta' },
  { id: 'a4', label: 'A4 (210 × 297 mm)', shortLabel: 'A4' },
]

export const ENGLISH_NOTE_COLORS: Array<{
  id: EnglishNoteColor
  label: string
  value: string
}> = [
  { id: 'coral', label: 'Rosa coral', value: '#ff7f9f' },
  { id: 'violet', label: 'Violeta suave', value: '#8b7ed6' },
  { id: 'babyBlue', label: 'Azul bebe', value: '#70b7f3' },
  { id: 'gray', label: 'Gris', value: '#8a8f9b' },
  { id: 'black', label: 'Negro', value: '#111111' },
]

