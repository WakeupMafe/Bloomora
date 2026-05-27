import { type FormEvent, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import {
  useAddListMutation,
  useBloomoraLists,
} from '@/hooks/useBloomoraLists'
import { cn } from '@/utils/cn'

const LIST_PREVIEW_ICONS = ['⭐', '💗', '📝'] as const

function ListBulletIcon({ className }: { className?: string }) {
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
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function GridNavIcon({ className }: { className?: string }) {
  const cell = {
    stroke: 'currentColor' as const,
    strokeWidth: 1.75,
    fill: 'none' as const,
    rx: 1,
  }
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect x="4" y="5" width="7" height="7" {...cell} />
      <rect x="13" y="5" width="7" height="7" {...cell} />
      <rect x="4" y="14" width="7" height="7" {...cell} />
      <rect x="13" y="14" width="7" height="7" {...cell} />
    </svg>
  )
}

export function ListsCard() {
  const { cedula } = useUserPhone()
  const { data: lists = [], isLoading } = useBloomoraLists(cedula)
  const addListMut = useAddListMutation(cedula)

  const [draftTitle, setDraftTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const count = lists.length
  const countLabel = count === 1 ? '1 lista' : `${count} listas`

  const listIcons = useMemo(() => {
    return lists.map((_, i) => LIST_PREVIEW_ICONS[i % LIST_PREVIEW_ICONS.length])
  }, [lists])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const t = draftTitle.trim()
    if (!t) return
    addListMut.mutate(t)
    setDraftTitle('')
  }

  const focusCreateInput = () => {
    inputRef.current?.focus({ preventScroll: false })
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <DashboardCard
      className={cn(
        'bloomora-lists-card !grid min-h-0 overflow-hidden',
        'rounded-[clamp(1.25rem,1.05rem+1vw,1.75rem)]',
        'bg-gradient-to-br from-bloomora-white via-bloomora-blush to-bloomora-lavender-50/50',
        'p-[clamp(1rem,0.75rem+0.85vw,1.5rem)]',
        'shadow-[0_12px_40px_-18px_rgba(124,107,181,0.18)] ring-1 ring-bloomora-line/30',
        'sm:shadow-[0_16px_48px_-20px_rgba(124,107,181,0.2)]',
      )}
    >
      <header className="bloomora-lists-card__header">
        <div className="bloomora-lists-card__heading">
          <h2 className="bloomora-lists-card__title">Tus listas</h2>
          <span className="bloomora-lists-card__badge">
            {isLoading ? '…' : countLabel}
          </span>
        </div>
        <p className="bloomora-lists-card__desc">
          Organiza listas para cualquier cosa
        </p>
        <div className="bloomora-lists-card__actions">
          <button
            type="button"
            onClick={focusCreateInput}
            className="bloomora-lists-card__action-btn"
          >
            <span aria-hidden className="text-base leading-none">
              +
            </span>
            Nueva lista
          </button>
          <Link to="/app/lists" className="bloomora-lists-card__action-btn">
            Ver todas
            <span aria-hidden className="text-xs opacity-90">
              ›
            </span>
          </Link>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-bloomora-text-muted">Cargando listas…</p>
      ) : null}

      {!isLoading && count > 0 ? (
        <ul className="bloomora-lists-card__preview" aria-label="Vista previa de listas">
          {lists.map((list, idx) => (
            <li key={list.id} className="min-w-0">
              <Link
                to={`/app/lists?list=${encodeURIComponent(list.id)}`}
                className="bloomora-lists-card__preview-item"
              >
                <span className="bloomora-lists-card__preview-icon" aria-hidden>
                  {listIcons[idx]}
                </span>
                <span className="bloomora-lists-card__preview-label">
                  {list.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : !isLoading ? (
        <p className="text-sm text-bloomora-text-muted">
          No se han creado aún listas. Usa el formulario de abajo para la primera.
        </p>
      ) : null}

      <div
        className={cn(
          'rounded-[clamp(1rem,0.9rem+0.45vw,1.35rem)] p-[1.5px]',
          'shadow-[0_0_32px_-8px_var(--bloomora-list-panel-glow)]',
          'bg-gradient-to-br from-[var(--bloomora-list-border-from)] via-[var(--bloomora-list-border-via)] to-[var(--bloomora-list-border-to)]',
        )}
      >
        <div
          className={cn(
            'bloomora-lists-card__create',
            'rounded-[clamp(0.95rem,0.88rem+0.4vw,1.28rem)]',
            'bg-bloomora-blush/[0.98] ring-1 ring-bloomora-line/20',
            'p-[clamp(0.85rem,0.65rem+0.55vw,1.25rem)]',
          )}
        >
          <h3 className="bloomora-lists-card__create-title">
            Crear una nueva lista
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="bloomora-lists-card__form-row">
              <span className="bloomora-lists-card__form-icon">
                <ListBulletIcon className="size-[clamp(1rem,0.9rem+0.25vw,1.125rem)]" />
              </span>
              <input
                ref={inputRef}
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Ej. Compras, Viaje, Ideas…"
                className="bloomora-lists-card__form-input"
                aria-label="Nombre de la nueva lista"
              />
              <button
                type="submit"
                disabled={!draftTitle.trim() || addListMut.isPending}
                className="bloomora-lists-card__form-submit"
              >
                {addListMut.isPending ? '…' : 'Añadir'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Link to="/app/lists" className="bloomora-lists-card__footer-link">
        <span className="bloomora-lists-card__footer-link-inner">
          <GridNavIcon className="shrink-0 opacity-80" />
          <span>Ir a la vista completa de listas</span>
          <span aria-hidden>›</span>
        </span>
      </Link>
    </DashboardCard>
  )
}
