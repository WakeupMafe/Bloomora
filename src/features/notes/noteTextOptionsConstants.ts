import type { EnglishNoteTitleFont } from '@/types/englishNote'

export type NoteFormatTarget = 'selection' | 'typing'

export const NOTE_TEXT_OPTION_FONTS: Array<{
  id: EnglishNoteTitleFont
  label: string
}> = [
  { id: 'popis', label: 'Poppins' },
  { id: 'arial', label: 'Arial' },
  { id: 'cursive', label: 'Cursiva' },
  { id: 'cursive2', label: 'Cursiva 2' },
]

export const NOTE_HIGHLIGHT_PRESETS = [
  { id: 'yellow', label: 'Amarillo', color: '#fef08a' },
  { id: 'green', label: 'Verde', color: '#bbf7d0' },
  { id: 'pink', label: 'Rosa', color: '#fecdd3' },
  { id: 'blue', label: 'Azul', color: '#bfdbfe' },
] as const

export const NOTE_FONT_SIZE_SLIDER_MIN = 8
export const NOTE_FONT_SIZE_SLIDER_MAX = 72
