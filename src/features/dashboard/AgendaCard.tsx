import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { defaultNewBlockDurationMin } from "@/data/dashboardMock";
import { EmptyDayState } from "@/components/auth/EmptyDayState";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AgendaTaskRow } from "@/features/dashboard/AgendaTaskRow";
import { AgendaTaskSubsteps } from "@/features/dashboard/AgendaTaskSubsteps";
import { useTaskBlockCountdown } from "@/contexts/TaskBlockCountdownContext";
import { Button } from "@/components/ui/Button";
import { BloomoraConfirmDialog } from "@/components/ui/BloomoraConfirmDialog";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useBloomoraToast } from "@/contexts/BloomoraToastContext";
import { useUserPhone } from "@/contexts/UserPhoneContext";
import {
  useAgendaMutations,
  useBloomoraAgenda,
} from "@/hooks/useBloomoraAgenda";
import { useAgendaBlockEndAlerts } from "@/hooks/useAgendaBlockEndAlerts";
import { useBloomoraGoals } from "@/hooks/useBloomoraGoals";
import { useBloomoraProfile } from "@/hooks/useBloomoraProfile";
import { useGoalTaskTemplates } from "@/hooks/useGoalTaskTemplates";
import { messageFromSupabaseError } from "@/lib/supabaseError";
import {
  useDuplicateAgendaDay,
  nextDateKeyFrom,
} from "@/hooks/useAgendaDayOperations";
import {
  addLocalDays,
  blockDurationSeconds,
  formatMinutes12h,
  minutesFromTimeInput,
  minutesSinceMidnightLocal,
  startOfLocalDay,
  titleCaseAgendaDate,
  toDateKeyLocal,
  toTimeInputValue,
} from "@/utils/agendaTime";
import { cn } from "@/utils/cn";

/** Sugerencia por defecto para el primer bloque en días que no son hoy. */
const defaultEmptyDayStartMin = 7 * 60;

function suggestedFirstBlockStartMin(isViewingToday: boolean): number {
  return isViewingToday
    ? minutesSinceMidnightLocal()
    : defaultEmptyDayStartMin;
}

function AgendaTrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1 v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" />
    </svg>
  );
}

type AgendaCardProps = {
  className?: string;
};

