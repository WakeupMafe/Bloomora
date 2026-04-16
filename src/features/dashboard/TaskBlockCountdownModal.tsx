import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";

/** Por encima del contenido pero sin capa que bloquee clics al documento. */
const Z_FLOATING_PANEL = 10_081;

function formatCountdown(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function clampCenteredModalDelta(
  dx: number,
  dy: number,
  w: number,
  h: number,
): { x: number; y: number } {
  if (typeof window === "undefined" || w <= 0 || h <= 0) {
    return { x: dx, y: dy };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 12;
  const maxDx = vw / 2 - w / 2 - margin;
  const minDx = -vw / 2 + w / 2 + margin;
  const maxDy = vh / 2 - h / 2 - margin;
  const minDy = -vh / 2 + h / 2 + margin;
  return {
    x: Math.min(maxDx, Math.max(minDx, dx)),
    y: Math.min(maxDy, Math.max(minDy, dy)),
  };
}

export type TaskBlockCountdownModalProps = {
  open: boolean;
  taskTitle: string;
  /** Duración total del bloque en segundos (según hora inicio y fin de la tarea). */
  totalSeconds: number;
  onClose: () => void;
};

/**
 * Panel flotante de cuenta atrás del bloque (no bloquea el resto de la app: sin backdrop).
 * En escritorio se arrastra desde la cabecera. Cierra solo con el botón «Cerrar».
 */
export function TaskBlockCountdownModal({
  open,
  taskTitle,
  totalSeconds,
  onClose,
}: TaskBlockCountdownModalProps) {
  const titleId = useId();
  const statusId = useId();
  const isNarrow = useMediaQuery("(max-width: 639px)");
  const dialogRef = useRef<HTMLDivElement>(null);
  const dragSessionRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const [remaining, setRemaining] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!open) return;
    setRemaining(totalSeconds);
    setPaused(false);
    setDragDelta({ x: 0, y: 0 });
  }, [open, totalSeconds]);

  useEffect(() => {
    if (!open || paused) return;
    const id = window.setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, paused]);

  const reclampPosition = useCallback(() => {
    if (isNarrow) return;
    const el = dialogRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    setDragDelta((d) => clampCenteredModalDelta(d.x, d.y, w, h));
  }, [isNarrow]);

  useEffect(() => {
    if (!open || isNarrow) return;
    const onResize = () => reclampPosition();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, isNarrow, reclampPosition]);

  const onDragHandlePointerDown = (e: React.PointerEvent) => {
    if (isNarrow || e.button !== 0) return;
    e.preventDefault();
    dragSessionRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: dragDelta.x,
      originY: dragDelta.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onDragHandlePointerMove = (e: React.PointerEvent) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== e.pointerId) return;
    const el = dialogRef.current;
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;
    const nx = session.originX + (e.clientX - session.startX);
    const ny = session.originY + (e.clientY - session.startY);
    setDragDelta(clampCenteredModalDelta(nx, ny, w, h));
  };

  const endDrag = (e: React.PointerEvent) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== e.pointerId) return;
    dragSessionRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  if (!open || typeof document === "undefined") return null;

  const done = remaining <= 0;

  const desktopStyle: CSSProperties = {
    zIndex: Z_FLOATING_PANEL,
    left: "50%",
    top: "50%",
    transform: `translate(calc(-50% + ${dragDelta.x}px), calc(-50% + ${dragDelta.y}px))`,
  };

  const portal = createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal={false}
      aria-labelledby={titleId}
      aria-describedby={statusId}
      className={cn(
        "bloomora-modal-panel pointer-events-auto fixed flex flex-col gap-4 overflow-hidden shadow-[0_20px_56px_rgba(0,0,0,0.2)] ring-1 backdrop-blur-md",
        "bg-bloomora-white/98 ring-bloomora-line/35",
        isNarrow
          ? "rounded-[22px] p-5"
          : "max-w-[min(100vw-2rem,24rem)] rounded-2xl p-6",
      )}
      style={
        isNarrow
          ? {
              zIndex: Z_FLOATING_PANEL,
              left: "max(12px, env(safe-area-inset-left))",
              right: "max(12px, env(safe-area-inset-right))",
              bottom: "max(12px, env(safe-area-inset-bottom))",
              width: "auto",
            }
          : desktopStyle
      }
    >
        <div
          className={cn(
            "min-w-0 rounded-xl px-1 py-0.5",
            !isNarrow &&
              "cursor-grab touch-none select-none active:cursor-grabbing sm:-mx-1 sm:px-2 sm:py-2 sm:hover:bg-bloomora-lavender-50/50",
          )}
          onPointerDown={onDragHandlePointerDown}
          onPointerMove={onDragHandlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          role="group"
          aria-label={
            isNarrow
              ? undefined
              : "Arrastra esta zona para mover el contador por la pantalla"
          }
        >
          <div className="flex items-start justify-between gap-2">
            <p className="bloomora-modal-kicker text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-bloomora-text-muted">
              Contador del bloque
            </p>
            {!isNarrow ? (
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-bloomora-text-muted/45"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M8 4h2v2H8V4zm6 0h2v2h-2V4zM8 9h2v2H8V9zm6 0h2v2h-2V9zM8 14h2v2H8v-2zm6 0h2v2h-2v-2zM8 19h2v2H8v-2zm6 0h2v2h-2v-2z" />
              </svg>
            ) : null}
          </div>
          <h2
            id={titleId}
            className="bloomora-modal-title mt-1.5 text-base font-bold leading-snug tracking-tight text-bloomora-deep sm:text-lg"
          >
            {taskTitle}
          </h2>
        </div>

        <div
          id={statusId}
          className={cn(
            "bloomora-modal-highlight rounded-2xl px-4 py-6 text-center ring-1 ring-bloomora-line/25",
            "bg-bloomora-lavender-50/80",
          )}
          aria-live="polite"
        >
          <p
            className={cn(
              "bloomora-modal-time font-mono text-[clamp(2.25rem,8vw,3rem)] font-bold tabular-nums tracking-tight text-bloomora-deep",
              done && "bloomora-modal-time--done text-bloomora-violet",
            )}
          >
            {formatCountdown(remaining)}
          </p>
          <p className="bloomora-modal-status mt-2 text-sm font-medium text-bloomora-text-muted">
            {done
              ? "Tiempo del bloque completado"
              : paused
                ? "En pausa"
                : "Restante según tu horario"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={done}
            onClick={() => setPaused((p) => !p)}
            className="sm:min-w-[7rem]"
          >
            {paused ? "Reanudar" : "Pausar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setRemaining(totalSeconds);
              setPaused(false);
            }}
            className="sm:min-w-[7rem]"
          >
            Reiniciar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onClose}
            className="sm:min-w-[7rem]"
          >
            Cerrar
          </Button>
        </div>
    </div>,
    document.body,
  );

  return portal;
}
