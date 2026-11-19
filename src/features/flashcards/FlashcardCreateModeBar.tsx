import {
  QUICK_FLASHCARD_DAILY_LIMIT,
  type FlashcardCreateMode,
  type QuickFlashcardQuota,
} from "@/features/flashcards/flashcardQuickMode";
import { cn } from "@/utils/cn";

type FlashcardCreateModeBarProps = {
  mode: FlashcardCreateMode;
  onModeChange: (mode: FlashcardCreateMode) => void;
  quickQuota: QuickFlashcardQuota;
  onCreateFull: () => void;
  onCreateQuick: () => void;
  layout?: "stack" | "row";
};

export function FlashcardCreateModeBar({
  mode,
  onModeChange,
  quickQuota,
  onCreateFull,
  onCreateQuick,
  layout = "stack",
}: FlashcardCreateModeBarProps) {
  const quickDisabled = mode === "quick" && !quickQuota.canCreate;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col gap-2",
        layout === "row" && "max-w-full",
      )}
    >
      <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] items-stretch gap-2">
        <button
          type="button"
          onClick={() => (mode === "quick" ? onCreateQuick() : onCreateFull())}
          disabled={quickDisabled}
          title={
            quickDisabled
              ? `Límite de ${quickQuota.limit} tarjetas rápidas hoy`
              : mode === "quick"
                ? "Añadir palabra y significado al momento"
                : "Crear una palabra completa"
          }
          className={cn(
            "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-white transition",
            "bg-[#D67A93] shadow-[0_8px_24px_-10px_rgba(214,122,147,0.55)] hover:brightness-[1.03]",
            quickDisabled &&
              "cursor-not-allowed opacity-50 hover:brightness-100",
          )}
        >
          <span className="text-lg leading-none" aria-hidden>
            +
          </span>
          Nueva palabra
        </button>

        <div
          className="flex min-h-12 w-full items-center rounded-full bg-[#FFF9F7] p-0.5 ring-1 ring-[#F0E4E8]"
          role="group"
          aria-label="Modo de creación"
        >
          <button
            type="button"
            onClick={() => onModeChange("full")}
            className={cn(
              "inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-full px-3 text-sm font-semibold transition",
              mode === "full"
                ? "bg-[#FBE3EA] text-[#3E2C41] shadow-sm"
                : "text-[#8A7A8C] hover:text-[#3E2C41]",
            )}
          >
            Completo
          </button>
          <button
            type="button"
            onClick={() => onModeChange("quick")}
            className={cn(
              "inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-full px-3 text-sm font-semibold transition",
              mode === "quick"
                ? "bg-[#FBE3EA] text-[#3E2C41] shadow-sm"
                : "text-[#8A7A8C] hover:text-[#3E2C41]",
            )}
          >
            Rápido
          </button>
        </div>
      </div>

      <p className="text-[0.75rem] leading-snug text-[#8A7A8C]">
        {mode === "quick" ? (
          <>
            Solo palabra y significado (hasta {QUICK_FLASHCARD_DAILY_LIMIT} al
            día). La imagen y los ejemplos se pueden añadir después.
            {quickQuota.canCreate ? (
              <span className="font-semibold text-[#D67A93]">
                {" "}
                · {quickQuota.remaining} restante
                {quickQuota.remaining === 1 ? "" : "s"} hoy
              </span>
            ) : (
              <span className="font-semibold text-[#D67A93]">
                {" "}
                · Límite de hoy alcanzado
              </span>
            )}
          </>
        ) : (
          "En modo completo puedes añadir imagen, categoría y ejemplos en un solo paso."
        )}
      </p>
    </div>
  );
}
