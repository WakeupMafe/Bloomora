export const NOTE_LINE_HEIGHTS: readonly number[]
export const NOTE_SPACING_AFTER: readonly number[]
export const NOTE_DEFAULT_LINE_HEIGHT: number
export const NOTE_DEFAULT_SPACING_AFTER: number

export function normalizeSpacing(
  html: string,
  options?: { renderStyles?: boolean },
): string

export function setBlockSpacing(
  block: HTMLElement,
  values?: { lineHeight?: number; spacingAfter?: number },
): { lineHeight: number; spacingAfter: number }
