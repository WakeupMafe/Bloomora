import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBloomoraToast } from "@/contexts/BloomoraToastContext";
import { useUserPhone } from "@/contexts/UserPhoneContext";
import { EnglishFlashcardForm } from "@/features/flashcards/EnglishFlashcardForm";
import { EnglishFlashcardList } from "@/features/flashcards/EnglishFlashcardList";
import { EnglishFlashcardQuickForm } from "@/features/flashcards/EnglishFlashcardQuickForm";
import { FlashcardCreateModeBar } from "@/features/flashcards/FlashcardCreateModeBar";
import { DownloadIcon } from "@/features/flashcards/FlashcardIcons";
import { useFlashcardErrorMarks } from "@/features/flashcards/flashcardErrorMarks";
import { exportFlashcardsPdf } from "@/features/flashcards/flashcardPdfExport";
import {
  evaluateQuickFlashcardQuota,
  isQuickFlashcardComplete,
  isQuickFlashcardDraft,
  quickQuotaMessage,
  type FlashcardCreateMode,
} from "@/features/flashcards/flashcardQuickMode";
import { useBloomoraAlert } from "@/contexts/BloomoraAlertContext";
import {
  useBloomoraEnglishFlashcards,
  useEnglishFlashcardMutations,
} from "@/hooks/useBloomoraEnglishFlashcards";
import { messageFromSupabaseError } from "@/lib/supabaseError";
import type {
  EnglishFlashcard,
  EnglishFlashcardInput,
} from "@/types/englishFlashcard";

type ViewMode = "list" | "form";

function wordCountLabel(n: number): string {
  if (n === 1) return "1 palabra";
  return `${n} palabras`;
}

