import { type FormEvent, useMemo, useState } from 'react'
import type { AgendaSubtask } from '@/data/dashboardMock'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export type AgendaTaskSubstepsProps = {
  taskId: string
  subtasks: AgendaSubtask[]
  isAdding?: boolean
  isTogglingSubtaskId?: string | null
  isRemovingSubtaskId?: string | null
  onAdd: (title: string) => void
  onToggle: (subtaskId: string, completed: boolean) => void
  onRemove: (subtaskId: string) => void
}

export function AgendaTaskSubsteps({
  taskId,
  subtasks,
  isAdding,
  isTogglingSubtaskId,
  isRemovingSubtaskId,
  onAdd,
  onToggle,
  onRemove,
}: AgendaTaskSubstepsProps) {
  const [open, setOpen] = useState(subtasks.length > 0)
  const [draft, setDraft] = useState('')

  const summary = useMemo(() => {
    const done = subtasks.filter((s) => s.completed).length
    const total = subtasks.length
    if (total === 0) return ''
    return `${done} de ${total} listos`
  }, [subtasks])

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    const t = draft.trim()
    if (!t || isAdding) return
    onAdd(t)
    setDraft('')
  }

  return (
    <div
      className={cn(
        'border-t border-bloomora-line/20',
        'bg-gradient-to-br from-bloomora-lavender-50/[0.18] via-white/40 to-bloomora-blush/[0.12]',
      )}
    >
      <button
        type="button"
        id={`agenda-substeps-toggle-${taskId}`}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-white/35 md:px-4"
        aria-expanded={open}
        aria-controls={`agenda-substeps-panel-${taskId}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/90 text-xs shadow-sm ring-1 ring-bloomora-lilac/25"
            aria-hidden
          >
            ✦
          </span>
          <span className="text-xs font-bold tracking-tight text-bloomora-deep">
            Pasos
          </span>
          {summary ? (
            <span className="truncate text-[0.6875rem] font-medium text-bloomora-text-muted">
              · {summary}
            </span>
          ) : null}
        </span>
        <span
          className="shrink-0 text-[0.65rem] font-bold text-bloomora-violet/70"
          aria-hidden
        >
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open ? (
        <div
          id={`agenda-substeps-panel-${taskId}`}
          role="region"
          aria-labelledby={`agenda-substeps-toggle-${taskId}`}
          className="space-y-2.5 px-3 pb-3.5 pt-0 md:px-4 md:pb-4"
        >
          {subtasks.length > 0 ? (
            <ol className="space-y-1.5">
              {subtasks.map((s, idx) => (
                <li key={s.id}>
                  <div
                    className={cn(
                      'flex items-start gap-2 rounded-xl px-2 py-2 ring-1 transition',
                      s.completed
                        ? 'bg-white/55 ring-bloomora-line/20'
                        : 'bg-white/80 ring-bloomora-lilac/20 shadow-sm',
                    )}
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={s.completed}
                      disabled={
                        isTogglingSubtaskId === s.id || isRemovingSubtaskId === s.id
                      }
                      onClick={() => onToggle(s.id, !s.completed)}
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition',
                        s.completed
                          ? 'border-bloomora-rose bg-bloomora-rose text-white'
                          : 'border-bloomora-rose/45 bg-white hover:border-bloomora-rose/80',
                      )}
                    >
                      {s.completed ? (
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span
                          className="text-[0.65rem] font-bold tabular-nums text-bloomora-violet/45"
                          aria-hidden
                        >
                          {idx + 1}
                        </span>
                      )}
                    </button>
                    <p
                      className={cn(
                        'min-w-0 flex-1 pt-0.5 text-[0.8125rem] font-medium leading-snug text-bloomora-deep',
                        s.completed &&
                          'text-bloomora-text-muted line-through decoration-bloomora-lilac/40',
                      )}
                    >
                      {s.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => onRemove(s.id)}
                      disabled={
                        isRemovingSubtaskId === s.id || isTogglingSubtaskId === s.id
                      }
                      className="shrink-0 rounded-lg px-1.5 py-1 text-[0.65rem] font-semibold text-bloomora-text-muted transition hover:bg-red-50/90 hover:text-red-600"
                      aria-label={`Quitar paso: ${s.title}`}
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-xl bg-white/50 px-3 py-2 text-[0.75rem] leading-relaxed text-bloomora-text-muted ring-1 ring-bloomora-line/25">
              Puede agregar una lista de subtareas o paso a paso. Ej.: bloqueador
              solar, hidratación, contorno de ojos… o barrer, sacar basura,
              ordenar mesas.
            </p>
          )}

          <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Añadir paso</span>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escribe un paso y pulsa Añadir"
                maxLength={200}
                className="w-full rounded-xl border border-bloomora-line/55 bg-white/95 px-3 py-2 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/25 focus:ring-2"
              />
            </label>
            <Button type="submit" size="sm" disabled={!draft.trim() || isAdding}>
              {isAdding ? '…' : 'Añadir'}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
