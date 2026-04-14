import type { MockGoalRow } from '@/data/dashboardMock'
import { cn } from '@/utils/cn'
import { MonthNavPill } from '@/features/goals/MonthNavPill'
import { daysInMonth, monthLabelEs, monthWeekRows } from '@/features/goals/goalTrackerUtils'
import {
  getCompletedCellStyle,
  getTrackerSwatch,
} from '@/features/goals/trackerColorPalette'

const WD_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const

type GoalTrackerGridProps = {
  year: number
  monthIndex0: number
  accent: MockGoalRow['accent']
  /** Paleta para días completados; si falta, se infiere del acento. */
  trackerColorId?: string
  completedDays: number[]
  onToggleDay?: (day: number) => void
  readOnly?: boolean
  /** Vista resumen: celdas más pequeñas */
  compact?: boolean
  /** Título del mes sobre la cuadrícula */
  showMonthBanner?: boolean
  /** Flechas ‹ › para cambiar de mes (p. ej. tracker individual). */
  monthNavigation?: {
    onPrev: () => void
    onNext: () => void
  }
  /** No permite marcar días anteriores a esta fecha (YYYY-MM-DD). */
  minAllowedDate?: string | null
  /**
   * `card`: tarjeta con fondo y sombra (p. ej. vista general).
   * `plain`: solo la cuadrícula, para incrustar dentro de `GoalTrackerPanel`.
   */
  variant?: 'card' | 'plain'
}

function isToday(
  year: number,
  monthIndex0: number,
  day: number,
  ref: Date,
) {
  return (
    ref.getFullYear() === year &&
    ref.getMonth() === monthIndex0 &&
    ref.getDate() === day
  )
}

function isFutureDay(
  year: number,
  monthIndex0: number,
  day: number,
  ref: Date,
) {
  const end = new Date(year, monthIndex0, day, 23, 59, 59, 999)
  return end > ref
}

