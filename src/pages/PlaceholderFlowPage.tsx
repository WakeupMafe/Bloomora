import { useLocation } from 'react-router-dom'
import { BloomoraLogo } from '@/components/brand/BloomoraLogo'
import { BackButton } from '@/components/navigation/BackButton'
import { Card } from '@/components/ui/Card'

const titles: Record<string, string> = {
  '/app/tasks/new': 'Nueva tarea',
  '/app/goals/new': 'Nueva meta',
  '/app/agenda': 'Toda la agenda',
  '/app/shopping': 'Lista de compras',
  '/app/lists': 'Tus listas',
  '/app/lists/new': 'Nueva lista',
}

export function PlaceholderFlowPage() {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Bloomora'

  return (
    <div className="app-shell-padding app-content-fluid mx-auto flex min-h-dvh flex-col gap-6 bg-bloomora-snow">
      <header className="flex items-center justify-between">
        <BloomoraLogo size="sm" />
        <BackButton to="/app" label="Volver al inicio" />
      </header>
      <Card className="app-principal-card">
        <h1 className="app-fluid-title font-bold text-bloomora-deep">{title}</h1>
        <p className="mt-2 text-sm text-bloomora-text-muted">
          Pantalla en construcción. Aquí irá el formulario y la lógica con
          Supabase.
        </p>
      </Card>
    </div>
  )
}
