import type { EnglishFlashcard } from '@/types/englishFlashcard'
import {
  FLASHCARD_NO_IMAGE_PLACEHOLDER,
  QUICK_FLASHCARD_PLACEHOLDER_IMAGE,
} from '@/types/englishFlashcard'

export const QUICK_FLASHCARD_DAILY_LIMIT = 6

export type FlashcardCreateMode = 'full' | 'quick'

export function isSameLocalCalendarDay(iso: string, ref = new Date()): boolean {
  const d = new Date(iso)
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  )
}

export function hasRealFlashcardImage(imageUrl: string): boolean {
  const trimmed = imageUrl.trim()
  return (
    !!trimmed &&
    trimmed !== QUICK_FLASHCARD_PLACEHOLDER_IMAGE &&
    trimmed !== FLASHCARD_NO_IMAGE_PLACEHOLDER
  )
}

/** Tarjeta creada en modo rápido (flags o placeholder legacy de borrador). */
export function isQuickFlashcardDraft(
  card: Pick<EnglishFlashcard, 'isQuickDraft' | 'imageUrl' | 'entryMode'>,
): boolean {
  if (card.entryMode === 'full') return false
  return (
    card.isQuickDraft ||
    card.entryMode === 'quick' ||
    card.imageUrl === QUICK_FLASHCARD_PLACEHOLDER_IMAGE
  )
}

export function wasQuickFlashcardEntry(
  card: Pick<EnglishFlashcard, 'entryMode' | 'imageUrl' | 'isQuickDraft'>,
): boolean {
  if (card.entryMode === 'full') return false
  return (
    card.entryMode === 'quick' ||
    card.isQuickDraft ||
    card.imageUrl === QUICK_FLASHCARD_PLACEHOLDER_IMAGE
  )
}

/** Tarjetas rápidas creadas hoy (completas o pendientes). */
export function countQuickFlashcardsToday(
  cards: EnglishFlashcard[],
  ref = new Date(),
): number {
  return cards.filter(
    (c) => wasQuickFlashcardEntry(c) && isSameLocalCalendarDay(c.createdAt, ref),
  ).length
}

/** Tarjeta rápida completada: ejemplos en ambos idiomas (imagen opcional). */
export function isQuickFlashcardComplete(
  card: Pick<
    EnglishFlashcard,
    'isQuickDraft' | 'imageUrl' | 'exampleEnglish' | 'exampleSpanish' | 'entryMode'
  >,
): boolean {
  if (!isQuickFlashcardDraft(card)) return true
  return !!card.exampleEnglish?.trim() && !!card.exampleSpanish?.trim()
}

export type QuickFlashcardQuota =
  | {
      canCreate: true
      usedToday: number
      remaining: number
      limit: number
      pendingCount: number
    }
  | {
      canCreate: false
      reason: 'daily_limit'
      usedToday: number
      limit: number
      pendingCount: number
    }

export function evaluateQuickFlashcardQuota(
  cards: EnglishFlashcard[],
): QuickFlashcardQuota {
  const limit = QUICK_FLASHCARD_DAILY_LIMIT
  const usedToday = countQuickFlashcardsToday(cards)
  const pendingCount = cards.filter(
    (c) => isQuickFlashcardDraft(c) && !isQuickFlashcardComplete(c),
  ).length

  if (usedToday >= limit) {
    return {
      canCreate: false,
      reason: 'daily_limit',
      usedToday,
      limit,
      pendingCount,
    }
  }

  return {
    canCreate: true,
    usedToday,
    remaining: limit - usedToday,
    limit,
    pendingCount,
  }
}

export function quickQuotaMessage(quota: QuickFlashcardQuota): string {
  if (quota.canCreate) return ''
  return `Ya creaste ${quota.limit} tarjetas rápidas hoy. Completa las pendientes con ejemplos, o vuelve mañana.`
}
