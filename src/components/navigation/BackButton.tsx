import { type MouseEventHandler } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { buttonClassName } from '@/components/ui/buttonRecipe'
import { cn } from '@/utils/cn'

type BackButtonProps = {
  to?: string
  label?: string
  className?: string
  onClick?: MouseEventHandler<HTMLButtonElement>
}

export function BackButton({
  to,
  label = 'Volver',
  className,
  onClick,
}: BackButtonProps) {
  const navigate = useNavigate()
  const classes = buttonClassName({
    variant: 'outline',
    size: 'sm',
    className: cn(
      'gap-1.5 border-bloomora-line/55 bg-white/75 text-bloomora-violet shadow-sm hover:bg-bloomora-white hover:text-bloomora-deep',
      className,
    ),
  })

  if (to) {
    return (
      <Link to={to} className={classes}>
        <span aria-hidden>←</span>
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) navigate(-1)
      }}
    >
      <span aria-hidden>←</span>
      <span>{label}</span>
    </button>
  )
}
