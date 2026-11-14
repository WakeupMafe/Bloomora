import { forwardRef } from 'react'
import bunnyCelebrate from '@/assets/bloomy/bunny_celebrate_512.png'
import logoTulip from '@/assets/bloomy/logo_tulip.png'
import type {
  ShareAchievementStats,
  ShareFormat,
  ShareStyle,
} from '@/features/share-achievement/shareAchievementTypes'
import { SHARE_EXPORT_SIZE } from '@/features/share-achievement/shareAchievementTypes'
import { cn } from '@/utils/cn'

type ShareAchievementCardProps = {
  stats: ShareAchievementStats
  format: ShareFormat
  style: ShareStyle
  /** Data URL o URL de foto de fondo (estilo foto). */
  photoUrl?: string | null
  className?: string
  /** Escala visual en preview (1 = tamaño export). */
  previewScale?: number
}

export const ShareAchievementCard = forwardRef<
  HTMLDivElement,
  ShareAchievementCardProps
>(function ShareAchievementCard(
  { stats, format, style, photoUrl, className, previewScale = 1 },
  ref,
) {
  const { width, height } = SHARE_EXPORT_SIZE[format]
  const onPhoto = style === 'foto'
  const hasPhoto = onPhoto && !!photoUrl

  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden text-left', className)}
      style={{
        width,
        height,
        transform: previewScale !== 1 ? `scale(${previewScale})` : undefined,
        transformOrigin: 'top left',
        fontFamily: 'Quicksand, system-ui, sans-serif',
      }}
      data-share-card
      data-format={format}
      data-style={style}
    >
      {/* Fondo */}
      {hasPhoto ? (
        <>
          <img
            src={photoUrl!}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/45 to-black/75" />
        </>
      ) : onPhoto ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#c4a4a0] via-[#8b6b78] to-[#3d2a48]" />
          <div className="absolute inset-0 bg-black/25" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(165deg,#FFF9FC_0%,#FDEEF4_40%,#F3E8FF_78%,#E8F4FF_100%)]" />
      )}

      <div
        className={cn(
          'relative flex h-full flex-col',
          format === 'story' ? 'px-[72px] py-[96px]' : 'px-[64px] py-[72px]',
        )}
      >
        {/* Header marca */}
        <div className="flex items-center gap-3">
          <img
            src={logoTulip}
            alt=""
            width={48}
            height={48}
            className="size-12 object-contain"
            draggable={false}
          />
          <div>
            <p
              className={cn(
                'text-[28px] font-bold leading-none',
                onPhoto ? 'text-white' : 'text-bloomora-deep',
              )}
            >
              Bloomora
            </p>
            <p
              className={cn(
                'mt-1 text-[22px] font-semibold',
                onPhoto ? 'text-white/80' : 'text-bloomora-violet',
              )}
            >
              Meta lograda
            </p>
          </div>
        </div>

        <div
          className={cn(
            'mt-8 inline-flex w-fit items-center rounded-full px-5 py-2 text-[24px] font-bold',
            onPhoto
              ? 'bg-white/20 text-white backdrop-blur-sm'
              : 'bg-bloomora-blush text-bloomora-rose-deep',
          )}
        >
          {stats.badge}
        </div>

        <h1
          className={cn(
            'mt-5 text-[64px] font-bold leading-[1.05] tracking-tight',
            onPhoto ? 'text-white' : 'text-bloomora-deep',
          )}
        >
          {stats.headline}
        </h1>
        <p
          className={cn(
            'mt-3 text-[32px] font-bold',
            onPhoto ? 'text-white' : 'text-bloomora-deep',
          )}
        >
          {stats.goalTitle}
        </p>
        <p
          className={cn(
            'mt-1 text-[26px] font-semibold',
            onPhoto ? 'text-white/75' : 'text-bloomora-violet',
          )}
        >
          {stats.dateRangeLabel}
        </p>

        {/* Hero número + Bloomy */}
        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <p
              className={cn(
                'text-[160px] font-bold leading-none tabular-nums',
                onPhoto ? 'text-white' : 'text-bloomora-rose-deep',
              )}
            >
              {stats.daysAchieved}
            </p>
            <p
              className={cn(
                'mt-2 text-[32px] font-bold',
                onPhoto ? 'text-white/85' : 'text-bloomora-violet',
              )}
            >
              días logrados
            </p>
          </div>
          <img
            src={bunnyCelebrate}
            alt=""
            width={320}
            height={320}
            className={cn(
              'object-contain',
              format === 'story' ? 'mb-2 h-[300px] w-[300px]' : 'h-[260px] w-[260px]',
            )}
            draggable={false}
          />
        </div>

        {/* Stats */}
        <div
          className={cn(
            'mt-8 grid grid-cols-3 gap-3 rounded-[28px] p-5',
            onPhoto ? 'bg-white/15 backdrop-blur-md' : 'bg-white/80 ring-1 ring-bloomora-line/30',
          )}
        >
          <StatBlock
            onPhoto={onPhoto}
            value={String(stats.daysSkipped)}
            label="Días saltados"
            hint={stats.skippedLabel}
          />
          <StatBlock
            onPhoto={onPhoto}
            value={String(stats.currentStreak)}
            label="Racha actual"
            hint={stats.streakLabel}
          />
          <StatBlock
            onPhoto={onPhoto}
            value={`${stats.percent}%`}
            label="Cumplimiento"
            hint={stats.percentLabel}
          />
        </div>

        {/* Grid progreso */}
        <div
          className={cn(
            'mt-6 flex-1 rounded-[28px] p-5',
            onPhoto ? 'bg-white/15 backdrop-blur-md' : 'bg-white/75 ring-1 ring-bloomora-line/25',
          )}
        >
          <p
            className={cn(
              'text-[26px] font-bold',
              onPhoto ? 'text-white' : 'text-bloomora-deep',
            )}
          >
            Tu progreso
          </p>
          <div
            className="mt-4 grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${Math.min(8, stats.cells.length)}, minmax(0, 1fr))`,
            }}
          >
            {stats.cells.map((cell) => (
              <div
                key={cell.day}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-xl text-[20px] font-bold tabular-nums',
                  cell.done
                    ? onPhoto
                      ? 'bg-white text-bloomora-rose-deep'
                      : 'bg-bloomora-rose-deep text-white'
                    : onPhoto
                      ? 'border border-dashed border-white/50 text-white/70'
                      : 'border border-dashed border-bloomora-line/50 text-bloomora-text-muted',
                )}
              >
                {cell.day}
              </div>
            ))}
          </div>
        </div>

        <p
          className={cn(
            'mt-auto pt-6 text-center text-[24px] font-semibold',
            onPhoto ? 'text-white/80' : 'text-bloomora-violet',
          )}
        >
          bloomoraplanner.com
        </p>
      </div>
    </div>
  )
})

function StatBlock({
  value,
  label,
  hint,
  onPhoto,
}: {
  value: string
  label: string
  hint: string
  onPhoto: boolean
}) {
  return (
    <div className="min-w-0 text-center">
      <p
        className={cn(
          'text-[40px] font-bold tabular-nums leading-none',
          onPhoto ? 'text-white' : 'text-bloomora-deep',
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          'mt-2 text-[20px] font-bold',
          onPhoto ? 'text-white/85' : 'text-bloomora-violet',
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'mt-1 text-[18px] font-semibold leading-snug',
          onPhoto ? 'text-white/65' : 'text-bloomora-text-muted',
        )}
      >
        {hint}
      </p>
    </div>
  )
}
