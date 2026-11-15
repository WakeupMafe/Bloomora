import type { ReactNode } from 'react'
import { BloomoraImage } from '@/components/ui/BloomoraImage'
import { hasRealFlashcardImage } from '@/features/flashcards/flashcardQuickMode'
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

/** Fondo sólido rosado cuando la flashcard no tiene imagen. */
export const FLASHCARD_NO_IMAGE_SURFACE =
  'bg-[color:var(--color-bloomora-blush,#FDECF2)]'

export function FlashcardImageFrame({
  src,
  size = 'card',
  priority = false,
  variant = 'card',
  className,
  overlay,
}: FlashcardImageFrameProps) {
  const showImage = hasRealFlashcardImage(src)

  return (
    <div
      className={cn(
        'relative flex w-full items-center justify-center',
        showImage
          ? 'bg-gradient-to-b from-bloomora-lavender-50/95 to-bloomora-blush/45 px-3 py-3'
          : cn(FLASHCARD_NO_IMAGE_SURFACE, 'px-0 py-0'),
        variant === 'compact' ? 'min-h-[8rem]' : 'min-h-[10.5rem] sm:min-h-[11rem]',
        className,
      )}
      aria-label={showImage ? undefined : 'Sin imagen'}
    >
      {showImage ? (
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
      ) : null}
      {overlay}
    </div>
  )
}
