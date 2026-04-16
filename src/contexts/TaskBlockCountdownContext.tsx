import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TaskBlockCountdownModal } from "@/features/dashboard/TaskBlockCountdownModal";

export type TaskBlockCountdownPayload = {
  title: string;
  totalSeconds: number;
};

type TaskBlockCountdownContextValue = {
  openBlockCountdown: (payload: TaskBlockCountdownPayload) => void;
  closeBlockCountdown: () => void;
};

const TaskBlockCountdownContext =
  createContext<TaskBlockCountdownContextValue | null>(null);

export function TaskBlockCountdownProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<TaskBlockCountdownPayload | null>(null);

  const openBlockCountdown = useCallback((payload: TaskBlockCountdownPayload) => {
    setActive(payload);
  }, []);

  const closeBlockCountdown = useCallback(() => {
    setActive(null);
  }, []);

  const value = useMemo(
    () => ({ openBlockCountdown, closeBlockCountdown }),
    [openBlockCountdown, closeBlockCountdown],
  );

  return (
    <TaskBlockCountdownContext.Provider value={value}>
      {children}
      <TaskBlockCountdownModal
        open={active != null}
        taskTitle={active?.title ?? ""}
        totalSeconds={active?.totalSeconds ?? 0}
        onClose={closeBlockCountdown}
      />
    </TaskBlockCountdownContext.Provider>
  );
}

export function useTaskBlockCountdown(): TaskBlockCountdownContextValue {
  const ctx = useContext(TaskBlockCountdownContext);
  if (!ctx) {
    throw new Error(
      "useTaskBlockCountdown must be used within TaskBlockCountdownProvider",
    );
  }
  return ctx;
}
