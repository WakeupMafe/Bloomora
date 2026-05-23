import conejoAvatar from '@/assets/ConejoAvatar.png'
import { BloomoraImage } from '@/components/ui/BloomoraImage'
import { cn } from '@/utils/cn'

type MascotAvatarProps = {
  className?: string
  /** Accessible description */
  alt?: string
  priority?: boolean
}

/**
 * Mascota principal de Bloomora (avatar del conejito) para pantallas como la bienvenida.
 */
export function MascotAvatar({
  className,
  alt = 'Conejito Bloomora con un tulipán rosado',
  priority = false,
}: MascotAvatarProps) {
  return (
    <BloomoraImage
      src={conejoAvatar}
      alt={alt}
      size="full"
      priority={priority}
      className={cn('h-auto max-w-full object-contain', className)}
    />
  )
}
