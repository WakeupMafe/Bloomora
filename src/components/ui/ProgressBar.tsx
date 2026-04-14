import { cn } from '@/utils/cn'

type ProgressBarProps = {
  value: number
  /** 0–100 */
  label: string
  className?: string
  /** Clases para el texto encima de la barra */
  labelClassName?: string
  fillClassName?: string
}

export function ProgressBar({
  value,
  label,
  className,
  labelClassName,
  fillClassName,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div
      className={cn(
        'relative h-10 overflow-hidden rounded-full bg-white/60 shadow-inner ring-1 ring-bloomora-line/25',
        className,
      )}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-bloomora-lilac/90 to-bloomora-rose/80 transition-[width] duration-300',
          fillClassName,
        )}
        style={{ width: `${pct}%` }}
      />
      <span
        className={cn(
          'relative z-10 flex h-full items-center justify-center px-3 text-xs font-semibold text-bloomora-deep drop-shadow-[0_1px_0_rgba(255,255,255,0.75)]',
          labelClassName,
        )}
      >
        {label}
      </span>
    </div>
  )
}
