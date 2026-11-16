import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { type MockGoalRow } from "@/data/dashboardMock";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { GoalActionsMenu } from "@/features/dashboard/GoalActionsMenu";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { buttonClassName } from "@/components/ui/buttonRecipe";
import { useBloomoraAlert } from "@/contexts/BloomoraAlertContext";
import { useBloomoraToast } from "@/contexts/BloomoraToastContext";
import { useUserPhone } from "@/contexts/UserPhoneContext";
import { ShareAchievementModal } from "@/features/share-achievement/ShareAchievementModal";
import {
  useBloomoraGoals,
  useDeleteGoalMutation,
  useEnsureGoalDayMutation,
} from "@/hooks/useBloomoraGoals";
import { useAgendaMutations } from "@/hooks/useBloomoraAgenda";
import {
  getCompletedDaysForMonth,
  monthLabelEs,
} from "@/features/goals/goalTrackerUtils";
import { listAgendaTasksLinkedToGoal } from "@/services/supabase/agendaRepo";
import { requireSupabase } from "@/services/supabase/typedClient";
import { toDateKeyLocal } from "@/utils/agendaTime";
import { cn } from "@/utils/cn";

/** Retraso para distinguir clic simple (abrir tracker) de doble clic (marcar hoy). */
const ROW_CLICK_DELAY_MS = 280;

function isGoalComplete(goal: MockGoalRow): boolean {
  return goal.estado === "Completada" || goal.percent >= 100;
}

function averageGoalsCompletionPercent(
  goals: MockGoalRow[],
  now: Date,
): number {
  if (goals.length === 0) return 0;
  const sum = goals.reduce((acc, goal) => {
    const completed = getCompletedDaysForMonth(
      goal,
      now.getFullYear(),
      now.getMonth(),
    ).length;
    const ratio =
      goal.objetivo > 0
        ? (completed / goal.objetivo) * 100
        : goal.percent;
    return acc + Math.min(100, Math.max(0, ratio));
  }, 0);
  return Math.min(100, Math.round(sum / goals.length));
}

/** Presentación: "n de m días" / label existente / ✅ Lista — sin nueva lógica de negocio. */
function goalProgressCaption(goal: MockGoalRow): string {
  if (isGoalComplete(goal)) return "✅ Lista";
  const trimmed = goal.label?.trim();
  if (trimmed) {
    return trimmed
      .replace(/\s*\/\s*/g, " de ")
      .replace(/\bdias\b/gi, "días");
  }
  if (goal.variant === "days") {
    return `${goal.progreso} de ${goal.objetivo} días`;
  }
  if (goal.variant === "pages") {
    return `${goal.progreso} de ${goal.objetivo} páginas`;
  }
  return `${Math.round(goal.percent)}%`;
}

function splitGoalEmoji(title: string): { emoji: string; name: string } {
  const match = title.match(
    /^((?:\p{Extended_Pictographic}|\p{Emoji_Presentation})\uFE0F?(?:\u200D(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})\uFE0F?)*)\s+/u,
  );
  if (!match) return { emoji: "🎯", name: title };
  return { emoji: match[1], name: title.slice(match[0].length).trim() || title };
}

function motivationalCopy(completed: number, total: number): {
  headline: string;
  detail: string;
} {
  const remaining = Math.max(0, total - completed);
  if (total === 0) {
    return { headline: "", detail: "" };
  }
  if (remaining === 0) {
    return {
      headline: "¡Todas cumplidas! 🎉",
      detail: "Cerraste el mes con tus metas",
    };
  }
  const ratio = completed / total;
  if (ratio >= 0.6) {
    return {
      headline: "¡Vas muy bien! 💪",
      detail:
        remaining === 1
          ? "Te falta 1 meta este mes"
          : `Te faltan ${remaining} metas este mes`,
    };
  }
  if (ratio >= 0.3) {
    return {
      headline: "¡Buen ritmo! ✨",
      detail:
        remaining === 1
          ? "Te falta 1 meta este mes"
          : `Te faltan ${remaining} metas este mes`,
    };
  }
  return {
    headline: "¡Tú puedes! 🌱",
    detail:
      remaining === 1
        ? "Te falta 1 meta este mes"
        : `Te faltan ${remaining} metas este mes`,
  };
}