export function AgendaCard({ className }: AgendaCardProps) {
  const { openBlockCountdown } = useTaskBlockCountdown();
  const { showToast } = useBloomoraToast();
  const { cedula, phone } = useUserPhone();
  const { data: profile } = useBloomoraProfile(phone);
  const agendaBlockNotifyOn =
    profile == null || profile.notify_agenda_block_end !== false;
  const [cursorDate, setCursorDate] = useState(() =>
    startOfLocalDay(new Date()),
  );
  const dayKey = useMemo(() => toDateKeyLocal(cursorDate), [cursorDate]);
  const headerLabel = useMemo(
    () => titleCaseAgendaDate(cursorDate),
    [cursorDate],
  );
  const isViewingToday = useMemo(() => {
    const today = startOfLocalDay(new Date());
    return toDateKeyLocal(cursorDate) === toDateKeyLocal(today);
  }, [cursorDate]);

  const [deviceNow, setDeviceNow] = useState(() => new Date());
  useEffect(() => {
    if (!isViewingToday) return;
    const id = window.setInterval(() => setDeviceNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [isViewingToday]);

  const deviceTimeLabel = useMemo(
    () =>
      deviceNow.toLocaleTimeString("es", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [deviceNow],
  );

  const {
    data: tasks = [],
    isLoading,
    isError,
    error: agendaError,
  } = useBloomoraAgenda(cedula, dayKey);
  const { data: goals = [] } = useBloomoraGoals(cedula);
  const { templateIds } = useGoalTaskTemplates(cedula);
  const {
    toggle,
    addTask,
    updateTask,
    removeTask,
    addSubtask,
    toggleSubtask,
    removeSubtask,
    renameSubtask,
  } = useAgendaMutations(cedula, dayKey);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [createMode, setCreateMode] = useState<"normal" | "goal">("normal");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [draftStartTime, setDraftStartTime] = useState("");
  const [draftEndTime, setDraftEndTime] = useState("");
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [deleteIntent, setDeleteIntent] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const duplicateDay = useDuplicateAgendaDay(cedula);
  const targetDayKey = useMemo(() => nextDateKeyFrom(dayKey), [dayKey]);
  const targetDayLabel = useMemo(() => {
    const [y, mo, d] = targetDayKey.split("-").map(Number);
    return titleCaseAgendaDate(new Date(y, mo - 1, d));
  }, [targetDayKey]);
  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => a.startMin - b.startMin),
    [tasks],
  );

  const { blockEndPrompt, dismissBlockEndPrompt } = useAgendaBlockEndAlerts(
    dayKey,
    sortedTasks,
    {
      enabled:
        agendaBlockNotifyOn && !isLoading && !isError && sortedTasks.length > 0,
    },
  );
  const orderedGoalOptions = useMemo(() => {
    if (!goals.length) return goals;
    const templateSet = new Set(templateIds);
    const templates = goals.filter((g) => templateSet.has(g.id));
    const regular = goals.filter((g) => !templateSet.has(g.id));
    return [...templates, ...regular];
  }, [goals, templateIds]);
  const selectedGoal = useMemo(
    () => orderedGoalOptions.find((g) => g.id === selectedGoalId) ?? null,
    [orderedGoalOptions, selectedGoalId],
  );

  const completedCount = sortedTasks.filter((t) => t.completed).length;
  const total = sortedTasks.length;
  const progressPct = total > 0 ? (completedCount / total) * 100 : 0;

  const nextBlockStartMin = useCallback((list: typeof sortedTasks) => {
    if (list.length === 0) return suggestedFirstBlockStartMin(isViewingToday);
    return list[list.length - 1].endMin;
  }, [isViewingToday]);

  const openCreateForm = useCallback(() => {
    if (sortedTasks.length === 0) {
      const start = suggestedFirstBlockStartMin(isViewingToday);
      setDraftStartTime(toTimeInputValue(start));
      setDraftEndTime(
        toTimeInputValue(start + defaultNewBlockDurationMin),
      );
    } else {
      const start = nextBlockStartMin(sortedTasks);
      setDraftStartTime(toTimeInputValue(start));
      setDraftEndTime(toTimeInputValue(start + defaultNewBlockDurationMin));
    }
    setDraftTitle("");
    setCreateMode("normal");
    setSelectedGoalId(orderedGoalOptions[0]?.id ?? "");
    setCreateFormError(null);
    setShowCreateForm(true);
    setEditingId(null);
  }, [sortedTasks, nextBlockStartMin, orderedGoalOptions, isViewingToday]);

  const shiftDay = (delta: number) => {
    setCursorDate((d) => addLocalDays(d, delta));
    setShowCreateForm(false);
    setEditingId(null);
  };

  const handleSubmitCreate = (e: FormEvent) => {
    e.preventDefault();
    setCreateFormError(null);
    const title =
      createMode === "goal"
        ? (selectedGoal?.title?.trim() ?? "")
        : draftTitle.trim();
    if (!title) {
      setCreateFormError(
        createMode === "goal"
          ? "Elige una meta para crear la tarea."
          : "Escribe un título para la tarea.",
      );
      return;
    }

    const startMin = minutesFromTimeInput(draftStartTime);
    if (startMin === null) {
      setCreateFormError("Elige una hora de inicio válida.");
      return;
    }
    let endMin = minutesFromTimeInput(draftEndTime);
    if (endMin === null) endMin = startMin + defaultNewBlockDurationMin;
    if (endMin <= startMin) {
      setCreateFormError(
        "La hora de fin debe ser después de la hora de inicio.",
      );
      return;
    }

    addTask.mutate(
      {
        title,
        startMin,
        endMin,
        goalId: createMode === "goal" ? selectedGoalId : null,
      },
      {
        onSuccess: () => {
          showToast(
            createMode === "goal"
              ? "¡Tarea creada desde meta! Se vinculará al completarla."
              : "¡Tarea guardada!",
          );
          setShowCreateForm(false);
          setDraftTitle("");
          setCreateFormError(null);
        },
        onError: (err) => {
          const msg =
            err instanceof Error ? err.message : "No se pudo guardar la tarea.";
          setCreateFormError(msg);
        },
      },
    );
  };

  const openEdit = (id: string) => {
    const t = sortedTasks.find((x) => x.id === id);
    if (!t) return;
    setEditingId(id);
    setEditTitle(t.title);
    setEditStartTime(toTimeInputValue(t.startMin));
    setEditEndTime(toTimeInputValue(t.endMin));
    setEditFormError(null);
    setShowCreateForm(false);
  };

  const handleSubmitEdit = (e: FormEvent) => {
    e.preventDefault();
    setEditFormError(null);
    if (!editingId) return;
    const title = editTitle.trim();
    if (!title) return;
    const t = sortedTasks.find((x) => x.id === editingId);
    if (!t) return;

    const startMin = minutesFromTimeInput(editStartTime);
    if (startMin === null) {
      setEditFormError("Elige una hora de inicio válida.");
      return;
    }
    let endMin = minutesFromTimeInput(editEndTime);
    if (endMin === null) endMin = t.endMin;
    if (endMin <= startMin) {
      setEditFormError("La hora de fin debe ser después de la hora de inicio.");
      return;
    }

    updateTask.mutate(
      {
        id: editingId,
        patch: { title, start_min: startMin, end_min: endMin },
      },
      {
        onSuccess: () => {
          showToast("¡Tarea actualizada!");
        },
      },
    );
    setEditingId(null);
  };

  const handleDeleteEdit = () => {
    if (!editingId) return;
    const t = sortedTasks.find((x) => x.id === editingId);
    setDeleteIntent({
      id: editingId,
      title: t?.title?.trim() || "esta tarea",
    });
  };

  const runDeleteTask = (id: string) => {
    removeTask.mutate(id, {
      onSuccess: () => {
        showToast("Tarea eliminada");
        setEditingId((prev) => (prev === id ? null : prev));
        setEditFormError(null);
        setDeleteIntent(null);
      },
    });
  };

  return (
    <DashboardCard
      className={cn(
        "dashboard-day-card flex h-full min-h-0 flex-col bg-bloomora-white p-5 max-[599px]:p-5 min-[600px]:p-7",
        className,
      )}
    >
      <BloomoraConfirmDialog
        open={blockEndPrompt != null}
        title="Bloque terminado ✨"
        description={
          blockEndPrompt
            ? `«${blockEndPrompt.title}» llegó a su hora de fin (${formatMinutes12h(blockEndPrompt.endMin)}). ¿Quieres marcar la tarea como completada?`
            : undefined
        }
        cancelLabel="No, gracias"
        confirmLabel="Sí, completar"
        tone="default"
        isPending={toggle.isPending}
        onCancel={dismissBlockEndPrompt}
        onConfirm={() => {
          if (!blockEndPrompt) return;
          const id = blockEndPrompt.taskId;
          toggle.mutate(
            { id, completed: true },
            {
              onSuccess: () => {
                showToast("¡Tarea marcada como hecha!");
                dismissBlockEndPrompt();
              },
              onError: (err) => {
                showToast(
                  err instanceof Error
                    ? err.message
                    : "No se pudo actualizar la tarea.",
                );
              },
            },
          );
        }}
      />
      <BloomoraConfirmDialog
        open={duplicateConfirmOpen}
        title="¿Duplicar este día al siguiente?"
        description={`Se copiarán ${sortedTasks.length} tarea${sortedTasks.length === 1 ? "" : "s"} de «${headerLabel}» a «${targetDayLabel}». Lo que ya exista en el día siguiente se eliminará y las copias quedarán sin marcar como hechas.`}
        cancelLabel="Cancelar"
        confirmLabel="Sí, duplicar"
        isPending={duplicateDay.isPending}
        onCancel={() => setDuplicateConfirmOpen(false)}
        onConfirm={() => {
          duplicateDay.mutate(
            { sourceDate: dayKey, targetDate: targetDayKey },
            {
              onSuccess: (result) => {
                showToast(
                  result.copiedCount > 0
                    ? `¡${result.copiedCount} tarea${result.copiedCount === 1 ? "" : "s"} copiada${result.copiedCount === 1 ? "" : "s"} al día siguiente!`
                    : "No había tareas que copiar en este día.",
                );
                setDuplicateConfirmOpen(false);
              },
              onError: (err) => {
                showToast(
                  err instanceof Error
                    ? err.message
                    : "No se pudo duplicar el día.",
                );
              },
            },
          );
        }}
      />
      <BloomoraConfirmDialog
        open={deleteIntent != null}
        title="¿Eliminar esta tarea?"
        description={
          deleteIntent
            ? `“${deleteIntent.title}” se quitará del día. Esta acción no se puede deshacer.`
            : undefined
        }
        cancelLabel="Cancelar"
        confirmLabel="Eliminar"
        tone="danger"
        isPending={removeTask.isPending}
        onCancel={() => setDeleteIntent(null)}
        onConfirm={() => {
          if (!deleteIntent) return;
          runDeleteTask(deleteIntent.id);
        }}
      />
      <div className="mb-5 flex shrink-0 flex-wrap items-start justify-between gap-3 sm:mb-6">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-bloomora-deep min-[1024px]:text-[1.375rem]">
            Tareas del día
          </h2>
          <p className="mt-0.5 text-[0.9375rem] text-bloomora-violet">
            Marca lo que completes ·{" "}
            <span className="font-semibold text-bloomora-deep">
              {completedCount} de {total}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-pill bg-[color:var(--bloomora-accent-bg)] px-[1.125rem] text-[0.9375rem] font-bold text-[color:var(--bloomora-accent-on)] shadow-[0_4px_12px_rgba(232,155,184,0.35)] transition hover:brightness-105"
        >
          + Tarea
        </button>
      </div>

      <div className="mb-5 flex shrink-0 flex-col items-stretch gap-2 sm:mb-6">
        <div className="flex items-center justify-between gap-2 rounded-pill bg-bloomora-mist p-1.5">
          <button
            type="button"
            aria-label="Día anterior"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-bloomora-white text-lg text-bloomora-violet transition hover:bg-[color:var(--bloomora-surface-3)]"
            onClick={() => shiftDay(-1)}
          >
            ‹
          </button>
          <span className="min-w-0 flex-1 truncate px-2 text-center text-base font-bold text-bloomora-deep">
            {headerLabel}
          </span>
          <button
            type="button"
            aria-label="Día siguiente"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-bloomora-white text-lg text-bloomora-violet transition hover:bg-[color:var(--bloomora-surface-3)]"
            onClick={() => shiftDay(1)}
          >
            ›
          </button>
        </div>
        {sortedTasks.length > 0 ? (
          <button
            type="button"
            disabled={isLoading || duplicateDay.isPending}
            onClick={() => setDuplicateConfirmOpen(true)}
            className="self-center rounded-pill px-3 py-1.5 text-xs font-semibold text-bloomora-violet ring-1 ring-[color:var(--bloomora-border)] transition hover:bg-[color:var(--bloomora-surface-3)] disabled:opacity-50"
          >
            Duplicar al día siguiente
          </button>
        ) : null}
      </div>

      {isViewingToday ? (
        <div className="mb-4 shrink-0 space-y-2 text-center sm:mb-5 lg:mb-3">
          <p className="text-[0.7rem] font-semibold tabular-nums tracking-wide text-bloomora-deep sm:text-sm">
            {deviceTimeLabel}
          </p>
          {!agendaBlockNotifyOn && profile != null ? (
            <p className="text-[0.65rem] text-bloomora-text-muted sm:text-xs">
              Avisos de fin de bloque desactivados en{" "}
              <Link
                to="/app/profile"
                className="font-semibold text-bloomora-violet underline-offset-2 hover:underline"
              >
                tu perfil
              </Link>
              .
            </p>
          ) : null}
          {agendaBlockNotifyOn &&
          typeof Notification !== "undefined" &&
          Notification.permission === "default" ? (
            <button
              type="button"
              className="text-[0.65rem] font-semibold text-bloomora-violet underline-offset-2 hover:underline sm:text-xs"
              onClick={() => void Notification.requestPermission()}
            >
              Activar notificaciones del navegador para avisos al terminar un
              bloque
            </button>
          ) : null}
        </div>
      ) : null}

      {isError ? (
        <div className="shrink-0 space-y-1 text-center text-sm text-red-600">
          <p>No se pudieron cargar las tareas.</p>
          <p className="text-xs font-normal text-bloomora-text-muted">
            Comprueba en Supabase{" "}
            <code className="rounded bg-[color:var(--bloomora-surface-2)] px-1 text-bloomora-deep">
              daily_plans
            </code>
            ,{" "}
            <code className="rounded bg-[color:var(--bloomora-surface-2)] px-1 text-bloomora-deep">
              tasks
            </code>
            ,{" "}
            <code className="rounded bg-[color:var(--bloomora-surface-2)] px-1 text-bloomora-deep">
              task_blocks
            </code>
            ,{" "}
            <code className="rounded bg-[color:var(--bloomora-surface-2)] px-1 text-bloomora-deep">
              subtasks
            </code>{" "}
            y sus permisos RLS. Comprueba que esté aplicada la migración{" "}
            <code className="rounded bg-[color:var(--bloomora-surface-2)] px-1 text-bloomora-deep">
              20260417_bloomora_simple_mode_rls_anon_core.sql
            </code>
            . Detalle de Supabase: {messageFromSupabaseError(agendaError)}
          </p>
        </div>
      ) : null}

      <div className="agenda-task-scroll flex min-h-0 min-w-0 flex-1 flex-col">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-bloomora-text-muted">
            Cargando…
          </p>
        ) : null}

        {!isLoading && sortedTasks.length === 0 && !showCreateForm ? (
          <EmptyDayState
            onAddTask={openCreateForm}
            onDuplicate={() => setDuplicateConfirmOpen(true)}
            duplicateDisabled={isLoading || duplicateDay.isPending}
          />
        ) : null}

        {!isLoading && sortedTasks.length > 0 ? (
          <div className="min-h-0 overflow-hidden rounded-xl ring-1 ring-[color:var(--bloomora-border)]">
            <ul className="divide-y divide-bloomora-line/30">
              {sortedTasks.map((task) => (
                <li key={task.id} className="flex flex-col">
                  <AgendaTaskRow
                    title={task.title}
                    startLabel={formatMinutes12h(task.startMin)}
                    endLabel={formatMinutes12h(task.endMin)}
                    completed={task.completed}
                    onToggle={() =>
                      toggle.mutate({
                        id: task.id,
                        completed: !task.completed,
                      })
                    }
                    onEdit={() => openEdit(task.id)}
                    onDelete={() =>
                      setDeleteIntent({
                        id: task.id,
                        title: task.title.trim() || "esta tarea",
                      })
                    }
                    onOpenBlockCountdown={() =>
                      openBlockCountdown({
                        title: task.title.trim() || "Tarea",
                        totalSeconds: blockDurationSeconds(
                          task.startMin,
                          task.endMin,
                        ),
                      })
                    }
                  />
                  {editingId === task.id ? (
                    <form
                      onSubmit={handleSubmitEdit}
                      className="mx-2 mb-3 space-y-3 rounded-[18px] border-2 border-bloomora-sky-deep/55 bg-bloomora-sky/40 p-4 shadow-[0_6px_20px_rgba(155,207,233,0.18)]"
                    >
                      <p className="text-xs font-semibold text-bloomora-deep">
                        Editar tarea
                      </p>
                      <label className="block text-xs font-medium text-bloomora-text-muted">
                        Título
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-bloomora-sky-deep/35 bg-bloomora-white px-3 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-sky/40 focus:ring-2"
                          autoFocus
                        />
                      </label>
                      <label className="block text-xs font-medium text-bloomora-text-muted">
                        Hora de inicio
                        <input
                          type="time"
                          step={300}
                          value={editStartTime}
                          onChange={(e) => setEditStartTime(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-bloomora-sky-deep/35 bg-bloomora-white px-3 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-sky/40 focus:ring-2"
                        />
                      </label>
                      <label className="block text-xs font-medium text-bloomora-text-muted">
                        Hora de fin
                        <input
                          type="time"
                          step={300}
                          value={editEndTime}
                          onChange={(e) => setEditEndTime(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-bloomora-sky-deep/35 bg-bloomora-white px-3 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-sky/40 focus:ring-2"
                        />
                      </label>
                      {editFormError ? (
                        <p
                          className="text-sm font-medium text-red-600"
                          role="alert"
                        >
                          {editFormError}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!editTitle.trim() || updateTask.isPending}
                          >
                            Guardar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(null);
                              setEditFormError(null);
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-red-200/90 text-red-600 shadow-none hover:bg-red-50/90 hover:text-red-700"
                          disabled={
                            removeTask.isPending || updateTask.isPending
                          }
                          onClick={handleDeleteEdit}
                          aria-label="Eliminar tarea"
                        >
                          <AgendaTrashIcon className="size-[1.125rem] shrink-0" />
                          Eliminar
                        </Button>
                      </div>
                    </form>
                  ) : null}
                  <AgendaTaskSubsteps
                    taskId={task.id}
                    subtasks={task.subtasks}
                    isAdding={
                      addSubtask.isPending &&
                      addSubtask.variables?.taskId === task.id
                    }
                    isTogglingSubtaskId={
                      toggleSubtask.isPending
                        ? (toggleSubtask.variables?.subtaskId ?? null)
                        : null
                    }
                    isRemovingSubtaskId={
                      removeSubtask.isPending
                        ? (removeSubtask.variables?.subtaskId ?? null)
                        : null
                    }
                    isRenamingSubtaskId={
                      renameSubtask.isPending
                        ? (renameSubtask.variables?.subtaskId ?? null)
                        : null
                    }
                    onAdd={(title) =>
                      addSubtask.mutate(
                        { taskId: task.id, title },
                        {
                          onSuccess: () => showToast("Paso añadido"),
                          onError: (err) =>
                            showToast(
                              err instanceof Error
                                ? err.message
                                : "No se pudo añadir el paso.",
                            ),
                        },
                      )
                    }
                    onToggle={(subtaskId, completed) =>
                      toggleSubtask.mutate({ subtaskId, completed })
                    }
                    onRemove={(subtaskId) =>
                      removeSubtask.mutate(
                        { subtaskId },
                        {
                          onSuccess: () => showToast("Paso quitado"),
                          onError: (err) =>
                            showToast(
                              err instanceof Error
                                ? err.message
                                : "No se pudo quitar el paso.",
                            ),
                        },
                      )
                    }
                    onRename={async (subtaskId, title) => {
                      try {
                        await renameSubtask.mutateAsync({ subtaskId, title });
                        showToast("Paso actualizado");
                      } catch (err) {
                        showToast(
                          err instanceof Error
                            ? err.message
                            : "No se pudo guardar el paso.",
                        );
                        throw err;
                      }
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {showCreateForm ? (
          <form
            onSubmit={handleSubmitCreate}
            className="mt-5 space-y-3 rounded-[18px] bg-bloomora-white/85 p-4 shadow-[0_6px_20px_rgba(91,74,140,0.06)] ring-1 ring-[color:var(--bloomora-border)]"
          >
            <p className="text-xs font-semibold text-bloomora-deep">
              {sortedTasks.length > 0 ? (
                <>
                  Nueva tarea · ajusta{" "}
                  <span className="text-bloomora-violet">inicio</span> y{" "}
                  <span className="text-bloomora-violet">fin</span> (por defecto
                  continúa después de la última).
                </>
              ) : (
                <>
                  Nueva tarea · elige a qué hora empiezas (por ejemplo 7:00 si
                  te levantas a esa hora) y cuándo termina.
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCreateMode("normal")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                  createMode === "normal"
                    ? "bg-[color:var(--bloomora-accent-bg)] text-[color:var(--bloomora-accent-on)] ring-bloomora-violet"
                    : "bg-[color:var(--bloomora-surface-2)] text-bloomora-violet ring-[color:var(--bloomora-border)] hover:bg-[color:var(--bloomora-surface-3)]"
                }`}
              >
                Entrada normal
              </button>
              <button
                type="button"
                onClick={() => setCreateMode("goal")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                  createMode === "goal"
                    ? "bg-[color:var(--bloomora-accent-bg)] text-[color:var(--bloomora-accent-on)] ring-bloomora-violet"
                    : "bg-[color:var(--bloomora-surface-2)] text-bloomora-violet ring-[color:var(--bloomora-border)] hover:bg-[color:var(--bloomora-surface-3)]"
                }`}
              >
                Desde metas
              </button>
            </div>
            {createMode === "goal" ? (
              <label className="block text-xs font-medium text-bloomora-text-muted">
                Meta vinculada
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[color:var(--bloomora-border)] bg-bloomora-white px-3 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/30 focus:ring-2"
                >
                  {orderedGoalOptions.length === 0 ? (
                    <option value="">No hay metas creadas</option>
                  ) : null}
                  {orderedGoalOptions.map((g) => (
                    <option key={g.id} value={g.id}>
                      {templateIds.includes(g.id) ? "⭐ " : ""}
                      {g.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="block text-xs font-medium text-bloomora-text-muted">
              Título
              <input
                onChange={(e) => setDraftTitle(e.target.value)}
                value={
                  createMode === "goal"
                    ? (selectedGoal?.title ?? "")
                    : draftTitle
                }
                className="mt-1.5 w-full rounded-xl border border-[color:var(--bloomora-border)] bg-bloomora-white px-3 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/30 focus:ring-2"
                placeholder="Ej. Caminar 20 minutos"
                disabled={createMode === "goal"}
                autoFocus
              />
            </label>
            <label className="block text-xs font-medium text-bloomora-text-muted">
              Hora de inicio
              <input
                type="time"
                step={300}
                value={draftStartTime}
                onChange={(e) => setDraftStartTime(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[color:var(--bloomora-border)] bg-bloomora-white px-3 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/30 focus:ring-2"
              />
            </label>
            <label className="block text-xs font-medium text-bloomora-text-muted">
              Hora de fin
              <input
                type="time"
                step={300}
                value={draftEndTime}
                onChange={(e) => setDraftEndTime(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[color:var(--bloomora-border)] bg-bloomora-white px-3 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/30 focus:ring-2"
              />
            </label>
            {createFormError ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {createFormError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={
                  addTask.isPending ||
                  (createMode === "normal" && !draftTitle.trim()) ||
                  (createMode === "goal" && !selectedGoalId)
                }
              >
                Guardar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateFormError(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : null}
      </div>

      {total > 0 ? (
        <div className="mt-5 shrink-0 sm:mt-6">
          <ProgressBar
            value={progressPct}
            label={`${completedCount} de ${total} completadas`}
          />
        </div>
      ) : null}

    </DashboardCard>
  );
}
