import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FlashcardDeckCard } from '@/features/flashcards/FlashcardDeckCard'
import { getCategoryTheme } from '@/features/flashcards/flashcardCategoryTheme'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/features/flashcards/FlashcardIcons'
import type { EnglishFlashcard } from '@/types/englishFlashcard'
import { cn } from '@/utils/cn'

const STACK_LAYERS_MAX = 2

type FlashcardDeckReviewProps = {
  cards: EnglishFlashcard[]
  packLabel: string
  category: string | null
  onClose: () => void
}

export function FlashcardDeckReview({
  cards,
  packLabel,
  category,
  onClose,
}: FlashcardDeckReviewProps) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const theme = getCategoryTheme(category)
  const card = cards[index]
  const stackBehind = Math.min(
    STACK_LAYERS_MAX,
    Math.max(0, cards.length - index - 1),
  )

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1))
    setFlipped(false)
  }, [])

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(cards.length - 1, i + 1))
    setFlipped(false)
  }, [cards.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
      if (e.key === ' ' || e.key === 'Enter') {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        setFlipped((f) => !f)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  if (!card) return null

  const content = (
    <>
      <button
        type="button"
        className="fixed inset-0 border-0 bg-[#2e106b]/35 p-0 backdrop-blur-sm"
        style={{ zIndex: 10_070 }}
        aria-label="Cerrar repaso"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="flashcard-deck-title"
        className="fixed inset-0 z-[10075] flex flex-col items-center justify-center px-4 py-8 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex w-full max-w-md items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/80">
              Repaso
            </p>
            <h2
              id="flashcard-deck-title"
              className="truncate text-lg font-bold text-white"
            >
              {packLabel}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-bloomora-deep shadow-md transition hover:bg-white"
          >
            Cerrar
          </button>
        </div>

        <div className="relative flex w-full max-w-md items-center justify-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={goPrev}
            disabled={index === 0}
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-full bg-white/95 text-bloomora-violet shadow-lg transition',
              'hover:scale-105 disabled:pointer-events-none disabled:opacity-35',
            )}
            aria-label="Carta anterior"
          >
            <ChevronLeftIcon className="size-6" />
          </button>

          <div className="relative h-[min(68vh,28rem)] w-full min-w-0 max-w-[18.5rem] flex-1 sm:max-w-[20rem]">
            {Array.from({ length: stackBehind }, (_, i) => {
              const layer = stackBehind - i
              return (
                <div
                  key={`stack-${layer}`}
                  aria-hidden
                  className="pointer-events-none absolute inset-x-2 rounded-[1.35rem] bg-white ring-1 ring-bloomora-line/15"
                  style={{
                    top: `${layer * 10}px`,
                    bottom: `${-layer * 6}px`,
                    transform: `scale(${1 - layer * 0.035}) rotate(${layer * 1.25}deg)`,
                    opacity: 0.55 - layer * 0.12,
                    zIndex: layer,
                  }}
                />
              )
            })}

            <div
              className="absolute inset-0 z-10"
              style={{ perspective: '1200px' }}
            >
              {card ? (
                <FlashcardDeckCard
                  key={card.id}
                  card={card}
                  theme={theme}
                  flipped={flipped}
                  onFlip={() => setFlipped((f) => !f)}
                />
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={index >= cards.length - 1}
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-full bg-white/95 text-bloomora-violet shadow-lg transition',
              'hover:scale-105 disabled:pointer-events-none disabled:opacity-35',
            )}
            aria-label="Carta siguiente"
          >
            <ChevronRightIcon className="size-6" />
          </button>
        </div>

        <p className="mt-5 text-sm font-semibold text-white/90">
          {index + 1} / {cards.length}
        </p>
        <p className="mt-1 text-xs text-white/70">
          Flechas para avanzar · Espacio para voltear
        </p>
      </div>
    </>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