export function GoalTrackerGrid({
  year,
  monthIndex0,
  accent,
  trackerColorId,
  completedDays,
  onToggleDay,
  readOnly,
  compact = false,
  showMonthBanner = true,
  monthNavigation,
  variant = 'card',
  minAllowedDate,
}: GoalTrackerGridProps) {
  const dim = daysInMonth(year, monthIndex0)
  const done = new Set(completedDays.filter((d) => d >= 1 && d <= dim))
  const rows = monthWeekRows(year, monthIndex0)
  const now = new Date()
  const swatch = getTrackerSwatch(trackerColorId, accent)

  const cell =
    compact
      ? 'min-h-9 min-w-0 rounded-full text-[11px] font-semibold sm:min-h-10'
      : 'min-h-11 min-w-0 rounded-full text-xs font-semibold sm:min-h-12 sm:text-sm'

  return (
    <div
      className={cn(
        'w-full',
        variant === 'card' &&
          cn(
            'rounded-[20px] p-3 shadow-[0_6px_22px_rgba(91,74,140,0.06)] ring-1 ring-bloomora-line/20 sm:rounded-[22px] sm:p-4',
            'bg-[linear-gradient(145deg,rgba(255,244,250,0.98)_0%,rgba(255,225,240,0.72)_48%,rgba(209,238,255,0.62)_100%)]',
          ),
        variant === 'plain' && 'pt-1',
      )}
    >
      {showMonthBanner ? (
        <div className="mb-3 sm:mb-4">
          {monthNavigation ? (
            <MonthNavPill
              year={year}
              monthIndex0={monthIndex0}
              onPrev={monthNavigation.onPrev}
              onNext={monthNavigation.onNext}
              compact={compact}
            />
          ) : (
            <div className="flex justify-center">
              <span className="rounded-full bg-white/70 px-4 py-1.5 text-sm font-semibold capitalize tracking-tight text-bloomora-deep shadow-sm ring-1 ring-bloomora-line/15">
                {monthLabelEs(year, monthIndex0)}
              </span>
            </div>
          )}
        </div>
      ) : null}

      <div
        className={cn(
          'grid grid-cols-7',
          /* ≥~10px entre círculos: más aire que antes (pedido mín. +6px respecto al layout muy junto) */
          compact
            ? 'gap-x-3.5 gap-y-3.5 sm:gap-x-4 sm:gap-y-4'
            : 'gap-x-4 gap-y-4 sm:gap-x-[1.05rem] sm:gap-y-[1.05rem]',
        )}
      >
        {WD_LABELS.map((label) => (
          <div
            key={label}
            className="flex min-h-6 items-center justify-center text-[10px] font-bold uppercase tracking-wide text-bloomora-text-muted/75 sm:min-h-7 sm:text-[11px]"
          >
            {label}
          </div>
        ))}

        {rows.map((week, wi) =>
          week.map((day, di) => {
            const key = day === null ? `e-${wi}-${di}` : `d-${day}`
            if (day === null) {
              return (
                <div
                  key={key}
                  className={cn(
                    cell,
                    'pointer-events-none invisible mx-auto flex aspect-square max-w-[3rem] sm:max-w-[3.25rem]',
                  )}
                  aria-hidden
                />
              )
            }

            const complete = done.has(day)
            const today = isToday(year, monthIndex0, day, now)
            const future = isFutureDay(year, monthIndex0, day, now)
            const beforeGoalStart = isBeforeMinAllowedDate(
              year,
              monthIndex0,
              day,
              minAllowedDate,
            )
            const interactive = !readOnly && !!onToggleDay && (!beforeGoalStart || complete)

            return (
              <button
                key={key}
                type="button"
                disabled={!interactive}
                onClick={() => onToggleDay?.(day)}
                style={complete ? getCompletedCellStyle(swatch) : undefined}
                className={cn(
                  cell,
                  'mx-auto flex aspect-square max-w-[3rem] items-center justify-center transition-all duration-200 ease-out sm:max-w-[3.25rem]',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloomora-lilac',
                  complete &&
                    'scale-[1.02] hover:scale-[1.05] hover:brightness-[1.03] active:scale-95',
                  !complete &&
                    cn(
                      'bg-[#FFEFF8]/90 text-bloomora-deep/65 shadow-inner shadow-white/60 ring-1 ring-bloomora-rose/25',
                      beforeGoalStart && 'opacity-45',
                      future && 'opacity-75',
                      interactive &&
                        'hover:scale-105 hover:bg-[#ffdceb] hover:text-bloomora-deep hover:shadow-md hover:ring-bloomora-rose/35 active:scale-95',
                    ),
                  today &&
                    !complete &&
                    'ring-2 ring-bloomora-rose ring-offset-2 ring-offset-[#fff8fc] shadow-[0_0_0_3px_rgba(244,184,208,0.25)]',
                  today &&
                    complete &&
                    'ring-2 ring-white/90 ring-offset-2 ring-offset-[#fff5fb]',
                  readOnly && 'cursor-default opacity-90',
                )}
                aria-label={
                  beforeGoalStart && !complete
                    ? `Día ${day}, anterior al inicio de la meta`
                    : complete
                    ? `Día ${day}, marcado. Quitar`
                    : `Marcar día ${day} como avanzado`
                }
              >
                {complete ? (
                  <span
                    className="text-sm drop-shadow-sm sm:text-base [text-shadow:0_1px_2px_rgba(0,0,0,0.12)]"
                    aria-hidden
                  >
                    ✓
                  </span>
                ) : (
                  <span>{day}</span>
                )}
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}

function isBeforeMinAllowedDate(
  year: number,
  monthIndex0: number,
  day: number,
  minAllowedDate: string | null | undefined,
): boolean {
  if (!minAllowedDate) return false
  const min = new Date(`${minAllowedDate}T12:00:00`)
  if (Number.isNaN(min.getTime())) return false
  const current = new Date(year, monthIndex0, day, 12, 0, 0, 0)
  return current < min
}
