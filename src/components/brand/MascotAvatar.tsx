import conejoAvatar from '@/assets/ConejoAvatar.png'
import { cn } from '@/utils/cn'

type MascotAvatarProps = {
  className?: string
  /** Accessible description */
  alt?: string
}

/**
 * Mascota principal de Bloomora (avatar del conejito) para pantallas como la bienvenida.
 */
export function MascotAvatar({
  className,
  alt = 'Conejito Bloomora con un tulipán rosado',
}: MascotAvatarProps) {
  return (
    <img
      src={conejoAvatar}
      alt={alt}
      decoding="async"
      className={cn('h-auto max-w-full object-contain', className)}
    />
  )
}
