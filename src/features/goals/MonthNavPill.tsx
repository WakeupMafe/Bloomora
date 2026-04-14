import { monthLabelEs } from '@/features/goals/goalTrackerUtils'
import { cn } from '@/utils/cn'

export type MonthNavPillProps = {
  year: number
  monthIndex0: number
  onPrev: () => void
  onNext: () => void
  compact?: boolean
  className?: string
}

/**
 * Selector ‹ mes año › estilo Bloomora (pill, pastel).
 */
export function MonthNavPill({
  year,
  monthIndex0,
  onPrev,
  onNext,
  compact = false,
  className,
}: MonthNavPillProps) {
  return (
    <div className={cn('flex justify-center', className)}>
      <div
        className={cn(
          'inline-flex max-w-full items-stretch overflow-hidden rounded-full bg-white/75 shadow-sm ring-1 ring-bloomora-line/20 backdrop-blur-[2px]',
          compact ? 'text-xs' : 'text-sm',
        )}
      >
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={onPrev}
          className="flex min-h-10 min-w-10 shrink-0 items-center justify-center text-lg font-semibold text-bloomora-violet/80 transition hover:bg-bloomora-lavender-50/60 hover:text-bloomora-deep active:scale-95 sm:min-h-11 sm:min-w-11"
        >
          ‹
        </button>
        <span
          className={cn(
            'flex min-w-0 flex-1 items-center justify-center border-x border-bloomora-line/15 px-3 py-2 text-center font-semibold capitalize leading-tight tracking-tight text-bloomora-deep sm:px-4',
            compact && 'py-1.5',
          )}
        >
          {monthLabelEs(year, monthIndex0)}
        </span>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={onNext}
          className="flex min-h-10 min-w-10 shrink-0 items-center justify-center text-lg font-semibold text-bloomora-violet/80 transition hover:bg-bloomora-lavender-50/60 hover:text-bloomora-deep active:scale-95 sm:min-h-11 sm:min-w-11"
        >
          ›
        </button>
      </div>
    </div>
  )
}
