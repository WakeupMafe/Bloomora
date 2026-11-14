import { cn } from '@/utils/cn'

import bunnyCelebrate from '@/assets/bloomy/bunny_celebrate_512.png'
import bunnyCelebrate2x from '@/assets/bloomy/bunny_celebrate.png'
import bunnyCover from '@/assets/bloomy/bunny_cover_eyes_512.png'
import bunnyCover2x from '@/assets/bloomy/bunny_cover_eyes.png'
import bunnyHero from '@/assets/bloomy/bunny_hero_tulip_512.png'
import bunnyHero2x from '@/assets/bloomy/bunny_hero_tulip.png'
import bunnyPeek from '@/assets/bloomy/bunny_peek_512.png'
import bunnyPeek2x from '@/assets/bloomy/bunny_peek.png'
import bunnyPhone from '@/assets/bloomy/bunny_phone_512.png'
import bunnyPhone2x from '@/assets/bloomy/bunny_phone.png'
import bunnySad from '@/assets/bloomy/bunny_sad_512.png'
import bunnySad2x from '@/assets/bloomy/bunny_sad.png'
import bunnySleep from '@/assets/bloomy/bunny_sleep_512.png'
import bunnySleep2x from '@/assets/bloomy/bunny_sleep.png'
import bunnyThink from '@/assets/bloomy/bunny_think_512.png'
import bunnyThink2x from '@/assets/bloomy/bunny_think.png'
import bunnyWave from '@/assets/bloomy/bunny_wave_512.png'
import bunnyWave2x from '@/assets/bloomy/bunny_wave.png'
import sparkle from '@/assets/svg/sparkle.svg'
import sparklePink from '@/assets/svg/sparkle_pink.svg'

export type BloomyPoseId =
  | 'hero'
  | 'wave'
  | 'think'
  | 'phone'
  | 'cover'
  | 'peek'
  | 'celebrate'
  | 'sad'
  | 'sleep'

const POSES: Record<
  BloomyPoseId,
  { src: string; src2x: string; defaultPx: number }
> = {
  hero: { src: bunnyHero, src2x: bunnyHero2x, defaultPx: 232 },
  wave: { src: bunnyWave, src2x: bunnyWave2x, defaultPx: 200 },
  think: { src: bunnyThink, src2x: bunnyThink2x, defaultPx: 168 },
  phone: { src: bunnyPhone, src2x: bunnyPhone2x, defaultPx: 160 },
  cover: { src: bunnyCover, src2x: bunnyCover2x, defaultPx: 184 },
  peek: { src: bunnyPeek, src2x: bunnyPeek2x, defaultPx: 184 },
  celebrate: { src: bunnyCelebrate, src2x: bunnyCelebrate2x, defaultPx: 240 },
  sad: { src: bunnySad, src2x: bunnySad2x, defaultPx: 136 },
  sleep: { src: bunnySleep, src2x: bunnySleep2x, defaultPx: 200 },
}

type BloomyPoseProps = {
  pose: BloomyPoseId
  sizePx?: number
  className?: string
  showSparks?: boolean
  priority?: boolean
}

/** Bloomy sobre círculo lavanda→blush (tokens Bloomora). */
export function BloomyPose({
  pose,
  sizePx,
  className,
  showSparks = true,
  priority = false,
}: BloomyPoseProps) {
  const meta = POSES[pose]
  const img = sizePx ?? meta.defaultPx
  const circle = img + 16

  return (
    <div
      className={cn('bloomy-pose relative mx-auto grid place-items-center', className)}
      style={{ width: circle, height: circle }}
      aria-hidden
    >
      <div
        className="bloomy-pose__blob absolute inset-0 rounded-full"
        style={{
          background:
            'linear-gradient(140deg, var(--color-bloomora-mist), var(--color-bloomora-blush))',
        }}
      />
      {showSparks ? (
        <>
          <img
            src={sparkle}
            alt=""
            className="pointer-events-none absolute top-[4%] right-[2%] w-5"
            aria-hidden
          />
          <img
            src={sparklePink}
            alt=""
            className="pointer-events-none absolute bottom-[12%] left-[2%] w-3.5"
            aria-hidden
          />
        </>
      ) : null}
      <img
        src={meta.src}
        srcSet={`${meta.src} 1x, ${meta.src2x} 2x`}
        alt=""
        width={img}
        height={img}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        className="bloomy-pose__img relative z-[1] max-h-full max-w-full object-contain object-center"
        style={{ width: img, height: img }}
      />
    </div>
  )
}
