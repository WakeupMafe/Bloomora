import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { cn } from '@/utils/cn'

type AdditionalToolsPanelProps = {
  className?: string
}

function PomodoroToolIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <circle cx="24" cy="26" r="14" fill="currentColor" opacity="0.15" />
      <circle
        cx="24"
        cy="26"
        r="14"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M24 26V18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M24 26l6 4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 10h8M24 10V8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="24" cy="9" rx="3" ry="1.5" fill="currentColor" opacity="0.35" />
    </svg>
  )
}

function NotesToolIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <rect
        x="12"
        y="8"
        width="24"
        height="32"
        rx="4"
        fill="currentColor"
        opacity="0.12"
      />
      <rect
        x="12"
        y="8"
        width="24"
        height="32"
        rx="4"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M18 18h14M18 24h14M18 30h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M30 8v6h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="34" cy="34" r="5" fill="currentColor" opacity="0.2" />
      <path
        d="M32 34l1.5 1.5L36 32"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type ToolTileProps = {
  label: string
  hint?: string
  badge?: string
  icon: ReactNode
  iconWrapClass: string
  onClick?: () => void
  to?: string
  disabled?: boolean
}

function ToolTile({
  label,
  hint,
  badge,
  icon,
  iconWrapClass,
  onClick,
  to,
  disabled,
}: ToolTileProps) {
  const content = (
    <>
      <span
        className={cn(
          'flex size-[3.25rem] items-center justify-center rounded-2xl shadow-sm ring-1 transition group-hover:scale-[1.03] group-hover:shadow-md sm:size-14',
          iconWrapClass,
        )}
      >
        {icon}
      </span>
      <span className="mt-2.5 text-center text-xs font-bold leading-tight text-bloomora-deep sm:text-[0.8125rem]">
        {label}
      </span>
      {hint ? (
        <span className="mt-0.5 text-center text-[0.65rem] leading-snug text-bloomora-text-muted">
          {hint}
        </span>
      ) : null}
      {badge ? (
        <span className="mt-1.5 rounded-full bg-bloomora-lavender-100/90 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-bloomora-violet ring-1 ring-bloomora-line/30">
          {badge}
        </span>
      ) : null}
    </>
  )

  const baseClass = cn(
    'group flex w-full flex-col items-center rounded-2xl px-2 py-3.5 transition',
    'hover:bg-bloomora-lavender-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bloomora-lilac/50',
    disabled && 'cursor-default opacity-70 hover:bg-transparent',
  )

  if (to && !disabled) {
    return (
      <Link to={to} className={baseClass} aria-label={label}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={baseClass}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
    >
      {content}
    </button>
  )
}

export function AdditionalToolsPanel({ className }: AdditionalToolsPanelProps) {
  return (
    <aside
      className={cn('min-w-0 w-full lg:max-w-[13.5rem] lg:justify-self-end', className)}
      aria-label="Herramientas adicionales"
    >
      <DashboardCard className="h-full bg-gradient-to-b from-bloomora-white via-bloomora-lavender-50/25 to-bloomora-mist/40 p-4 shadow-[0_10px_32px_-14px_rgba(91,74,140,0.14)] sm:p-5">
        <h2 className="text-center text-[0.7rem] font-bold uppercase tracking-[0.12em] text-bloomora-violet/90 sm:text-xs">
          Herramientas adicionales
        </h2>
        <p className="mt-1 text-center text-[0.65rem] leading-snug text-bloomora-text-muted sm:text-xs">
          Accesos rápidos
        </p>

        <nav className="mt-5 flex flex-row justify-center gap-2 sm:flex-col sm:gap-1 lg:mt-6">
          <ToolTile
            to="/app/pomodoro"
            label="Pomodoro"
            hint="Temporizador"
            icon={
              <PomodoroToolIcon className="size-9 text-rose-500 sm:size-10" />
            }
            iconWrapClass="bg-gradient-to-br from-rose-50 to-orange-50 text-rose-500 ring-rose-200/50"
          />
          <ToolTile
            to="/app/english-notes"
            label="Apuntes"
            hint="Ingles"
            icon={
              <NotesToolIcon className="size-9 text-bloomora-violet/70 sm:size-10" />
            }
            iconWrapClass="bg-gradient-to-br from-bloomora-lavender-50 to-bloomora-blush/80 text-bloomora-violet ring-bloomora-line/35"
          />
        </nav>
      </DashboardCard>
    </aside>
  )
}
