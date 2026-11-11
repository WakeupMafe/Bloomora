import type { NoteBodyFont } from '@/features/notes/noteTypingDefaults'

export type NoteFormatTarget = 'selection' | 'typing'

export const NOTE_TEXT_OPTION_FONTS: Array<{
  id: NoteBodyFont
  label: string
}> = [
  { id: 'poppins', label: 'Poppins' },
  { id: 'quicksand', label: 'Quicksand' },
  { id: 'inter', label: 'Inter' },
  { id: 'fraunces', label: 'Fraunces' },
  { id: 'georgia', label: 'Georgia' },
  { id: 'times', label: 'Times New Roman' },
  { id: 'arial', label: 'Arial' },
]

export const NOTE_HIGHLIGHT_PRESETS = [
  { id: 'yellow', label: 'Amarillo', color: '#fef08a' },
  { id: 'green', label: 'Verde', color: '#bbf7d0' },
  { id: 'pink', label: 'Rosa', color: '#fecdd3' },
  { id: 'blue', label: 'Azul', color: '#bfdbfe' },
] as const

export const NOTE_FONT_SIZE_SLIDER_MIN = 8
export const NOTE_FONT_SIZE_SLIDER_MAX = 72
