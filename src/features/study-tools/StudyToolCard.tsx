import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { bloomoraPanelCardClass } from '@/components/ui/formControls'
import { cn } from '@/utils/cn'

type StudyToolCardProps = {
  title: string
  description: string
  to: string
  icon: ReactNode
  className?: string
}

export function StudyToolCard({
  title,
  description,
  to,
  icon,
  className,
}: StudyToolCardProps) {
  return (
    <Link to={to} className="group block min-w-0">
      <Card
        variant="glass"
        className={cn(
          bloomoraPanelCardClass,
          'p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-18px_rgba(124,107,181,0.28)]',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/90 ring-1 ring-bloomora-line/30">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-bloomora-deep">{title}</h3>
            <p className="mt-1 text-sm text-bloomora-text-muted">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}

