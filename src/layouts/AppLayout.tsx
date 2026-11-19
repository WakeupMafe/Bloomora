import { Outlet } from 'react-router-dom'
import { ListGadgetsProvider } from '@/contexts/ListGadgetsContext'
import { TaskBlockCountdownProvider } from '@/contexts/TaskBlockCountdownContext'
import { WorkspaceToolsProvider } from '@/contexts/WorkspaceToolsContext'
import { AgendaStartSoonHost } from '@/features/dashboard/AgendaStartSoonHost'
import { InstallBloomoraPrompt } from '@/features/pwa/InstallBloomoraPrompt'
import { DashboardShellNav } from '@/features/dashboard/DashboardShellNav'
import { ListGadgetsHost } from '@/features/lists/ListGadgetsHost'
import { WorkspaceToolsHost } from '@/features/workspace/WorkspaceToolsHost'
import { RequirePhone } from '@/layouts/RequirePhone'

/**
 * Shell for app routes con identificación por celular (sin Supabase Auth).
 * Nav/tabs compartidos en todo `/app`.
 */
export function AppLayout() {
  return (
    <div className="min-h-dvh bg-bloomora-snow">
      <TaskBlockCountdownProvider>
        <WorkspaceToolsProvider>
          <ListGadgetsProvider>
            <RequirePhone>
              <DashboardShellNav />
              <div className="app-shell-content">
                <Outlet />
              </div>
              <WorkspaceToolsHost />
              <ListGadgetsHost />
              <AgendaStartSoonHost />
              <InstallBloomoraPrompt />
            </RequirePhone>
          </ListGadgetsProvider>
        </WorkspaceToolsProvider>
      </TaskBlockCountdownProvider>
    </div>
  )
}
