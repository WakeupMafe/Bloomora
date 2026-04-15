import { useCallback, useEffect, useRef, useState } from 'react'
import type { AgendaTask } from '@/data/dashboardMock'
import {
  formatMinutes12h,
  minutesSinceMidnightLocal,
  startOfLocalDay,
  toDateKeyLocal,
} from '@/utils/agendaTime'

function storageKeyForDay(dayKey: string) {
  return `bloomora:agenda-block-ended:${dayKey}`
}

function loadNotified(dayKey: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(storageKeyForDay(dayKey))
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

function saveNotified(dayKey: string, set: Set<string>) {
  try {
    sessionStorage.setItem(storageKeyForDay(dayKey), JSON.stringify([...set]))
  } catch {
    /* ignore */
  }
}

function vibrateBlockEnd() {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([160, 70, 160, 70, 200])
    }
  } catch {
    /* ignore */
  }
}

/** Tono corto (no requiere archivo); puede fallar en iOS hasta haber gesto de usuario. */
function playBlockEndChime() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(523.25, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
    osc.onended = () => void ctx.close()
  } catch {
    /* ignore */
  }
}

function showSystemNotification(title: string, body: string, tag: string) {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    new Notification(title, {
      body,
      tag,
      lang: 'es',
    })
  } catch {
    /* ignore */
  }
}

export type AgendaBlockEndPrompt = {
  taskId: string
  title: string
  endMin: number
}

/**
 * Cuando la hora del dispositivo cruza el fin de un bloque (tareas del día hoy),
 * vibra, intenta sonido y notificación del sistema, y abre un aviso en la app.
 * No dispara al abrir horas después: solo al cruce prevMin → nowMin del minuto de fin.
 */
export function useAgendaBlockEndAlerts(
  dayKey: string,
  tasks: AgendaTask[],
  opts: { enabled: boolean },
) {
  const [prompt, setPrompt] = useState<AgendaBlockEndPrompt | null>(null)
  const notifiedRef = useRef<Set<string>>(new Set())
  const tasksRef = useRef(tasks)
  tasksRef.current = tasks
  const lastScanMinuteRef = useRef<number | null>(null)
  const promptQueueRef = useRef<AgendaBlockEndPrompt[]>([])

  useEffect(() => {
    notifiedRef.current = loadNotified(dayKey)
    lastScanMinuteRef.current = null
    promptQueueRef.current = []
  }, [dayKey])

  useEffect(() => {
    if (opts.enabled) return
    setPrompt(null)
    promptQueueRef.current = []
  }, [opts.enabled])

  useEffect(() => {
    if (prompt?.taskId && tasks.find((t) => t.id === prompt.taskId)?.completed) {
      setPrompt(null)
    }
  }, [tasks, prompt])

  /** Al cerrar un diálogo, muestra el siguiente de la cola si hay. */
  useEffect(() => {
    if (prompt != null) return
    const next = promptQueueRef.current.shift()
    if (next) setPrompt(next)
  }, [prompt])

  const scan = useCallback(() => {
    if (!opts.enabled) return

    const todayKey = toDateKeyLocal(startOfLocalDay(new Date()))
    if (dayKey !== todayKey) return

    const nowMin = minutesSinceMidnightLocal()

    if (lastScanMinuteRef.current === null) {
      lastScanMinuteRef.current = nowMin
      return
    }

    const prev = lastScanMinuteRef.current
    lastScanMinuteRef.current = nowMin

    if (prompt != null) return

    const crossed = [...tasksRef.current]
      .filter(
        (t) =>
          !t.completed &&
          prev < t.endMin &&
          nowMin >= t.endMin &&
          !notifiedRef.current.has(`${t.id}:${t.endMin}`),
      )
      .sort((a, b) => a.endMin - b.endMin || a.startMin - b.startMin)

    if (crossed.length === 0) return

    vibrateBlockEnd()
    playBlockEndChime()

    for (const t of crossed) {
      const key = `${t.id}:${t.endMin}`
      notifiedRef.current.add(key)
      saveNotified(dayKey, notifiedRef.current)

      const endLabel = formatMinutes12h(t.endMin)
      showSystemNotification(
        'Bloque terminado ✨',
        `«${t.title}» terminó (${endLabel}). ¿Marcar como hecha?`,
        `bloomora-block-${dayKey}-${t.id}-${t.endMin}`,
      )

      promptQueueRef.current.push({
        taskId: t.id,
        title: t.title,
        endMin: t.endMin,
      })
    }

    const first = promptQueueRef.current.shift()
    if (first) setPrompt(first)
  }, [dayKey, opts.enabled, prompt])

  useEffect(() => {
    if (!opts.enabled) return
    scan()
    const id = window.setInterval(scan, 12_000)
    return () => window.clearInterval(id)
  }, [opts.enabled, scan])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') scan()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [scan])

  const dismissBlockEndPrompt = useCallback(() => {
    setPrompt(null)
  }, [])

  return { blockEndPrompt: prompt, dismissBlockEndPrompt, rescanBlockEnds: scan }
}
