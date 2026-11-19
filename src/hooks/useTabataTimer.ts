import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  advancePhasesByElapsed,
  buildPhasePlan,
  totalSeconds,
} from '@/features/tabata/tabataPlan'
import type { Tabata, TabataPhase } from '@/features/tabata/tabataTypes'
import {
  cancelTabataSpeech,
  playCountdownBeep,
  playPhaseChangeBeep,
  primeTabataSpeech,
  releaseTabataWakeLock,
  requestTabataWakeLock,
  speakTabata,
  unlockTabataAudio,
  vibrateTabata,
} from '@/features/tabata/tabataSounds'

export type TabataRunStatus = 'idle' | 'running' | 'paused' | 'finished'

export type TabataTimerController = ReturnType<typeof useTabataTimer>

const TICK_MS = 250
const MUTE_KEY = 'bloomora:tabata-muted'
const COUNTDOWN_BEEP_FROM_SEC = 10
const VOICE_ANNOUNCE_AT_SEC = 15

function spokenDuration(seconds: number): string {
  const n = Math.max(0, Math.round(seconds))
  if (n < 60) return `${n} segundos`
  const minutes = Math.floor(n / 60)
  const rest = n % 60
  const minuteLabel = minutes === 1 ? '1 minuto' : `${minutes} minutos`
  return rest > 0 ? `${minuteLabel} y ${rest} segundos` : minuteLabel
}

function buildNextPhaseAnnouncement(
  next: TabataPhase | null,
  short: boolean,
): string {
  if (!next || next.kind === 'fin') {
    return short ? 'Ya casi terminas' : 'Último tramo, ya casi terminas'
  }
  const dur = spokenDuration(next.durationSec)
  if (short) {
    switch (next.kind) {
      case 'trabajo':
        return `Luego: trabajo, ${dur}`
      case 'descanso':
        return `Luego: descanso, ${dur}`
      case 'descanso_series':
        return `Luego: descanso entre series, ${dur}`
      case 'enfriamiento':
        return `Luego: enfriamiento, ${dur}`
      default:
        return `Luego: preparación, ${dur}`
    }
  }
  switch (next.kind) {
    case 'trabajo':
      if (next.intervalo === 1 && next.serie > 1) {
        return `Tu próxima sesión es la serie ${next.serie}, de trabajo, de ${dur}`
      }
      return `Tu próxima sesión es de trabajo, de ${dur}`
    case 'descanso':
      return `Tu próxima sesión es de descanso, de ${dur}`
    case 'descanso_series':
      return `Tu próxima sesión es descanso entre series, de ${dur}`
    case 'enfriamiento':
      return `Tu próxima sesión es de enfriamiento, de ${dur}`
    default:
      return `Tu próxima sesión es de preparación, de ${dur}`
  }
}

