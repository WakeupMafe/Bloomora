import { useCallback, useEffect, useState } from "react";
import type { EnglishFlashcard } from "@/types/englishFlashcard";

export const FLASHCARD_ERROR_STORAGE_KEY = "bloomora_flashcards_errores";

const CHANGE_EVENT = "bloomora_flashcards_errores_changed";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FLASHCARD_ERROR_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === "undefined") return;
  const unique = [...new Set(ids)];
  window.localStorage.setItem(
    FLASHCARD_ERROR_STORAGE_KEY,
    JSON.stringify(unique),
  );
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useFlashcardErrorMarks() {
  const [ids, setIds] = useState<string[]>(() => readIds());

  useEffect(() => {
    const sync = () => setIds(readIds());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const persist = useCallback((next: string[]) => {
    writeIds(next);
    setIds([...new Set(next)]);
  }, []);

  const isMarked = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback(
    (id: string) => {
      persist(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
    },
    [ids, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const pruneTo = useCallback(
    (existingIds: string[]) => {
      const allowed = new Set(existingIds);
      const next = ids.filter((id) => allowed.has(id));
      if (next.length !== ids.length) persist(next);
    },
    [ids, persist],
  );

  const ofCards = useCallback(
    (cards: EnglishFlashcard[]) => {
      const marked = new Set(ids);
      return cards.filter((card) => marked.has(card.id));
    },
    [ids],
  );

  return { ids, isMarked, toggle, clear, pruneTo, ofCards };
}
