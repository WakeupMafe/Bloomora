import { type MouseEventHandler } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/utils/cn'

type BackButtonProps = {
  /** Ruta padre si no hay historial interno (nunca forzar `/`). */
  parentTo: string
  /** Nombre de la página padre (visible en PC). */
  parentLabel: string
  className?: string
  /** Forzar solo ícono aunque sea PC. */
  iconOnly?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
}

function BackChevron({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

/**
 * Volver contextual: en móvil/tablet solo chevron; en PC chevron + página padre.
 * Si hay historial interno (`location.key !== "default"`) → `navigate(-1)`;
 * si no → `parentTo`. Nunca navega a `/`.
 */
export function BackButton({
  parentTo,
  parentLabel,
  className,
  iconOnly = false,
  onClick,
}: BackButtonProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isPc = useMediaQuery('(min-width: 1024px)')
  const showLabel = isPc && !iconOnly

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    onClick?.(e)
    if (e.defaultPrevented) return
    if (location.key !== 'default') {
      navigate(-1)
      return
    }
    navigate(parentTo)
  }

  return (
    <button
      type="button"
      className={cn('bloomora-back-btn', showLabel && 'bloomora-back-btn--labeled', className)}
      aria-label={`Volver a ${parentLabel}`}
      onClick={handleClick}
    >
      <BackChevron className="bloomora-back-btn__icon" />
      {showLabel ? (
        <span className="bloomora-back-btn__label">{parentLabel}</span>
      ) : null}
    </button>
  )
}
