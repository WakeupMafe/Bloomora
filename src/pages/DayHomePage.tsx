import { AgendaCard } from '@/features/dashboard/AgendaCard'
import { DashboardAppHeader } from '@/features/dashboard/DashboardAppHeader'
import { GoalProgressCard } from '@/features/dashboard/GoalProgressCard'
import { ListsCard } from '@/features/dashboard/ListsCard'

/**
 * Inicio autenticado: tareas + metas (fila 1) y listas (fila 2, ancho completo).
 */
export function DayHomePage() {
  return (
    <div className="relative isolate min-h-dvh">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-bloomora-blush/35 via-bloomora-snow to-bloomora-mist/90" />
        <div className="absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-bloomora-lavender-50/35 blur-3xl" />
        <div className="absolute -left-20 bottom-1/3 h-64 w-64 rounded-full bg-bloomora-rose/12 blur-3xl" />
      </div>

      <main className="app-shell-padding--dashboard mx-auto w-full max-w-[1200px]">
        <DashboardAppHeader />

        <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 sm:mt-8 lg:mt-10 lg:grid-cols-2 lg:items-start lg:gap-8">
          <AgendaCard className="min-h-0 min-w-0 w-full" />
          <GoalProgressCard className="min-h-0 min-w-0 w-full max-w-full" />
        </div>

        <div className="mt-6 min-w-0 sm:mt-8 lg:mt-10">
          <ListsCard />
        </div>
      </main>
    </div>
  )
}
