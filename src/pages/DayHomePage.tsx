import { AgendaCard } from "@/features/dashboard/AgendaCard";
import { DashboardAppHeader } from "@/features/dashboard/DashboardAppHeader";
import { GoalProgressCard } from "@/features/dashboard/GoalProgressCard";
import { ListsCard } from "@/features/dashboard/ListsCard";
import { AdditionalToolsPanel } from "@/features/dashboard/AdditionalToolsPanel";
import { useUserPhone } from "@/contexts/UserPhoneContext";
import { useAutoPurgePreviousAgendaMonth } from "@/hooks/useAgendaDayOperations";

/**
 * Inicio: fila 1 tareas + metas; fila 2 listas y accesos rápidos a herramientas.
 */
export function DayHomePage() {
  const { cedula } = useUserPhone();
  useAutoPurgePreviousAgendaMonth(cedula);

  return (
    <div className="min-h-dvh bg-bloomora-snow">
      <main className="app-shell-padding--dashboard mx-auto w-full max-w-[1200px]">
        <DashboardAppHeader />

        <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 sm:mt-8 lg:mt-10 lg:grid-cols-2 lg:items-stretch lg:gap-8">
          <AgendaCard className="h-full min-h-0 min-w-0 w-full max-h-[600px] lg:max-h-[550px]" />
          <GoalProgressCard className="h-full min-h-0 min-w-0 w-full max-w-full max-h-[600px] lg:max-h-[550px]" />
        </div>

        <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 sm:mt-8 lg:mt-10 lg:grid-cols-[minmax(0,1.8fr)_minmax(16rem,0.9fr)] lg:items-stretch lg:gap-6 xl:gap-8">
          <ListsCard />
          <AdditionalToolsPanel className="h-full self-stretch" />
        </div>
      </main>
    </div>
  );
}
