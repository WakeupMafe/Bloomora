import { memo, useCallback } from 'react'
import { FlashcardImageFrame } from '@/features/flashcards/FlashcardImageFrame'
import {
  isGrammarCategory,
  isVerbsCategory,
} from '@/features/flashcards/flashcardCategories'
import { getCategoryTheme } from '@/features/flashcards/flashcardCategoryTheme'
import {
  HeartFilledIcon,
  HeartOutlineIcon,
  PencilIcon,
  SparkleIcon,
  SpeakerIcon,
  TrashIcon,
} from '@/features/flashcards/FlashcardIcons'
import { FlashcardRichTextContent } from '@/features/flashcards/FlashcardRichTextContent'
import { VerbFormsDisplay } from '@/features/flashcards/VerbFormsDisplay'
import {
  primaryEnglishDisplay,
  resolveVerbForms,
} from '@/features/flashcards/verbFormsCodec'
import type { EnglishFlashcard } from '@/types/englishFlashcard'
import { cn } from '@/utils/cn'

type EnglishFlashcardCardProps = {
  card: EnglishFlashcard
  isFavorite: boolean
  onToggleFavorite: () => void
  onEdit: () => void
  onDelete: () => void
}

function capitalizeWord(w: string): string {
  if (!w) return w
  return w.charAt(0).toUpperCase() + w.slice(1)
}

export const EnglishFlashcardCard = memo(function EnglishFlashcardCard({
  card,
  isFavorite,
  onToggleFavorite,
  onEdit,
  onDelete,
}: EnglishFlashcardCardProps) {
  const theme = getCategoryTheme(card.category)
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

  const exampleBlock = card.exampleEnglish || card.exampleSpanish

  return (
    <article className="flex flex-col rounded-[1.35rem] bg-white shadow-[0_4px_24px_-4px_rgba(91,74,140,0.12)] ring-1 ring-bloomora-line/15 transition hover:shadow-[0_8px_32px_-6px_rgba(91,74,140,0.16)]">
      <FlashcardImageFrame
        src={card.imageUrl}
        size="card"
        variant="card"
        className="shrink-0"
        overlay={
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite()
            }}
            className={cn(
              'absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-black/5 transition hover:scale-105',
              isFavorite ? 'text-red-500' : 'text-red-400',
            )}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Marcar favorito'}
          >
            {isFavorite ? (
              <HeartFilledIcon />
            ) : (
              <HeartOutlineIcon />
            )}
          </button>
        }
      />

      <div
        className={cn(
          'flex flex-1 flex-col px-5 pb-5 pt-4',
          !isGrammar && 'items-center text-center',
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
            'mt-2.5 text-2xl font-bold leading-tight tracking-tight',
            theme.accentText,
            !isGrammar && 'max-w-md',
          )}
        >
          {title}
        </h3>

        {card.pronunciation ? (
          <div
            className={cn(
              'mt-1.5 flex flex-wrap items-center gap-2',
              !isGrammar && 'justify-center',
            )}
          >
            <span className="text-sm text-bloomora-text-muted">
              {card.pronunciation}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                speak()
              }}
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-full transition',
                theme.speakerClass,
              )}
              aria-label="Escuchar pronunciación"
            >
              <SpeakerIcon />
            </button>
          </div>
        ) : null}

        <div className="my-3 h-px w-full bg-bloomora-line/40" />

        <p
          className={cn(
            'flex gap-2 text-sm leading-relaxed text-bloomora-text-muted',
            isGrammar ? 'items-start' : 'max-w-md items-center justify-center',
          )}
        >
          <SparkleIcon
            className={cn('shrink-0 text-amber-400', isGrammar && 'mt-0.5')}
          />
          <span>{card.spanishMeaning}</span>
        </p>

        {grammarExplanation ? (
          <div
            className={cn(
              'mt-3 w-full rounded-2xl px-3.5 py-3 text-left ring-1',
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
          <p className="mt-2 max-w-md text-sm font-semibold text-bloomora-violet">
            {card.shortMeaning}
          </p>
        ) : null}

        {exampleBlock ? (
          <div
            className={cn(
              'mt-3 w-full space-y-1.5',
              !isGrammar && 'max-w-md',
            )}
          >
            {card.exampleEnglish ? (
              <p className="text-xs italic leading-relaxed text-bloomora-text-muted/90 sm:text-sm">
                <span className="font-semibold not-italic text-bloomora-text-muted/70">
                  EN:{' '}
                </span>
                &ldquo;{card.exampleEnglish}&rdquo;
              </p>
            ) : null}
            {card.exampleSpanish ? (
              <p className="text-xs leading-relaxed text-bloomora-deep/85 sm:text-sm">
                <span className="font-semibold text-bloomora-violet/80">
                  ES:{' '}
                </span>
                {card.exampleSpanish}
              </p>
            ) : null}
          </div>
        ) : null}

        {showVerbs ? (
          <div className="mt-4 w-full min-w-0">
            <VerbFormsDisplay
              forms={verbForms}
              boxClassName={theme.verbBoxClass}
            />
          </div>
        ) : null}

        <div
          className={cn(
            'mt-auto flex w-full items-center gap-3 pt-5',
            isGrammar ? 'justify-between' : 'justify-center',
          )}
        >
          {isGrammar && card.category ? (
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold ring-1',
                theme.footerPillClass,
              )}
            >
              {card.category}
            </span>
          ) : isGrammar ? (
            <span />
          ) : null}
          <div className="flex shrink-0 gap-2">
            {!isGrammar && card.category ? (
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold ring-1',
                  theme.footerPillClass,
                )}
              >
                {card.category}
              </span>
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className={cn(
                'flex size-9 items-center justify-center rounded-full transition hover:scale-105',
                theme.editBtnClass,
              )}
              aria-label="Editar"
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="flex size-9 items-center justify-center rounded-full bg-[#fce7f3] text-red-500 transition hover:scale-105 hover:bg-[#fbcfe8]/90"
              aria-label="Eliminar"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
})
