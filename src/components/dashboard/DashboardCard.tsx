import { type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export type DashboardCardProps = HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'div'
}

/**
 * Card del dashboard: blanco, borde line, radius 28, sombra suave.
 */
export function DashboardCard({
  as: Tag = 'section',
  className,
  ...props
}: DashboardCardProps) {
  return (
    <Tag
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-bloomora-line bg-bloomora-white shadow-[0_1px_2px_rgba(91,74,140,0.04),0_12px_32px_rgba(91,74,140,0.08)] max-[599px]:rounded-[24px]',
        className,
      )}
      {...props}
    />
  )
}
