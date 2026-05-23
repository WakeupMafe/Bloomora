import { cn } from '@/utils/cn'

type PageSpinnerProps = {
  className?: string
  label?: string
}

export function PageSpinner({
  className,
  label = 'Cargando…',
}: PageSpinnerProps) {
  return (
    <div
      className={cn(
        'flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className="size-9 animate-spin rounded-full border-2 border-bloomora-line/40 border-t-bloomora-violet"
        aria-hidden
      />
      <p className="text-sm font-medium text-bloomora-text-muted">{label}</p>
    </div>
  )
}
