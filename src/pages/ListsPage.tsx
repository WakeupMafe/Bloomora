import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useQueries } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { BloomoraLogo } from '@/components/brand/BloomoraLogo'
import { BackButton } from '@/components/navigation/BackButton'
import { Button } from '@/components/ui/Button'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { useAddListMutation, useBloomoraLists } from '@/hooks/useBloomoraLists'
import {
  computeNextAgendaBlockMinutes,
  useListItemAgendaMutations,
} from '@/hooks/useListItemAgendaMutations'
import {
  useBloomoraListItems,
  useDeleteListMutation,
  useListItemsMutations,
  useUpdateListTitleMutation,
} from '@/hooks/useBloomoraListItems'
import { ListItemAgendaMenu } from '@/features/lists/ListItemAgendaMenu'
import { listAgendaTasks } from '@/services/supabase/agendaRepo'
import { requireExistingProfileByCedula } from '@/services/supabase/profilesRepo'
import { requireSupabase } from '@/services/supabase/typedClient'
import {
  addLocalDays,
  formatMinutes12h,
  startOfLocalDay,
  titleCaseAgendaDate,
  toDateKeyLocal,
} from '@/utils/agendaTime'
import { cn } from '@/utils/cn'

export function ListsPage() {
  const { cedula } = useUserPhone()
  const { data: lists = [], isLoading: listsLoading } = useBloomoraLists(cedula)
  const addListMut = useAddListMutation(cedula)
  const updateTitleMut = useUpdateListTitleMutation(cedula)
  const deleteListMut = useDeleteListMutation(cedula)
  const [searchParams, setSearchParams] = useSearchParams()
  const listParam = searchParams.get('list')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newListTitle, setNewListTitle] = useState('')
  const [listTitleEdit, setListTitleEdit] = useState('')
  const [newItem, setNewItem] = useState('')

  const selectList = useCallback(
    (id: string) => {
      setSelectedId(id)
      setSearchParams({ list: id }, { replace: true })
    },
    [setSearchParams],
  )

  useEffect(() => {
    if (lists.length === 0) {
      setSelectedId(null)
      if (listParam) setSearchParams({}, { replace: true })
      return
    }
    if (listParam && lists.some((l) => l.id === listParam)) {
      setSelectedId(listParam)
      return
    }
    if (listParam) {
      setSearchParams({}, { replace: true })
    }
    if (selectedId && lists.some((l) => l.id === selectedId)) return
    setSelectedId(lists[0]!.id)
  }, [lists, listParam, selectedId, setSearchParams])

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
  const {
    createTaskFromListItem,
    addSubtaskFromListItem,
    showToast,
  } = useListItemAgendaMutations(cedula)

  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [bulkTaskModalOpen, setBulkTaskModalOpen] = useState(false)
  const [bulkSubtaskModalOpen, setBulkSubtaskModalOpen] = useState(false)
  const [selectedBulkTaskId, setSelectedBulkTaskId] = useState<number | null>(null)
  const [bulkPending, setBulkPending] = useState(false)

  const { dayKeys, dayDates } = useMemo(() => {
    const today = startOfLocalDay(new Date())
    const keys: string[] = []
    const dates: Date[] = []
    for (let i = 0; i < 3; i++) {
      const d = addLocalDays(today, i)
      keys.push(toDateKeyLocal(d))
      dates.push(d)
    }
    return { dayKeys: keys, dayDates: dates }
  }, [])

  const selectedItems = useMemo(
    () => items.filter((it) => selectedItemIds.includes(it.id)),
    [items, selectedItemIds],
  )

  const bulkAgendaQueries = useQueries({
    queries: dayKeys.map((dayKey) => ({
      queryKey: ['agenda-lite-bulk', cedula, dayKey] as const,
      queryFn: async () => {
        const sb = requireSupabase()
        await requireExistingProfileByCedula(sb, cedula!)
        return listAgendaTasks(sb, cedula!, dayKey)
      },
      enabled: Boolean(cedula && (bulkTaskModalOpen || bulkSubtaskModalOpen)),
      staleTime: 30_000,
    })),
  })

  const exitMultiSelectMode = () => {
    setMultiSelectMode(false)
    setSelectedItemIds([])
    setBulkTaskModalOpen(false)
    setBulkSubtaskModalOpen(false)
    setSelectedBulkTaskId(null)
  }

  const activateMultiSelect = (itemId: string) => {
    setMultiSelectMode(true)
    setSelectedItemIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]))
  }

  const toggleSelectedItem = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    )
  }

  const transferSelectedAsTasks = async (dayKey: string, dayLabel: string) => {
    if (selectedItems.length === 0) {
      showToast('Selecciona al menos un ítem.')
      return
    }
    setBulkPending(true)
    try {
      for (const it of selectedItems) {
        await createTaskFromListItem.mutateAsync({ dayKey, title: it.title })
        if (!it.done) await toggleItem.mutateAsync({ id: it.id, done: true })
      }
      showToast(
        `Listo! Pasaste ${selectedItems.length} ítems como tarea en ${dayLabel}.`,
      )
      exitMultiSelectMode()
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudieron pasar todos los ítems.',
      )
    } finally {
      setBulkPending(false)
    }
  }

  const transferSelectedAsSteps = async () => {
    if (selectedBulkTaskId == null) {
      showToast('Elige una tarea.')
      return
    }
    if (selectedItems.length === 0) {
      showToast('Selecciona al menos un ítem.')
      return
    }
    setBulkPending(true)
    try {
      for (const it of selectedItems) {
        await addSubtaskFromListItem.mutateAsync({
          taskId: selectedBulkTaskId,
          title: it.title,
        })
        if (!it.done) await toggleItem.mutateAsync({ id: it.id, done: true })
      }
      showToast(`Genial! Agregaste ${selectedItems.length} ítems como pasos.`)
      exitMultiSelectMode()
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'No se pudieron asignar todos los pasos.',
      )
    } finally {
      setBulkPending(false)
    }
  }

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

  useEffect(() => {
    setSelectedItemIds((prev) => prev.filter((id) => items.some((it) => it.id === id)))
  }, [items])

  useEffect(() => {
    if (!multiSelectMode) return
    if (selectedItemIds.length === 0) {
      setMultiSelectMode(false)
      setBulkTaskModalOpen(false)
      setBulkSubtaskModalOpen(false)
      setSelectedBulkTaskId(null)
    }
  }, [multiSelectMode, selectedItemIds.length])

  useEffect(() => {
    exitMultiSelectMode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  return (
    <div className="app-shell-padding app-content-fluid mx-auto flex min-h-dvh flex-col gap-5 bg-bloomora-snow pb-[max(4rem,env(safe-area-inset-bottom))] sm:gap-6">
      <header className="flex items-center justify-between gap-3">
        <BloomoraLogo size="sm" />
        <BackButton to="/app" />
      </header>

      <h1 className="app-fluid-title font-bold text-bloomora-deep">Tus listas</h1>

      <div className="flex min-w-0 flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="min-w-0 space-y-3 rounded-[clamp(1rem,0.85rem+0.8vw,1.35rem)] bg-bloomora-lavender-50/95 p-4 shadow-[0_6px_24px_-10px_rgba(124,107,181,0.12)] ring-1 ring-bloomora-line/40 sm:p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-bloomora-text-muted">
            Tus listas
          </p>
          {listsLoading ? (
            <p className="text-sm text-bloomora-text-muted">Cargando…</p>
          ) : lists.length === 0 ? (
            <p className="text-sm text-bloomora-text-muted">Sin listas aún.</p>
          ) : (
            <ul
              className={cn(
                'flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]',
                'snap-x snap-mandatory',
                'lg:flex-col lg:gap-2 lg:overflow-visible lg:pb-0 lg:snap-none',
              )}
            >
              {lists.map((l) => (
                <li key={l.id} className="shrink-0 snap-start lg:w-full lg:shrink">
                  <button
                    type="button"
                    onClick={() => selectList(l.id)}
                    className={cn(
                      'flex max-w-[min(85vw,16rem)] items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition touch-manipulation',
                      'min-h-[2.75rem] whitespace-nowrap lg:max-w-none lg:w-full lg:whitespace-normal',
                      selectedId === l.id
                        ? 'bg-bloomora-lavender-100 text-bloomora-deep shadow-sm ring-2 ring-bloomora-lilac/45'
                        : 'bg-bloomora-white/80 text-bloomora-deep ring-1 ring-bloomora-line/35 hover:bg-bloomora-lavender-100/90 hover:ring-bloomora-lilac/25',
                    )}
                  >
                    <span className="min-w-0 truncate lg:whitespace-normal">{l.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form
            onSubmit={handleCreateList}
            className="space-y-2 border-t border-bloomora-line/20 pt-3"
          >
            <input
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="Nueva lista…"
              className="bloomora-form-input w-full rounded-xl border border-bloomora-line/50 px-3 py-2.5 text-sm font-semibold outline-none ring-bloomora-lilac/20 focus:ring-2"
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

        <section className="min-w-0 rounded-[clamp(1.1rem,0.95rem+0.9vw,1.5rem)] bg-bloomora-lavender-50/95 p-4 shadow-[0_8px_32px_-12px_rgba(124,107,181,0.14)] ring-1 ring-bloomora-line/40 sm:p-6">
          {!selected ? (
            <p className="text-sm text-bloomora-text-muted">
              Crea o elige una lista.
            </p>
          ) : (
            <>
              <form
                onSubmit={handleRenameList}
                className="flex flex-col gap-3 border-b border-bloomora-line/15 pb-4 sm:flex-row sm:flex-wrap sm:items-end"
              >
                <label className="min-w-0 flex-1 text-xs font-semibold text-bloomora-text-muted sm:min-w-[12rem]">
                  Nombre de la lista
                  <input
                    value={listTitleEdit}
                    onChange={(e) => setListTitleEdit(e.target.value)}
                    className="bloomora-form-input mt-1 w-full rounded-xl border border-bloomora-line/50 px-3 py-2.5 text-[clamp(0.95rem,0.88rem+0.4vw,1.05rem)] font-bold text-bloomora-deep outline-none ring-bloomora-lilac/20 focus:ring-2"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateTitleMut.isPending}
                    className="min-h-10 touch-manipulation"
                  >
                    Guardar nombre
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-10 text-red-600 touch-manipulation"
                    onClick={() => {
                      if (!window.confirm('¿Eliminar esta lista y sus ítems?'))
                        return
                      deleteListMut.mutate(selected.id, {
                        onSuccess: () => {
                          setSelectedId(null)
                          setSearchParams({}, { replace: true })
                        },
                      })
                    }}
                  >
                    Eliminar lista
                  </Button>
                </div>
              </form>

              <div className="mt-5">
                <h2 className="text-sm font-bold text-bloomora-deep">
                  Cosas de la lista
                </h2>
                <p className="mt-1 text-xs text-bloomora-text-muted">
                  Márcala cuando la hagas.
                </p>
                {!multiSelectMode ? (
                  <p className="mt-1 text-[0.7rem] font-semibold text-bloomora-violet">
                    Doble clic en un ítem para seleccionar varios.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2 rounded-2xl border border-bloomora-lilac/35 bg-bloomora-lavender-50/75 p-3 ring-1 ring-bloomora-line/30">
                    <p className="text-xs font-bold text-bloomora-deep">
                      Seleccionados: {selectedItems.length}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={selectedItems.length === 0 || bulkPending}
                        onClick={() => setBulkTaskModalOpen(true)}
                      >
                        Pasar como tarea
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={selectedItems.length === 0 || bulkPending}
                        onClick={() => setBulkSubtaskModalOpen(true)}
                      >
                        Pasar como paso
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={exitMultiSelectMode}
                        disabled={bulkPending}
                      >
                        Cancelar selección
                      </Button>
                    </div>
                  </div>
                )}
                {itemsLoading ? (
                  <p className="mt-3 text-sm text-bloomora-text-muted">
                    Cargando…
                  </p>
                ) : items.length === 0 ? (
                  <p className="mt-3 rounded-2xl bg-bloomora-lavender-50/50 px-4 py-4 text-center text-sm text-bloomora-text-muted ring-1 ring-bloomora-line/25">
                    Lista vacía. Escribe abajo y añade tu primer paso.
                  </p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-3">
                    {items.map((it) => (
                      <ListItemRow
                        key={it.id}
                        cedula={cedula}
                        item={it}
                        multiSelectMode={multiSelectMode}
                        selected={selectedItemIds.includes(it.id)}
                        onActivateMultiSelect={() => activateMultiSelect(it.id)}
                        onSelectToggle={() => toggleSelectedItem(it.id)}
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

              <form
                onSubmit={handleAddItem}
                className="mt-6 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:items-stretch"
              >
                <input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Algo más para la lista…"
                  className="bloomora-form-input min-h-12 min-w-0 flex-1 rounded-2xl border border-bloomora-line/50 px-4 py-3 text-[clamp(0.9rem,0.85rem+0.35vw,1rem)] font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/25 focus:ring-2 touch-manipulation"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="min-h-12 shrink-0 px-6 sm:self-end"
                  disabled={!newItem.trim() || addItem.isPending}
                >
                  Añadir
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
      {bulkTaskModalOpen && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                data-bloomora-modal-backdrop
                className="fixed inset-0 border-0 bg-bloomora-deep/20 p-0 backdrop-blur-[2px]"
                style={{ zIndex: 10_070 }}
                aria-label="Cerrar"
                onClick={() => !bulkPending && setBulkTaskModalOpen(false)}
              />
              <div
                role="dialog"
                aria-modal
                className="bloomora-modal-panel fixed left-1/2 top-1/2 z-[10075] flex max-h-[min(88vh,32rem)] w-[min(100vw-1.5rem,24rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-hidden rounded-2xl bg-bloomora-blush/[0.98] p-5 shadow-[0_16px_48px_rgba(91,74,140,0.22)] ring-1 ring-bloomora-line/40 backdrop-blur-md sm:p-6"
              >
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-bloomora-text-muted">
                    Transferencia múltiple
                  </p>
                  <h2 className="bloomora-modal-title mt-1 text-base font-bold text-bloomora-deep sm:text-lg">
                    Pasar como tarea
                  </h2>
                  <p className="mt-1 text-sm text-bloomora-text-muted">
                    Se crearán {selectedItems.length} tareas y se tacharán en la lista.
                  </p>
                </div>
                <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                  {dayKeys.map((dayKey, i) => {
                    const label = titleCaseAgendaDate(dayDates[i]!)
                    const q = bulkAgendaQueries[i]
                    const tasks = q?.data ?? []
                    const { startMin, endMin } = computeNextAgendaBlockMinutes(tasks)
                    const range = `${formatMinutes12h(startMin)} – ${formatMinutes12h(endMin)}`
                    return (
                      <li key={dayKey}>
                        <button
                          type="button"
                          disabled={bulkPending}
                          onClick={() => void transferSelectedAsTasks(dayKey, label)}
                          className="flex w-full flex-col items-start gap-0.5 rounded-2xl border border-bloomora-line/35 bg-bloomora-white/80 px-4 py-3 text-left transition hover:border-bloomora-lilac/50 hover:bg-bloomora-lavender-50/60 disabled:opacity-60"
                        >
                          <span className="text-sm font-bold text-bloomora-deep">{label}</span>
                          <span className="text-xs font-medium text-bloomora-text-muted">
                            {q?.isLoading ? 'Calculando hora…' : `Sugerido: ${range}`}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="self-end"
                  onClick={() => setBulkTaskModalOpen(false)}
                  disabled={bulkPending}
                >
                  Cancelar
                </Button>
              </div>
            </>,
            document.body,
          )
        : null}
      {bulkSubtaskModalOpen && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                data-bloomora-modal-backdrop
                className="fixed inset-0 border-0 bg-bloomora-deep/20 p-0 backdrop-blur-[2px]"
                style={{ zIndex: 10_070 }}
                aria-label="Cerrar"
                onClick={() => !bulkPending && setBulkSubtaskModalOpen(false)}
              />
              <div
                role="dialog"
                aria-modal
                className="bloomora-modal-panel fixed left-1/2 top-1/2 z-[10075] flex max-h-[min(88vh,34rem)] w-[min(100vw-1.5rem,25rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-hidden rounded-2xl bg-bloomora-blush/[0.98] p-5 shadow-[0_16px_48px_rgba(91,74,140,0.22)] ring-1 ring-bloomora-line/40 backdrop-blur-md sm:p-6"
              >
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-bloomora-text-muted">
                    Transferencia múltiple
                  </p>
                  <h2 className="bloomora-modal-title mt-1 text-base font-bold text-bloomora-deep sm:text-lg">
                    Pasar como paso
                  </h2>
                  <p className="mt-1 text-sm text-bloomora-text-muted">
                    Elige una tarea destino para {selectedItems.length} ítems.
                  </p>
                </div>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-0.5">
                  {dayKeys.map((dayKey, i) => {
                    const dayLabel = titleCaseAgendaDate(dayDates[i]!)
                    const q = bulkAgendaQueries[i]
                    const tasks = q?.data ?? []
                    return (
                      <div key={dayKey}>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-bloomora-violet">
                          {dayLabel}
                        </p>
                        {q?.isLoading ? (
                          <p className="text-sm text-bloomora-text-muted">Cargando…</p>
                        ) : tasks.length === 0 ? (
                          <p className="text-sm text-bloomora-text-muted">Sin tareas este día.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {tasks.map((t) => (
                              <li key={t.id}>
                                <label
                                  className={cn(
                                    'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition',
                                    selectedBulkTaskId === t.id
                                      ? 'border-bloomora-rose/50 bg-bloomora-lavender-50/90 ring-1 ring-bloomora-rose/25'
                                      : 'border-bloomora-line/30 bg-bloomora-white/70 hover:border-bloomora-lilac/40',
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name="bulk-task-pick"
                                    className="mt-1"
                                    checked={selectedBulkTaskId === t.id}
                                    onChange={() => setSelectedBulkTaskId(t.id)}
                                  />
                                  <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-bloomora-deep">
                                    {t.title}
                                  </span>
                                </label>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setBulkSubtaskModalOpen(false)}
                    disabled={bulkPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={selectedBulkTaskId == null || bulkPending}
                    onClick={() => void transferSelectedAsSteps()}
                  >
                    {bulkPending ? 'Asignando…' : 'Asignar varios'}
                  </Button>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  )
}

function ListItemRow({
  cedula,
  item,
  multiSelectMode,
  selected,
  onSelectToggle,
  onActivateMultiSelect,
  onToggle,
  onRename,
  onDelete,
}: {
  cedula: string | null
  item: { id: string; title: string; done: boolean }
  multiSelectMode: boolean
  selected: boolean
  onSelectToggle: () => void
  onActivateMultiSelect: () => void
  onToggle: (done: boolean) => void
  onRename: (title: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.title)

  useEffect(() => {
    setDraft(item.title)
  }, [item.title])

  const markAsTransferred = () => {
    if (!item.done) onToggle(true)
  }

  return (
    <li
      className={cn(
        'bloomora-list-item-surface overflow-hidden rounded-2xl border border-bloomora-line/30',
        'p-3 shadow-[0_4px_18px_-6px_rgba(124,107,181,0.12)] ring-1 ring-bloomora-line/25',
        multiSelectMode && selected && 'ring-2 ring-bloomora-rose/45',
        'sm:p-4',
      )}
      onDoubleClick={() => {
        if (editing || multiSelectMode) return
        onActivateMultiSelect()
      }}
    >
      {editing ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            onRename(draft)
            setEditing(false)
          }}
        >
          <div className="flex items-start gap-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="bloomora-form-input min-h-11 min-w-0 flex-1 rounded-xl border border-bloomora-line/50 px-3 py-2 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/25 focus:ring-2"
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" className="min-h-10 touch-manipulation">
              Guardar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-10 touch-manipulation"
              onClick={() => {
                setDraft(item.title)
                setEditing(false)
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={multiSelectMode ? selected : item.done}
              onClick={() => {
                if (multiSelectMode) onSelectToggle()
                else onToggle(!item.done)
              }}
              className={cn(
                'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition touch-manipulation',
                multiSelectMode
                  ? selected
                    ? 'border-bloomora-violet bg-bloomora-violet text-white shadow-sm'
                    : 'border-bloomora-violet/40 bg-bloomora-white text-transparent hover:border-bloomora-violet/70'
                  : item.done
                    ? 'border-bloomora-rose-deep bg-bloomora-rose text-white shadow-sm'
                    : 'border-bloomora-rose/40 bg-bloomora-white text-transparent hover:border-bloomora-rose/70',
              )}
            >
              {multiSelectMode ? (selected ? '✓' : '') : item.done ? '✓' : ''}
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-[clamp(0.9rem,0.84rem+0.35vw,1rem)] font-semibold leading-snug text-bloomora-deep',
                  item.done &&
                    'text-bloomora-text-muted line-through decoration-bloomora-rose/55',
                )}
              >
                {item.title}
              </p>
              {multiSelectMode ? (
                <p className="mt-2 text-xs font-semibold text-bloomora-violet">
                  {selected ? 'Seleccionado' : 'Toca el círculo para seleccionar'}
                </p>
              ) : (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-bloomora-lavender-100/90 px-3 py-1.5 text-xs font-semibold text-bloomora-violet ring-1 ring-bloomora-line/40 transition hover:bg-bloomora-lavender-50 touch-manipulation"
                    onClick={() => setEditing(true)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-bloomora-lavender-100/90 px-3 py-1.5 text-xs font-semibold text-red-600/90 ring-1 ring-red-500/15 transition hover:bg-red-500/10 touch-manipulation"
                    onClick={onDelete}
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>
          </div>
          {!multiSelectMode ? (
            <ListItemAgendaMenu
              cedula={cedula}
              itemTitle={item.title}
              itemDone={item.done}
              onTransferred={markAsTransferred}
            />
          ) : null}
        </div>
      )}
    </li>
  )
}
