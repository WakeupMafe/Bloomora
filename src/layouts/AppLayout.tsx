import { Outlet } from 'react-router-dom'
import { TaskBlockCountdownProvider } from '@/contexts/TaskBlockCountdownContext'
import { WorkspaceToolsProvider } from '@/contexts/WorkspaceToolsContext'
import { WorkspaceToolsHost } from '@/features/workspace/WorkspaceToolsHost'
import { RequirePhone } from '@/layouts/RequirePhone'

/**
 * Shell for app routes con identificación por celular (sin Supabase Auth).
 */
export function AppLayout() {
  return (
    <div className="min-h-dvh bg-bloomora-snow">
      <TaskBlockCountdownProvider>
        <WorkspaceToolsProvider>
          <RequirePhone>
            <Outlet />
            <WorkspaceToolsHost />
          </RequirePhone>
        </WorkspaceToolsProvider>
      </TaskBlockCountdownProvider>
    </div>
  )
}
