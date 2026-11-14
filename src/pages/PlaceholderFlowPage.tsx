import { useLocation } from 'react-router-dom'
import { BackButton } from '@/components/navigation/BackButton'
import { Card } from '@/components/ui/Card'

const titles: Record<string, string> = {
  '/app/tasks/new': 'Nueva tarea',
  '/app/agenda': 'Toda la agenda',
  '/app/shopping': 'Lista de compras',
}

export function PlaceholderFlowPage() {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Bloomora'

  return (
    <div className="app-shell-padding app-content-fluid mx-auto flex min-h-dvh flex-col gap-6 bg-bloomora-snow">
      <header className="flex items-center gap-3">
        <BackButton parentTo="/app" parentLabel="Hoy" />
        <h1 className="app-fluid-title font-bold text-bloomora-deep">{title}</h1>
      </header>
      <Card className="app-principal-card">
        <p className="text-sm text-bloomora-text-muted">
          Pantalla en construccion.
        </p>
      </Card>
    </div>
  )
}
