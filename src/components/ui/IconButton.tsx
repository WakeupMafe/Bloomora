import { type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  tone?: 'neutral' | 'primary' | 'danger'
}

/** Botón compacto para acciones representadas solo por un icono. */
export function IconButton({ label, tone = 'neutral', className, type = 'button', ...props }: IconButtonProps) {
  const tones = {
    neutral:
      'bg-[color:var(--bloomora-surface-1)] text-[color:var(--bloomora-accent)] ring-[color:var(--bloomora-border)] hover:bg-[color:var(--bloomora-surface-3)]',
    primary:
      'bg-[color:var(--bloomora-accent-bg)] text-[color:var(--bloomora-accent-on)] ring-[color:var(--bloomora-accent-bg)] hover:brightness-105',
    danger:
      'bg-[color:var(--bloomora-danger-soft)] text-[color:var(--bloomora-danger-fg)] ring-[color:var(--bloomora-danger-fg)] hover:brightness-110',
  }
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloomora-lilac disabled:pointer-events-none disabled:opacity-45', tones[tone], className)}
      {...props}
    />
  )
}
