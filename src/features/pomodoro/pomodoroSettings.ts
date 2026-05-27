export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak'

export type PomodoroSettings = {
  focusMin: number
  shortBreakMin: number
  longBreakMin: number
  longBreakEvery: number
  autoStartBreaks: boolean
  autoStartFocus: boolean
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  longBreakEvery: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
}

const STORAGE_KEY = 'bloomora:pomodoroSettings'

export function loadPomodoroSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_POMODORO_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<PomodoroSettings>
    return {
      ...DEFAULT_POMODORO_SETTINGS,
      ...parsed,
      focusMin: clampMin(parsed.focusMin, 1, 120, 25),
      shortBreakMin: clampMin(parsed.shortBreakMin, 1, 60, 5),
      longBreakMin: clampMin(parsed.longBreakMin, 1, 60, 15),
      longBreakEvery: clampMin(parsed.longBreakEvery, 2, 10, 4),
    }
  } catch {
    return { ...DEFAULT_POMODORO_SETTINGS }
  }
}

export function savePomodoroSettings(settings: PomodoroSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* ignore */
  }
}

function clampMin(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

export function phaseDurationMs(
  phase: PomodoroPhase,
  settings: PomodoroSettings,
): number {
  const min =
    phase === 'focus'
      ? settings.focusMin
      : phase === 'shortBreak'
        ? settings.shortBreakMin
        : settings.longBreakMin
  return min * 60 * 1000
}

export function phaseLabel(phase: PomodoroPhase): string {
  switch (phase) {
    case 'focus':
      return 'Enfoque'
    case 'shortBreak':
      return 'Descanso corto'
    case 'longBreak':
      return 'Descanso largo'
  }
}

export function phaseEmoji(phase: PomodoroPhase): string {
  switch (phase) {
    case 'focus':
      return '🍅'
    case 'shortBreak':
      return '☕'
    case 'longBreak':
      return '🌿'
  }
}
