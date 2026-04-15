import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[linear-gradient(90deg,#ff9aab_0%,#ffc2d1_100%)] text-white font-semibold shadow-[0_12px_32px_-8px_rgba(255,154,171,0.5)] hover:brightness-[1.08] hover:saturate-[1.06] hover:shadow-[0_14px_40px_-8px_rgba(255,140,160,0.58)]',
  secondary:
    'bg-bloomora-white/80 text-bloomora-deep shadow-bloomora-card ring-1 ring-bloomora-line hover:bg-bloomora-white hover:ring-bloomora-lilac/50 hover:shadow-[0_10px_32px_-14px_rgba(124,107,181,0.24)] hover:text-bloomora-deep',
  ghost:
    'text-bloomora-violet hover:bg-bloomora-lavender-50/95 hover:text-bloomora-deep hover:shadow-[inset_0_0_0_1px_rgba(184,168,232,0.2)] active:bg-bloomora-lavender-100/75',
  outline:
    'border border-bloomora-line bg-transparent text-bloomora-deep hover:border-bloomora-lilac/50 hover:bg-bloomora-blush/75 hover:text-bloomora-deep hover:shadow-[0_6px_22px_-10px_rgba(124,107,181,0.18)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 text-sm gap-1.5',
  md: 'min-h-11 px-5 text-[0.9375rem] gap-2',
  lg: 'min-h-12 px-7 text-base gap-2',
}

const baseStyles =
  'inline-flex items-center justify-center rounded-pill font-medium tracking-tight ring-offset-bloomora-snow transition-[transform,box-shadow,background-color,border-color,color,filter,opacity] duration-[220ms] ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloomora-lilac motion-reduce:transition-none motion-reduce:active:scale-100 active:scale-[0.972] active:duration-150 active:ease-out'

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
