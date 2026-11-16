import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FlashcardDeckCard } from "@/features/flashcards/FlashcardDeckCard";
import { getCategoryTheme } from "@/features/flashcards/flashcardCategoryTheme";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/features/flashcards/FlashcardIcons";
import { useFlashcardErrorMarks } from "@/features/flashcards/flashcardErrorMarks";
import type { EnglishFlashcard } from "@/types/englishFlashcard";
import { cn } from "@/utils/cn";
import { hasRealFlashcardImage } from "@/features/flashcards/flashcardQuickMode";
import { optimizeImageUrl } from "@/utils/imageUrl";

const STACK_LAYERS_MAX = 2;

type FlashcardDeckReviewProps = {
  cards: EnglishFlashcard[];
  packLabel: string;
  category: string | null;
  onClose: () => void;
};

export function FlashcardDeckReview({
  cards,
  packLabel,
  category,
  onClose,
}: FlashcardDeckReviewProps) {
  const [sessionCards, setSessionCards] = useState(cards);
  const [title, setTitle] = useState(packLabel);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const { isMarked, toggle, clear, ofCards } = useFlashcardErrorMarks();

  useEffect(() => {
    setSessionCards(cards);
    setTitle(packLabel);
    setIndex(0);
    setFlipped(false);
    setShowSummary(false);
  }, [cards, packLabel]);

  const card = sessionCards[index];
  const theme = getCategoryTheme(card?.category ?? category);
  const markedInSession = ofCards(sessionCards);
  const stackBehind = showSummary
    ? 0
    : Math.min(STACK_LAYERS_MAX, Math.max(0, sessionCards.length - index - 1));

  const goPrev = useCallback(() => {
    if (showSummary) {
      setShowSummary(false);
      setIndex(Math.max(0, sessionCards.length - 1));
      setFlipped(false);
      return;
    }
    setIndex((i) => Math.max(0, i - 1));
    setFlipped(false);
  }, [showSummary, sessionCards.length]);

  const goNext = useCallback(() => {
    if (showSummary) return;
    if (index >= sessionCards.length - 1) {
      setShowSummary(true);
      setFlipped(false);
      return;
    }
    setIndex((i) => i + 1);
    setFlipped(false);
  }, [showSummary, index, sessionCards.length]);

  const startErrorReview = () => {
    const next = ofCards(sessionCards);
    if (!next.length) return;
    setSessionCards(next);
    setTitle("Mis errores");
    setIndex(0);
    setFlipped(false);
    setShowSummary(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
      if (e.key === " " || e.key === "Enter") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
        if (showSummary) return;
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose, showSummary]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (showSummary) return;
    const nextCards = [sessionCards[index + 1], sessionCards[index + 2]];
    const preloaded: HTMLImageElement[] = [];
    for (const next of nextCards) {
      if (!next || !hasRealFlashcardImage(next.imageUrl)) continue;
      const img = new Image();
      img.decoding = "async";
      img.src = optimizeImageUrl(next.imageUrl, "deck");
      preloaded.push(img);
    }
    return () => {
      for (const img of preloaded) img.src = "";
    };
  }, [index, sessionCards, showSummary]);

  if (!showSummary && !card) return null;

  const content = (
    <>
      <button
        type="button"
        className="fixed inset-0 border-0 bg-[#2e106b]/35 p-0 backdrop-blur-sm"
        style={{ zIndex: 10_070 }}
        aria-label="Cerrar modo mazo de cartas"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="flashcard-deck-title"
        className="fixed inset-0 z-[10075] flex flex-col items-center justify-center px-4 py-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex w-full max-w-md items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold tracking-wide text-white/80">
              Modo mazo de cartas
            </p>
            <h2
              id="flashcard-deck-title"
              className="truncate text-lg font-bold text-white"
            >
              {title}
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

        {showSummary ? (
          <div className="w-full max-w-md rounded-[1.35rem] bg-white px-6 py-8 text-center shadow-[0_12px_40px_-8px_rgba(91,74,140,0.22)] ring-1 ring-[#F0E4E8]">
            <h3 className="text-xl font-bold text-bloomora-deep">
              Repaso terminado
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-bloomora-text-muted">
              {markedInSession.length === 0
                ? "No marcaste ninguna carta como error. ¡Muy bien!"
                : markedInSession.length === 1
                  ? "Marcaste 1 carta como «Me equivoqué»."
                  : `Marcaste ${markedInSession.length} cartas como «Me equivoqué».`}
            </p>
            <div className="mt-6 flex flex-col items-center gap-2">
              {markedInSession.length > 0 ? (
                <button
                  type="button"
                  onClick={startErrorReview}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#D67A93] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-[1.03]"
                >
                  Repasar mis errores
                </button>
              ) : null}
              {markedInSession.length > 0 ? (
                <button
                  type="button"
                  onClick={clear}
                  className="inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-bloomora-violet ring-1 ring-bloomora-violet/25 transition hover:bg-[#F7F2F4]"
                >
                  Quitar todas las marcas
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex w-full items-center justify-center rounded-full bg-[#F7F2F4] px-4 py-2.5 text-sm font-semibold text-bloomora-deep transition hover:bg-[#FBE3EA]"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative flex w-full max-w-md items-center justify-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={index === 0}
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full bg-white/95 text-bloomora-violet shadow-lg transition",
                  "hover:scale-105 disabled:pointer-events-none disabled:opacity-35",
                )}
                aria-label="Carta anterior"
              >
                <ChevronLeftIcon className="size-6" />
              </button>

              <div className="relative h-[min(68vh,28rem)] w-full min-w-0 max-w-[18.5rem] flex-1">
                {Array.from({ length: stackBehind }, (_, i) => {
                  const layer = stackBehind - i;
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
                  );
                })}

                <div
                  className="absolute inset-0 z-10"
                  style={{ perspective: "1200px" }}
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
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full bg-white/95 text-bloomora-violet shadow-lg transition",
                  "hover:scale-105",
                )}
                aria-label={
                  index >= sessionCards.length - 1
                    ? "Ver resumen"
                    : "Carta siguiente"
                }
              >
                <ChevronRightIcon className="size-6" />
              </button>
            </div>

            <p className="mt-5 text-sm font-semibold text-white/90">
              {index + 1} / {sessionCards.length}
            </p>
            <button
              type="button"
              aria-pressed={card ? isMarked(card.id) : false}
              onClick={() => {
                if (card) toggle(card.id);
              }}
              className={cn(
                "mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-md transition",
                card && isMarked(card.id)
                  ? "bg-[#D67A93] text-white"
                  : "bg-white/95 text-bloomora-deep",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-5 items-center justify-center rounded-md text-xs",
                  card && isMarked(card.id)
                    ? "bg-white/20"
                    : "bg-[#F7F2F4] ring-1 ring-[#F0E4E8]",
                )}
              >
                {card && isMarked(card.id) ? "✓" : ""}
              </span>
              Me equivoqué
            </button>
            <p className="mt-2 text-xs text-white/70">
              {card && isMarked(card.id)
                ? "Marcada. Si ya la sabes, pulsa de nuevo para quitar la marca."
                : "Chulea esta carta si te equivocaste. Flechas para avanzar · Espacio para voltear"}
            </p>
          </>
        )}
      </div>
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
