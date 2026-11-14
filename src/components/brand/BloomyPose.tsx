import { cn } from '@/utils/cn'

import bunnyCelebratePng from '@/assets/bloomy/bunny_celebrate_512.png'
import bunnyCelebrate1xAvif from '@/assets/bloomy/bunny_celebrate_1x.avif'
import bunnyCelebrate1xWebp from '@/assets/bloomy/bunny_celebrate_1x.webp'
import bunnyCelebrate2xAvif from '@/assets/bloomy/bunny_celebrate_2x.avif'
import bunnyCelebrate2xWebp from '@/assets/bloomy/bunny_celebrate_2x.webp'
import bunnyCoverPng from '@/assets/bloomy/bunny_cover_eyes_512.png'
import bunnyCover1xAvif from '@/assets/bloomy/bunny_cover_eyes_1x.avif'
import bunnyCover1xWebp from '@/assets/bloomy/bunny_cover_eyes_1x.webp'
import bunnyCover2xAvif from '@/assets/bloomy/bunny_cover_eyes_2x.avif'
import bunnyCover2xWebp from '@/assets/bloomy/bunny_cover_eyes_2x.webp'
import bunnyHeroPng from '@/assets/bloomy/bunny_hero_tulip_512.png'
import bunnyHero1xAvif from '@/assets/bloomy/bunny_hero_tulip_1x.avif'
import bunnyHero1xWebp from '@/assets/bloomy/bunny_hero_tulip_1x.webp'
import bunnyHero2xAvif from '@/assets/bloomy/bunny_hero_tulip_2x.avif'
import bunnyHero2xWebp from '@/assets/bloomy/bunny_hero_tulip_2x.webp'
import bunnyPeekPng from '@/assets/bloomy/bunny_peek_512.png'
import bunnyPeek1xAvif from '@/assets/bloomy/bunny_peek_1x.avif'
import bunnyPeek1xWebp from '@/assets/bloomy/bunny_peek_1x.webp'
import bunnyPeek2xAvif from '@/assets/bloomy/bunny_peek_2x.avif'
import bunnyPeek2xWebp from '@/assets/bloomy/bunny_peek_2x.webp'
import bunnyPhonePng from '@/assets/bloomy/bunny_phone_512.png'
import bunnyPhone1xAvif from '@/assets/bloomy/bunny_phone_1x.avif'
import bunnyPhone1xWebp from '@/assets/bloomy/bunny_phone_1x.webp'
import bunnyPhone2xAvif from '@/assets/bloomy/bunny_phone_2x.avif'
import bunnyPhone2xWebp from '@/assets/bloomy/bunny_phone_2x.webp'
import bunnySadPng from '@/assets/bloomy/bunny_sad_512.png'
import bunnySad1xAvif from '@/assets/bloomy/bunny_sad_1x.avif'
import bunnySad1xWebp from '@/assets/bloomy/bunny_sad_1x.webp'
import bunnySad2xAvif from '@/assets/bloomy/bunny_sad_2x.avif'
import bunnySad2xWebp from '@/assets/bloomy/bunny_sad_2x.webp'
import bunnySleepPng from '@/assets/bloomy/bunny_sleep_512.png'
import bunnySleep1xAvif from '@/assets/bloomy/bunny_sleep_1x.avif'
import bunnySleep1xWebp from '@/assets/bloomy/bunny_sleep_1x.webp'
import bunnySleep2xAvif from '@/assets/bloomy/bunny_sleep_2x.avif'
import bunnySleep2xWebp from '@/assets/bloomy/bunny_sleep_2x.webp'
import bunnyThinkPng from '@/assets/bloomy/bunny_think_512.png'
import bunnyThink1xAvif from '@/assets/bloomy/bunny_think_1x.avif'
import bunnyThink1xWebp from '@/assets/bloomy/bunny_think_1x.webp'
import bunnyThink2xAvif from '@/assets/bloomy/bunny_think_2x.avif'
import bunnyThink2xWebp from '@/assets/bloomy/bunny_think_2x.webp'
import bunnyWavePng from '@/assets/bloomy/bunny_wave_512.png'
import bunnyWave1xAvif from '@/assets/bloomy/bunny_wave_1x.avif'
import bunnyWave1xWebp from '@/assets/bloomy/bunny_wave_1x.webp'
import bunnyWave2xAvif from '@/assets/bloomy/bunny_wave_2x.avif'
import bunnyWave2xWebp from '@/assets/bloomy/bunny_wave_2x.webp'
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

