import tulipanLogo from '@/assets/TulipanLogo.png'
import { cn } from '@/utils/cn'

type BloomoraLogoProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /**
   * El PNG es el tulipán de marca. Por defecto se muestra la palabra “Bloomora” al lado.
   * Si más adelante usas un PNG que ya incluye el texto, pon `false`.
   */
  showWordmark?: boolean
}

const heights = {
  sm: 'h-[clamp(1.5rem,4vw,2rem)]',
  md: 'h-[clamp(1.75rem,4.5vw,2.5rem)]',
  lg: 'h-[clamp(2rem,5vw,3.25rem)]',
} as const

const wordmarkSizes = {
  sm: 'text-[clamp(1rem,2.8vw,1.125rem)]',
  md: 'text-[clamp(1.25rem,3.2vw,1.5rem)]',
  lg: 'text-[clamp(1.5rem,3.8vw,2.25rem)]',
} as const

export function BloomoraLogo({
  className,
  size = 'md',
  showWordmark = true,
}: BloomoraLogoProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-[clamp(0.4rem,1.5vw,0.65rem)]',
        className,
      )}
    >
      <img
        src={tulipanLogo}
        alt={showWordmark ? '' : 'Bloomora'}
        aria-hidden={showWordmark || undefined}
        className={cn(
          'w-auto shrink-0 object-contain object-center',
          heights[size],
        )}
        decoding="async"
      />
      {showWordmark ? (
        <span
          className={cn(
            'bloomora-logo-wordmark font-semibold tracking-[0.03em] text-bloomora-rose-deep',
            wordmarkSizes[size],
          )}
        >
          Bloomora
        </span>
      ) : null}
    </div>
  )
}
