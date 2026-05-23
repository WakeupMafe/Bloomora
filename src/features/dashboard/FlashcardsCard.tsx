import { Link } from 'react-router-dom'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { useBloomoraEnglishFlashcards } from '@/hooks/useBloomoraEnglishFlashcards'
import { primaryEnglishDisplay } from '@/features/flashcards/verbFormsCodec'
import { cn } from '@/utils/cn'

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 7H20v13H6.5A2.5 2.5 0 0 0 4 19.5v-15z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function FlashcardsCard() {
  const { cedula } = useUserPhone()
  const { data: cards = [], isLoading } = useBloomoraEnglishFlashcards(cedula)

  const count = cards.length
  const countLabel =
    count === 0
      ? 'Sin palabras'
      : count === 1
        ? '1 palabra'
        : `${count} palabras`

  const preview = cards.slice(0, 3)

  return (
    <DashboardCard className="overflow-hidden rounded-[clamp(1.25rem,1.05rem+1vw,1.75rem)] bg-gradient-to-br from-bloomora-white via-bloomora-lavender-50/40 to-bloomora-blush/60 p-5 shadow-[0_12px_40px_-18px_rgba(124,107,181,0.18)] ring-1 ring-bloomora-line/30 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bloomora-lavender-100/90 text-bloomora-violet ring-1 ring-bloomora-lilac/25">
            <BookIcon />
          </span>
          <h2 className="text-lg font-bold tracking-tight text-bloomora-deep sm:text-xl">
            English Flashcards
          </h2>
          <span className="rounded-full bg-bloomora-lavender-100/90 px-3 py-0.5 text-xs font-semibold text-bloomora-violet shadow-sm ring-1 ring-bloomora-lilac/30">
            {isLoading ? '…' : countLabel}
          </span>
        </div>
        <Link
          to="/app/flashcards"
          className={cn(
            'inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_-6px_var(--bloomora-list-panel-glow)] transition sm:w-auto',
            'bg-gradient-to-r from-[var(--bloomora-list-cta-from)] via-[var(--bloomora-list-cta-via)] to-[var(--bloomora-list-cta-to)] hover:brightness-[1.04]',
          )}
        >
          Abrir flashcards
          <span aria-hidden className="ml-1">
            ›
          </span>
        </Link>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-bloomora-text-muted">
        Vocabulario en inglés con imagen y tarjetas que puedes voltear.
      </p>

      {!isLoading && preview.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Vista previa">
          {preview.map((c) => (
            <li key={c.id}>
              <Link
                to="/app/flashcards"
                className="inline-flex max-w-[14rem] items-center gap-2 rounded-full border border-bloomora-line/40 bg-bloomora-white/95 py-1.5 pl-1.5 pr-3 text-sm font-semibold text-bloomora-deep shadow-sm ring-1 ring-bloomora-line/25 transition hover:bg-bloomora-lavender-50/95"
              >
                <img
                  src={c.imageUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-bloomora-line/25"
                />
                <span className="min-w-0 truncate">
                  {primaryEnglishDisplay(c.englishWord, c.category)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : !isLoading ? (
        <p className="mt-4 text-sm text-bloomora-text-muted">
          Crea tu primera palabra con una imagen para memorizarla mejor.
        </p>
      ) : null}
    </DashboardCard>
  )
}
