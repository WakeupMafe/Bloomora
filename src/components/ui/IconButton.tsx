import { type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  tone?: 'neutral' | 'primary' | 'danger'
}

/** Botón compacto para acciones representadas solo por un icono. */
export function IconButton({ label, tone = 'neutral', className, type = 'button', ...props }: IconButtonProps) {
  const tones = {
    neutral: 'bg-white text-bloomora-violet ring-bloomora-line/70 hover:bg-bloomora-lavender-50',
    primary: 'bg-bloomora-rose text-white ring-bloomora-rose/30 hover:bg-bloomora-rose-deep',
    danger: 'bg-rose-50 text-rose-600 ring-rose-200 hover:bg-rose-100',
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
