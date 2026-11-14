import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'font-bold text-[color:var(--bloomora-on-accent)] bg-[linear-gradient(135deg,var(--bloomora-btn-from),var(--bloomora-btn-to))] shadow-[var(--bloomora-btn-shadow)] hover:shadow-[var(--bloomora-btn-shadow-hover)] hover:brightness-[1.03]',
  secondary:
    'border border-bloomora-line/70 bg-bloomora-white text-bloomora-deep shadow-sm hover:border-bloomora-lilac/60 hover:bg-bloomora-lavender-50/50 hover:shadow-md',
  ghost:
    'text-bloomora-violet hover:bg-bloomora-lavender-50/95 hover:text-bloomora-deep hover:shadow-[inset_0_0_0_1px_rgba(184,168,232,0.2)] active:bg-bloomora-lavender-100/75',
  outline:
    'border border-bloomora-line/70 bg-bloomora-white text-bloomora-violet hover:border-bloomora-lilac/60 hover:bg-bloomora-lavender-50/50',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 text-sm gap-1.5',
  md: 'min-h-11 px-5 text-[0.9375rem] gap-2',
  lg: 'min-h-12 px-7 text-base gap-2',
}

const baseStyles =
  'inline-flex items-center justify-center rounded-pill font-semibold tracking-tight ring-offset-bloomora-snow transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloomora-lilac motion-reduce:transition-none active:scale-[0.98]'

export function buttonClassName(options: {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}) {
  const { variant = 'primary', size = 'md', fullWidth, className } = options
  return cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && 'w-full',
    className,
  )
}
