import {
  QUICK_FLASHCARD_DAILY_LIMIT,
  type FlashcardCreateMode,
  type QuickFlashcardQuota,
} from '@/features/flashcards/flashcardQuickMode'
import { cn } from '@/utils/cn'

type FlashcardCreateModeBarProps = {
  mode: FlashcardCreateMode
  onModeChange: (mode: FlashcardCreateMode) => void
  quickQuota: QuickFlashcardQuota
  onCreateFull: () => void
  onCreateQuick: () => void
  layout?: 'stack' | 'row'
}

export function FlashcardCreateModeBar({
  mode,
  onModeChange,
  quickQuota,
  onCreateFull,
  onCreateQuick,
  layout = 'stack',
}: FlashcardCreateModeBarProps) {
  const quickDisabled = !quickQuota.canCreate

  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        layout === 'row' && 'sm:flex-row sm:items-end sm:justify-end',
      )}
    >
      <div
        className="flex w-full flex-col gap-2 sm:w-auto"
        role="group"
        aria-label="Modo de creación"
      >
        <span className="text-[0.65rem] font-bold uppercase tracking-wide text-bloomora-text-muted">
          Modo al crear
        </span>
        <div className="flex rounded-xl bg-bloomora-lavender-50/80 p-1 ring-1 ring-bloomora-line/30">
          <button
            type="button"
            onClick={() => onModeChange('full')}
            className={cn(
              'flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none sm:min-w-[7.5rem]',
              mode === 'full'
                ? 'bg-white text-bloomora-deep shadow-sm ring-1 ring-bloomora-line/25'
                : 'text-bloomora-text-muted hover:text-bloomora-deep',
            )}
          >
            Completo
          </button>
          <button
            type="button"
            onClick={() => onModeChange('quick')}
            className={cn(
              'flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none sm:min-w-[7.5rem]',
              mode === 'quick'
                ? 'bg-white text-bloomora-violet shadow-sm ring-1 ring-bloomora-violet/25'
                : 'text-bloomora-text-muted hover:text-bloomora-violet',
            )}
          >
            Rápido
          </button>
        </div>
        <p className="text-[0.7rem] leading-snug text-bloomora-text-muted">
          {mode === 'quick' ? (
            <>
              Solo palabra + significado (hasta {QUICK_FLASHCARD_DAILY_LIMIT} al día, completas
              o pendientes). Imagen y ejemplos después.
              {quickQuota.canCreate ? (
                <span className="font-semibold text-bloomora-violet">
                  {' '}
                  · {quickQuota.remaining} restante{quickQuota.remaining === 1 ? '' : 's'}{' '}
                  hoy
                </span>
              ) : null}
            </>
          ) : (
            'Imagen, categoría, ejemplos y más en un solo paso.'
          )}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onCreateFull}
          className={cn(
            'inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition sm:w-auto',
            mode === 'full'
              ? 'bg-gradient-to-r from-[#f687b3] via-[#f9a8d4] to-[#f6ad55] text-white shadow-[0_8px_28px_-6px_rgba(236,72,153,0.45)] hover:brightness-[1.03]'
              : 'bg-white text-bloomora-deep ring-1 ring-bloomora-line/35 hover:bg-bloomora-lavender-50/80',
          )}
        >
          <span className="text-lg leading-none" aria-hidden>
            +
          </span>
          Nueva palabra
        </button>
        <button
          type="button"
          onClick={onCreateQuick}
          disabled={quickDisabled}
          title={
            quickDisabled
              ? `Límite de ${quickQuota.limit} tarjetas rápidas hoy`
              : 'Añadir palabra y significado al momento'
          }
          className={cn(
            'inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition sm:w-auto',
            mode === 'quick'
              ? 'bg-bloomora-violet text-white shadow-[0_8px_24px_-8px_rgba(91,74,140,0.55)] hover:brightness-110'
              : 'bg-bloomora-lavender-50 text-bloomora-violet ring-1 ring-bloomora-violet/25 hover:bg-bloomora-lavender-100/80',
            quickDisabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <span className="text-lg leading-none" aria-hidden>
            ⚡
          </span>
          Modo rápido
        </button>
      </div>
    </div>
  )
}
