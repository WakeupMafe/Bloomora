import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { BloomoraLogo } from '@/components/brand/BloomoraLogo'
import { BackButton } from '@/components/navigation/BackButton'
import { Button } from '@/components/ui/Button'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { useAddListMutation, useBloomoraLists } from '@/hooks/useBloomoraLists'
import {
  useBloomoraListItems,
  useDeleteListMutation,
  useListItemsMutations,
  useUpdateListTitleMutation,
} from '@/hooks/useBloomoraListItems'
import { cn } from '@/utils/cn'

export function ListsPage() {
  const { cedula } = useUserPhone()
  const { data: lists = [], isLoading: listsLoading } = useBloomoraLists(cedula)
  const addListMut = useAddListMutation(cedula)
  const updateTitleMut = useUpdateListTitleMutation(cedula)
  const deleteListMut = useDeleteListMutation(cedula)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newListTitle, setNewListTitle] = useState('')
  const [listTitleEdit, setListTitleEdit] = useState('')
  const [newItem, setNewItem] = useState('')

  useEffect(() => {
    if (!selectedId && lists.length > 0) setSelectedId(lists[0].id)
    if (selectedId && !lists.some((l) => l.id === selectedId)) {
      setSelectedId(lists[0]?.id ?? null)
    }
  }, [lists, selectedId])

  const selected = useMemo(
    () => lists.find((l) => l.id === selectedId) ?? null,
    [lists, selectedId],
  )

  useEffect(() => {
    if (selected) setListTitleEdit(selected.title)
  }, [selected])

  const { data: items = [], isLoading: itemsLoading } = useBloomoraListItems(
    cedula,
    selectedId,
  )
  const { addItem, toggleItem, renameItem, removeItem } = useListItemsMutations(
    cedula,
    selectedId,
  )

  const handleCreateList = (e: FormEvent) => {
    e.preventDefault()
    const t = newListTitle.trim()
    if (!t) return
    addListMut.mutate(t, {
      onSuccess: () => setNewListTitle(''),
    })
  }

  const handleRenameList = (e: FormEvent) => {
    e.preventDefault()
    if (!selectedId) return
    const t = listTitleEdit.trim()
    if (!t) return
    updateTitleMut.mutate({ listId: selectedId, title: t })
  }

  const handleAddItem = (e: FormEvent) => {
    e.preventDefault()
    const t = newItem.trim()
    if (!t) return
    addItem.mutate(t, { onSuccess: () => setNewItem('') })
  }

  return (
    <div className="app-shell-padding app-content-fluid mx-auto flex min-h-dvh flex-col gap-6 bg-bloomora-snow pb-16">
      <header className="flex items-center justify-between gap-4">
        <BloomoraLogo size="sm" />
        <BackButton to="/app" />
      </header>

      <h1 className="app-fluid-title font-bold text-bloomora-deep">Tus listas</h1>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,14rem)_1fr]">
        <aside className="space-y-3 rounded-[18px] bg-white/90 p-4 ring-1 ring-bloomora-line/40">
          <p className="text-xs font-bold uppercase tracking-wide text-bloomora-text-muted">
            Listas
          </p>
          {listsLoading ? (
            <p className="text-sm text-bloomora-text-muted">Cargando…</p>
          ) : lists.length === 0 ? (
            <p className="text-sm text-bloomora-text-muted">Sin listas aún.</p>
          ) : (
            <ul className="space-y-1">
              {lists.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(l.id)}
                    className={cn(
                      'w-full truncate rounded-lg px-2 py-2 text-left text-sm font-semibold transition',
                      selectedId === l.id
                        ? 'bg-bloomora-lavender-50 text-bloomora-deep ring-1 ring-bloomora-lilac/35'
                        : 'text-bloomora-deep hover:bg-white/80',
                    )}
                  >
                    {l.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleCreateList} className="space-y-2 border-t border-bloomora-line/20 pt-3">
            <input
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="Nueva lista…"
              className="w-full rounded-lg border border-bloomora-line/50 px-2 py-2 text-xs font-semibold"
            />
            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={!newListTitle.trim() || addListMut.isPending}
            >
              Crear
            </Button>
          </form>
        </aside>

        <section className="min-w-0 rounded-[22px] bg-white/90 p-5 ring-1 ring-bloomora-line/40 sm:p-6">
          {!selected ? (
            <p className="text-sm text-bloomora-text-muted">
              Crea o elige una lista.
            </p>
          ) : (
            <>
              <form
                onSubmit={handleRenameList}
                className="flex flex-wrap items-end gap-2 border-b border-bloomora-line/15 pb-4"
              >
                <label className="min-w-0 flex-1 text-xs font-semibold text-bloomora-text-muted">
                  Nombre de la lista
                  <input
                    value={listTitleEdit}
                    onChange={(e) => setListTitleEdit(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-bloomora-line/50 px-3 py-2 text-base font-bold text-bloomora-deep"
                  />
                </label>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateTitleMut.isPending}
                >
                  Guardar nombre
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  onClick={() => {
                    if (!window.confirm('¿Eliminar esta lista y sus ítems?'))
                      return
                    deleteListMut.mutate(selected.id, {
                      onSuccess: () => setSelectedId(null),
                    })
                  }}
                >
                  Eliminar lista
                </Button>
              </form>

              <div className="mt-5">
                <h2 className="text-sm font-bold text-bloomora-deep">Ítems</h2>
                {itemsLoading ? (
                  <p className="mt-2 text-sm text-bloomora-text-muted">
                    Cargando…
                  </p>
                ) : items.length === 0 ? (
                  <p className="mt-2 text-sm text-bloomora-text-muted">
                    Lista vacía. Añade algo abajo.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-bloomora-line/25">
                    {items.map((it) => (
                      <ListItemRow
                        key={it.id}
                        item={it}
                        onToggle={(done) =>
                          toggleItem.mutate({ id: it.id, done })
                        }
                        onRename={(title) =>
                          renameItem.mutate({ id: it.id, title })
                        }
                        onDelete={() => {
                          if (!window.confirm('¿Quitar este ítem?')) return
                          removeItem.mutate(it.id)
                        }}
                      />
                    ))}
                  </ul>
                )}
              </div>

              <form onSubmit={handleAddItem} className="mt-5 flex gap-2">
                <input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Nuevo ítem…"
                  className="min-w-0 flex-1 rounded-xl border border-bloomora-line/50 px-3 py-2 text-sm font-semibold"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newItem.trim() || addItem.isPending}
                >
                  Añadir
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function ListItemRow({
  item,
  onToggle,
  onRename,
  onDelete,
}: {
  item: { id: string; title: string; done: boolean }
  onToggle: (done: boolean) => void
  onRename: (title: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.title)

  useEffect(() => {
    setDraft(item.title)
  }, [item.title])

  return (
    <li className="flex flex-wrap items-center gap-2 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.done}
        onClick={() => onToggle(!item.done)}
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
          item.done
            ? 'border-bloomora-rose-deep bg-bloomora-rose text-white'
            : 'border-bloomora-line/50 bg-white',
        )}
      >
        {item.done ? '✓' : null}
      </button>
      {editing ? (
        <form
          className="flex min-w-0 flex-1 flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            onRename(draft)
            setEditing(false)
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-bloomora-line/50 px-2 py-1 text-sm"
          />
          <Button type="submit" size="sm">
            OK
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft(item.title)
              setEditing(false)
            }}
          >
            Cancelar
          </Button>
        </form>
      ) : (
        <>
          <span
            className={cn(
              'min-w-0 flex-1 text-sm font-semibold',
              item.done && 'text-bloomora-text-muted line-through',
            )}
          >
            {item.title}
          </span>
          <button
            type="button"
            className="text-xs font-semibold text-bloomora-violet"
            onClick={() => setEditing(true)}
          >
            Editar
          </button>
          <button
            type="button"
            className="text-xs font-semibold text-red-600"
            onClick={onDelete}
          >
            Quitar
          </button>
        </>
      )}
    </li>
  )
}
