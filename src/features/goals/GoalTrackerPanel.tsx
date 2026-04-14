import { MascotAvatar } from '@/components/brand/MascotAvatar'
import type { MockGoalRow } from '@/data/dashboardMock'
import { cn } from '@/utils/cn'
import { GoalTrackerGrid } from '@/features/goals/GoalTrackerGrid'
import {
  accentEmoji,
  buildGoalProgressInsights,
  computeStreak,
  daysInMonth,
  moodCaption,
  moodEmoji,
  trackerMood,
} from '@/features/goals/goalTrackerUtils'
import { TrackerColorMenu } from '@/features/goals/TrackerColorMenu'

export type GoalTrackerPanelProps = {
  title: string
  accent: MockGoalRow['accent']
  trackerColorId?: string
  onTrackerColorChange?: (trackerColorId: string) => void
  year: number
  monthIndex0: number
  completedDays: number[]
  onToggleDay?: (day: number) => void
  readOnly?: boolean
  monthNavigation?: {
    onPrev: () => void
    onNext: () => void
  }
  allCompletedDaysByMonth?: Record<string, number[]>
  goalStartDate?: string | null
}

export function GoalTrackerPanel({
  title,
  accent,
  trackerColorId,
  onTrackerColorChange,
  year,
  monthIndex0,
  completedDays,
  onToggleDay,
  readOnly,
  monthNavigation,
  allCompletedDaysByMonth,
  goalStartDate,
}: GoalTrackerPanelProps) {
  const dim = daysInMonth(year, monthIndex0)
  const done = completedDays.filter((d) => d >= 1 && d <= dim)
  const count = done.length
  const ratio = dim > 0 ? count / dim : 0
  const monthStreak = computeStreak(year, monthIndex0, completedDays)
  const progress = buildGoalProgressInsights(allCompletedDaysByMonth)
  const streak = Math.max(monthStreak, progress.diasConsecutivos)
  const mood = trackerMood(count, dim, streak)
  const vivid = ratio >= 0.2
  const streakSubtitle = progress.streakBadge
    ? `${progress.streakBadge.emoji} ${progress.streakBadge.label}`
    : null
  const encouragement =
    progress.comebackMessage ?? progress.milestoneMessage ?? progress.dynamicMessage

  return (
    <article
      className={cn(
        'relative overflow-visible rounded-[22px] p-5 pb-20 shadow-[0_8px_28px_rgba(91,74,140,0.08)] ring-1 ring-bloomora-line/30 sm:rounded-[26px] sm:p-7 sm:pb-24',
        'bg-[linear-gradient(168deg,#FFF9FC_0%,#FDECF5_32%,#f5ecfc_58%,#D6F0FF_100%)]',
      )}
    >
      <header className="relative z-[1] flex flex-wrap items-start justify-between gap-3 pr-2 sm:pr-4">
        <div className="max-w-[min(100%,22rem)] sm:max-w-[min(100%,26rem)]">
          <p className="text-2xl leading-none sm:text-3xl" aria-hidden>
            {accentEmoji(accent)}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-bloomora-deep sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-bloomora-text-muted sm:text-base">
            Marca los días en los que avanzaste 🌱
          </p>
        </div>
        {!readOnly && onTrackerColorChange ? (
          <TrackerColorMenu
            value={trackerColorId}
            accent={accent}
            onChange={onTrackerColorChange}
          />
        ) : null}
      </header>

      <div
        key={`${year}-${monthIndex0}`}
        className={cn(
          'relative z-[1] mt-6 space-y-4',
          monthNavigation && 'bloomora-tracker-month-animate',
        )}
      >
        <div>
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span
              className={cn(
                'font-semibold',
                vivid ? 'text-bloomora-deep' : 'text-bloomora-text-muted',
              )}
            >
              {count} / {dim} días cumplidos{' '}
              <span className="font-normal">🌸</span>
            </span>
            {streak > 0 ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold',
                  vivid
                    ? 'bg-white/70 text-orange-600 shadow-sm'
                    : 'bg-white/40 text-bloomora-text-muted',
                )}
              >
                🔥 {streak} {streak === 1 ? 'día seguido' : 'días seguidos'}
                {streakSubtitle ? (
                  <span className="font-semibold text-bloomora-deep/80">
                    — {streakSubtitle}
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>
          <div
            className={cn(
              'h-2.5 overflow-hidden rounded-full bg-white/55 shadow-inner',
              vivid && 'ring-1 ring-white/80',
            )}
          >
            <div
              className={cn(
                'h-full rounded-full transition-[width,filter] duration-500 ease-out',
                vivid
                  ? 'bg-gradient-to-r from-bloomora-rose via-bloomora-lilac to-bloomora-sky-deep shadow-[0_0_12px_rgba(184,168,232,0.45)]'
                  : 'bg-gradient-to-r from-bloomora-lavender-100 to-bloomora-rose/70',
              )}
              style={{ width: `${Math.min(100, (count / dim) * 100)}%` }}
            />
          </div>
        </div>

        <GoalTrackerGrid
          variant="plain"
          year={year}
          monthIndex0={monthIndex0}
          accent={accent}
          trackerColorId={trackerColorId}
          completedDays={completedDays}
          onToggleDay={onToggleDay}
          readOnly={readOnly}
          monthNavigation={monthNavigation}
          minAllowedDate={goalStartDate}
        />
        <p className="px-1 text-sm font-medium text-bloomora-violet/90">
          ✨ {encouragement}
        </p>
        <p className="px-1 text-xs text-bloomora-text-muted">
          Total: {progress.totalDiasCumplidos} dias cumplidos
          {progress.ultimoDiaMarcado ? ` · Ultimo: ${progress.ultimoDiaMarcado}` : ''}
        </p>
      </div>

      <div
        className={cn(
          'pointer-events-none absolute bottom-3 right-2 flex flex-col items-end sm:bottom-4 sm:right-4',
        )}
      >
        <div
          className={cn(
            'mb-1 rounded-full bg-white/75 px-2.5 py-1 text-[11px] font-semibold text-bloomora-deep shadow-sm ring-1 ring-bloomora-line/25 backdrop-blur-sm sm:text-xs',
            mood === 'celebrate' && 'text-bloomora-violet',
          )}
          aria-hidden
        >
          <span className="mr-1">{moodEmoji(mood)}</span>
          {moodCaption(mood)}
        </div>
        <MascotAvatar
          className={cn(
            'w-[4.5rem] drop-shadow-[0_6px_16px_rgba(124,107,181,0.25)] sm:w-[5.5rem]',
            mood === 'neutral' && 'opacity-[0.88] saturate-[0.92]',
            mood === 'celebrate' && 'scale-105',
          )}
        />
      </div>
    </article>
  )
}
