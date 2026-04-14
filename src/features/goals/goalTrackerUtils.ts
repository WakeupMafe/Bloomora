import type { MockGoalRow } from '@/data/dashboardMock'

/** Clave estable `YYYY-MM` (mes 1–12 con dos dígitos). */
export function monthKey(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, '0')}`
}

export function addMonths(
  year: number,
  monthIndex0: number,
  delta: number,
): { year: number; monthIndex0: number } {
  const d = new Date(year, monthIndex0 + delta, 1)
  return { year: d.getFullYear(), monthIndex0: d.getMonth() }
}

export function getCompletedDaysForMonth(
  goal: Pick<MockGoalRow, 'completedDaysByMonth'>,
  year: number,
  monthIndex0: number,
): number[] {
  const key = monthKey(year, monthIndex0)
  return goal.completedDaysByMonth?.[key] ?? []
}

export function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate()
}

/** Lunes = 0 … Domingo = 6 */
export function weekdayMondayFirst(year: number, monthIndex0: number, day: number) {
  const d = new Date(year, monthIndex0, day).getDay()
  return (d + 6) % 7
}

/** Filas de 7 celdas: número de día o null (hueco). */
export function monthWeekRows(
  year: number,
  monthIndex0: number,
): (number | null)[][] {
  const dim = daysInMonth(year, monthIndex0)
  const leading = weekdayMondayFirst(year, monthIndex0, 1)
  const cells: (number | null)[] = []
  for (let i = 0; i < leading; i++) cells.push(null)
  for (let d = 1; d <= dim; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const rows: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7))
  }
  return rows
}

export function monthLabelEs(year: number, monthIndex0: number): string {
  return new Date(year, monthIndex0, 1).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  })
}

export function computeStreak(
  year: number,
  monthIndex0: number,
  completedDays: number[],
  referenceDate: Date = new Date(),
): number {
  const dim = daysInMonth(year, monthIndex0)
  const done = new Set(
    completedDays.filter((d) => d >= 1 && d <= dim),
  )
  const sameMonth =
    referenceDate.getFullYear() === year &&
    referenceDate.getMonth() === monthIndex0
  let anchor = sameMonth ? referenceDate.getDate() : dim
  while (anchor >= 1 && !done.has(anchor)) anchor--
  if (anchor < 1) return 0
  let streak = 0
  while (anchor >= 1 && done.has(anchor)) {
    streak++
    anchor--
  }
  return streak
}

type StreakBadge = {
  emoji: string
  label: string
} | null

export type GoalProgressInsights = {
  diasConsecutivos: number
  totalDiasCumplidos: number
  ultimoDiaMarcado: string | null
  streakBadge: StreakBadge
  comebackMessage: string | null
  milestoneMessage: string | null
  dynamicMessage: string
}

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseMonthKey(month: string): { year: number; monthIndex0: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month)
  if (!m) return null
  const year = Number(m[1])
  const monthIndex0 = Number(m[2]) - 1
  if (!Number.isFinite(year) || monthIndex0 < 0 || monthIndex0 > 11) return null
  return { year, monthIndex0 }
}

function dateKeySetFromCompletedDaysByMonth(
  completedDaysByMonth?: Record<string, number[]>,
): Set<string> {
  const out = new Set<string>()
  if (!completedDaysByMonth) return out
  for (const [month, days] of Object.entries(completedDaysByMonth)) {
    const parsed = parseMonthKey(month)
    if (!parsed) continue
    const dim = daysInMonth(parsed.year, parsed.monthIndex0)
    for (const d of days) {
      if (d < 1 || d > dim) continue
      const date = new Date(parsed.year, parsed.monthIndex0, d)
      out.add(toDateKey(date))
    }
  }
  return out
}

function streakBadgeFromDays(diasConsecutivos: number): StreakBadge {
  if (diasConsecutivos >= 10) return { emoji: '🏆', label: 'Nivel disciplina' }
  if (diasConsecutivos >= 7) return { emoji: '🚀', label: 'Imparable' }
  if (diasConsecutivos >= 5) return { emoji: '🔥', label: 'On fire' }
  if (diasConsecutivos >= 3) return { emoji: '🔥', label: 'Vas muy bien' }
  return null
}

function milestoneFromTotal(total: number): string | null {
  if (total >= 30) return 'Hábito creado 🧠'
  if (total >= 7) return '1 semana lograda 🎉'
  if (total >= 1) return 'Primer paso 🌱'
  return null
}

const SOFT_DYNAMIC_MESSAGES = [
  'Sigue así ✨',
  'Pequeños pasos, grandes cambios 🌸',
  'Lo estás logrando 💪',
  'Disciplina > motivación 🧠',
] as const

export function buildGoalProgressInsights(
  completedDaysByMonth: Record<string, number[]> | undefined,
  referenceDate: Date = new Date(),
): GoalProgressInsights {
  const dateKeys = dateKeySetFromCompletedDaysByMonth(completedDaysByMonth)
  const totalDiasCumplidos = dateKeys.size
  const todayKey = toDateKey(referenceDate)
  const yesterday = new Date(referenceDate)
  yesterday.setDate(referenceDate.getDate() - 1)
  const yesterdayKey = toDateKey(yesterday)

  let diasConsecutivos = 0
  const walk = new Date(referenceDate)
  while (dateKeys.has(toDateKey(walk))) {
    diasConsecutivos++
    walk.setDate(walk.getDate() - 1)
  }

  const sorted = [...dateKeys].sort()
  const ultimoDiaMarcado = sorted.length > 0 ? sorted[sorted.length - 1] : null
  const streakBadge = streakBadgeFromDays(diasConsecutivos)
  const comebackMessage =
    dateKeys.has(todayKey) && !dateKeys.has(yesterdayKey) && totalDiasCumplidos > 1
      ? 'Volviste 💪'
      : null
  const milestoneMessage = milestoneFromTotal(totalDiasCumplidos)
  const msgIndex =
    (referenceDate.getDate() + totalDiasCumplidos + referenceDate.getMonth()) %
    SOFT_DYNAMIC_MESSAGES.length
  const dynamicMessage = SOFT_DYNAMIC_MESSAGES[msgIndex]

  return {
    diasConsecutivos,
    totalDiasCumplidos,
    ultimoDiaMarcado,
    streakBadge,
    comebackMessage,
    milestoneMessage,
    dynamicMessage,
  }
}

export type TrackerMood = 'celebrate' | 'happy' | 'gentle' | 'neutral'

export function trackerMood(
  completedCount: number,
  dim: number,
  streak: number,
): TrackerMood {
  const ratio = dim > 0 ? completedCount / dim : 0
  if (ratio >= 0.45 || streak >= 5) return 'celebrate'
  if (ratio >= 0.2 || streak >= 3) return 'happy'
  if (completedCount > 0) return 'gentle'
  return 'neutral'
}

export function moodCaption(mood: TrackerMood): string {
  switch (mood) {
    case 'celebrate':
      return '¡Vas increíble!'
    case 'happy':
      return 'Buen ritmo'
    case 'gentle':
      return 'Paso a paso'
    default:
      return 'Aquí cuando quieras'
  }
}

export function moodEmoji(mood: TrackerMood): string {
  switch (mood) {
    case 'celebrate':
      return '✨'
    case 'happy':
      return '😊'
    case 'gentle':
      return '🌱'
    default:
      return '🤍'
  }
}

export function accentEmoji(accent: MockGoalRow['accent']): string {
  switch (accent) {
    case 'green':
      return '💪'
    case 'sky':
      return '🦋'
    default:
      return '🌸'
  }
}