type PoseAssets = {
  png: string
  avif1x: string
  avif2x: string
  webp1x: string
  webp2x: string
  defaultPx: number
}

const POSES: Record<BloomyPoseId, PoseAssets> = {
  hero: {
    png: bunnyHeroPng,
    avif1x: bunnyHero1xAvif,
    avif2x: bunnyHero2xAvif,
    webp1x: bunnyHero1xWebp,
    webp2x: bunnyHero2xWebp,
    defaultPx: 232,
  },
  wave: {
    png: bunnyWavePng,
    avif1x: bunnyWave1xAvif,
    avif2x: bunnyWave2xAvif,
    webp1x: bunnyWave1xWebp,
    webp2x: bunnyWave2xWebp,
    defaultPx: 200,
  },
  think: {
    png: bunnyThinkPng,
    avif1x: bunnyThink1xAvif,
    avif2x: bunnyThink2xAvif,
    webp1x: bunnyThink1xWebp,
    webp2x: bunnyThink2xWebp,
    defaultPx: 168,
  },
  phone: {
    png: bunnyPhonePng,
    avif1x: bunnyPhone1xAvif,
    avif2x: bunnyPhone2xAvif,
    webp1x: bunnyPhone1xWebp,
    webp2x: bunnyPhone2xWebp,
    defaultPx: 160,
  },
  cover: {
    png: bunnyCoverPng,
    avif1x: bunnyCover1xAvif,
    avif2x: bunnyCover2xAvif,
    webp1x: bunnyCover1xWebp,
    webp2x: bunnyCover2xWebp,
    defaultPx: 184,
  },
  peek: {
    png: bunnyPeekPng,
    avif1x: bunnyPeek1xAvif,
    avif2x: bunnyPeek2xAvif,
    webp1x: bunnyPeek1xWebp,
    webp2x: bunnyPeek2xWebp,
    defaultPx: 184,
  },
  celebrate: {
    png: bunnyCelebratePng,
    avif1x: bunnyCelebrate1xAvif,
    avif2x: bunnyCelebrate2xAvif,
    webp1x: bunnyCelebrate1xWebp,
    webp2x: bunnyCelebrate2xWebp,
    defaultPx: 240,
  },
  sad: {
    png: bunnySadPng,
    avif1x: bunnySad1xAvif,
    avif2x: bunnySad2xAvif,
    webp1x: bunnySad1xWebp,
    webp2x: bunnySad2xWebp,
    defaultPx: 136,
  },
  sleep: {
    png: bunnySleepPng,
    avif1x: bunnySleep1xAvif,
    avif2x: bunnySleep2xAvif,
    webp1x: bunnySleep1xWebp,
    webp2x: bunnySleep2xWebp,
    defaultPx: 200,
  },
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
      <picture>
        <source
          type="image/avif"
          srcSet={`${meta.avif1x} 1x, ${meta.avif2x} 2x`}
        />
        <source
          type="image/webp"
          srcSet={`${meta.webp1x} 1x, ${meta.webp2x} 2x`}
        />
        <img
          src={meta.png}
          alt=""
          width={img}
          height={img}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : undefined}
          className="bloomy-pose__img relative z-[1] max-h-full max-w-full object-contain object-center"
          style={{ width: img, height: img }}
        />
      </picture>
    </div>
  )
}
