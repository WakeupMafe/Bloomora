import type { ReactNode } from 'react'
import { BloomoraImage } from '@/components/ui/BloomoraImage'
import type { ImageSizePreset } from '@/utils/imageUrl'
import { cn } from '@/utils/cn'

type FlashcardImageFrameProps = {
  src: string
  size?: ImageSizePreset
  priority?: boolean
  /** Altura máxima de la imagen dentro del marco. */
  variant?: 'card' | 'deck' | 'compact'
  className?: string
  overlay?: ReactNode
}

const IMAGE_MAX: Record<NonNullable<FlashcardImageFrameProps['variant']>, string> = {
  card: 'max-h-44 sm:max-h-48',
  deck: 'max-h-40 sm:max-h-44',
  compact: 'max-h-32',
}

export function FlashcardImageFrame({
  src,
  size = 'card',
  priority = false,
  variant = 'card',
  className,
  overlay,
}: FlashcardImageFrameProps) {
  return (
    <div
      className={cn(
        'relative flex w-full items-center justify-center',
        'bg-gradient-to-b from-bloomora-lavender-50/95 to-bloomora-blush/45 px-3 py-3',
        variant === 'compact' ? 'min-h-[8rem]' : 'min-h-[10.5rem] sm:min-h-[11rem]',
        className,
      )}
    >
      <BloomoraImage
        src={src}
        alt=""
        size={size}
        priority={priority}
        className={cn(
          'mx-auto block h-auto w-full object-contain',
          IMAGE_MAX[variant],
        )}
      />
      {overlay}
    </div>
  )
}
