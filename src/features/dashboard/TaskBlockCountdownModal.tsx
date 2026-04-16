import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { playCountdownGentleBellsSound } from "@/utils/agendaBlockSound";
import { cn } from "@/utils/cn";

/** Por encima del contenido pero sin capa que bloquee clics al documento. */
const Z_FLOATING_PANEL = 10_081;

const SAFE = 12;

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
  const margin = SAFE;
  const maxDx = vw / 2 - w / 2 - margin;
  const minDx = -vw / 2 + w / 2 + margin;
  const maxDy = vh / 2 - h / 2 - margin;
  const minDy = -vh / 2 + h / 2 + margin;
  return {
    x: Math.min(maxDx, Math.max(minDx, dx)),
    y: Math.min(maxDy, Math.max(minDy, dy)),
  };
}

function clampMobileTopLeft(
  x: number,
  y: number,
  w: number,
  h: number,
): { x: number; y: number } {
  if (typeof window === "undefined" || w <= 0 || h <= 0) {
    return { x, y };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const m = SAFE;
  return {
    x: Math.min(Math.max(m, x), vw - w - m),
    y: Math.min(Math.max(m, y), vh - h - m),
  };
}

export type TaskBlockCountdownModalProps = {
  open: boolean;
  taskTitle: string;
  /** Duración total del bloque en segundos (según hora inicio y fin de la tarea). */
  totalSeconds: number;
  onClose: () => void;
};

type DragSession = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  mode: "desktop" | "mobile";
};

