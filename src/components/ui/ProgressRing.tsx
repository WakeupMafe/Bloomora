import { type ReactNode, useId } from 'react'
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
  /** Contenido central personalizado (reemplaza % / label) */
  children?: ReactNode
  /** Gradiente del arco: de `--lav` (lilac) a `--pink` (rose) */
  gradient?: boolean
  /** Accesible: p. ej. "3 de 5 metas cumplidas este mes" */
  'aria-label'?: string
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
  children,
  gradient = false,
  'aria-label': ariaLabel,
}: ProgressRingProps) {
  const uid = useId().replace(/:/g, '')
  const gradId = `progress-ring-grad-${uid}`
  const safe = Math.min(100, Math.max(0, value))
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const offset = c - (safe / 100) * c

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden
      >
        {gradient ? (
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-bloomora-lilac)" />
              <stop offset="100%" stopColor="var(--color-bloomora-rose)" />
            </linearGradient>
          </defs>
        ) : null}
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
          className={cn(
            !gradient &&
              'text-bloomora-lilac transition-[stroke-dashoffset] duration-500',
            gradient && 'transition-[stroke-dashoffset] duration-500',
            indicatorClassName,
          )}
          stroke={gradient ? `url(#${gradId})` : 'currentColor'}
        />
      </svg>
      {children !== undefined ? (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center',
            valueClassName,
          )}
        >
          {children}
        </div>
      ) : label !== undefined ? (
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
