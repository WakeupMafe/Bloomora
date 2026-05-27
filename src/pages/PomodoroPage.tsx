import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BackButton } from '@/components/navigation/BackButton'
import { PomodoroTimer } from '@/features/pomodoro/PomodoroTimer'
import { registerPomodoroAlarmUnlock } from '@/utils/pomodoroAlarmSound'

export function PomodoroPage() {
  useEffect(() => {
    registerPomodoroAlarmUnlock()
  }, [])

  return (
    <div className="app-shell-padding app-content-fluid mx-auto min-h-dvh bg-[#f8f6fc] pb-16">
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackButton to="/app" label="Volver al inicio" />
        <Link
          to="/app"
          className="text-xs font-semibold text-bloomora-violet hover:text-bloomora-deep sm:text-sm"
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

      <div className="mx-auto mt-10 max-w-lg rounded-[1.75rem] bg-white/90 p-6 shadow-[0_12px_40px_-12px_rgba(91,74,140,0.2)] ring-1 ring-bloomora-line/25 sm:p-8">
        <PomodoroTimer />
      </div>
    </div>
  )
}
