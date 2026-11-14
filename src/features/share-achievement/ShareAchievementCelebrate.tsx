import { useEffect, useState } from 'react'
import bunnyCelebrate from '@/assets/bloomy/bunny_celebrate_512.png'
import { Button } from '@/components/ui/Button'
import type { ShareAchievementStats } from '@/features/share-achievement/shareAchievementTypes'
import { cn } from '@/utils/cn'

type ShareAchievementCelebrateProps = {
  open: boolean
  firstName?: string | null
  stats: ShareAchievementStats
  onShare: () => void
  onDismiss: () => void
}

function BloomyCelebrateArt({ sizePx = 180 }: { sizePx?: number }) {
  const [reduceMotion, setReduceMotion] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  if (reduceMotion) {
    return (
      <img
        src={bunnyCelebrate}
        alt="Bloomy celebrando"
        width={600}
        height={600}
        className="object-contain"
        style={{ width: sizePx, height: sizePx }}
      />
    )
  }

  return (
    <picture>
      <source srcSet="/mascota/bloomy_salta.webp" type="image/webp" />
      <img
        src="/mascota/bloomy_salta.gif"
        alt="Bloomy celebrando"
        width={600}
        height={600}
        className="object-contain"
        style={{ width: sizePx, height: sizePx }}
      />
    </picture>
  )
}

export function ShareAchievementCelebrate({
  open,
  firstName,
  stats,
  onShare,
  onDismiss,
}: ShareAchievementCelebrateProps) {
  if (!open) return null
  const name = firstName?.trim() || 'tú'

  return (
    <div
      className="fixed inset-0 z-[10090] flex items-end justify-center bg-bloomora-deep/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-celebrate-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onDismiss()
      }}
    >
      <div
        className={cn(
          'flex w-full max-w-md flex-col items-center rounded-t-[1.75rem] bg-white px-5 pb-6 pt-4 shadow-2xl sm:rounded-[1.75rem] sm:px-6',
        )}
      >
        <BloomyCelebrateArt sizePx={176} />
        <span className="mt-2 inline-flex items-center rounded-pill bg-bloomora-blush px-3 py-1 text-xs font-bold text-bloomora-rose-deep">
          🏅 {stats.badge}
        </span>
        <h2
          id="share-celebrate-title"
          className="mt-3 text-center text-2xl font-bold text-bloomora-deep"
        >
          ¡Lo lograste, {name}!
        </h2>
        <p className="mt-2 text-center text-[0.9375rem] font-medium leading-snug text-bloomora-violet">
          Cumpliste <span className="font-bold text-bloomora-deep">{stats.goalTitle}</span>{' '}
          · {stats.percentLabel}. ¡Bloomy está orgulloso de ti!
        </p>

        <div className="mt-4 grid w-full grid-cols-3 gap-2">
          <div className="rounded-2xl bg-emerald-50 px-2 py-3 text-center">
            <p className="text-xl font-bold tabular-nums text-emerald-800">
              {stats.daysAchieved}
            </p>
            <p className="text-[0.65rem] font-semibold text-emerald-700">
              días logrados
            </p>
          </div>
          <div className="rounded-2xl bg-bloomora-blush px-2 py-3 text-center">
            <p className="text-xl font-bold tabular-nums text-bloomora-rose-deep">
              {stats.currentStreak}
            </p>
            <p className="text-[0.65rem] font-semibold text-bloomora-rose-deep">
              racha actual
            </p>
          </div>
          <div className="rounded-2xl bg-bloomora-lavender-50 px-2 py-3 text-center">
            <p className="text-xl font-bold tabular-nums text-bloomora-deep">
              {stats.percent}%
            </p>
            <p className="text-[0.65rem] font-semibold text-bloomora-violet">
              cumplimiento
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          fullWidth
          className="mt-5 h-[52px] bg-bloomora-rose-deep text-base font-bold text-white hover:bg-bloomora-rose-deep/90"
          onClick={onShare}
        >
          Compartir mi logro
        </Button>
        <Button
          variant="secondary"
          fullWidth
          className="mt-2 h-[52px] text-base font-bold"
          onClick={onDismiss}
        >
          Ahora no
        </Button>
      </div>
    </div>
  )
}
