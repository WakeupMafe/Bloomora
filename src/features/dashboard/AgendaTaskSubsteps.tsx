import { type FormEvent, useEffect, useMemo, useState } from 'react'
import type { AgendaSubtask } from '@/data/dashboardMock'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export type AgendaTaskSubstepsProps = {
  taskId: string
  subtasks: AgendaSubtask[]
  isAdding?: boolean
  isTogglingSubtaskId?: string | null
  isRemovingSubtaskId?: string | null
  isRenamingSubtaskId?: string | null
  onAdd: (title: string) => void
  onToggle: (subtaskId: string, completed: boolean) => void
  onRemove: (subtaskId: string) => void
  /** Debe resolverse cuando el guardado termina (p. ej. `mutateAsync`) para cerrar el editor. */
  onRename: (subtaskId: string, title: string) => void | Promise<void>
}

export function AgendaTaskSubsteps({
  taskId,
  subtasks,
  isAdding,
  isTogglingSubtaskId,
  isRemovingSubtaskId,
  isRenamingSubtaskId,
  onAdd,
  onToggle,
  onRemove,
  onRename,
}: AgendaTaskSubstepsProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const summary = useMemo(() => {
    const done = subtasks.filter((s) => s.completed).length
    const total = subtasks.length
    if (total === 0) return ''
    return `${done} de ${total} listos`
  }, [subtasks])

  useEffect(() => {
    if (editingId && !subtasks.some((s) => s.id === editingId)) {
      setEditingId(null)
      setEditDraft('')
    }
  }, [subtasks, editingId])

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    const t = draft.trim()
    if (!t || isAdding) return
    onAdd(t)
    setDraft('')
  }

  const startEdit = (s: AgendaSubtask) => {
    setEditingId(s.id)
    setEditDraft(s.title)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft('')
  }

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    const t = editDraft.trim()
    if (!t) return
    try {
      await Promise.resolve(onRename(editingId, t))
      setEditingId(null)
      setEditDraft('')
    } catch {
      /* el padre muestra toast; editor sigue abierto */
    }
  }

  const busyFor = (id: string) =>
    isTogglingSubtaskId === id ||
    isRemovingSubtaskId === id ||
    isRenamingSubtaskId === id

  return (
    <div
      className={cn(
        'border-t border-bloomora-sky-deep/20',
        'bg-bloomora-sky/40',
      )}
    >
      <button
        type="button"
        id={`agenda-substeps-toggle-${taskId}`}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-bloomora-sky/55 md:px-4"
        aria-expanded={open}
        aria-controls={`agenda-substeps-panel-${taskId}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-bloomora-sky-deep/35 text-[0.65rem] font-bold text-bloomora-deep shadow-sm ring-1 ring-bloomora-sky-deep/25"
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
          className="shrink-0 text-[0.65rem] font-bold text-bloomora-sky-deep/80"
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
          className="space-y-2.5 border-t border-bloomora-sky-deep/15 bg-bloomora-sky/35 px-3 pb-3.5 pt-2.5 md:px-4 md:pb-4"
        >
          {subtasks.length > 0 ? (
            <ol className="space-y-1.5">
              {subtasks.map((s, idx) => (
                <li key={s.id}>
                  {editingId === s.id ? (
                    <form
                      className="flex flex-col gap-2 rounded-xl bg-bloomora-sky/55 p-2 ring-1 ring-bloomora-sky-deep/25"
                      onSubmit={handleSaveEdit}
                    >
                      <input
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        maxLength={200}
                        className="w-full rounded-lg border border-bloomora-sky-deep/35 bg-white/95 px-2.5 py-2 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-sky/30 focus:ring-2"
                        autoFocus
                        aria-label="Editar texto del paso"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={
                            !editDraft.trim() ||
                            busyFor(s.id) ||
                            isRenamingSubtaskId === s.id
                          }
                        >
                          {isRenamingSubtaskId === s.id ? '…' : 'Guardar'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isRenamingSubtaskId === s.id}
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div
                      className={cn(
                        'flex items-start gap-2 rounded-xl px-2 py-2 ring-1 shadow-sm transition',
                        s.completed
                          ? 'bg-bloomora-sky/25 ring-bloomora-sky-deep/20'
                          : 'bg-bloomora-sky/55 ring-bloomora-sky-deep/25',
                      )}
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={s.completed}
                        disabled={busyFor(s.id)}
                        onClick={() => onToggle(s.id, !s.completed)}
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition',
                          s.completed
                            ? 'border-bloomora-sky-deep/70 bg-bloomora-sky-deep text-white'
                            : 'border-bloomora-sky-deep/45 bg-white/95 hover:border-bloomora-sky-deep/65',
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
                            className="text-[0.65rem] font-bold tabular-nums text-bloomora-sky-deep/75"
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
                      <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-start">
                        <button
                          type="button"
                          onClick={() => startEdit(s)}
                          disabled={busyFor(s.id)}
                          className="rounded-lg px-1.5 py-1 text-[0.65rem] font-semibold text-bloomora-violet transition hover:bg-white/90"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(s.id)}
                          disabled={busyFor(s.id)}
                          className="rounded-lg px-1.5 py-1 text-[0.65rem] font-semibold text-bloomora-text-muted transition hover:bg-red-50/90 hover:text-red-600"
                          aria-label={`Quitar paso: ${s.title}`}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          ) : null}

          <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Añadir paso</span>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escribe un paso y pulsa Añadir"
                maxLength={200}
                className="w-full rounded-xl border border-bloomora-sky-deep/30 bg-white/95 px-3 py-2 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-sky/35 focus:ring-2 focus:ring-bloomora-sky-deep/30"
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
