import { Outlet } from 'react-router-dom'
import { RequirePhone } from '@/layouts/RequirePhone'

/**
 * Shell for app routes con identificación por celular (sin Supabase Auth).
 */
export function AppLayout() {
  return (
    <div className="min-h-dvh bg-bloomora-snow">
      <RequirePhone>
        <Outlet />
      </RequirePhone>
    </div>
  )
}
