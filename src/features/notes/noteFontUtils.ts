import type { NoteBodyFont } from '@/features/notes/noteTypingDefaults'

export const NOTE_BODY_FONTS: Array<{ id: NoteBodyFont; label: string }> = [
  { id: 'poppins', label: 'Poppins' },
  { id: 'quicksand', label: 'Quicksand' },
  { id: 'inter', label: 'Inter' },
  { id: 'fraunces', label: 'Fraunces' },
  { id: 'georgia', label: 'Georgia' },
  { id: 'times', label: 'Times New Roman' },
  { id: 'arial', label: 'Arial' },
]

export const NOTE_FONT_SIZE_OPTIONS = [10, 12, 14, 16, 18, 24, 32] as const

export function noteBodyFontFamily(font: NoteBodyFont): string {
  switch (font) {
    case 'quicksand': return 'Quicksand, sans-serif'
    case 'inter': return 'Inter, sans-serif'
    case 'fraunces': return 'Fraunces, Georgia, serif'
    case 'georgia': return 'Georgia, serif'
    case 'times': return '"Times New Roman", Times, serif'
    case 'arial': return 'Arial, Helvetica, sans-serif'
    default: return 'Poppins, sans-serif'
  }
}

export function stepNoteFontSize(current: number, direction: -1 | 1): number {
  if (direction > 0) {
    return NOTE_FONT_SIZE_OPTIONS.find((size) => size > current) ?? NOTE_FONT_SIZE_OPTIONS.at(-1)!
  }
  return [...NOTE_FONT_SIZE_OPTIONS].reverse().find((size) => size < current) ?? NOTE_FONT_SIZE_OPTIONS[0]
}
