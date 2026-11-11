import { Link } from 'react-router-dom'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { getCategoryTheme } from '@/features/flashcards/flashcardCategoryTheme'
import { itemCountLabel } from '@/features/flashcards/groupFlashcardsByCategory'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { useBloomoraEnglishFlashcardsDashboard } from '@/hooks/useBloomoraEnglishFlashcards'
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
  const { data, isLoading } = useBloomoraEnglishFlashcardsDashboard(cedula)

  const count = data?.count ?? 0
  const categories = data?.categories ?? []
  const countLabel =
    count === 0
      ? 'Sin palabras'
      : count === 1
        ? '1 palabra'
        : `${count} palabras`

  return (
    <DashboardCard className="overflow-hidden rounded-[clamp(1.25rem,1.05rem+1vw,1.75rem)] border border-bloomora-line/50 bg-white p-5 shadow-[0_5px_18px_rgba(91,74,140,0.06)] ring-0 sm:p-6">
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
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <ButtonLink
            to="/app/flashcards?crear=rapido"
            variant="secondary"
            size="sm"
            className="w-full gap-1.5 sm:w-auto"
          >
            <span aria-hidden>⚡</span>
            Modo rápido
          </ButtonLink>
          <ButtonLink
            to="/app/flashcards"
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
          >
            Abrir flashcards
            <span aria-hidden className="ml-1">
              ›
            </span>
          </ButtonLink>
        </div>
      </div>
      {!isLoading && categories.length > 0 ? (
        <ul
          className="mt-4 flex flex-col gap-2"
          aria-label="Categorías con contenido"
        >
          {categories.map((cat) => {
            const theme = getCategoryTheme(cat.key)
            return (
              <li key={cat.key}>
                <Link
                  to={`/app/flashcards?repasar=${encodeURIComponent(cat.key)}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-bloomora-line/35 bg-bloomora-white/95 px-3.5 py-2.5 shadow-sm ring-1 ring-bloomora-line/20 transition hover:border-bloomora-lilac/40 hover:bg-bloomora-lavender-50/90"
                >
                  <span
                    className={cn(
                      'inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide',
                      theme.badgeClass,
                    )}
                  >
                    {cat.label}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-bloomora-text-muted">
                    ({itemCountLabel(cat.count)})
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : !isLoading ? (
        <p className="mt-4 text-sm text-bloomora-text-muted">
          Crea tu primera palabra con una imagen para memorizarla mejor.
        </p>
      ) : null}
    </DashboardCard>
  )
}
