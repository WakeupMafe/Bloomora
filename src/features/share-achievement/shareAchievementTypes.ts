export type ShareFormat = 'story' | 'post'
export type ShareStyle = 'fondo' | 'foto'

/** Hitos compartibles según el kit visual. */
export type ShareMilestoneKind = 'streak_7' | 'streak_15' | 'streak_30' | 'month'

export type ShareDayCell = {
  day: number
  done: boolean
}

export type ShareAchievementStats = {
  kind: ShareMilestoneKind
  /** Título corto del hito, ej. "¡15 días seguidos!" */
  headline: string
  /** Badge corto, ej. "Racha de 15 días" */
  badge: string
  goalTitle: string
  /** Rango legible, ej. "1 – 15 nov 2026" */
  dateRangeLabel: string
  year: number
  monthIndex0: number
  daysAchieved: number
  daysSkipped: number
  daysInPeriod: number
  currentStreak: number
  bestStreak: number
  percent: number
  cells: ShareDayCell[]
  skippedLabel: string
  streakLabel: string
  percentLabel: string
}

export const SHARE_EXPORT_SIZE: Record<
  ShareFormat,
  { width: number; height: number; label: string }
> = {
  story: { width: 1080, height: 1920, label: 'Historia 9:16' },
  post: { width: 1080, height: 1350, label: 'Publicación 4:5' },
}

export const MILESTONE_STREAKS = [7, 15, 30] as const
