import { Link } from 'react-router-dom'
import { BackButton } from '@/components/navigation/BackButton'
import { buttonClassName } from '@/components/ui/buttonRecipe'
import { StudyToolCard } from '@/features/study-tools/StudyToolCard'

function TomatoIcon() {
  return <span className="text-xl">🍅</span>
}

function NotesIcon() {
  return <span className="text-xl">📝</span>
}

export function StudyToolsPage() {
  return (
    <div className="app-shell-padding app-content-fluid mx-auto min-h-dvh bg-bloomora-snow pb-16">
      <div className="mb-6 flex items-center justify-between">
        <BackButton to="/app" label="Volver al inicio" />
        <Link
          to="/app"
          className={buttonClassName({ variant: 'ghost', size: 'sm' })}
        >
          Inicio
        </Link>
      </div>
      <header className="mb-6">
        <h1 className="text-[clamp(1.4rem,1.1rem+1.2vw,2rem)] font-bold text-bloomora-deep">
          Herramientas de estudio
        </h1>
        <p className="mt-1 text-sm text-bloomora-text-muted">
          Elige la herramienta que necesitas hoy.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <StudyToolCard
          title="Pomodoro"
          description="Temporizador con alarma para enfoque y descansos."
          to="/app/pomodoro"
          icon={<TomatoIcon />}
        />
        <StudyToolCard
          title="Apuntes de ingles"
          description="Editor visual en formato A4, listo para imprimir."
          to="/app/english-notes"
          icon={<NotesIcon />}
        />
      </div>
    </div>
  )
}

