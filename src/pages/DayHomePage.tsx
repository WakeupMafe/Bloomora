import { AgendaCard } from "@/features/dashboard/AgendaCard";
import { DashboardGreeting } from "@/features/dashboard/DashboardGreeting";
import { GoalProgressCard } from "@/features/dashboard/GoalProgressCard";
import { ListsCard } from "@/features/dashboard/ListsCard";
import { AdditionalToolsPanel } from "@/features/dashboard/AdditionalToolsPanel";
import { useUserPhone } from "@/contexts/UserPhoneContext";
import { useAutoPurgePreviousAgendaMonth } from "@/hooks/useAgendaDayOperations";

/**
 * Inicio: saludo + grid 2 cols (PC) / 1 col (tablet-móvil).
 */
export function DayHomePage() {
  const { cedula } = useUserPhone();
  useAutoPurgePreviousAgendaMonth(cedula);

  return (
    <main className="app-shell-padding--dashboard mx-auto w-full max-w-[1184px]">
      <DashboardGreeting />

      <div className="grid min-w-0 grid-cols-1 gap-4 min-[600px]:gap-6 min-[1024px]:grid-cols-2 min-[1024px]:gap-6">
        <AgendaCard className="h-full min-h-0 min-w-0 w-full" />
        <GoalProgressCard className="h-full min-h-0 min-w-0 w-full max-w-full" />
        <ListsCard />
        <AdditionalToolsPanel className="h-full self-stretch" />
      </div>
    </main>
  );
}
