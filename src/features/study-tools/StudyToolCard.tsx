import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { cn } from '@/utils/cn'

type StudyToolCardProps = {
  title: string
  description: string
  to: string
  ctaLabel: string
  ctaVariant?: 'primary' | 'secondary'
  chips?: string[]
  visual: ReactNode
  visualClassName?: string
  onClick?: () => void
  className?: string
}

/**
 * Card grande de la página Herramientas: visual + chips + CTA.
 */
export function StudyToolCard({
  title,
  description,
  to,
  ctaLabel,
  ctaVariant = 'primary',
  chips = [],
  visual,
  visualClassName,
  onClick,
  className,
}: StudyToolCardProps) {
  const ctaClass = cn(
    'mt-5 inline-flex h-[52px] w-full items-center justify-center rounded-pill text-base font-bold transition',
    ctaVariant === 'primary'
      ? 'bg-bloomora-rose-deep text-[color:var(--bloomora-accent-on)] shadow-[0_4px_12px_rgba(232,155,184,0.35)] hover:bg-bloomora-rose-deep/90'
      : 'border-2 border-bloomora-line bg-bloomora-white text-bloomora-violet hover:bg-bloomora-mist/70',
  )

  const body = (
    <>
      <div
        className={cn(
          'relative flex h-[150px] items-center justify-center overflow-hidden rounded-[1.25rem]',
          visualClassName,
        )}
      >
        {visual}
      </div>
      <h3 className="mt-5 text-[1.3125rem] font-bold text-bloomora-deep">
        {title}
      </h3>
      <p className="mt-1 flex-1 text-[0.9375rem] leading-snug text-bloomora-violet">
        {description}
      </p>
      {chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="inline-flex min-h-8 items-center rounded-pill bg-bloomora-mist px-3 text-[0.8125rem] font-semibold text-bloomora-violet"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      {onClick ? (
        <button type="button" className={ctaClass} onClick={onClick}>
          {ctaLabel}
        </button>
      ) : (
        <span className={ctaClass}>{ctaLabel}</span>
      )}
    </>
  )

  if (onClick) {
    return (
      <DashboardCard
        as="div"
        className={cn(
          'flex h-full flex-col p-5 max-[599px]:p-5 min-[600px]:p-6',
          className,
        )}
      >
        {body}
      </DashboardCard>
    )
  }

  return (
    <Link to={to} className="group block min-w-0 h-full">
      <DashboardCard
        as="div"
        className={cn(
          'flex h-full flex-col p-5 transition group-hover:-translate-y-0.5 max-[599px]:p-5 min-[600px]:p-6',
          className,
        )}
      >
        {body}
      </DashboardCard>
    </Link>
  )
}
