import type { EnglishNoteColor, EnglishNoteTitleFont } from '@/types/englishNote'
import { ENGLISH_NOTE_COLORS } from '@/types/englishNote'

const BODY_FONT_SIZE_PX = 15

export type NoteTextAlign = 'left' | 'center'

export type NoteTypingDefaults = {
  font: EnglishNoteTitleFont
  color: EnglishNoteColor
  colorHex: string
  fontSizePx: number
  align: NoteTextAlign
}

export const BODY_TYPING_DEFAULTS: NoteTypingDefaults = {
  font: 'popis',
  color: 'gray',
  colorHex: ENGLISH_NOTE_COLORS.find((c) => c.id === 'gray')?.value ?? '#8a8f9b',
  fontSizePx: BODY_FONT_SIZE_PX,
  align: 'left',
}

export function noteColorHex(colorId: EnglishNoteColor): string {
  return ENGLISH_NOTE_COLORS.find((c) => c.id === colorId)?.value ?? '#111111'
}