/**
 * Panel flotante de cuenta atrás del bloque (no bloquea el resto de la app: sin backdrop).
 * En escritorio se arrastra desde la cabecera. En móvil: minimizado por defecto (solo tiempo),
 * arrastrable a cualquier esquina.
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
  const dragSessionRef = useRef<DragSession | null>(null);
  const endBellPlayedRef = useRef(false);
  /** Marca absoluta (epoch ms) en que termina el bloque. */
  const endAtMsRef = useRef<number | null>(null);

  const [remaining, setRemaining] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  /** Móvil: esquina superior izquierda en px; null = aún no medido (centrado abajo). */
  const [mobileTopLeft, setMobileTopLeft] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [minimizedMobile, setMinimizedMobile] = useState(true);

  const getRemainingFromClock = useCallback(() => {
    const endAt = endAtMsRef.current;
    if (endAt == null) return 0;
    return Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  }, []);

  const syncRemainingFromClock = useCallback(() => {
    const next = getRemainingFromClock();
    setRemaining((prev) => (prev === next ? prev : next));
  }, [getRemainingFromClock]);

  useEffect(() => {
    if (!open) return;
    endAtMsRef.current = Date.now() + totalSeconds * 1000;
    setRemaining(totalSeconds);
    setPaused(false);
    setDragDelta({ x: 0, y: 0 });
    setMobileTopLeft(null);
    setMinimizedMobile(true);
    endBellPlayedRef.current = false;
  }, [open, totalSeconds]);

  useEffect(() => {
    if (remaining > 0) endBellPlayedRef.current = false;
  }, [remaining]);

  useEffect(() => {
    if (!open || remaining > 0) return;
    if (endBellPlayedRef.current) return;
    endBellPlayedRef.current = true;
    void playCountdownGentleBellsSound();
  }, [open, remaining]);

  useEffect(() => {
    if (!open || paused) return;
    syncRemainingFromClock();
    const id = window.setInterval(syncRemainingFromClock, 250);
    return () => window.clearInterval(id);
  }, [open, paused, syncRemainingFromClock]);

  /**
   * Al volver de background/screen-off, resincroniza inmediatamente el reloj
   * para evitar “pausas aparentes” por throttling de timers del navegador.
   */
  useEffect(() => {
    if (!open || paused) return;
    const onWake = () => syncRemainingFromClock();
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("pageshow", onWake);
    return () => {
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("pageshow", onWake);
    };
  }, [open, paused, syncRemainingFromClock]);

  const reclampDesktop = useCallback(() => {
    if (isNarrow) return;
    const el = dialogRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    setDragDelta((d) => clampCenteredModalDelta(d.x, d.y, w, h));
  }, [isNarrow]);

  const reclampMobile = useCallback(() => {
    if (!isNarrow) return;
    const el = dialogRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w < 1 || h < 1) return;
    setMobileTopLeft((prev) => {
      if (prev == null) return prev;
      return clampMobileTopLeft(prev.x, prev.y, w, h);
    });
  }, [isNarrow]);

  useLayoutEffect(() => {
    if (!open || !isNarrow || !dialogRef.current) return;
    const el = dialogRef.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w < 1 || h < 1) return;
    setMobileTopLeft((prev) => {
      if (prev != null) return clampMobileTopLeft(prev.x, prev.y, w, h);
      return clampMobileTopLeft(
        Math.max(SAFE, (window.innerWidth - w) / 2),
        Math.max(SAFE, window.innerHeight - h - SAFE),
        w,
        h,
      );
    });
  }, [open, isNarrow, minimizedMobile]);

  useEffect(() => {
    if (!open || isNarrow) return;
    const onResize = () => reclampDesktop();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, isNarrow, reclampDesktop]);

  useEffect(() => {
    if (!open || !isNarrow) return;
    const onResize = () => reclampMobile();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, isNarrow, reclampMobile]);

  const onDragHandlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    let ox = dragDelta.x;
    let oy = dragDelta.y;
    if (isNarrow) {
      const el = dialogRef.current;
      if (!el) return;
      if (mobileTopLeft == null) {
        const r = el.getBoundingClientRect();
        ox = r.left;
        oy = r.top;
        setMobileTopLeft({ x: ox, y: oy });
      } else {
        ox = mobileTopLeft.x;
        oy = mobileTopLeft.y;
      }
    }
    dragSessionRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: ox,
      originY: oy,
      mode: isNarrow ? "mobile" : "desktop",
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onDragHandlePointerMove = (e: React.PointerEvent) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== e.pointerId) return;
    const el = dialogRef.current;
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;
    if (session.mode === "mobile") {
      const nx = session.originX + (e.clientX - session.startX);
      const ny = session.originY + (e.clientY - session.startY);
      setMobileTopLeft(clampMobileTopLeft(nx, ny, w, h));
    } else {
      const nx = session.originX + (e.clientX - session.startX);
      const ny = session.originY + (e.clientY - session.startY);
      setDragDelta(clampCenteredModalDelta(nx, ny, w, h));
    }
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

  const togglePause = () => {
    if (paused) {
      endAtMsRef.current = Date.now() + remaining * 1000;
      setPaused(false);
      return;
    }
    const snap = getRemainingFromClock();
    setRemaining(snap);
    setPaused(true);
  };

  const resetCountdown = () => {
    endAtMsRef.current = Date.now() + totalSeconds * 1000;
    setRemaining(totalSeconds);
    setPaused(false);
  };

  const desktopStyle: CSSProperties = {
    zIndex: Z_FLOATING_PANEL,
    left: "50%",
    top: "50%",
    transform: `translate(calc(-50% + ${dragDelta.x}px), calc(-50% + ${dragDelta.y}px))`,
  };

  const narrowUnsettledStyle: CSSProperties = {
    zIndex: Z_FLOATING_PANEL,
    left: "50%",
    bottom: "max(12px, env(safe-area-inset-bottom))",
    transform: "translateX(-50%)",
    width: minimizedMobile ? "auto" : "min(100vw - 24px, 24rem)",
    maxWidth: minimizedMobile ? "14rem" : undefined,
  };

  const mobilePanelStyle: CSSProperties = isNarrow
    ? mobileTopLeft == null
      ? narrowUnsettledStyle
      : {
          zIndex: Z_FLOATING_PANEL,
          left: mobileTopLeft.x,
          top: mobileTopLeft.y,
          width: minimizedMobile ? "auto" : "min(100vw - 24px, 24rem)",
          maxWidth: minimizedMobile ? "14rem" : undefined,
        }
    : desktopStyle;

  const dragHandleClass = cn(
    "min-w-0 rounded-xl px-1 py-0.5 touch-none select-none",
    !isNarrow &&
      "cursor-grab active:cursor-grabbing sm:-mx-1 sm:px-2 sm:py-2 sm:hover:bg-bloomora-lavender-50/50",
    isNarrow && "cursor-grab active:cursor-grabbing",
  );

  const portal = createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal={false}
      aria-labelledby={titleId}
      aria-describedby={statusId}
      className={cn(
        "bloomora-modal-panel pointer-events-auto fixed flex flex-col overflow-hidden shadow-[0_20px_56px_rgba(0,0,0,0.2)] ring-1 backdrop-blur-md",
        "bg-bloomora-white/98 ring-bloomora-line/35",
        isNarrow
          ? minimizedMobile
            ? "bloomora-mobile-countdown-chip gap-0 rounded-2xl px-1.5 py-1.5 ring-bloomora-line/40"
            : "gap-4 rounded-[22px] p-5"
          : "max-w-[min(100vw-2rem,24rem)] gap-4 rounded-2xl p-6",
      )}
      style={mobilePanelStyle}
    >
      {isNarrow && minimizedMobile ? (
        <div
          className={dragHandleClass}
          onPointerDown={onDragHandlePointerDown}
          onPointerMove={onDragHandlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          role="group"
          aria-label="Arrastra para mover el contador. Pulsa expandir para más opciones."
        >
          <div className="flex items-center gap-2 pr-1">
            <p
              className={cn(
                "bloomora-modal-time bloomora-mobile-countdown-time font-mono text-[clamp(1.55rem,6.8vw,1.95rem)] font-bold tabular-nums tracking-tight text-bloomora-deep",
                done && "bloomora-modal-time--done text-bloomora-violet",
              )}
              aria-live="polite"
            >
              {formatCountdown(remaining)}
            </p>
            <button
              type="button"
              className="bloomora-mobile-countdown-expand-btn flex h-10 shrink-0 items-center justify-center rounded-xl px-2.5 text-bloomora-violet ring-1 ring-bloomora-line/40 hover:bg-bloomora-lavender-50/80"
              aria-label="Expandir panel del cronómetro"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setMinimizedMobile(false);
              }}
            >
              <svg
                className="h-[1.05rem] w-[1.05rem]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M7 14l5-5 5 5" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={dragHandleClass}
            onPointerDown={onDragHandlePointerDown}
            onPointerMove={onDragHandlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            role="group"
            aria-label={
              isNarrow
                ? "Arrastra para mover el contador"
                : "Arrastra esta zona para mover el contador por la pantalla"
            }
          >
            <div className="flex items-start justify-between gap-2">
              <p className="bloomora-modal-kicker text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-bloomora-text-muted">
                Contador del bloque
              </p>
              <div className="flex shrink-0 items-center gap-1">
                {isNarrow ? (
                  <button
                    type="button"
                    className="rounded-full px-2 py-1 text-[11px] font-semibold text-bloomora-violet ring-1 ring-bloomora-line/40 hover:bg-bloomora-lavender-50/80"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMinimizedMobile(true);
                    }}
                  >
                    Minimizar
                  </button>
                ) : null}
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
              onClick={togglePause}
              className="sm:min-w-[7rem]"
            >
              {paused ? "Reanudar" : "Pausar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetCountdown}
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
        </>
      )}
    </div>,
    document.body,
  );

  return portal;
}