function isGoalMarkedToday(goal: MockGoalRow, now = new Date()): boolean {
  const days = getCompletedDaysForMonth(
    goal,
    now.getFullYear(),
    now.getMonth(),
  );
  return days.includes(now.getDate());
}

function GoalListRow({
  goal,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onDelete,
  onEdit,
  onShare,
  onDoubleMarkToday,
  marking,
}: {
  goal: MockGoalRow;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onShare: () => void;
  onDoubleMarkToday: () => void;
  marking: boolean;
}) {
  const complete = isGoalComplete(goal);
  const { emoji, name } = splitGoalEmoji(goal.title);
  const caption = goalProgressCaption(goal);
  const pct = Math.min(100, Math.max(0, goal.percent));
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearClickTimer = () => {
    if (clickTimerRef.current != null) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
  };

  const handleRowClick = () => {
    if (marking) return;
    clearClickTimer();
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      onEdit();
    }, ROW_CLICK_DELAY_MS);
  };

  const handleRowDoubleClick = () => {
    clearClickTimer();
    if (marking) return;
    onDoubleMarkToday();
  };

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-stretch gap-1 rounded-2xl border border-[color:var(--bloomora-border)] bg-bloomora-white px-2.5 py-2.5 sm:px-3 sm:py-3",
      )}
    >
      <button
        type="button"
        onClick={handleRowClick}
        onDoubleClick={handleRowDoubleClick}
        disabled={marking}
        title="Doble clic para marcar como hecha hoy"
        aria-label={`Meta ${name}. Progreso: ${caption}, ${Math.round(pct)} por ciento. Clic para abrir. Doble clic para marcar como hecha hoy.`}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left outline-none transition hover:bg-[color:var(--bloomora-surface-3)] focus-visible:ring-2 focus-visible:ring-bloomora-lilac/60 focus-visible:ring-offset-1 disabled:opacity-60"
      >
        <span
          className="grid size-11 shrink-0 place-items-center rounded-[0.875rem] bg-bloomora-blush text-[1.375rem]"
          aria-hidden
        >
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <h3 className="truncate text-[0.9375rem] font-semibold leading-snug tracking-tight text-bloomora-deep sm:text-base">
              {name}
            </h3>
            <span
              className={cn(
                "shrink-0 text-[0.8125rem] font-semibold tabular-nums sm:text-[0.875rem]",
                complete ? "text-emerald-700" : "text-bloomora-violet",
              )}
            >
              {caption}
            </span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--bloomora-surface-2)] ring-1 ring-[color:var(--bloomora-border)]"
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(pct)} por ciento`}
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                complete
                  ? "bg-emerald-400"
                  : "bg-gradient-to-r from-bloomora-lilac to-bloomora-rose",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </button>

      <div className="flex shrink-0 items-start pt-0.5">
        <GoalActionsMenu
          goalTitle={goal.title}
          open={menuOpen}
          onClose={onCloseMenu}
          onTriggerClick={onToggleMenu}
          onEdit={onEdit}
          onDelete={onDelete}
          onShare={onShare}
        />
      </div>
    </div>
  );
}

type GoalProgressCardProps = {
  className?: string;
};

export function GoalProgressCard({ className }: GoalProgressCardProps) {
  const navigate = useNavigate();
  const { cedula } = useUserPhone();
  const { confirm } = useBloomoraAlert();
  const { showToast } = useBloomoraToast();
  const { data: goals = [], isLoading } = useBloomoraGoals(cedula);
  const deleteGoalMut = useDeleteGoalMutation(cedula);
  const ensureGoalDayMut = useEnsureGoalDayMutation(cedula);

  const todayKey = toDateKeyLocal(new Date());
  const agendaMut = useAgendaMutations(cedula, todayKey);

  const [menuGoalId, setMenuGoalId] = useState<string | null>(null);
  const [markingGoalId, setMarkingGoalId] = useState<string | null>(null);
  const [shareGoalId, setShareGoalId] = useState<string | null>(null);
  const closeGoalMenu = () => setMenuGoalId(null);
  const shareGoal = goals.find((g) => g.id === shareGoalId) ?? null;

  const now = new Date();
  const monthLabelRaw = monthLabelEs(now.getFullYear(), now.getMonth());
  const monthLabel =
    monthLabelRaw.charAt(0).toUpperCase() + monthLabelRaw.slice(1);
  const dayOfMonth = now.getDate();

  const total = goals.length;
  const completed = goals.filter(isGoalComplete).length;
  const monthPercent = averageGoalsCompletionPercent(goals, now);
  const previewGoals = goals.slice(0, 3);
  const motivation = motivationalCopy(completed, total);
  const ringAria = `${completed} de ${total} metas cumplidas este mes`;

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "¿Borrar esta meta por completo?",
      confirmLabel: "Borrar",
      tone: "danger",
    });
    if (!ok) return;
    deleteGoalMut.mutate(id);
    setMenuGoalId(null);
  };

  const handleEdit = (id: string) => {
    setMenuGoalId(null);
    navigate(`/app/goals/${id}/tracker`);
  };

  const promptLinkedTaskIfAny = async (goalId: string) => {
    if (!cedula) return;
    let linked;
    try {
      linked = await listAgendaTasksLinkedToGoal(requireSupabase(), {
        userCedula: cedula,
        planDate: todayKey,
        goalId: Number(goalId),
      });
    } catch {
      return;
    }

    const pending = linked.find((t) => !t.completed);
    if (!pending) return;

    const markTask = await confirm({
      title:
        "Detectamos que esta meta se encuentra registrada como una tarea del día de hoy. ¿Quieres marcarla como hecha?",
      confirmLabel: "Sí",
      cancelLabel: "No",
    });
    if (!markTask) return;

    try {
      await agendaMut.toggle.mutateAsync({
        id: String(pending.id),
        completed: true,
      });
      showToast("Tarea marcada como hecha");
    } catch {
      showToast("No se pudo marcar la tarea");
    }
  };

  const handleDoubleMarkToday = async (goal: MockGoalRow) => {
    if (!cedula || markingGoalId) return;
    setMenuGoalId(null);
    setMarkingGoalId(goal.id);

    try {
      const today = new Date();
      const alreadyMarked = isGoalMarkedToday(goal, today);

      if (alreadyMarked) {
        showToast("Esta meta ya estaba marcada para hoy");
        await promptLinkedTaskIfAny(goal.id);
        return;
      }

      const ok = await confirm({
        title: "¿Quieres registrar esta actividad como hecha hoy?",
        confirmLabel: "Sí",
        cancelLabel: "No",
      });
      if (!ok) return;

      await ensureGoalDayMut.mutateAsync({
        goalId: goal.id,
        year: today.getFullYear(),
        monthIndex0: today.getMonth(),
        day: today.getDate(),
      });
      showToast("Meta marcada para hoy");

      await promptLinkedTaskIfAny(goal.id);
    } catch {
      showToast("No se pudo marcar la meta");
    } finally {
      setMarkingGoalId(null);
    }
  };

  return (
    <DashboardCard
      className={cn(
        "dashboard-panel-card dashboard-day-card h-full min-h-0 min-w-0 max-w-full bg-bloomora-white p-5 max-[599px]:p-5 min-[600px]:p-7",
        className,
      )}
    >
      <header className="flex min-w-0 shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-bloomora-deep min-[1024px]:text-[1.375rem]">
            Tus metas
          </h2>
          <p className="mt-0.5 text-[0.9375rem] font-medium text-bloomora-violet">
            {monthLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/app/goals/overview"
            aria-label="Calendarios"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--bloomora-border)] bg-bloomora-white text-bloomora-deep transition hover:bg-[color:var(--bloomora-surface-3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloomora-lilac"
          >
            <span className="relative inline-flex size-6 items-center justify-center" aria-hidden>
              <svg
                viewBox="0 0 24 24"
                className="size-6 text-bloomora-violet"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <rect x="3.5" y="5" width="17" height="15" rx="3" />
                <path d="M3.5 10h17M8 3.5v3M16 3.5v3" strokeLinecap="round" />
              </svg>
              <span className="absolute inset-x-0 bottom-0.5 text-center text-[0.65rem] font-bold leading-none tabular-nums text-bloomora-deep">
                {dayOfMonth}
              </span>
            </span>
          </Link>
          <Link
            to="/app/goals/new"
            className={buttonClassName({
              variant: "primary",
              size: "sm",
              className:
                "min-h-11 bg-[color:var(--bloomora-accent-bg)] px-[1.125rem] font-bold text-[color:var(--bloomora-accent-on)] shadow-[0_4px_12px_rgba(232,155,184,0.35)] hover:brightness-105",
            })}
          >
            + Nueva
          </Link>
        </div>
      </header>

      <div className="dashboard-card-scroll mt-4 flex min-h-0 w-full max-w-full flex-1 flex-col">
        {isLoading ? (
          <p className="py-8 text-center text-base text-bloomora-violet">
            Cargando metas…
          </p>
        ) : null}

        {!isLoading && total === 0 ? (
          <div className="rounded-[1.35rem] bg-[color:var(--bloomora-surface-2)] px-4 py-6 text-center ring-1 ring-[color:var(--bloomora-border)] sm:px-5 sm:py-7">
            <p className="text-3xl leading-none" aria-hidden>
              🌱
            </p>
            <h3 className="mt-3 text-lg font-bold tracking-tight text-bloomora-deep sm:text-xl">
              ¡Planta tu primera meta!
            </h3>
            <p className="mt-1.5 text-[0.9375rem] font-medium text-bloomora-violet sm:text-base">
              Elige algo que quieras lograr este mes
            </p>
            <Link
              to="/app/goals/new"
              className={buttonClassName({
                variant: "primary",
                size: "lg",
                fullWidth: true,
                className:
                  "mt-5 h-14 min-h-14 bg-[color:var(--bloomora-accent-bg)] text-base font-bold text-[color:var(--bloomora-accent-on)] hover:brightness-105",
              })}
            >
              + Crear mi meta
            </Link>
          </div>
        ) : null}

        {!isLoading && total > 0 ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="flex shrink-0 flex-col items-center gap-4 rounded-[1.375rem] bg-bloomora-mist px-4 py-5 text-center min-[600px]:flex-row min-[600px]:items-center min-[600px]:gap-6 min-[600px]:px-6 min-[600px]:py-6 min-[600px]:text-left">
              <ProgressRing
                value={monthPercent}
                size={124}
                strokeWidth={14}
                gradient
                aria-label={ringAria}
                className="shrink-0"
              >
                <span className="text-[1.4rem] font-bold leading-tight tabular-nums text-bloomora-deep">
                  {completed} de {total}
                </span>
                <span className="mt-0.5 text-[0.8125rem] font-semibold text-bloomora-violet">
                  cumplidas
                </span>
              </ProgressRing>

              <div className="min-w-0">
                <p className="text-xl font-bold text-bloomora-deep">
                  {motivation.headline}
                </p>
                <p className="mt-1 text-[0.9375rem] font-medium text-bloomora-violet">
                  {motivation.detail}
                </p>
                <span className="mt-3 inline-flex min-h-8 items-center rounded-pill border border-[color:var(--bloomora-border)] bg-bloomora-white px-3 text-sm font-bold tabular-nums text-bloomora-violet">
                  {monthPercent}% del mes
                </span>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-2.5">
              {previewGoals.map((g) => (
                <GoalListRow
                  key={g.id}
                  goal={g}
                  menuOpen={menuGoalId === g.id}
                  onToggleMenu={() =>
                    setMenuGoalId((id) => (id === g.id ? null : g.id))
                  }
                  onCloseMenu={closeGoalMenu}
                  onDelete={() => handleDelete(g.id)}
                  onEdit={() => handleEdit(g.id)}
                  onShare={() => setShareGoalId(g.id)}
                  onDoubleMarkToday={() => void handleDoubleMarkToday(g)}
                  marking={markingGoalId === g.id}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {shareGoal ? (
        <ShareAchievementModal
          open
          goal={shareGoal}
          year={now.getFullYear()}
          monthIndex0={now.getMonth()}
          onClose={() => setShareGoalId(null)}
        />
      ) : null}
    </DashboardCard>
  );
}
