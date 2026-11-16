import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { BloomoraConfirmDialog } from "@/components/ui/BloomoraConfirmDialog";
import { EnglishFlashcardToolbar } from "@/features/flashcards/EnglishFlashcardToolbar";
import { FlashcardCategoryPack } from "@/features/flashcards/FlashcardCategoryPack";
import { FlashcardDeckReview } from "@/features/flashcards/FlashcardDeckReview";
import { useFlashcardErrorMarks } from "@/features/flashcards/flashcardErrorMarks";
import {
  buildCategoryPacks,
  type CategoryPack,
} from "@/features/flashcards/groupFlashcardsByCategory";
import { englishSearchText } from "@/features/flashcards/verbFormsCodec";
import type { EnglishFlashcard } from "@/types/englishFlashcard";

type EnglishFlashcardListProps = {
  cards: EnglishFlashcard[];
  search: string;
  categoryFilter: string;
  autoReviewCategory?: string | null;
  onAutoReviewHandled?: () => void;
  onSearchChange: (v: string) => void;
  onCategoryFilterChange: (v: string) => void;
  onEdit: (card: EnglishFlashcard) => void;
  deleteTarget: EnglishFlashcard | null;
  deletePending: boolean;
  onRequestDelete: (card: EnglishFlashcard) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

export function EnglishFlashcardList({
  cards,
  search,
  categoryFilter,
  autoReviewCategory,
  onAutoReviewHandled,
  onSearchChange,
  onCategoryFilterChange,
  onEdit,
  deleteTarget,
  deletePending,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: EnglishFlashcardListProps) {
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [expandedPacks, setExpandedPacks] = useState<Set<string>>(
    () => new Set(),
  );
  const [reviewPack, setReviewPack] = useState<CategoryPack | null>(null);
  const deferredSearch = useDeferredValue(search);
  const { ofCards, pruneTo, clear } = useFlashcardErrorMarks();

  const allReviewPack = useMemo<CategoryPack>(
    () => ({
      key: "__all__",
      category: null,
      label: "Todas las flashcards",
      cards: buildCategoryPacks(cards).flatMap((pack) => pack.cards),
    }),
    [cards],
  );

  const errorReviewPack = useMemo<CategoryPack>(
    () => ({
      key: "__errors__",
      category: null,
      label: "Mis errores",
      cards: ofCards(allReviewPack.cards),
    }),
    [allReviewPack, ofCards],
  );

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return cards.filter((c) => {
      if (categoryFilter && (c.category ?? "") !== categoryFilter) return false;
      if (!q) return true;
      const en = englishSearchText(c.englishWord, c.category).toLowerCase();
      return en.includes(q) || c.spanishMeaning.toLowerCase().includes(q);
    });
  }, [cards, deferredSearch, categoryFilter]);

  const packs = useMemo(() => buildCategoryPacks(filtered), [filtered]);

  useEffect(() => {
    if (categoryFilter) {
      setExpandedPacks((prev) => {
        const next = new Set(prev);
        next.add(categoryFilter);
        return next;
      });
      return;
    }
    if (packs.length === 1) {
      setExpandedPacks(new Set([packs[0]!.key]));
    }
  }, [categoryFilter, packs]);

  useEffect(() => {
    if (!autoReviewCategory) return;
    const pack = buildCategoryPacks(cards).find(
      (p) => p.key === autoReviewCategory,
    );
    if (pack) {
      setReviewPack(pack);
      setExpandedPacks((prev) => {
        const next = new Set(prev);
        next.add(pack.key);
        return next;
      });
    }
    onAutoReviewHandled?.();
  }, [autoReviewCategory, cards, onAutoReviewHandled]);

  useEffect(() => {
    if (cards.length === 0) return;
    pruneTo(cards.map((card) => card.id));
  }, [cards, pruneTo]);

  const togglePack = (key: string) => {
    setExpandedPacks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {cards.length > 0 ? (
        <section className="rounded-[1.25rem] bg-white p-4 shadow-[0_8px_28px_-16px_rgba(62,44,65,0.16)] ring-1 ring-[#F0E4E8]">
          <h2
            className="text-base font-semibold tracking-tight text-[#3E2C41]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Repaso
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-[#8A7A8C]">
            {errorReviewPack.cards.length > 0
              ? `${errorReviewPack.cards.length} marcada${errorReviewPack.cards.length === 1 ? "" : "s"} para enfocar.`
              : "Revisa todo el mazo cuando quieras."}
          </p>
          <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-2">
            <button
              type="button"
              onClick={() => setReviewPack(allReviewPack)}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#D67A93] px-4 text-sm font-bold text-white shadow-[0_8px_24px_-10px_rgba(214,122,147,0.5)] transition hover:brightness-[1.03]"
            >
              Repasar todas
            </button>
            {errorReviewPack.cards.length > 0 ? (
              <button
                type="button"
                onClick={() => setReviewPack(errorReviewPack)}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#FBE3EA] px-4 text-sm font-bold text-[#3E2C41] ring-1 ring-[#F0E4E8] transition hover:bg-[#F7F2F4]"
              >
                {`Repasar mis errores (${errorReviewPack.cards.length})`}
              </button>
            ) : null}
            {errorReviewPack.cards.length > 0 ? (
              <button
                type="button"
                onClick={clear}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#FFF9F7] px-4 text-sm font-semibold text-[#8A7A8C] ring-1 ring-[#F0E4E8] transition hover:text-[#3E2C41]"
              >
                Quitar marcas
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      <EnglishFlashcardToolbar
        search={search}
        categoryFilter={categoryFilter}
        onSearchChange={onSearchChange}
        onCategoryFilterChange={onCategoryFilterChange}
      />

      {packs.length === 0 ? (
        <div className="rounded-[1.25rem] bg-white px-6 py-12 text-center shadow-[0_8px_28px_-16px_rgba(62,44,65,0.12)] ring-1 ring-[#F0E4E8]">
          <p
            className="text-base font-semibold text-[#3E2C41]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {cards.length === 0
              ? "Aún no tienes flashcards"
              : "Ninguna coincide con tu búsqueda"}
          </p>
          <p className="mt-2 text-sm text-[#8A7A8C]">
            {cards.length === 0
              ? "Pulsa «Nueva palabra» para crear la primera."
              : "Prueba otro término o cambia el filtro de categoría."}
          </p>
        </div>
      ) : (
        <ul className="flex list-none flex-col gap-5 p-0">
          {packs.map((pack) => (
            <FlashcardCategoryPack
              key={pack.key}
              pack={pack}
              expanded={expandedPacks.has(pack.key)}
              onToggle={() => togglePack(pack.key)}
              onStartReview={() => setReviewPack(pack)}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onEdit={onEdit}
              onDelete={onRequestDelete}
            />
          ))}
        </ul>
      )}

      {reviewPack ? (
        <FlashcardDeckReview
          cards={reviewPack.cards}
          packLabel={reviewPack.label}
          category={reviewPack.category}
          onClose={() => setReviewPack(null)}
        />
      ) : null}

      <BloomoraConfirmDialog
        open={!!deleteTarget}
        title="¿Eliminar esta flashcard?"
        description={
          deleteTarget
            ? `Se borrará «${deleteTarget.englishWord.split("|")[0]}» de tu vocabulario.`
            : undefined
        }
        confirmLabel="Eliminar"
        tone="danger"
        isPending={deletePending}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </div>
  );
}
