import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BackButton } from '@/components/navigation/BackButton'
import { Card } from '@/components/ui/Card'
import { buttonClassName } from '@/components/ui/buttonRecipe'
import { bloomoraPanelCardClass } from '@/components/ui/formControls'
import { PomodoroTimer } from '@/features/pomodoro/PomodoroTimer'
import { registerPomodoroAlarmUnlock } from '@/utils/pomodoroAlarmSound'
import { cn } from '@/utils/cn'

export function PomodoroPage() {
  useEffect(() => {
    registerPomodoroAlarmUnlock()
  }, [])

  return (
    <div className="app-shell-padding app-content-fluid mx-auto min-h-dvh bg-bloomora-snow pb-16">
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackButton to="/app" label="Volver al inicio" />
        <Link
          to="/app"
          className={buttonClassName({ variant: 'ghost', size: 'sm' })}
        >
          Inicio
        </Link>
      </div>

      <header className="text-center">
        <h1 className="text-[clamp(1.75rem,1.4rem+1.5vw,2.35rem)] font-bold tracking-tight text-bloomora-deep">
          Pomodoro para estudiar
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-bloomora-text-muted">
          Bloques de enfoque con descansos. Al terminar suena tu alarma incluso
          si cambias de pestaña.
        </p>
      </header>

      <Card
        variant="glass"
        className={cn(bloomoraPanelCardClass, 'mx-auto mt-10 max-w-lg p-6 sm:p-8')}
      >
        <PomodoroTimer />
      </Card>
    </div>
  )
}
