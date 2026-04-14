import { type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export type DashboardCardProps = HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'div'
}

/**
 * Contenedor de card para el dashboard: mismo radio, sombra y borde suave Bloomora.
 */
export function DashboardCard({
  as: Tag = 'section',
  className,
  ...props
}: DashboardCardProps) {
  return (
    <Tag
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-[22px] shadow-[0_8px_24px_rgba(91,74,140,0.07)] ring-1 ring-bloomora-line/20 sm:rounded-[24px]',
        className,
      )}
      {...props}
    />
  )
}
