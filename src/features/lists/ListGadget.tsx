import {
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import {
  useBloomoraListItems,
  useListItemsMutations,
} from '@/hooks/useBloomoraListItems'
import { cn } from '@/utils/cn'

type DragPosition = { x: number; y: number }
type DragSession = DragPosition & {
  pointerId: number
  startX: number
  startY: number
}

const POSTIT_WIDTH = 288

type PostitPaletteId = 'sky' | 'lavender' | 'blush' | 'mint' | 'amber'

const POSTIT_PALETTES: Record<
  PostitPaletteId,
  { shell: string; header: string; accent: string; swatch: string; label: string }
> = {
  sky: {
    shell: 'border-bloomora-sky-deep/55 bg-bloomora-sky/35',
    header: 'from-bloomora-sky/90 to-bloomora-sky/45',
    accent: 'bg-bloomora-sky-deep',
    swatch: 'bg-bloomora-sky',
    label: 'Cielo',
  },
  lavender: {
    shell: 'border-bloomora-lilac/50 bg-[color:var(--bloomora-surface-2)]',
    header: 'from-bloomora-lavender-100 to-bloomora-lavender-50/50',
    accent: 'bg-bloomora-lilac',
    swatch: 'bg-bloomora-lilac',
    label: 'Lavanda',
  },
  blush: {
    shell: 'border-bloomora-rose/55 bg-bloomora-blush',
    header: 'from-bloomora-rose/50 to-bloomora-blush/80',
    accent: 'bg-bloomora-rose-deep',
    swatch: 'bg-bloomora-rose',
    label: 'Rosa',
  },
  mint: {
    shell: 'border-emerald-200/80 bg-emerald-50',
    header: 'from-emerald-100/90 to-emerald-50/70',
    accent: 'bg-emerald-400',
    swatch: 'bg-emerald-300',
    label: 'Menta',
  },
  amber: {
    shell: 'border-amber-200/80 bg-amber-50',
    header: 'from-amber-100/90 to-amber-50/70',
    accent: 'bg-amber-400',
    swatch: 'bg-amber-300',
    label: 'Ámbar',
  },
}

const PALETTE_ORDER: PostitPaletteId[] = [
  'sky',
  'lavender',
  'blush',
  'mint',
  'amber',
]

function colorStorageKey(listId: string) {
  return `bloomora:list-gadget-color:${listId}`
}

function readStoredPalette(
  listId: string,
  fallbackIndex: number,
): PostitPaletteId {
  if (typeof window === 'undefined') {
    return PALETTE_ORDER[fallbackIndex % PALETTE_ORDER.length]!
  }
  const raw = window.localStorage.getItem(colorStorageKey(listId))
  if (raw && raw in POSTIT_PALETTES) return raw as PostitPaletteId
  return PALETTE_ORDER[fallbackIndex % PALETTE_ORDER.length]!
}

function useDraggablePostit(initialOffset: number) {
  const [position, setPosition] = useState<DragPosition>(() => ({
    x:
      typeof window === 'undefined'
        ? 24
        : Math.max(12, window.innerWidth - POSTIT_WIDTH - 24 - initialOffset),
    y: Math.min(
      120 + initialOffset,
      typeof window === 'undefined' ? 120 : window.innerHeight - 220,
    ),
  }))
  const sessionRef = useRef<DragSession | null>(null)

  const clamp = (x: number, y: number, w = POSTIT_WIDTH, h = 220) => ({
    x: Math.max(8, Math.min(x, window.innerWidth - w - 8)),
    y: Math.max(8, Math.min(y, window.innerHeight - h - 8)),
  })

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button, input, a, label')) return
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect()
    sessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: bounds?.left ?? position.x,
      y: bounds?.top ?? position.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const session = sessionRef.current
    if (!session || session.pointerId !== event.pointerId) return
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect()
    setPosition(
      clamp(
        session.x + event.clientX - session.startX,
        session.y + event.clientY - session.startY,
        bounds?.width,
        bounds?.height,
      ),
    )
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (sessionRef.current?.pointerId === event.pointerId) {
      sessionRef.current = null
    }
  }

  useEffect(() => {
    const onResize = () =>
      setPosition((current) => clamp(current.x, current.y))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return {
    position,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  }
}

type ListGadgetProps = {
  listId: string
  title: string
  stackIndex: number
  onClose: () => void
}

export function ListGadget({
  listId,
  title,
  stackIndex,
  onClose,
}: ListGadgetProps) {
  const { cedula } = useUserPhone()
  const { data: items = [], isLoading } = useBloomoraListItems(cedula, listId)
  const { addItem, toggleItem, renameItem, removeItem } = useListItemsMutations(
    cedula,
    listId,
  )
  const [draft, setDraft] = useState('')
  const [paletteId, setPaletteId] = useState<PostitPaletteId>(() =>
    readStoredPalette(listId, stackIndex),
  )
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const drag = useDraggablePostit(stackIndex * 28)
  const palette = POSTIT_PALETTES[paletteId]

  const selectPalette = (id: PostitPaletteId) => {
    setPaletteId(id)
    window.localStorage.setItem(colorStorageKey(listId), id)
    setColorPickerOpen(false)
  }

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    const t = draft.trim()
    if (!t) return
    addItem.mutate(t, { onSuccess: () => setDraft('') })
  }

  const startEdit = (itemId: string, currentTitle: string) => {
    setEditingId(itemId)
    setEditDraft(currentTitle)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft('')
  }

  const saveEdit = () => {
    if (!editingId) return
    const next = editDraft.trim()
    if (!next) {
      cancelEdit()
      return
    }
    const current = items.find((it) => it.id === editingId)
    if (current && current.title === next) {
      cancelEdit()
      return
    }
    renameItem.mutate(
      { id: editingId, title: next },
      { onSettled: () => cancelEdit() },
    )
  }

  const onEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  return (
    <section
      role="dialog"
      aria-label={`Lista flotante: ${title}`}
      className={cn(
        'fixed z-[10065] flex w-[min(18rem,calc(100vw-1.25rem))] flex-col overflow-hidden rounded-2xl border-2 shadow-[0_18px_40px_-16px_rgba(53,39,91,0.35)]',
        palette.shell,
      )}
      style={{ left: drag.position.x, top: drag.position.y }}
    >
      <header
        className={cn(
          'flex touch-none cursor-grab items-center gap-1.5 bg-gradient-to-r px-2.5 py-2 active:cursor-grabbing',
          palette.header,
        )}
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
        onPointerCancel={drag.onPointerCancel}
      >
        <span
          className={cn('size-2.5 shrink-0 rounded-full', palette.accent)}
          aria-hidden
        />
        <h2 className="min-w-0 flex-1 truncate text-sm font-bold text-bloomora-deep">
          {title}
        </h2>
        <span
          className="text-[0.65rem] font-semibold text-bloomora-violet"
          aria-hidden
        >
          ⠿
        </span>
        <button
          type="button"
          aria-label="Cambiar color del post-it"
          aria-expanded={colorPickerOpen}
          title="Color de fondo"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => setColorPickerOpen((open) => !open)}
          className={cn(
            'inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--bloomora-surface-1)] ring-1 ring-[color:var(--bloomora-border)] transition hover:bg-[color:var(--bloomora-surface-3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloomora-lilac',
          )}
        >
          <span
            className={cn('size-4 rounded-full ring-1 ring-black/10', palette.swatch)}
            aria-hidden
          />
        </button>
        <IconButton
          label="Cerrar lista flotante"
          tone="neutral"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onClose}
          className="size-9 rounded-xl bg-[color:var(--bloomora-surface-1)]"
          title="Cerrar"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </IconButton>
      </header>

      {colorPickerOpen ? (
        <div
          className="flex flex-wrap items-center gap-2 border-b border-[color:var(--bloomora-border)] bg-[color:var(--bloomora-surface-2)] px-3 py-2.5"
          role="group"
          aria-label="Colores del post-it"
        >
          {PALETTE_ORDER.map((id) => {
            const option = POSTIT_PALETTES[id]
            const selected = id === paletteId
            return (
              <button
                key={id}
                type="button"
                aria-label={option.label}
                aria-pressed={selected}
                title={option.label}
                onClick={() => selectPalette(id)}
                className={cn(
                  'size-9 rounded-full ring-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloomora-lilac',
                  option.swatch,
                  selected
                    ? 'ring-bloomora-deep scale-105'
                    : 'ring-transparent hover:ring-[color:var(--bloomora-border)]',
                )}
              />
            )
          })}
        </div>
      ) : null}

      <div className="flex max-h-[min(22rem,50vh)] min-h-[10rem] flex-col">
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2.5 py-2.5">
          {isLoading ? (
            <li className="px-1 text-xs text-bloomora-violet">Cargando…</li>
          ) : null}
          {!isLoading && items.length === 0 ? (
            <li className="rounded-xl border border-dashed border-[color:var(--bloomora-border)] px-3 py-4 text-center text-xs text-bloomora-violet">
              Lista vacía. Añade un ítem abajo.
            </li>
          ) : null}
          {items.map((item) => {
            const isEditing = editingId === item.id
            return (
              <li key={item.id}>
                {isEditing ? (
                  <div className="flex items-center gap-1.5 rounded-xl bg-[color:var(--bloomora-surface-2)] px-1.5 py-1 ring-1 ring-bloomora-lilac/35">
                    <input
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={onEditKeyDown}
                      onBlur={saveEdit}
                      autoFocus
                      aria-label={`Editar ítem ${item.title}`}
                      className="min-h-10 min-w-0 flex-1 rounded-lg bg-transparent px-2 text-sm font-semibold text-bloomora-deep outline-none"
                    />
                    <button
                      type="button"
                      aria-label="Guardar ítem"
                      disabled={renameItem.isPending}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={saveEdit}
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-bloomora-violet hover:bg-[color:var(--bloomora-surface-3)]"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <div className="group/item flex items-start gap-1 rounded-xl px-1 py-0.5 transition hover:bg-[color:var(--bloomora-surface-2)]">
                    <label className="flex min-h-10 min-w-0 flex-1 cursor-pointer items-start gap-2 px-1 py-1.5">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() =>
                          toggleItem.mutate({ id: item.id, done: !item.done })
                        }
                        className="mt-0.5 size-4 shrink-0 rounded border-[color:var(--bloomora-border)] text-bloomora-violet focus:ring-bloomora-lilac/40"
                      />
                      <span
                        className={cn(
                          'min-w-0 flex-1 text-sm font-semibold leading-snug text-bloomora-deep',
                          item.done &&
                            'text-bloomora-violet/70 line-through decoration-bloomora-lilac/50',
                        )}
                      >
                        {item.title}
                      </span>
                    </label>
                    <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                      <button
                        type="button"
                        aria-label={`Editar ${item.title}`}
                        title="Editar"
                        onClick={() => startEdit(item.id, item.title)}
                        className="grid size-9 place-items-center rounded-lg text-bloomora-violet opacity-80 transition hover:bg-[color:var(--bloomora-surface-2)] hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-bloomora-lilac"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        aria-label={`Eliminar ${item.title}`}
                        title="Eliminar"
                        disabled={removeItem.isPending}
                        onClick={() => removeItem.mutate(item.id)}
                        className="grid size-9 place-items-center rounded-lg text-rose-600/85 opacity-80 transition hover:bg-rose-50 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <form
          onSubmit={handleAdd}
          className="shrink-0 border-t border-[color:var(--bloomora-border)] bg-white/45 p-2.5"
        >
          <div className="flex items-center gap-1.5 overflow-hidden rounded-full border border-[color:var(--bloomora-border)] bg-[color:var(--bloomora-surface-1)]">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Nuevo ítem…"
              aria-label={`Añadir ítem a ${title}`}
              className="min-h-10 min-w-0 flex-1 bg-transparent px-3 py-2 text-xs font-semibold text-bloomora-deep outline-none placeholder:text-bloomora-text-muted/65"
            />
            <button
              type="submit"
              disabled={!draft.trim() || addItem.isPending}
              className="m-1 rounded-full bg-bloomora-violet px-3 py-1.5 text-[0.65rem] font-bold text-[color:var(--bloomora-accent-on)] disabled:opacity-45"
            >
              +
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
