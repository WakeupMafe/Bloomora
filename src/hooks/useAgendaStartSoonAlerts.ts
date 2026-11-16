import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AgendaTask } from '@/data/dashboardMock'
import { minutesSinceMidnightLocal, toDateKeyLocal } from '@/utils/agendaTime'

function storageKeyForDay(dayKey: string) {
  return `bloomora:agenda-start-soon:${dayKey}`
}

function loadNotified(dayKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKeyForDay(dayKey))
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
    localStorage.setItem(storageKeyForDay(dayKey), JSON.stringify([...set]))
  } catch {
    /* ignore */
  }
}

export type AgendaStartSoonPrompt = {
  taskId: string
  title: string
  startMin: number
}

/**
 * Aviso in-app ~2 minutos antes del inicio de una tarea de hoy (no completada).
 * Dispara si la app está abierta en la ventana [startMin-2, startMin),
 * incluido al volver a primer plano; no avisa si la tarea ya empezó.
 */
export function useAgendaStartSoonAlerts(
  dayKey: string,
  tasks: AgendaTask[],
  opts: { enabled: boolean },
) {
  const [prompt, setPrompt] = useState<AgendaStartSoonPrompt | null>(null)
  const notifiedRef = useRef<Set<string>>(new Set())
  const tasksRef = useRef(tasks)
  const dayKeyRef = useRef(dayKey)
  const promptQueueRef = useRef<AgendaStartSoonPrompt[]>([])

  useLayoutEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  useEffect(() => {
    dayKeyRef.current = dayKey
    notifiedRef.current = loadNotified(dayKey)
    promptQueueRef.current = []
    setPrompt(null)
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

  useEffect(() => {
    if (prompt != null) return
    const next = promptQueueRef.current.shift()
    if (next) setPrompt(next)
  }, [prompt])

  const scan = useCallback(() => {
    if (!opts.enabled) return

    const todayKey = toDateKeyLocal(new Date())
    if (dayKeyRef.current !== todayKey) {
      dayKeyRef.current = todayKey
      notifiedRef.current = loadNotified(todayKey)
      promptQueueRef.current = []
      setPrompt(null)
      return
    }

    if (dayKey !== todayKey) return

    const nowMin = minutesSinceMidnightLocal()
    if (prompt != null) return

    const due = [...tasksRef.current]
      .filter((t) => {
        if (t.completed) return false
        if (!(nowMin >= t.startMin - 2 && nowMin < t.startMin)) return false
        const key = `${t.id}:${t.startMin}`
        return !notifiedRef.current.has(key)
      })
      .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)

    if (due.length === 0) return

    for (const t of due) {
      const key = `${t.id}:${t.startMin}`
      notifiedRef.current.add(key)
      saveNotified(dayKey, notifiedRef.current)
      promptQueueRef.current.push({
        taskId: t.id,
        title: t.title,
        startMin: t.startMin,
      })
    }

    const first = promptQueueRef.current.shift()
    if (first) setPrompt(first)
  }, [dayKey, opts.enabled, prompt])

  useEffect(() => {
    if (!opts.enabled) return
    scan()
    const id = window.setInterval(scan, 20_000)
    return () => window.clearInterval(id)
  }, [opts.enabled, scan])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') scan()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [scan])

  const dismiss = useCallback(() => {
    setPrompt(null)
  }, [])

  return { prompt, dismiss }
}
