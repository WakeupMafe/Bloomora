import { useCallback, useEffect, useRef, useState } from 'react'
import {
  loadPomodoroSettings,
  phaseDurationMs,
  phaseLabel,
  savePomodoroSettings,
  type PomodoroPhase,
  type PomodoroSettings,
} from '@/features/pomodoro/pomodoroSettings'
import {
  notifyPomodoroComplete,
  playPomodoroAlarm,
  requestPomodoroNotificationPermission,
  stopPomodoroAlarm,
  unlockPomodoroAlarm,
} from '@/utils/pomodoroAlarmSound'

export type PomodoroStatus = 'idle' | 'running' | 'paused' | 'alarm'

export function usePomodoroTimer() {
  const [settings, setSettings] = useState<PomodoroSettings>(() =>
    loadPomodoroSettings(),
  )
  const [phase, setPhase] = useState<PomodoroPhase>('focus')
  const [status, setStatus] = useState<PomodoroStatus>('idle')
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [remainingMs, setRemainingMs] = useState(() =>
    phaseDurationMs('focus', loadPomodoroSettings()),
  )
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0)

  const settingsRef = useRef(settings)
  const phaseRef = useRef(phase)
  const statusRef = useRef(status)
  const endsAtRef = useRef(endsAt)
  const alarmFiredRef = useRef(false)
  const remainingMsRef = useRef(remainingMs)

  settingsRef.current = settings
  remainingMsRef.current = remainingMs
  phaseRef.current = phase
  statusRef.current = status
  endsAtRef.current = endsAt

  const updateSettings = useCallback((patch: Partial<PomodoroSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      savePomodoroSettings(next)
      return next
    })
  }, [])

  const syncRemainingFromPhase = useCallback(
    (p: PomodoroPhase, s: PomodoroSettings) => {
      const ms = phaseDurationMs(p, s)
      setRemainingMs(ms)
      return ms
    },
    [],
  )

  const fireAlarm = useCallback(() => {
    if (alarmFiredRef.current) return
    alarmFiredRef.current = true
    setStatus('alarm')
    setRemainingMs(0)
    const p = phaseRef.current
    void playPomodoroAlarm()
    notifyPomodoroComplete({
      title: `${phaseLabel(p)} terminado`,
      body:
        p === 'focus'
          ? '¡Buen trabajo! Toca la app para detener la alarma.'
          : 'Descanso listo. Toca la app para continuar.',
    })
  }, [])

  const tick = useCallback(() => {
    if (statusRef.current !== 'running' || endsAtRef.current == null) return
    const left = endsAtRef.current - Date.now()
    if (left <= 0) {
      fireAlarm()
      return
    }
    setRemainingMs(left)
  }, [fireAlarm])

  useEffect(() => {
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [tick, status, endsAt])

  useEffect(() => {
    if (status === 'idle') {
      syncRemainingFromPhase(phase, settings)
    }
  }, [
    phase,
    settings.focusMin,
    settings.shortBreakMin,
    settings.longBreakMin,
    status,
    settings,
    syncRemainingFromPhase,
  ])

  useEffect(() => {
    const onWake = () => tick()
    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('focus', onWake)
    return () => {
      document.removeEventListener('visibilitychange', onWake)
      window.removeEventListener('focus', onWake)
    }
  }, [tick])

  const start = useCallback(async () => {
    unlockPomodoroAlarm()
    await requestPomodoroNotificationPermission()

    const s = settingsRef.current
    const p = phaseRef.current
    const duration =
      statusRef.current === 'paused'
        ? remainingMsRef.current > 0
          ? remainingMsRef.current
          : phaseDurationMs(p, s)
        : phaseDurationMs(p, s)

    alarmFiredRef.current = false
    stopPomodoroAlarm()
    setEndsAt(Date.now() + duration)
    setRemainingMs(duration)
    setStatus('running')
  }, [])

  const pause = useCallback(() => {
    if (statusRef.current !== 'running' || endsAtRef.current == null) return
    const left = Math.max(0, endsAtRef.current - Date.now())
    setRemainingMs(left)
    setEndsAt(null)
    setStatus('paused')
  }, [])

  const reset = useCallback(() => {
    stopPomodoroAlarm()
    alarmFiredRef.current = false
    setEndsAt(null)
    setStatus('idle')
    syncRemainingFromPhase(phaseRef.current, settingsRef.current)
  }, [syncRemainingFromPhase])

  const stopAlarm = useCallback(() => {
    stopPomodoroAlarm()
    alarmFiredRef.current = false
    setStatus('idle')
    setEndsAt(null)

    const s = settingsRef.current
    const p = phaseRef.current
    let nextPhase: PomodoroPhase = 'focus'

    if (p === 'focus') {
      const sessions = completedFocusSessions + 1
      setCompletedFocusSessions(sessions)
      nextPhase =
        sessions > 0 && sessions % s.longBreakEvery === 0
          ? 'longBreak'
          : 'shortBreak'
      if (s.autoStartBreaks) {
        setPhase(nextPhase)
        const dur = phaseDurationMs(nextPhase, s)
        setRemainingMs(dur)
        alarmFiredRef.current = false
        setEndsAt(Date.now() + dur)
        setStatus('running')
        return
      }
    } else if (s.autoStartFocus) {
      nextPhase = 'focus'
      setPhase(nextPhase)
      const dur = phaseDurationMs('focus', s)
      setRemainingMs(dur)
      alarmFiredRef.current = false
      setEndsAt(Date.now() + dur)
      setStatus('running')
      return
    }

    setPhase(nextPhase)
    syncRemainingFromPhase(nextPhase, s)
  }, [completedFocusSessions, syncRemainingFromPhase])

  const selectPhase = useCallback(
    (p: PomodoroPhase) => {
      if (statusRef.current === 'running' || statusRef.current === 'alarm') return
      stopPomodoroAlarm()
      alarmFiredRef.current = false
      setPhase(p)
      setStatus('idle')
      setEndsAt(null)
      syncRemainingFromPhase(p, settingsRef.current)
    },
    [syncRemainingFromPhase],
  )

  const skipToNext = useCallback(() => {
    stopPomodoroAlarm()
    alarmFiredRef.current = false
    setEndsAt(null)
    setStatus('idle')

    const s = settingsRef.current
    let next: PomodoroPhase = 'focus'
    if (phaseRef.current === 'focus') {
      const sessions = completedFocusSessions + 1
      setCompletedFocusSessions(sessions)
      next =
        sessions > 0 && sessions % s.longBreakEvery === 0
          ? 'longBreak'
          : 'shortBreak'
    }
    setPhase(next)
    syncRemainingFromPhase(next, s)
  }, [completedFocusSessions, syncRemainingFromPhase])

  const totalMs = phaseDurationMs(phase, settings)
  const progress =
    totalMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / totalMs)) : 0

  return {
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
  }
}
