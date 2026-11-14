import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type DashboardQuickActionProps = {
  label: string
  description?: string
  icon: ReactNode
  iconClassName?: string
  className?: string
  to?: string
  onClick?: () => void
  disabled?: boolean
}

/** Acceso rápido horizontal para paneles del dashboard, con estilo y foco unificados. */
export function DashboardQuickAction({
  label,
  description,
  icon,
  iconClassName,
  className,
  to,
  onClick,
  disabled = false,
}: DashboardQuickActionProps) {
  const content = (
    <>
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl bg-bloomora-lavender-50 text-bloomora-violet ring-1 ring-bloomora-line/35 sm:size-11', iconClassName)} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold leading-tight text-bloomora-deep">{label}</span>
        {description ? <span className="mt-0.5 block truncate text-xs leading-snug text-bloomora-text-muted">{description}</span> : null}
      </span>
      <span aria-hidden className="text-lg leading-none text-bloomora-text-muted/70">›</span>
    </>
  )
  const classNames = cn(
    'group flex min-h-[4.25rem] w-full items-center gap-3.5 rounded-[1.125rem] border border-bloomora-line bg-white px-4 py-3 text-left transition-colors',
    'hover:border-bloomora-lilac/50 hover:bg-bloomora-mist/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bloomora-lilac/50',
    disabled && 'pointer-events-none opacity-50',
    className,
  )

  if (to && !disabled) return <Link to={to} className={classNames}>{content}</Link>
  return <button type="button" className={classNames} onClick={onClick} disabled={disabled}>{content}</button>
}