export function useTabataTimer() {
  const [active, setActive] = useState<Tabata | null>(null)
  const [phases, setPhases] = useState<TabataPhase[]>([])
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [status, setStatus] = useState<TabataRunStatus>('idle')
  const [phaseEndsAt, setPhaseEndsAt] = useState<number | null>(null)
  const [remainingMs, setRemainingMs] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [muted, setMutedState] = useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === '1'
    } catch {
      return false
    }
  })

  const statusRef = useRef(status)
  const phaseEndsAtRef = useRef(phaseEndsAt)
  const phaseIndexRef = useRef(phaseIndex)
  const phasesRef = useRef(phases)
  const remainingMsRef = useRef(remainingMs)
  const mutedRef = useRef(muted)
  const lastBeepSecRef = useRef<number | null>(null)
  const lastAnnouncedPhaseRef = useRef<number | null>(null)
  const runStartedAtRef = useRef<number | null>(null)
  const pausedAccumulatedRef = useRef(0)
  const pauseStartedAtRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    statusRef.current = status
    phaseEndsAtRef.current = phaseEndsAt
    phaseIndexRef.current = phaseIndex
    phasesRef.current = phases
    remainingMsRef.current = remainingMs
    mutedRef.current = muted
  }, [status, phaseEndsAt, phaseIndex, phases, remainingMs, muted])

  const setMuted = useCallback((next: boolean) => {
    setMutedState(next)
    if (next) cancelTabataSpeech()
    try {
      localStorage.setItem(MUTE_KEY, next ? '1' : '0')
    } catch {
      /* ignorar */
    }
  }, [])

  const totalMs = useMemo(
    () => (active ? totalSeconds(active) * 1000 : 0),
    [active],
  )

  const currentPhase = phases[phaseIndex] ?? null
  const nextPhase =
    phaseIndex + 1 < phases.length ? phases[phaseIndex + 1] : null

  const applyTick = useCallback((now = Date.now()) => {
    if (statusRef.current !== 'running' || phaseEndsAtRef.current == null) return

    const result = advancePhasesByElapsed(
      phasesRef.current,
      phaseIndexRef.current,
      phaseEndsAtRef.current,
      now,
    )

    if (result.crossedPhase) {
      playPhaseChangeBeep(mutedRef.current)
      vibrateTabata([30, 40, 30])
      lastBeepSecRef.current = null
    }

    if (result.finished) {
      cancelTabataSpeech()
      setPhaseIndex(result.phaseIndex)
      setPhaseEndsAt(null)
      setRemainingMs(0)
      setElapsedMs(totalMs)
      setStatus('finished')
      void releaseTabataWakeLock()
      playPhaseChangeBeep(mutedRef.current)
      vibrateTabata([80, 40, 80, 40, 120])
      return
    }

    if (result.phaseIndex !== phaseIndexRef.current) {
      setPhaseIndex(result.phaseIndex)
    }
    setPhaseEndsAt(result.phaseEndsAt)
    setRemainingMs(result.remainingMs)

    const started = runStartedAtRef.current
    if (started != null) {
      const pausedExtra =
        pauseStartedAtRef.current != null
          ? now - pauseStartedAtRef.current
          : 0
      setElapsedMs(
        Math.min(
          totalMs,
          now - started - pausedAccumulatedRef.current - pausedExtra,
        ),
      )
    }

    const secLeft = Math.ceil(result.remainingMs / 1000)
    const idx = result.phaseIndex
    const phase = phasesRef.current[idx]
    if (phase && lastAnnouncedPhaseRef.current !== idx && secLeft >= 1 && secLeft <= VOICE_ANNOUNCE_AT_SEC) {
      lastAnnouncedPhaseRef.current = idx
      const next = phasesRef.current[idx + 1] ?? null
      // fases ≤10 s: la voz sale al inicio y en versión corta para no pisar los pitidos
      speakTabata(buildNextPhaseAnnouncement(next, phase.durationSec <= COUNTDOWN_BEEP_FROM_SEC), mutedRef.current)
    }
    if (secLeft >= 1 && secLeft <= COUNTDOWN_BEEP_FROM_SEC && lastBeepSecRef.current !== secLeft) {
      lastBeepSecRef.current = secLeft
      playCountdownBeep(mutedRef.current)
      vibrateTabata(20)
    }
  }, [totalMs])

  useEffect(() => {
    if (status !== 'running') return
    applyTick()
    const id = window.setInterval(() => applyTick(), TICK_MS)
    return () => window.clearInterval(id)
  }, [status, phaseEndsAt, phaseIndex, applyTick])

  useEffect(() => {
    const onWake = () => {
      if (statusRef.current === 'running') applyTick()
    }
    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('focus', onWake)
    const onVisibilityWakeLock = () => {
      if (
        document.visibilityState === 'visible' &&
        statusRef.current === 'running'
      ) {
        void requestTabataWakeLock()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityWakeLock)
    return () => {
      document.removeEventListener('visibilitychange', onWake)
      window.removeEventListener('focus', onWake)
      document.removeEventListener('visibilitychange', onVisibilityWakeLock)
    }
  }, [applyTick])

  useEffect(() => {
    return () => {
      cancelTabataSpeech()
      void releaseTabataWakeLock()
    }
  }, [])

  const start = useCallback(async (tabata: Tabata) => {
    primeTabataSpeech()
    await unlockTabataAudio()
    const plan = buildPhasePlan(tabata)
    const firstWorkable = plan.findIndex(
      (p) => p.kind !== 'fin' && p.durationSec > 0,
    )
    const idx = firstWorkable >= 0 ? firstWorkable : 0
    const first = plan[idx]
    const durationMs = (first?.durationSec ?? 0) * 1000
    const now = Date.now()

    setActive(tabata)
    setPhases(plan)
    setPhaseIndex(idx)
    setStatus('running')
    setPhaseEndsAt(now + durationMs)
    setRemainingMs(durationMs)
    setElapsedMs(0)
    runStartedAtRef.current = now
    pausedAccumulatedRef.current = 0
    pauseStartedAtRef.current = null
    lastBeepSecRef.current = null
    lastAnnouncedPhaseRef.current = null
    await requestTabataWakeLock()
    playPhaseChangeBeep(mutedRef.current)
  }, [])

  const pause = useCallback(() => {
    if (statusRef.current !== 'running' || phaseEndsAtRef.current == null) return
    cancelTabataSpeech()
    const left = Math.max(0, phaseEndsAtRef.current - Date.now())
    setRemainingMs(left)
    setPhaseEndsAt(null)
    setStatus('paused')
    pauseStartedAtRef.current = Date.now()
    void releaseTabataWakeLock()
  }, [])

  const resume = useCallback(async () => {
    if (statusRef.current !== 'paused') return
    primeTabataSpeech()
    await unlockTabataAudio()
    const now = Date.now()
    if (pauseStartedAtRef.current != null) {
      pausedAccumulatedRef.current += now - pauseStartedAtRef.current
      pauseStartedAtRef.current = null
    }
    const left = remainingMsRef.current
    setPhaseEndsAt(now + left)
    setStatus('running')
    await requestTabataWakeLock()
  }, [])

  const skip = useCallback(() => {
    if (statusRef.current !== 'running' && statusRef.current !== 'paused') return
    cancelTabataSpeech()
    const plan = phasesRef.current
    let idx = phaseIndexRef.current + 1
    while (idx < plan.length && plan[idx].durationSec <= 0 && plan[idx].kind !== 'fin') {
      idx += 1
    }
    if (idx >= plan.length || plan[idx].kind === 'fin') {
      cancelTabataSpeech()
      setPhaseIndex(plan.length - 1)
      setPhaseEndsAt(null)
      setRemainingMs(0)
      setElapsedMs(totalMs)
      setStatus('finished')
      void releaseTabataWakeLock()
      playPhaseChangeBeep(mutedRef.current)
      return
    }
    const next = plan[idx]
    const dur = next.durationSec * 1000
    setPhaseIndex(idx)
    lastBeepSecRef.current = null
    lastAnnouncedPhaseRef.current = null
    playPhaseChangeBeep(mutedRef.current)
    vibrateTabata(30)
    if (statusRef.current === 'paused') {
      setRemainingMs(dur)
      setPhaseEndsAt(null)
    } else {
      const now = Date.now()
      setPhaseEndsAt(now + dur)
      setRemainingMs(dur)
    }
  }, [totalMs])

  const stop = useCallback(() => {
    cancelTabataSpeech()
    setStatus('idle')
    setActive(null)
    setPhases([])
    setPhaseIndex(0)
    setPhaseEndsAt(null)
    setRemainingMs(0)
    setElapsedMs(0)
    runStartedAtRef.current = null
    pausedAccumulatedRef.current = 0
    pauseStartedAtRef.current = null
    lastBeepSecRef.current = null
    lastAnnouncedPhaseRef.current = null
    void releaseTabataWakeLock()
  }, [])

  const restart = useCallback(async () => {
    const tabata = active
    if (!tabata) return
    await start(tabata)
  }, [active, start])

  const phaseProgress =
    currentPhase && currentPhase.durationSec > 0
      ? Math.min(
          1,
          Math.max(0, 1 - remainingMs / (currentPhase.durationSec * 1000)),
        )
      : 0

  const overallProgress =
    totalMs > 0 ? Math.min(1, Math.max(0, elapsedMs / totalMs)) : 0

  return {
    active,
    phases,
    phaseIndex,
    currentPhase,
    nextPhase,
    status,
    remainingMs,
    elapsedMs,
    totalMs,
    phaseProgress,
    overallProgress,
    muted,
    setMuted,
    start,
    pause,
    resume,
    skip,
    stop,
    restart,
  }
}
