import { BloomyPose } from '@/components/brand/BloomyPose'
import { cn } from '@/utils/cn'
import zzz from '@/assets/svg/zzz.svg'

type EmptyDayStateProps = {
  /** Reservado: el CTA principal vive en el header de la card (+ Tarea). */
  onAddTask?: () => void
  onDuplicate?: () => void
  duplicateDisabled?: boolean
  className?: string
}

/**
 * Estado vacío del día: Bloomy dormido + copy del mock + CTA duplicar.
 * Conserva object-contain en bunny_sleep (no romper el fix).
 */
export function EmptyDayState({
  onDuplicate,
  duplicateDisabled,
  className,
}: EmptyDayStateProps) {
  return (
    <div
      className={cn(
        'flex w-full min-h-0 flex-col items-center justify-start gap-2 px-2 py-4 text-center',
        className,
      )}
    >
      <div className="relative shrink-0">
        <BloomyPose
          pose="sleep"
          sizePx={148}
          showSparks={false}
          className="overflow-hidden rounded-full"
        />
        <img
          src={zzz}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -top-0.5 -right-1 w-10 sm:w-11"
        />
      </div>
      <h3 className="text-[1.1875rem] font-bold text-bloomora-deep">
        Tu día está libre
      </h3>
      <p className="max-w-xs text-[0.9375rem] font-medium leading-snug text-bloomora-violet">
        Agrega tu primera tarea o copia la de ayer
      </p>
      {onDuplicate ? (
        <button
          type="button"
          disabled={duplicateDisabled}
          onClick={onDuplicate}
          className="mt-2 inline-flex min-h-11 items-center justify-center rounded-pill border-2 border-bloomora-line bg-bloomora-white px-5 text-[0.9375rem] font-semibold text-bloomora-violet transition hover:bg-bloomora-mist/60 disabled:opacity-50"
        >
          Duplicar al día siguiente
        </button>
      ) : null}
    </div>
  )
}