export function EnglishFlashcardsPage() {
  const { cedula } = useUserPhone();
  const { showToast } = useBloomoraToast();
  const { alert: showAlert } = useBloomoraAlert();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: cards = [], isLoading } = useBloomoraEnglishFlashcards(cedula);
  const { insertMut, updateMut, deleteMut } =
    useEnglishFlashcardMutations(cedula);
  const { ofCards } = useFlashcardErrorMarks();

  const [view, setView] = useState<ViewMode>("list");
  const [createMode, setCreateMode] = useState<FlashcardCreateMode>("full");
  const [editing, setEditing] = useState<EnglishFlashcard | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<EnglishFlashcard | null>(
    null,
  );
  const [autoReviewCategory, setAutoReviewCategory] = useState<string | null>(
    null,
  );

  const quickQuota = useMemo(() => evaluateQuickFlashcardQuota(cards), [cards]);
  const pendingQuickCards = useMemo(
    () =>
      cards.filter(
        (c) => isQuickFlashcardDraft(c) && !isQuickFlashcardComplete(c),
      ),
    [cards],
  );
  const errorCount = ofCards(cards).length;

  useEffect(() => {
    if (isLoading || searchParams.get("crear") !== "rapido") return;
    setSearchParams({}, { replace: true });
    void (async () => {
      const quota = evaluateQuickFlashcardQuota(cards);
      if (!quota.canCreate) {
        await showAlert({
          title: "Modo rápido no disponible",
          description: quickQuotaMessage(quota),
        });
        return;
      }
      setCreateMode("quick");
      setEditing(null);
      setView("form");
    })();
  }, [cards, isLoading, searchParams, setSearchParams, showAlert]);

  useEffect(() => {
    if (isLoading) return;
    const repasar = searchParams.get("repasar");
    if (!repasar) return;
    setSearchParams({}, { replace: true });
    setCategoryFilter(repasar);
    setAutoReviewCategory(repasar);
  }, [isLoading, searchParams, setSearchParams]);

  const tryOpenCreate = async (mode: FlashcardCreateMode) => {
    if (mode === "quick") {
      const quota = evaluateQuickFlashcardQuota(cards);
      if (!quota.canCreate) {
        await showAlert({
          title: "Modo rápido no disponible",
          description: quickQuotaMessage(quota),
        });
        return;
      }
    }
    setCreateMode(mode);
    setEditing(null);
    setView("form");
  };

  const openEdit = (card: EnglishFlashcard) => {
    setEditing(card);
    setCreateMode("full");
    setView("form");
  };

  const closeForm = () => {
    setEditing(null);
    setView("list");
  };

  const handleSave = (input: EnglishFlashcardInput) => {
    if (!cedula) return;
    if (editing) {
      updateMut.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => {
            const completed = editing.isQuickDraft && !input.isQuickDraft;
            showToast(
              completed ? "Tarjeta rápida completada" : "Flashcard actualizada",
            );
            closeForm();
          },
          onError: (err) =>
            showToast(messageFromSupabaseError(err), { duration: 8000 }),
        },
      );
    } else {
      insertMut.mutate(input, {
        onSuccess: () => {
          showToast(
            input.entryMode === "quick"
              ? "Palabra guardada en modo rápido"
              : "¡Palabra guardada!",
          );
          closeForm();
        },
        onError: (err) =>
          showToast(messageFromSupabaseError(err), { duration: 8000 }),
      });
    }
  };

  const isFormPending = insertMut.isPending || updateMut.isPending;

  const handleExportPdf = async () => {
    if (!cards.length) {
      await showAlert({
        title: "Sin flashcards",
        description:
          "Añade al menos una palabra para generar el listado en PDF.",
      });
      return;
    }
    const ok = await exportFlashcardsPdf(cards, () => {
      showToast("En la ventana de impresión elige Guardar como PDF.");
    });
    if (!ok) {
      showToast(
        "No se pudo abrir la ventana de impresión. Revisa el bloqueador de ventanas emergentes.",
      );
    }
  };

  const listSubtitle = isLoading
    ? "Cargando…"
    : errorCount > 0
      ? `${wordCountLabel(cards.length)} · ${errorCount} para repasar`
      : wordCountLabel(cards.length);

  const formTitle = editing
    ? editing.isQuickDraft
      ? "Completar tarjeta rápida"
      : "Editar palabra"
    : createMode === "quick"
      ? "Nueva tarjeta rápida"
      : "Nueva palabra";

  const formSubtitle = editing?.isQuickDraft
    ? "Añade ejemplos para finalizar. La imagen es opcional."
    : createMode === "quick"
      ? "Solo palabra y significado por ahora."
      : "Completa palabra y significado. La imagen es opcional.";

  return (
    <div
      className="flashcards-page mx-auto min-h-dvh w-[max(80%,min(90%,60rem))] max-w-full overflow-x-hidden bg-[#F7F2F4] pb-16 pt-6 text-[#3E2C41]"
      style={{ fontFamily: "Quicksand, Poppins, sans-serif" }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="min-w-0 pt-0.5">
            <h1
              className="text-[clamp(1.45rem,1.15rem+1.2vw,1.9rem)] font-semibold leading-tight tracking-tight text-[#3E2C41]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {view === "list" ? "English Flashcards" : formTitle}
            </h1>
            <p className="mt-0.5 text-sm leading-snug text-[#8A7A8C]">
              {view === "list" ? listSubtitle : formSubtitle}
            </p>
          </div>
        </div>

        {view === "list" ? (
          <button
            type="button"
            onClick={() => void handleExportPdf()}
            disabled={isLoading || cards.length === 0}
            aria-label="Descargar PDF"
            title="Descargar PDF"
            className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-white px-3.5 text-sm font-semibold text-[#8A7A8C] ring-1 ring-[#F0E4E8] transition hover:bg-[#FFF9F7] hover:text-[#3E2C41] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <DownloadIcon className="size-4" />
            PDF
          </button>
        ) : null}
      </header>

      {view === "list" ? (
        <div className="mt-5">
          <FlashcardCreateModeBar
            mode={createMode}
            onModeChange={setCreateMode}
            quickQuota={quickQuota}
            onCreateFull={() => void tryOpenCreate("full")}
            onCreateQuick={() => void tryOpenCreate("quick")}
            layout="stack"
          />
        </div>
      ) : null}

      {view === "form" && cedula ? (
        <div className="mt-6">
          {!editing && createMode === "quick" ? (
            <EnglishFlashcardQuickForm
              isPending={isFormPending}
              remainingToday={quickQuota.canCreate ? quickQuota.remaining : 0}
              onCancel={closeForm}
              onSave={handleSave}
            />
          ) : (
            <EnglishFlashcardForm
              cedula={cedula}
              editing={editing}
              isPending={isFormPending}
              onCancel={closeForm}
              onSave={handleSave}
            />
          )}
        </div>
      ) : null}

      {view === "list" ? (
        <div className="mt-6 flex flex-col gap-4">
          {pendingQuickCards.length > 0 ? (
            <div className="rounded-[1.25rem] bg-[#FBE3EA] px-4 py-3 ring-1 ring-[#F0E4E8]">
              <p className="text-sm font-semibold text-[#3E2C41]">
                {pendingQuickCards.length} tarjeta(s) rápida(s) sin completar
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#8A7A8C]">
                Puedes seguir añadiendo en modo rápido hasta {quickQuota.limit}{" "}
                al día
                {quickQuota.canCreate ? (
                  <>
                    {" "}
                    ({quickQuota.remaining} restante
                    {quickQuota.remaining === 1 ? "" : "s"}).
                  </>
                ) : (
                  "."
                )}{" "}
                Edítalas cuando quieras para añadir ejemplos (y una imagen si
                quieres).
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {pendingQuickCards.slice(0, 6).map((card) => (
                  <li key={card.id} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => openEdit(card)}
                      className="inline-flex min-h-11 max-w-full items-center truncate rounded-full bg-white px-3 text-xs font-semibold text-[#3E2C41] ring-1 ring-[#F0E4E8] hover:bg-[#FFF9F7]"
                    >
                      {card.englishWord || "Sin título"} → completar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {isLoading ? (
            <p className="text-sm text-[#8A7A8C]">Cargando flashcards…</p>
          ) : (
            <EnglishFlashcardList
              cards={cards}
              search={search}
              categoryFilter={categoryFilter}
              autoReviewCategory={autoReviewCategory}
              onAutoReviewHandled={() => setAutoReviewCategory(null)}
              onSearchChange={setSearch}
              onCategoryFilterChange={setCategoryFilter}
              onEdit={openEdit}
              deleteTarget={deleteTarget}
              deletePending={deleteMut.isPending}
              onRequestDelete={setDeleteTarget}
              onCancelDelete={() => setDeleteTarget(null)}
              onConfirmDelete={() => {
                if (!deleteTarget) return;
                deleteMut.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    showToast("Flashcard eliminada");
                    setDeleteTarget(null);
                  },
                  onError: () => showToast("No se pudo eliminar."),
                });
              }}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
