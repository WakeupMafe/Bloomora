import { Link, type LinkProps } from 'react-router-dom'
import { buttonClassName, type ButtonSize, type ButtonVariant } from '@/components/ui/buttonRecipe'
import { cn } from '@/utils/cn'

export type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

/** Enlace de navegación con la misma apariencia y tamaños que Button. */
export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  fullWidth,
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={cn(buttonClassName({ variant, size, fullWidth, className }))} {...props} />
}
