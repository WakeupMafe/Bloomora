import { useEffect } from 'react'
import { BackButton } from '@/components/navigation/BackButton'
import { Card } from '@/components/ui/Card'
import { bloomoraPanelCardClass } from '@/components/ui/formControls'
import { PomodoroTimer, PomodoroTimerView } from '@/features/pomodoro/PomodoroTimer'
import type { PomodoroTimerController } from '@/hooks/usePomodoroTimer'
import { registerPomodoroAlarmUnlock } from '@/utils/pomodoroAlarmSound'
import { cn } from '@/utils/cn'

export function PomodoroPage({
  embedded = false,
  controller,
}: {
  embedded?: boolean
  controller?: PomodoroTimerController
}) {
  useEffect(() => {
    registerPomodoroAlarmUnlock()
  }, [])

  return (
    <div className={cn(
      'app-shell-padding app-content-fluid mx-auto bg-bloomora-snow',
      embedded ? 'flex h-full min-h-0 flex-col overflow-hidden px-3 py-3 sm:px-5 sm:py-4' : 'min-h-dvh pb-16',
    )}>
      {!embedded ? (
        <div className="mb-6 flex items-center gap-3">
          <BackButton parentTo="/app/study-tools" parentLabel="Herramientas" />
          <h1 className="font-bold tracking-tight text-bloomora-deep text-[clamp(1.35rem,1.1rem+1vw,1.75rem)]">
            Pomodoro
          </h1>
        </div>
      ) : null}

      <header className={cn('text-center', embedded && 'shrink-0', !embedded && 'sr-only')}>
        <h1 className={cn('font-bold tracking-tight text-bloomora-deep', embedded ? 'text-xl sm:text-2xl' : 'text-[clamp(1.75rem,1.4rem+1.5vw,2.35rem)]')}>
          Pomodoro para estudiar
        </h1>
        <p className={cn('mx-auto mt-2 max-w-md text-sm leading-relaxed text-bloomora-text-muted', embedded && 'hidden sm:block sm:mt-1 sm:text-xs')}>
          Bloques de enfoque con descansos. Al terminar suena tu alarma incluso
          si cambias de pestaña.
        </p>
      </header>

      <Card
        variant="glass"
        className={cn(bloomoraPanelCardClass, 'mx-auto max-w-lg', embedded ? 'my-auto min-h-0 w-full p-3 sm:p-4' : 'mt-10 p-6 sm:p-8')}
      >
          {controller ? <PomodoroTimerView controller={controller} compact={embedded} /> : <PomodoroTimer compact={embedded} />}
      </Card>
    </div>
  )
}
