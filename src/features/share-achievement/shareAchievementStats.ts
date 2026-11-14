import type { MockGoalRow } from '@/data/dashboardMock'
import {
  computeStreak,
  daysInMonth,
  getCompletedDaysForMonth,
  monthKey,
} from '@/features/goals/goalTrackerUtils'
import {
  MILESTONE_STREAKS,
  type ShareAchievementStats,
  type ShareDayCell,
  type ShareMilestoneKind,
} from '@/features/share-achievement/shareAchievementTypes'

const MONTH_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const

function formatDayMonth(day: number, monthIndex0: number, year: number): string {
  return `${day} ${MONTH_SHORT[monthIndex0]} ${year}`
}

export function formatShareDateRange(
  startDay: number,
  endDay: number,
  monthIndex0: number,
  year: number,
): string {
  if (startDay === endDay) {
    return formatDayMonth(startDay, monthIndex0, year)
  }
  if (startDay === 1 && endDay === daysInMonth(year, monthIndex0)) {
    const name = new Date(year, monthIndex0, 1).toLocaleDateString('es-CO', {
      month: 'long',
      year: 'numeric',
    })
    return name.charAt(0).toUpperCase() + name.slice(1)
  }
  return `${startDay} – ${endDay} ${MONTH_SHORT[monthIndex0]} ${year}`
}

/** Mejor racha dentro de un mes (días marcados). */
export function bestStreakInMonth(completedDays: number[]): number {
  if (completedDays.length === 0) return 0
  const sorted = [...new Set(completedDays)].sort((a, b) => a - b)
  let best = 1
  let cur = 1
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] === sorted[i - 1] + 1) {
      cur += 1
      best = Math.max(best, cur)
    } else {
      cur = 1
    }
  }
  return best
}

function streakEndingOn(
  completedDays: number[],
  endDay: number,
): number {
  const done = new Set(completedDays)
  let d = endDay
  let n = 0
  while (d >= 1 && done.has(d)) {
    n += 1
    d -= 1
  }
  return n
}

export function milestoneLabel(kind: ShareMilestoneKind): string {
  switch (kind) {
    case 'streak_7':
      return '7 días'
    case 'streak_15':
      return '15 días seguidos'
    case 'streak_30':
      return '30 días'
    case 'month':
      return 'Mes completo'
  }
}

function buildStatsForStreak(
  goal: MockGoalRow,
  year: number,
  monthIndex0: number,
  streakLen: number,
  kind: ShareMilestoneKind,
  now = new Date(),
): ShareAchievementStats | null {
  const completed = getCompletedDaysForMonth(goal, year, monthIndex0)
  if (completed.length === 0) return null

  const sameMonth =
    now.getFullYear() === year && now.getMonth() === monthIndex0
  let endDay = sameMonth ? Math.min(now.getDate(), daysInMonth(year, monthIndex0)) : daysInMonth(year, monthIndex0)

  // Buscar el tramo consecutivo más reciente de longitud >= streakLen
  let foundEnd = -1
  while (endDay >= streakLen) {
    const len = streakEndingOn(completed, endDay)
    if (len >= streakLen) {
      foundEnd = endDay
      break
    }
    endDay -= 1
  }
  if (foundEnd < 0) return null

  const startDay = foundEnd - streakLen + 1
  const periodDays = Array.from({ length: streakLen }, (_, i) => startDay + i)
  const doneSet = new Set(completed)
  const cells: ShareDayCell[] = periodDays.map((day) => ({
    day,
    done: doneSet.has(day),
  }))
  const daysAchieved = cells.filter((c) => c.done).length
  const daysSkipped = streakLen - daysAchieved
  const current = computeStreak(year, monthIndex0, completed, now)
  const best = Math.max(bestStreakInMonth(completed), current)
  const percent = Math.round((daysAchieved / streakLen) * 100)

  return {
    kind,
    headline:
      streakLen === 7
        ? '¡7 días seguidos!'
        : streakLen === 15
          ? '¡15 días seguidos!'
          : '¡30 días seguidos!',
    badge: `Racha de ${streakLen} días`,
    goalTitle: goal.title,
    dateRangeLabel: formatShareDateRange(startDay, foundEnd, monthIndex0, year),
    year,
    monthIndex0,
    daysAchieved,
    daysSkipped,
    daysInPeriod: streakLen,
    currentStreak: current,
    bestStreak: best,
    percent,
    cells,
    skippedLabel:
      daysSkipped === 0
        ? 'Perfecto'
        : `${daysSkipped} de ${streakLen}`,
    streakLabel:
      current >= best && current > 0
        ? '¡Tu mejor racha!'
        : best > current
          ? `Mejor: ${best}`
          : 'Sigue así',
    percentLabel: `${daysAchieved} de ${streakLen} días`,
  }
}

