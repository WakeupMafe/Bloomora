import { type ButtonHTMLAttributes, forwardRef } from 'react'
import {
  buttonClassName,
  type ButtonSize,
  type ButtonVariant,
} from '@/components/ui/buttonRecipe'
import { cn } from '@/utils/cn'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    fullWidth,
    type = 'button',
    disabled,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        buttonClassName({ variant, size, fullWidth, className }),
        disabled && 'pointer-events-none opacity-45',
      )}
      {...props}
    />
  )
})
