import { cn } from '@/utils/cn'

type ProgressRingProps = {
  value: number
  /** 0–100 */
  size?: number
  strokeWidth?: number
  className?: string
  trackClassName?: string
  indicatorClassName?: string
  /** Clases para el porcentaje central */
  valueClassName?: string
  label?: string
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  className,
  trackClassName,
  indicatorClassName,
  valueClassName,
  label,
}: ProgressRingProps) {
  const safe = Math.min(100, Math.max(0, value))
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const offset = c - (safe / 100) * c

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn('text-bloomora-lavender-100', trackClassName)}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn('text-bloomora-lilac transition-[stroke-dashoffset] duration-500', indicatorClassName)}
          stroke="currentColor"
        />
      </svg>
      {label !== undefined ? (
        <span
          className={cn(
            'pointer-events-none absolute text-center text-lg font-bold text-bloomora-deep',
            valueClassName,
          )}
        >
          {label}
        </span>
      ) : (
        <span
          className={cn(
            'pointer-events-none absolute text-center text-lg font-bold text-bloomora-deep',
            valueClassName,
          )}
        >
          {Math.round(safe)}%
        </span>
      )}
    </div>
  )
}
