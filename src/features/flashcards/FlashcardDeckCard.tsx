import { useCallback } from 'react'
import { FlashcardImageFrame } from '@/features/flashcards/FlashcardImageFrame'
import {
  isGrammarCategory,
  isVerbsCategory,
} from '@/features/flashcards/flashcardCategories'
import type { FlashcardCategoryTheme } from '@/features/flashcards/flashcardCategoryTheme'
import { FlashcardRichTextContent } from '@/features/flashcards/FlashcardRichTextContent'
import { SparkleIcon, SpeakerIcon } from '@/features/flashcards/FlashcardIcons'
import { VerbFormsDisplay } from '@/features/flashcards/VerbFormsDisplay'
import {
  primaryEnglishDisplay,
  resolveVerbForms,
} from '@/features/flashcards/verbFormsCodec'
import type { EnglishFlashcard } from '@/types/englishFlashcard'
import { cn } from '@/utils/cn'

type FlashcardDeckCardProps = {
  card: EnglishFlashcard
  theme: FlashcardCategoryTheme
  flipped: boolean
  onFlip: () => void
}

function capitalizeWord(w: string): string {
  if (!w) return w
  return w.charAt(0).toUpperCase() + w.slice(1)
}

export function FlashcardDeckCard({
  card,
  theme,
  flipped,
  onFlip,
}: FlashcardDeckCardProps) {
  const title = capitalizeWord(
    primaryEnglishDisplay(card.englishWord, card.category),
  )
  const verbForms =
    isVerbsCategory(card.category) && card.verbForms
      ? card.verbForms
      : resolveVerbForms(card.englishWord, card.category)
  const showVerbs = verbForms && (verbForms.v1 || verbForms.v2 || verbForms.v3)
  const isGrammar = isGrammarCategory(card.category)
  const grammarExplanation = isGrammar ? card.shortMeaning?.trim() : null

  const speak = useCallback(() => {
    const text = primaryEnglishDisplay(card.englishWord, card.category)
    if (!text || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    window.speechSynthesis.speak(u)
  }, [card.category, card.englishWord])

  return (
    <button
      type="button"
      onClick={onFlip}
      className={cn(
        'flashcard-deck-flip group relative h-full w-full',
        isGrammar ? 'text-left' : 'text-center',
        flipped && 'flashcard-deck-flip--flipped',
      )}
      aria-label={flipped ? 'Ver frente de la carta' : 'Ver reverso de la carta'}
    >
      <div className="flashcard-deck-flip-inner h-full w-full">
        <div className="flashcard-deck-face absolute inset-0 flex flex-col overflow-hidden rounded-[1.35rem] bg-white shadow-[0_12px_40px_-8px_rgba(91,74,140,0.22)] ring-1 ring-bloomora-line/20">
          <FlashcardImageFrame
            src={card.imageUrl}
            size="deck"
            variant="deck"
            priority
            className="shrink-0"
          />
          <div
            className={cn(
              'flex flex-1 flex-col px-5 pb-5 pt-4',
              !isGrammar && 'items-center',
            )}
          >
            <span
              className={cn(
                'inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide',
                theme.badgeClass,
                !isGrammar && 'mx-auto',
              )}
            >
              {theme.badge}
            </span>
            <h3
              className={cn(
                'mt-2 text-[clamp(1.5rem,1.2rem+1vw,1.85rem)] font-bold leading-tight',
                theme.accentText,
                !isGrammar && 'max-w-md',
              )}
            >
              {title}
            </h3>
            {card.pronunciation ? (
              <div
                className={cn(
                  'mt-2 flex flex-wrap items-center gap-2',
                  !isGrammar && 'justify-center',
                )}
              >
                <span className="text-sm text-bloomora-text-muted">
                  {card.pronunciation}
                </span>
                <span
                  role="presentation"
                  onClick={(e) => {
                    e.stopPropagation()
                    speak()
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  className={cn(
                    'inline-flex size-8 items-center justify-center rounded-full transition',
                    theme.speakerClass,
                  )}
                >
                  <SpeakerIcon />
                </span>
              </div>
            ) : null}
            <p className="mt-auto pt-4 text-center text-xs font-semibold text-bloomora-text-muted/80">
              Toca la carta para ver el significado
            </p>
          </div>
        </div>

        <div className="flashcard-deck-face flashcard-deck-face--back absolute inset-0 flex flex-col overflow-hidden rounded-[1.35rem] bg-white shadow-[0_12px_40px_-8px_rgba(91,74,140,0.22)] ring-1 ring-bloomora-line/20">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5">
            <div
              className={cn(
                'flex flex-1 flex-col',
                isGrammar ? 'text-left' : 'items-center justify-center text-center',
              )}
            >
            <span
              className={cn(
                'inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide',
                theme.badgeClass,
                !isGrammar && 'mx-auto',
              )}
            >
              Reverso
            </span>
            <p
              className={cn(
                'mt-3 text-[clamp(1.35rem,1.1rem+1vw,1.65rem)] font-bold leading-snug',
                theme.accentText,
                !isGrammar && 'max-w-md',
              )}
            >
              {card.spanishMeaning}
            </p>

            {grammarExplanation ? (
              <div
                className={cn(
                  'mt-4 w-full rounded-2xl px-3.5 py-3 text-left ring-1',
                  theme.verbBoxClass,
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#c2410c]/90">
                  Explicación
                </p>
                <FlashcardRichTextContent
                  html={grammarExplanation}
                  className="mt-1.5 text-sm leading-relaxed text-bloomora-deep/90"
                />
              </div>
            ) : null}

            {!isGrammar && card.shortMeaning ? (
              <p className="mt-3 max-w-md text-sm font-semibold text-bloomora-violet">
                {card.shortMeaning}
              </p>
            ) : null}

            {!isGrammar && card.exampleEnglish ? (
              <p className="mt-3 max-w-md text-sm italic text-bloomora-text-muted">
                &ldquo;{card.exampleEnglish}&rdquo;
              </p>
            ) : null}

            {!isGrammar && card.exampleSpanish ? (
              <p className="mt-1 max-w-md text-sm text-bloomora-text-muted/90">
                {card.exampleSpanish}
              </p>
            ) : null}

            {isGrammar && card.exampleEnglish ? (
              <p className="mt-3 text-sm italic text-bloomora-text-muted">
                &ldquo;{card.exampleEnglish}&rdquo;
              </p>
            ) : null}

            {isGrammar && card.exampleSpanish ? (
              <p className="mt-1 text-sm text-bloomora-text-muted/90">
                {card.exampleSpanish}
              </p>
            ) : null}

            {showVerbs ? (
              <div className="mt-4 w-full min-w-0">
                <VerbFormsDisplay
                  forms={verbForms}
                  boxClassName={theme.verbBoxClass}
                />
              </div>
            ) : null}
            </div>

            <p className="mt-auto flex shrink-0 items-center justify-center gap-2 pt-4 text-xs font-semibold text-bloomora-text-muted/80">
              <SparkleIcon className="text-amber-400" />
              Toca para volver al frente
            </p>
          </div>
        </div>
      </div>
    </button>
  )
}
