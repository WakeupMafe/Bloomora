import { memo, useEffect, useState, type ImgHTMLAttributes } from 'react'
import { optimizeImageUrl, type ImageSizePreset } from '@/utils/imageUrl'
import { cn } from '@/utils/cn'

export type BloomoraImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'loading' | 'decoding' | 'fetchPriority'
> & {
  src: string
  /** Redimensionado en Supabase; `full` = URL original. */
  size?: ImageSizePreset
  /** LCP / above-the-fold: carga inmediata sin lazy. */
  priority?: boolean
}

export const BloomoraImage = memo(function BloomoraImage({
  src,
  alt = '',
  size = 'card',
  priority = false,
  className,
  onError,
  ...rest
}: BloomoraImageProps) {
  const optimized = optimizeImageUrl(src, size)
  const [resolvedSrc, setResolvedSrc] = useState(optimized)

  useEffect(() => {
    setResolvedSrc(optimized)
  }, [optimized])

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={cn(className)}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      onError={(e) => {
        if (resolvedSrc !== src) setResolvedSrc(src)
        onError?.(e)
      }}
      {...rest}
    />
  )
})