function buildStatsForMonth(
  goal: MockGoalRow,
  year: number,
  monthIndex0: number,
  now = new Date(),
): ShareAchievementStats | null {
  const dim = daysInMonth(year, monthIndex0)
  const completed = getCompletedDaysForMonth(goal, year, monthIndex0)
  const sameMonth =
    now.getFullYear() === year && now.getMonth() === monthIndex0
  // Para mes en curso: solo hasta hoy; mes pasado: mes completo
  const until = sameMonth ? Math.min(now.getDate(), dim) : dim
  if (completed.filter((d) => d >= 1 && d <= until).length < Math.ceil(until * 0.7)) {
    // Exigir al menos 70% del mes visible para ofrecer "mes"
    // (mes cerrado con casi todo marcado, o mes actual muy avanzado)
  }
  const daysAchieved = completed.filter((d) => d >= 1 && d <= until).length
  if (daysAchieved < 1) return null
  // Vista de mes disponible con al menos 50% del periodo visible
  if (daysAchieved / until < 0.5) return null

  const daysSkipped = Math.max(0, until - daysAchieved)
  const doneSet = new Set(completed)
  const cells: ShareDayCell[] = Array.from({ length: until }, (_, i) => {
    const day = i + 1
    return { day, done: doneSet.has(day) }
  })
  const current = computeStreak(year, monthIndex0, completed, now)
  const best = Math.max(bestStreakInMonth(completed), current)
  const percent = Math.round((daysAchieved / until) * 100)
  const monthName = new Date(year, monthIndex0, 1).toLocaleDateString('es-CO', {
    month: 'long',
  })
  const monthCap = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  return {
    kind: 'month',
    headline: daysAchieved >= dim ? '¡Mes completado!' : `¡${monthCap} en marcha!`,
    badge: daysAchieved >= dim ? `${monthCap} completo` : monthCap,
    goalTitle: goal.title,
    dateRangeLabel: formatShareDateRange(1, until, monthIndex0, year),
    year,
    monthIndex0,
    daysAchieved,
    daysSkipped,
    daysInPeriod: until,
    currentStreak: current,
    bestStreak: best,
    percent,
    cells,
    skippedLabel:
      daysSkipped === 0 ? 'Perfecto' : `${daysSkipped} de ${until}`,
    streakLabel:
      current >= best && current > 0
        ? '¡Tu mejor racha!'
        : best > current
          ? `Mejor: ${best}`
          : 'Sigue así',
    percentLabel: `${daysAchieved} de ${until}`,
  }
}

export function buildShareStats(
  goal: MockGoalRow,
  kind: ShareMilestoneKind,
  year: number,
  monthIndex0: number,
  now = new Date(),
): ShareAchievementStats | null {
  if (kind === 'month') return buildStatsForMonth(goal, year, monthIndex0, now)
  const len = kind === 'streak_7' ? 7 : kind === 'streak_15' ? 15 : 30
  return buildStatsForStreak(goal, year, monthIndex0, len, kind, now)
}

/** Hitos disponibles para esta meta/mes (orden UI). */
export function availableMilestones(
  goal: MockGoalRow,
  year: number,
  monthIndex0: number,
  now = new Date(),
): ShareMilestoneKind[] {
  const out: ShareMilestoneKind[] = []
  for (const n of MILESTONE_STREAKS) {
    const kind: ShareMilestoneKind =
      n === 7 ? 'streak_7' : n === 15 ? 'streak_15' : 'streak_30'
    if (buildShareStats(goal, kind, year, monthIndex0, now)) out.push(kind)
  }
  if (buildShareStats(goal, 'month', year, monthIndex0, now)) out.push('month')
  return out
}

/**
 * Detecta si al marcar `day` se cruzó un umbral de racha (7/15/30).
 * Compara streak antes/después del toggle (day acaba de marcarse).
 */
export function detectStreakMilestoneCrossed(
  completedDaysBefore: number[],
  completedDaysAfter: number[],
  year: number,
  monthIndex0: number,
  now = new Date(),
): ShareMilestoneKind | null {
  const before = computeStreak(year, monthIndex0, completedDaysBefore, now)
  const after = computeStreak(year, monthIndex0, completedDaysAfter, now)
  for (const n of [...MILESTONE_STREAKS].reverse()) {
    if (before < n && after >= n) {
      return n === 7 ? 'streak_7' : n === 15 ? 'streak_15' : 'streak_30'
    }
  }
  const dim = daysInMonth(year, monthIndex0)
  const beforeCount = completedDaysBefore.filter((d) => d >= 1 && d <= dim).length
  const afterCount = completedDaysAfter.filter((d) => d >= 1 && d <= dim).length
  if (beforeCount < dim && afterCount >= dim) return 'month'
  return null
}

export function defaultMilestone(
  goal: MockGoalRow,
  year: number,
  monthIndex0: number,
  preferred?: ShareMilestoneKind,
): ShareMilestoneKind | null {
  const available = availableMilestones(goal, year, monthIndex0)
  if (available.length === 0) return null
  if (preferred && available.includes(preferred)) return preferred
  // Preferir la racha más alta disponible, luego mes
  const streaks = available.filter((k) => k !== 'month')
  if (streaks.length) return streaks[streaks.length - 1]
  return available[0]
}

export function shareStorageKey(goalId: string, kind: ShareMilestoneKind, year: number, monthIndex0: number) {
  return `bloomora:share-seen:${goalId}:${kind}:${monthKey(year, monthIndex0)}`
}
