import { memo, useEffect, useState } from "react";
import { BloomoraImage } from "@/components/ui/BloomoraImage";
import { EnglishFlashcardCard } from "@/features/flashcards/EnglishFlashcardCard";
import { getCategoryTheme } from "@/features/flashcards/flashcardCategoryTheme";
import { ChevronDownIcon } from "@/features/flashcards/FlashcardIcons";
import { FLASHCARD_NO_IMAGE_SURFACE } from "@/features/flashcards/FlashcardImageFrame";
import { hasRealFlashcardImage } from "@/features/flashcards/flashcardQuickMode";
import type { CategoryPack } from "@/features/flashcards/groupFlashcardsByCategory";
import { primaryEnglishDisplay } from "@/features/flashcards/verbFormsCodec";
import type { EnglishFlashcard } from "@/types/englishFlashcard";
import { cn } from "@/utils/cn";

const PREVIEW_IMAGES_MAX = 2;
const VISIBLE_CARDS_STEP = 12;

type FlashcardCategoryPackProps = {
  pack: CategoryPack;
  expanded: boolean;
  onToggle: () => void;
  onStartReview: () => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onEdit: (card: EnglishFlashcard) => void;
  onDelete: (card: EnglishFlashcard) => void;
};

function wordCountLabel(n: number): string {
  if (n === 1) return "1 palabra";
  return `${n} palabras`;
}

export const FlashcardCategoryPack = memo(function FlashcardCategoryPack({
  pack,
  expanded,
  onToggle,
  onStartReview,
  favorites,
  onToggleFavorite,
  onEdit,
  onDelete,
}: FlashcardCategoryPackProps) {
  const theme = getCategoryTheme(pack.category);
  const previews = pack.cards.slice(0, PREVIEW_IMAGES_MAX);
  const previewWords = pack.cards
    .slice(0, 4)
    .map((c) => primaryEnglishDisplay(c.englishWord, c.category))
    .join(", ");

  const [visibleCount, setVisibleCount] = useState(VISIBLE_CARDS_STEP);

  useEffect(() => {
    if (!expanded) setVisibleCount(VISIBLE_CARDS_STEP);
  }, [expanded, pack.key]);

  const visibleCards = pack.cards.slice(0, visibleCount);
  const hiddenCount = Math.max(0, pack.cards.length - visibleCount);

  return (
    <li className="min-w-0 list-none">
      <article
        className={cn(
          "overflow-hidden rounded-[1.35rem] bg-white shadow-[0_4px_24px_-4px_rgba(91,74,140,0.12)] ring-1 ring-bloomora-line/15 transition-shadow",
          expanded && "shadow-[0_8px_32px_-6px_rgba(91,74,140,0.16)]",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-bloomora-lavender-50/30 sm:gap-5 sm:p-5"
        >
          <div className="flex shrink-0 items-center">
            <div className="flex -space-x-3">
              {previews.map((card, i) => (
                <div
                  key={card.id}
                  className={cn(
                    "relative flex size-14 items-center justify-center overflow-hidden rounded-xl ring-2 ring-white sm:size-16",
                    hasRealFlashcardImage(card.imageUrl)
                      ? "bg-bloomora-lavender-50/90"
                      : FLASHCARD_NO_IMAGE_SURFACE,
                  )}
                  style={{ zIndex: PREVIEW_IMAGES_MAX - i }}
                >
                  {hasRealFlashcardImage(card.imageUrl) ? (
                    <BloomoraImage
                      src={card.imageUrl}
                      alt=""
                      size="thumb"
                      className="max-h-full max-w-full object-contain p-0.5"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide",
                theme.badgeClass,
              )}
            >
              {theme.badge}
            </span>
            <h2
              className={cn(
                "mt-1.5 text-xl font-bold tracking-tight sm:text-2xl",
                theme.accentText,
              )}
            >
              {pack.label}
            </h2>
            <p className="mt-0.5 text-sm font-semibold text-bloomora-text-muted">
              {wordCountLabel(pack.cards.length)}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartReview();
              }}
              className={cn(
                "mt-2.5 inline-flex items-center whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold ring-1 transition hover:brightness-[1.02] active:scale-[0.99]",
                theme.footerPillClass,
              )}
            >
              Modo mazo de cartas
            </button>
            {!expanded && previewWords ? (
              <p className="mt-1.5 line-clamp-1 text-xs text-bloomora-text-muted/90">
                {previewWords}
                {pack.cards.length > 4 ? "…" : ""}
              </p>
            ) : null}
          </div>

          <ChevronDownIcon
            className={cn(
              "size-5 shrink-0 text-bloomora-violet transition-transform duration-300",
              expanded && "rotate-180",
            )}
          />
        </button>

        {expanded ? (
          <div className="border-t border-bloomora-line/25 bg-[#faf8ff]/50 px-4 pb-5 pt-4 sm:px-5">
            <ul className="flashcard-pack-grid grid list-none items-start gap-6 p-0 lg:grid-cols-2">
              {visibleCards.map((card) => (
                <li
                  key={card.id}
                  className="flashcard-pack-grid__item min-w-0 w-full"
                >
                  <EnglishFlashcardCard
                    card={card}
                    isFavorite={favorites.has(card.id)}
                    onToggleFavorite={() => onToggleFavorite(card.id)}
                    onEdit={() => onEdit(card)}
                    onDelete={() => onDelete(card)}
                  />
                </li>
              ))}
            </ul>
            {hiddenCount > 0 ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + VISIBLE_CARDS_STEP)}
                  className={cn(
                    "inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold ring-1 transition hover:brightness-[1.02] active:scale-[0.99]",
                    theme.footerPillClass,
                  )}
                >
                  Ver más ({hiddenCount} restantes)
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </article>
    </li>
  );
});
