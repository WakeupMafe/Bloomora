import { type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'elevated' | 'subtle' | 'glass'
}

const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
  elevated: 'bg-bloomora-white shadow-bloomora-card ring-1 ring-bloomora-line',
  subtle: 'bg-bloomora-mist/80 ring-1 ring-bloomora-line',
  glass: 'bg-bloomora-white/70 backdrop-blur-md ring-1 ring-white/60 shadow-bloomora-soft',
}

export function Card({ className, variant = 'elevated', ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-xl p-4', variantStyles[variant], className)}
      {...props}
    />
  )
}
