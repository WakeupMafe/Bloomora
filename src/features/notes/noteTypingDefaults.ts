import type { EnglishNoteColor, EnglishNoteTitleFont } from '@/types/englishNote'
import { ENGLISH_NOTE_COLORS } from '@/types/englishNote'

const BODY_FONT_SIZE_PX = 15

export type NoteTextAlign = 'left' | 'center' | 'right' | 'justify'

export type NoteFontWeight = 'normal' | 'medium' | 'bold'

export type NoteTextCase = 'none' | 'uppercase' | 'lowercase' | 'capitalize'

export type NoteTypingDefaults = {
  font: EnglishNoteTitleFont
  color: EnglishNoteColor
  colorHex: string
  fontSizePx: number
  align: NoteTextAlign
  fontWeight: NoteFontWeight
  lineHeight: number
  textCase: NoteTextCase
}

export const BODY_TYPING_DEFAULTS: NoteTypingDefaults = {
  font: 'popis',
  color: 'gray',
  colorHex: ENGLISH_NOTE_COLORS.find((c) => c.id === 'gray')?.value ?? '#8a8f9b',
  fontSizePx: BODY_FONT_SIZE_PX,
  align: 'left',
  fontWeight: 'normal',
  lineHeight: 1.5,
  textCase: 'none',
}

export function noteColorHex(colorId: EnglishNoteColor): string {
  return ENGLISH_NOTE_COLORS.find((c) => c.id === colorId)?.value ?? '#111111'
}
