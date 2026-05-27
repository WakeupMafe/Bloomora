import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { bloomoraInputClass } from '@/components/ui/formControls'
import {
  phaseDurationMs,
  phaseEmoji,
  phaseLabel,
  type PomodoroPhase,
} from '@/features/pomodoro/pomodoroSettings'
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer'
import { requestPomodoroNotificationPermission } from '@/utils/pomodoroAlarmSound'
import { cn } from '@/utils/cn'

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const PHASES: PomodoroPhase[] = ['focus', 'shortBreak', 'longBreak']

type PomodoroTimerProps = {
  className?: string
  compact?: boolean
}

export function PomodoroTimer({ className, compact }: PomodoroTimerProps) {
  const {
    phase,
    status,
    remainingMs,
    progress,
    settings,
    completedFocusSessions,
    updateSettings,
    start,
    pause,
    reset,
    stopAlarm,
    selectPhase,
    skipToNext,
  } = usePomodoroTimer()

  const [showSettings, setShowSettings] = useState(false)

  const timeLabel = useMemo(() => formatTime(remainingMs), [remainingMs])
  const ringSize = compact ? 200 : 260
  const stroke = compact ? 10 : 12
  const radius = (ringSize - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  const isRunning = status === 'running'
  const isAlarm = status === 'alarm'
  const canChangePhase = status === 'idle' || status === 'paused'

  return (
    <div
      className={cn(
        'flex flex-col items-center',
        isAlarm && 'animate-[pulse_1.2s_ease-in-out_infinite]',
        className,
      )}
    >
      <div className="flex flex-wrap justify-center gap-2">
        {PHASES.map((p) => (
          <Button
            key={p}
            type="button"
            variant={phase === p ? 'primary' : 'outline'}
            size="sm"
            disabled={!canChangePhase}
            onClick={() => selectPhase(p)}
            className={cn(!canChangePhase && 'opacity-50')}
          >
            {phaseEmoji(p)} {phaseLabel(p)}
          </Button>
        ))}
      </div>

      <div
        className="relative mt-6 flex items-center justify-center"
        style={{ width: ringSize, height: ringSize }}
      >
        <svg
          width={ringSize}
          height={ringSize}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-bloomora-line/35"
          />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={cn(
              'transition-[stroke-dashoffset] duration-300',
              isAlarm
                ? 'text-rose-500'
                : phase === 'focus'
                  ? 'text-bloomora-violet'
                  : 'text-emerald-500',
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl" aria-hidden>
            {isAlarm ? '🔔' : phaseEmoji(phase)}
          </span>
          <p
            className={cn(
              'mt-1 font-mono text-4xl font-bold tabular-nums tracking-tight sm:text-5xl',
              isAlarm ? 'text-rose-600' : 'text-bloomora-deep',
            )}
          >
            {timeLabel}
          </p>
          <p className="mt-1 text-xs font-semibold text-bloomora-text-muted">
            {isAlarm
              ? '¡Tiempo!'
              : isRunning
                ? 'En curso…'
                : status === 'paused'
                  ? 'Pausado'
                  : phaseLabel(phase)}
          </p>
        </div>
      </div>

      {isAlarm ? (
        <div className="mt-6 w-full max-w-sm space-y-3 text-center">
          <p className="text-sm font-semibold text-rose-600">
            La alarma sigue sonando. Deténla para continuar.
          </p>
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            className="bg-gradient-to-r from-rose-500 to-orange-500 shadow-[0_12px_32px_-8px_rgba(244,63,94,0.45)]"
            onClick={stopAlarm}
          >
            Detener alarma
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {!isRunning ? (
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => void start()}
            >
              {status === 'paused' ? 'Reanudar' : 'Iniciar'}
            </Button>
          ) : (
            <Button type="button" variant="outline" size="lg" onClick={pause}>
              Pausar
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={reset}
            disabled={
              status === 'idle' &&
              remainingMs >= phaseDurationMs(phase, settings) - 500
            }
          >
            Reiniciar
          </Button>
          {(isRunning || status === 'paused') && (
            <Button type="button" variant="ghost" size="sm" onClick={skipToNext}>
              Saltar
            </Button>
          )}
        </div>
      )}

      <p className="mt-4 text-center text-xs text-bloomora-text-muted">
        Pomodoros completados:{' '}
        <span className="font-bold text-bloomora-violet">
          {completedFocusSessions}
        </span>
      </p>

      {!compact ? (
        <div className="mt-6 w-full max-w-md">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings((v) => !v)}
          >
            {showSettings ? 'Ocultar ajustes' : 'Ajustes del temporizador'}
          </Button>

          {showSettings ? (
            <Card variant="subtle" className="mt-3 space-y-3 rounded-2xl p-4">
              <div className="grid grid-cols-3 gap-3">
                <label className="block text-xs font-medium text-bloomora-text-muted">
                  Enfoque (min)
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={settings.focusMin}
                    disabled={!canChangePhase}
                    onChange={(e) =>
                      updateSettings({
                        focusMin: Number(e.target.value) || 25,
                      })
                    }
                    className={cn(bloomoraInputClass, 'mt-1 !min-h-10 rounded-xl px-2 py-2')}
                  />
                </label>
                <label className="block text-xs font-medium text-bloomora-text-muted">
                  Desc. corto
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={settings.shortBreakMin}
                    disabled={!canChangePhase}
                    onChange={(e) =>
                      updateSettings({
                        shortBreakMin: Number(e.target.value) || 5,
                      })
                    }
                    className={cn(bloomoraInputClass, 'mt-1 !min-h-10 rounded-xl px-2 py-2')}
                  />
                </label>
                <label className="block text-xs font-medium text-bloomora-text-muted">
                  Desc. largo
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={settings.longBreakMin}
                    disabled={!canChangePhase}
                    onChange={(e) =>
                      updateSettings({
                        longBreakMin: Number(e.target.value) || 15,
                      })
                    }
                    className={cn(bloomoraInputClass, 'mt-1 !min-h-10 rounded-xl px-2 py-2')}
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-bloomora-deep">
                <input
                  type="checkbox"
                  checked={settings.autoStartBreaks}
                  disabled={!canChangePhase}
                  onChange={(e) =>
                    updateSettings({ autoStartBreaks: e.target.checked })
                  }
                  className="size-4 rounded border-bloomora-line/60"
                />
                Iniciar descanso al terminar enfoque
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-bloomora-deep">
                <input
                  type="checkbox"
                  checked={settings.autoStartFocus}
                  disabled={!canChangePhase}
                  onChange={(e) =>
                    updateSettings({ autoStartFocus: e.target.checked })
                  }
                  className="size-4 rounded border-bloomora-line/60"
                />
                Iniciar enfoque al terminar descanso
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="!min-h-8 px-0"
                onClick={() => void requestPomodoroNotificationPermission()}
              >
                Activar notificaciones del navegador
              </Button>
              <p className="text-[0.65rem] leading-relaxed text-bloomora-text-muted">
                La alarma usa tu sonido personalizado y sigue sonando en otra
                pestaña si ya iniciaste el temporizador desde esta página.
              </p>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
