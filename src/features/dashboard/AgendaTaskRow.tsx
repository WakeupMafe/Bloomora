import { cn } from '@/utils/cn'

type AgendaTaskRowProps = {
  title: string
  startLabel: string
  endLabel: string
  completed: boolean
  onToggle: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function AgendaTaskRow({
  title,
  startLabel,
  endLabel,
  completed,
  onToggle,
  onEdit,
  onDelete,
}: AgendaTaskRowProps) {
  return (
    <div
      className={cn(
        'group flex flex-col gap-3 px-3 py-4 transition-colors',
        'md:flex-row md:items-center md:gap-4 md:px-2 md:py-3.5',
        'lg:rounded-xl lg:hover:bg-white/45',
      )}
    >
      {/* Fila 1 (móvil): ✔ + título con prioridad de ancho · Desktop: misma fila con el bloque de hora a la derecha */}
      <div className="flex min-w-0 flex-1 items-start gap-3 md:items-center">
        <button
          type="button"
          role="checkbox"
          aria-checked={completed}
          onClick={onToggle}
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors md:mt-0 md:h-8 md:w-8',
            completed
              ? 'border-bloomora-rose-deep bg-bloomora-rose text-bloomora-white'
              : 'border-bloomora-rose/55 bg-bloomora-white/90 hover:border-bloomora-rose group-hover:border-bloomora-rose/80',
          )}
        >
          {completed ? (
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
        </button>
        <p
          className={cn(
            'min-w-0 w-full flex-1 whitespace-normal break-words',
            'font-semibold leading-snug text-bloomora-deep',
            'text-[clamp(0.875rem,0.82rem+0.45vw,0.9375rem)]',
            completed &&
              'text-bloomora-text-muted line-through decoration-bloomora-lilac/45',
          )}
        >
          {title}
        </p>
      </div>

      {/* Fila 2 (móvil): hora + acciones · Desktop: alineado a la derecha en la misma fila */}
      <div
        className={cn(
          'flex min-w-0 items-center justify-between gap-3',
          'pl-10 md:shrink-0 md:justify-end md:gap-3 md:pl-0',
        )}
      >
        <p
          className={cn(
            'min-w-0 text-left text-[clamp(0.6875rem,0.62rem+0.35vw,0.75rem)] font-semibold tabular-nums tracking-tight text-bloomora-violet/90',
            'md:text-right md:text-xs',
          )}
        >
          {startLabel}
          <span className="mx-0.5 font-normal text-bloomora-text-muted/80">–</span>
          {endLabel}
        </p>
        {onEdit || onDelete ? (
          <div
            className={cn(
              'flex shrink-0 flex-wrap items-center justify-end gap-1.5',
              'opacity-90 md:opacity-0 md:group-hover:opacity-100',
            )}
          >
            {onEdit ? (
              <button
                type="button"
                aria-label="Editar tarea"
                onClick={onEdit}
                className="rounded-lg px-2 py-1.5 text-[clamp(0.6875rem,0.62rem+0.35vw,0.75rem)] font-semibold text-bloomora-violet ring-1 ring-bloomora-line/40 hover:bg-white/80 md:py-1 md:text-[11px]"
              >
                Editar
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                aria-label="Eliminar tarea"
                onClick={onDelete}
                className="rounded-lg px-2 py-1.5 text-[clamp(0.6875rem,0.62rem+0.35vw,0.75rem)] font-semibold text-red-600/90 ring-1 ring-red-200/60 hover:bg-red-50/80 md:py-1 md:text-[11px]"
              >
                ✕
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
