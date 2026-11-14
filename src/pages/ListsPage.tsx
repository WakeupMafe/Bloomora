import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { BloomyPose } from '@/components/brand/BloomyPose'
import { BackButton } from '@/components/navigation/BackButton'
import { Button } from '@/components/ui/Button'
import { useBloomoraAlert } from '@/contexts/BloomoraAlertContext'
import { useListGadgets } from '@/contexts/ListGadgetsContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import {
  ListActionsSheet,
  type ListActionId,
} from '@/features/lists/ListActionsSheet'
import { ListItemAgendaMenu } from '@/features/lists/ListItemAgendaMenu'
import {
  clearListEmoji,
  getListEmoji,
  LIST_EMOJI_OPTIONS,
  setListEmoji,
} from '@/features/lists/listEmoji'
import {
  copyTextToClipboard,
  formatListAsText,
  renderAndExportListImage,
} from '@/features/lists/exportListShare'
import {
  formatListUpdatedLabel,
  LIST_IDEA_PRESETS,
  listProgressPct,
} from '@/features/lists/listFormat'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import {
  useAddListMutation,
  useBloomoraLists,
  useDuplicateListMutation,
} from '@/hooks/useBloomoraLists'
import {
  useBloomoraListItems,
  useDeleteListMutation,
  useListItemsMutations,
  useUpdateListTitleMutation,
  type UiListItem,
} from '@/hooks/useBloomoraListItems'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { DashboardList } from '@/types/dashboardLists'
import { cn } from '@/utils/cn'

const EMPTY_LISTS: DashboardList[] = []
const EMPTY_ITEMS: UiListItem[] = []
/** Ancho de cada acción de swipe (mín. 64px). */
const SWIPE_ACTION_WIDTH = 72
const SWIPE_OPEN_OFFSET = -(SWIPE_ACTION_WIDTH * 2)
const SWIPE_OPEN_RATIO = 0.4
const SWIPE_AXIS_DEADZONE = 10
const LONG_PRESS_MS = 480

type PendingUndo = {
  listId: string
  item: UiListItem
  timer: ReturnType<typeof setTimeout>
}

export function ListsPage() {
  const { cedula } = useUserPhone()
  const { confirm } = useBloomoraAlert()
  const { showToast } = useBloomoraToast()
  const { openListGadget, closeListGadget, isListGadgetOpen } = useListGadgets()
  const [exportBusy, setExportBusy] = useState(false)
  const isWide = useMediaQuery('(min-width: 600px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const canUseGadgets = useMediaQuery('(min-width: 768px)')
  const { data: listsData, isLoading: listsLoading } = useBloomoraLists(cedula)
  const lists = listsData ?? EMPTY_LISTS
  const addListMut = useAddListMutation(cedula)
  const dupListMut = useDuplicateListMutation(cedula)
  const updateTitleMut = useUpdateListTitleMutation(cedula)
  const deleteListMut = useDeleteListMutation(cedula)
  const [searchParams, setSearchParams] = useSearchParams()
  const listParam = searchParams.get('list')
  const crearParam = searchParams.get('crear')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listQuery, setListQuery] = useState('')
  const [newListTitle, setNewListTitle] = useState('')
  const [creatingOpen, setCreatingOpen] = useState(false)
  const [listTitleEdit, setListTitleEdit] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [emojiTick, setEmojiTick] = useState(0)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(false)
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [pendingSectionOpen, setPendingSectionOpen] = useState(true)
  const [doneSectionOpen, setDoneSectionOpen] = useState(true)
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null)
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null)
  const [emojiById, setEmojiById] = useState<Record<string, string>>({})

  const newListInputRef = useRef<HTMLInputElement>(null)
  const newItemInputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useBodyScrollLock(actionsOpen || emojiPickerOpen)

  const selectList = useCallback(
    (id: string) => {
      setSelectedId(id)
      setSearchParams({ list: id }, { replace: true })
      setActionsOpen(false)
      setMultiSelectMode(false)
      setSelectedItemIds([])
      setRenaming(false)
    },
    [setSearchParams],
  )

  const clearMobileDetail = useCallback(() => {
    setSelectedId(null)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('list')
        return next
      },
      { replace: true },
    )
    setActionsOpen(false)
    setMultiSelectMode(false)
    setSelectedItemIds([])
  }, [setSearchParams])

  useEffect(() => {
    if (lists.length === 0) {
      setSelectedId(null)
      if (listParam) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.delete('list')
            return next
          },
          { replace: true },
        )
      }
      return
    }
    if (listParam && lists.some((l) => l.id === listParam)) {
      setSelectedId(listParam)
      return
    }
    if (listParam) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('list')
          return next
        },
        { replace: true },
      )
    }
    if (!isWide) {
      if (selectedId && lists.some((l) => l.id === selectedId)) return
      setSelectedId(null)
      return
    }
    if (selectedId && lists.some((l) => l.id === selectedId)) return
    setSelectedId(lists[0]!.id)
  }, [lists, listParam, selectedId, setSearchParams, isWide])

  const selected = useMemo(
    () => lists.find((l) => l.id === selectedId) ?? null,
    [lists, selectedId],
  )

  useEffect(() => {
    if (selected) {
      setListTitleEdit(selected.title)
      setRenaming(false)
    }
  }, [selected?.id, selected?.title])

  useEffect(() => {
    const map: Record<string, string> = {}
    lists.forEach((l, i) => {
      map[l.id] = getListEmoji(l.id, l.title, i)
    })
    setEmojiById(map)
  }, [lists, emojiTick])

  useEffect(() => {
    if (crearParam !== '1') return
    setCreatingOpen(true)
    const frame = window.requestAnimationFrame(() => {
      newListInputRef.current?.focus({ preventScroll: false })
      newListInputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
    setSearchParams(
      (prev) => {
        if (!prev.has('crear')) return prev
        const next = new URLSearchParams(prev)
        next.delete('crear')
        return next
      },
      { replace: true },
    )
    return () => window.cancelAnimationFrame(frame)
  }, [crearParam, setSearchParams])

  const { data: itemsData, isLoading: itemsLoading } = useBloomoraListItems(
    cedula,
    selectedId,
  )
  const items = itemsData ?? EMPTY_ITEMS
  const {
    addItem,
    toggleItem,
    renameItem,
    removeItem,
    clearCompleted,
    markManyDone,
    removeMany,
  } = useListItemsMutations(cedula, selectedId)

  const pendingUndoRef = useRef<PendingUndo | null>(null)
  pendingUndoRef.current = pendingUndo
  const removeItemMutateRef = useRef(removeItem.mutate)
  removeItemMutateRef.current = removeItem.mutate

  useEffect(() => {
    return () => {
      const pending = pendingUndoRef.current
      if (!pending) return
      clearTimeout(pending.timer)
      removeItemMutateRef.current(pending.item.id)
    }
  }, [])

  useEffect(() => {
    if (!pendingUndo) return
    if (pendingUndo.listId === selectedId) return
    clearTimeout(pendingUndo.timer)
    removeItemMutateRef.current(pendingUndo.item.id)
    setPendingUndo(null)
  }, [selectedId, pendingUndo])

  const filteredLists = useMemo(() => {
    const q = listQuery.trim().toLowerCase()
    if (!q) return lists
    return lists.filter((l) => l.title.toLowerCase().includes(q))
  }, [lists, listQuery])

  const totals = useMemo(() => {
    const listCount = lists.length
    const pending = lists.reduce(
      (acc, l) => acc + Math.max(0, l.totalCount - l.doneCount),
      0,
    )
    return { listCount, pending }
  }, [lists])

  const showMobileDetail = !isWide && selected != null
  const showListPanel = isWide || !showMobileDetail
  const showDetailPanel = isWide || showMobileDetail

  useEffect(() => {
    if (!isDesktop && !multiSelectMode) return
    setOpenSwipeId(null)
  }, [isDesktop, multiSelectMode])

  const handleSwipeOpenChange = useCallback((id: string | null) => {
    setOpenSwipeId(id)
  }, [])

  const openCreate = () => {
    setCreatingOpen(true)
    requestAnimationFrame(() => newListInputRef.current?.focus())
  }

  const handleCreateList = (e: FormEvent) => {
    e.preventDefault()
    const t = newListTitle.trim()
    if (!t) return
    addListMut.mutate(t, {
      onSuccess: (newId) => {
        setNewListTitle('')
        setCreatingOpen(false)
        if (newId != null) selectList(String(newId))
      },
    })
  }

  const createFromIdea = (title: string, emoji: string) => {
    addListMut.mutate(title, {
      onSuccess: (newId) => {
        if (newId != null) {
          setListEmoji(String(newId), emoji)
          setEmojiTick((n) => n + 1)
          selectList(String(newId))
        }
      },
    })
  }

  const handleRenameList = (e?: FormEvent) => {
    e?.preventDefault()
    if (!selectedId) return
    const t = listTitleEdit.trim()
    if (!t) return
    updateTitleMut.mutate(
      { listId: selectedId, title: t },
      { onSuccess: () => setRenaming(false) },
    )
  }

  const handleAddItem = (e: FormEvent) => {
    e.preventDefault()
    const t = newItem.trim()
    if (!t) return
    addItem.mutate(t, {
      onSuccess: () => {
        setNewItem('')
        newItemInputRef.current?.focus()
      },
    })
  }

  const scheduleUndoRemove = (item: UiListItem) => {
    if (!selectedId) return
    if (pendingUndo) {
      clearTimeout(pendingUndo.timer)
      removeItem.mutate(pendingUndo.item.id)
    }
    const timer = setTimeout(() => {
      removeItem.mutate(item.id)
      setPendingUndo(null)
    }, 5000)
    setPendingUndo({ listId: selectedId, item, timer })
  }

  const undoRemove = () => {
    if (!pendingUndo) return
    clearTimeout(pendingUndo.timer)
    setPendingUndo(null)
  }

  const visibleItems = useMemo(() => {
    if (!pendingUndo || pendingUndo.listId !== selectedId) return items
    return items.filter((i) => i.id !== pendingUndo.item.id)
  }, [items, pendingUndo, selectedId])

  const visiblePending = useMemo(
    () => visibleItems.filter((i) => !i.done),
    [visibleItems],
  )
  const visibleDone = useMemo(
    () => visibleItems.filter((i) => i.done),
    [visibleItems],
  )

  const selectedDone = selected?.doneCount ?? visibleDone.length
  const selectedTotal = selected?.totalCount ?? visibleItems.length
  const selectedPct = listProgressPct(selectedDone, selectedTotal)
  const selectedEmoji =
    selected != null
      ? (emojiById[selected.id] ?? getListEmoji(selected.id, selected.title))
      : '📝'

  const exitMultiSelect = () => {
    setMultiSelectMode(false)
    setSelectedItemIds([])
  }

  const toggleSelectedItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const selectAllVisible = () => {
    setSelectedItemIds(visibleItems.map((i) => i.id))
  }

  const handleSheetAction = async (id: ListActionId) => {
    if (!selected) return
    setActionsOpen(false)
    if (id === 'postit') {
      if (canUseGadgets) openListGadget(selected.id)
      return
    }
    if (id === 'rename') {
      setRenaming(true)
      requestAnimationFrame(() => renameInputRef.current?.focus())
      return
    }
    if (id === 'emoji') {
      setEmojiPickerOpen(true)
      return
    }
    if (id === 'select') {
      setMultiSelectMode(true)
      return
    }
    if (id === 'copy-text') {
      try {
        const text = formatListAsText({
          title: selected.title,
          emoji: selectedEmoji,
          items: visibleItems,
        })
        await copyTextToClipboard(text)
        showToast('Lista copiada como texto. Ya la puedes pegar o reenviar.')
      } catch {
        showToast('No se pudo copiar el texto.')
      }
      return
    }
    if (id === 'copy-image') {
      if (exportBusy) return
      setExportBusy(true)
      try {
        const result = await renderAndExportListImage({
          title: selected.title,
          emoji: selectedEmoji,
          items: visibleItems,
        })
        if (result === 'copied') {
          showToast('Imagen copiada. Pégala donde quieras.')
        } else if (result === 'shared') {
          showToast('Lista compartida.')
        } else {
          showToast('Imagen guardada en descargas.')
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        showToast('No se pudo generar la imagen.')
      } finally {
        setExportBusy(false)
      }
      return
    }
    if (id === 'duplicate') {
      dupListMut.mutate({
        listId: selected.id,
        title: `${selected.title} (copia)`,
      })
      return
    }
    if (id === 'clear') {
      if (selectedDone === 0) return
      clearCompleted.mutate()
      return
    }
    if (id === 'delete') {
      const ok = await confirm({
        title: `¿Eliminar “${selected.title}”?`,
        description: `Se borrarán la lista y sus ${selectedTotal} ítems. Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar lista',
        tone: 'danger',
      })
      if (!ok) return
      deleteListMut.mutate(selected.id, {
        onSuccess: () => {
          closeListGadget(selected.id)
          clearListEmoji(selected.id)
          if (!isWide) clearMobileDetail()
          else {
            setSelectedId(null)
            setSearchParams({}, { replace: true })
          }
        },
      })
    }
  }

  const markSelectedDone = () => {
    if (selectedItemIds.length === 0) return
    markManyDone.mutate(
      { ids: selectedItemIds, done: true },
      { onSuccess: exitMultiSelect },
    )
  }

  const deleteSelected = async () => {
    if (selectedItemIds.length === 0) return
    const ok = await confirm({
      title: `¿Eliminar ${selectedItemIds.length} ítems?`,
      confirmLabel: 'Eliminar',
      tone: 'danger',
    })
    if (!ok) return
    removeMany.mutate(selectedItemIds, { onSuccess: exitMultiSelect })
  }

  useEffect(() => {
    setSelectedItemIds((prev) => {
      const next = prev.filter((id) => visibleItems.some((it) => it.id === id))
      if (
        next.length === prev.length &&
        next.every((id, i) => id === prev[i])
      ) {
        return prev
      }
      return next
    })
  }, [visibleItems])

  useEffect(() => {
    exitMultiSelect()
    setActionsOpen(false)
    setEmojiPickerOpen(false)
  }, [selectedId])

  return (
    <div className="bloomora-lists-page app-shell-padding--dashboard mx-auto flex flex-col gap-5 max-[599px]:gap-4">
      {!showMobileDetail ? (
        <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pb-1 pt-6 max-[599px]:pt-6 min-[600px]:pt-8 min-[1024px]:pt-10">
          <div className="min-w-0">
            <h1 className="text-[clamp(1.75rem,1.4rem+1.2vw,2.25rem)] font-bold tracking-tight text-bloomora-deep">
              Listas
            </h1>
            <p className="mt-1 text-sm text-bloomora-text-muted">
              {listsLoading
                ? 'Cargando…'
                : `${totals.listCount} lista${totals.listCount === 1 ? '' : 's'} · ${totals.pending} pendiente${totals.pending === 1 ? '' : 's'}`}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="min-h-11 shrink-0 self-end rounded-pill px-4 shadow-[0_8px_20px_-8px_rgba(232,155,184,0.55)]"
            onClick={openCreate}
          >
            <span className="max-[599px]:hidden">+ Nueva lista</span>
            <span className="min-[600px]:hidden">+ Nueva</span>
          </Button>
        </header>
      ) : null}

      {creatingOpen ? (
        <form
          onSubmit={handleCreateList}
          className="flex flex-col gap-2 rounded-[1.25rem] border border-bloomora-line bg-bloomora-white p-3 shadow-sm sm:flex-row sm:items-center"
        >
          <input
            ref={newListInputRef}
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            placeholder="Nombre de la nueva lista…"
            aria-label="Nombre de la nueva lista"
            className="bloomora-form-input min-h-11 min-w-0 flex-1 rounded-xl border border-bloomora-line/50 px-3 text-sm font-semibold outline-none ring-bloomora-lilac/20 focus:ring-2"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={!newListTitle.trim() || addListMut.isPending}
            >
              Crear
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setCreatingOpen(false)
                setNewListTitle('')
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {!listsLoading && lists.length === 0 ? (
        <EmptyListsState
          onCreate={openCreate}
          onIdea={createFromIdea}
          busy={addListMut.isPending}
        />
      ) : (
        <div
          className={cn(
            'grid min-w-0 gap-4',
            isWide &&
              'min-[600px]:grid-cols-[minmax(15rem,18.5rem)_minmax(0,1fr)] min-[1024px]:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] min-[600px]:items-start',
          )}
        >
          {showListPanel ? (
            <aside
              className={cn(
                'min-w-0',
                isWide
                  ? 'rounded-[1.5rem] border border-bloomora-line bg-bloomora-white p-4 shadow-[0_10px_30px_-18px_rgba(91,74,140,0.28)] sm:p-5'
                  : 'p-0',
              )}
            >
              {isWide ? (
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-base font-bold text-bloomora-deep">
                    Tus listas
                  </h2>
                  <span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-pill bg-bloomora-blush px-2 text-xs font-bold text-bloomora-rose-deep">
                    {totals.listCount}
                  </span>
                </div>
              ) : null}

              <label className="relative mb-3 block">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bloomora-text-muted">
                  🔍
                </span>
                <input
                  value={listQuery}
                  onChange={(e) => setListQuery(e.target.value)}
                  placeholder="Buscar lista"
                  className="bloomora-form-input min-h-11 w-full rounded-pill border border-bloomora-line/50 bg-bloomora-white py-2.5 pl-10 pr-4 text-sm font-semibold shadow-sm outline-none ring-bloomora-lilac/20 focus:ring-2"
                />
              </label>

              {listsLoading ? (
                <p className="text-sm text-bloomora-text-muted">Cargando…</p>
              ) : filteredLists.length === 0 ? (
                <p className="text-sm text-bloomora-text-muted">
                  No hay listas con ese nombre.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {filteredLists.map((l, idx) => {
                    const emoji = emojiById[l.id] ?? getListEmoji(l.id, l.title, idx)
                    const pct = listProgressPct(l.doneCount, l.totalCount)
                    const active = selectedId === l.id
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => selectList(l.id)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-[1.15rem] px-3 py-3 text-left transition touch-manipulation',
                            active
                              ? 'bg-bloomora-blush/80 ring-2 ring-bloomora-rose/45'
                              : isWide
                                ? 'bg-bloomora-mist/35 ring-1 ring-bloomora-line/35 hover:bg-bloomora-mist/70'
                                : 'bg-bloomora-white shadow-[0_6px_18px_-10px_rgba(91,74,140,0.28)] ring-1 ring-bloomora-line/30',
                            !isWide && 'pr-2',
                          )}
                        >
                          <span
                            className="grid size-11 shrink-0 place-items-center rounded-[0.9rem] bg-bloomora-white text-xl shadow-sm"
                            aria-hidden
                          >
                            {emoji}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate font-bold text-bloomora-deep">
                                {l.title}
                              </span>
                              {active && isWide ? (
                                <span className="text-xs" aria-hidden>
                                  ✏️
                                </span>
                              ) : null}
                            </span>
                            <span className="mt-1.5 flex items-center gap-2">
                              <span className="bloomora-lists-progress min-w-0 flex-1">
                                <span style={{ width: `${pct}%` }} />
                              </span>
                              <span className="shrink-0 text-xs font-semibold tabular-nums text-bloomora-text-muted">
                                {l.doneCount} de {l.totalCount}
                              </span>
                            </span>
                          </span>
                          {!isWide ? (
                            <span className="text-bloomora-text-muted" aria-hidden>
                              ›
                            </span>
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}

              {!isWide && lists.length > 0 ? (
                <div className="mt-5 rounded-[1.25rem] border border-dashed border-bloomora-lilac/45 bg-bloomora-mist/30 p-4">
                  <p className="mb-3 text-sm font-bold text-bloomora-deep">
                    Ideas para tu próxima lista
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {LIST_IDEA_PRESETS.slice(0, 4).map((idea) => (
                      <button
                        key={idea.label}
                        type="button"
                        disabled={addListMut.isPending}
                        onClick={() => createFromIdea(idea.title, idea.emoji)}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-pill bg-bloomora-white px-3 text-sm font-bold text-bloomora-violet ring-1 ring-bloomora-line/40"
                      >
                        <span aria-hidden>{idea.emoji}</span>
                        {idea.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          ) : null}

          {showDetailPanel ? (
            <section className="min-w-0 rounded-[1.5rem] border border-bloomora-line bg-bloomora-white p-4 shadow-[0_10px_30px_-18px_rgba(91,74,140,0.28)] sm:p-5 max-[599px]:rounded-none max-[599px]:border-0 max-[599px]:bg-transparent max-[599px]:p-0 max-[599px]:shadow-none">
              {!selected ? (
                <p className="text-sm text-bloomora-text-muted">
                  Elige una lista o crea una nueva.
                </p>
              ) : (
                <>
                  {showMobileDetail ? (
                    <header className="mb-4 flex items-center gap-2">
                      <BackButton
                        parentTo="/app/lists"
                        parentLabel="Listas"
                        iconOnly
                        onClick={(e) => {
                          e.preventDefault()
                          clearMobileDetail()
                        }}
                      />
                      <h2 className="min-w-0 flex-1 truncate text-center text-lg font-bold text-bloomora-deep">
                        {selected.title}
                      </h2>
                      <button
                        type="button"
                        aria-label="Más acciones"
                        className="grid size-11 place-items-center rounded-full text-xl text-bloomora-deep"
                        onClick={() => setActionsOpen(true)}
                      >
                        ⋮
                      </button>
                    </header>
                  ) : null}

                  {multiSelectMode ? (
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-bloomora-mist/70 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Salir de selección"
                          className="grid size-9 place-items-center rounded-full bg-bloomora-white text-bloomora-deep ring-1 ring-bloomora-line/40"
                          onClick={exitMultiSelect}
                        >
                          ✕
                        </button>
                        <p className="text-sm font-bold text-bloomora-deep">
                          {selectedItemIds.length} seleccionado
                          {selectedItemIds.length === 1 ? '' : 's'}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-sm font-bold text-bloomora-violet"
                        onClick={selectAllVisible}
                      >
                        Seleccionar todo
                      </button>
                      <p className="basis-full text-xs text-bloomora-text-muted">
                        Toca los ítems para elegirlos
                        {isWide ? ' · en PC también Shift + clic para un rango' : ''}
                      </p>
                    </div>
                  ) : null}

                  <div
                    className={cn(
                      'rounded-[1.25rem] bg-bloomora-mist/45 p-3 sm:p-4',
                      showMobileDetail && 'bg-bloomora-white ring-1 ring-bloomora-line/35',
                    )}
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-bloomora-blush text-2xl">
                        {selectedEmoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        {renaming ? (
                          <form
                            onSubmit={handleRenameList}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <input
                              ref={renameInputRef}
                              value={listTitleEdit}
                              onChange={(e) => setListTitleEdit(e.target.value)}
                              className="bloomora-form-input min-h-10 min-w-0 flex-1 rounded-xl border border-bloomora-line/50 px-3 text-base font-bold outline-none ring-bloomora-lilac/25 focus:ring-2"
                            />
                            <Button type="submit" size="sm">
                              Guardar
                            </Button>
                          </form>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            {!showMobileDetail ? (
                              <h2 className="text-xl font-bold text-bloomora-deep">
                                {selected.title}
                              </h2>
                            ) : null}
                            {!showMobileDetail ? (
                              <button
                                type="button"
                                aria-label="Renombrar"
                                className="text-sm"
                                onClick={() => {
                                  setRenaming(true)
                                  requestAnimationFrame(() =>
                                    renameInputRef.current?.focus(),
                                  )
                                }}
                              >
                                ✏️
                              </button>
                            ) : null}
                          </div>
                        )}
                        <p className="mt-0.5 text-sm text-bloomora-text-muted">
                          {selectedTotal === 0
                            ? 'Sin ítems todavía'
                            : `${selectedDone} de ${selectedTotal} hechos`}
                          {!showMobileDetail && selected.updatedAt
                            ? ` · ${formatListUpdatedLabel(selected.updatedAt)}`
                            : ''}
                        </p>
                      </div>
                      <div className="ml-auto flex flex-wrap items-center gap-2">
                        {canUseGadgets ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="min-h-10"
                            disabled={isListGadgetOpen(selected.id)}
                            onClick={() => openListGadget(selected.id)}
                          >
                            {showMobileDetail ? '📄 Post-it' : '📄 Abrir como post-it'}
                          </Button>
                        ) : showMobileDetail ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="min-h-10"
                            disabled
                            title="Los post-it están en tablet y PC"
                          >
                            📄 Post-it
                          </Button>
                        ) : null}
                        {!showMobileDetail ? (
                          <button
                            type="button"
                            aria-label="Más acciones"
                            className="grid size-10 place-items-center rounded-full text-lg text-bloomora-deep ring-1 ring-bloomora-line/40"
                            onClick={() => setActionsOpen(true)}
                          >
                            ⋮
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {selectedTotal > 0 ? (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="bloomora-lists-progress bloomora-lists-progress--lg min-w-0 flex-1">
                          <span style={{ width: `${selectedPct}%` }} />
                        </div>
                        <span className="text-sm font-bold tabular-nums text-bloomora-violet">
                          {selectedPct}%
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {showMobileDetail && !hintDismissed && !multiSelectMode ? (
                    <div className="relative mt-3 rounded-2xl bg-bloomora-mist/70 px-3 py-2.5 pr-9 text-xs font-semibold leading-relaxed text-bloomora-violet">
                      Desliza un ítem a la izquierda para editar o quitar. Mantén
                      presionado para seleccionar varios.
                      <button
                        type="button"
                        aria-label="Cerrar pista"
                        className="absolute right-2 top-2 grid size-7 place-items-center rounded-full"
                        onClick={() => setHintDismissed(true)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : null}

                  {!showMobileDetail ? (
                    <form
                      onSubmit={handleAddItem}
                      className="mt-4 flex items-center gap-2 rounded-pill bg-bloomora-blush/70 p-1.5 ring-1 ring-bloomora-line/30"
                    >
                      <span className="pl-3 text-bloomora-rose-deep" aria-hidden>
                        +
                      </span>
                      <input
                        ref={newItemInputRef}
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder={
                          selectedTotal === 0
                            ? 'Escribe tu primer ítem…'
                            : 'Agregar algo a la lista…'
                        }
                        className="min-h-11 min-w-0 flex-1 bg-transparent px-1 text-sm font-semibold text-bloomora-deep outline-none placeholder:text-bloomora-text-muted"
                      />
                      <span className="hidden text-xs font-bold text-bloomora-text-muted sm:inline">
                        Enter ↵
                      </span>
                      <button
                        type="submit"
                        disabled={!newItem.trim() || addItem.isPending}
                        aria-label="Agregar ítem"
                        className="grid size-11 shrink-0 place-items-center rounded-full bg-bloomora-rose-deep text-lg font-bold text-white shadow-sm disabled:opacity-45"
                      >
                        +
                      </button>
                    </form>
                  ) : null}

                  {itemsLoading ? (
                    <p className="mt-4 text-sm text-bloomora-text-muted">
                      Cargando…
                    </p>
                  ) : visibleItems.length === 0 ? (
                    <EmptyListItemsState />
                  ) : (
                    <div className="mt-4 space-y-4">
                      {selectedDone === selectedTotal && selectedTotal > 0 ? (
                        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200/80">
                          <BloomyPose pose="celebrate" sizePx={72} showSparks={false} />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-emerald-800">
                              ¡Lista completa! Todo listo.
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="mt-2"
                              onClick={() => clearCompleted.mutate()}
                            >
                              🧹 Limpiar hechos
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      <ItemSection
                        title="PENDIENTES"
                        count={visiblePending.length}
                        open={pendingSectionOpen}
                        onToggle={() => setPendingSectionOpen((v) => !v)}
                        trailing={
                          !multiSelectMode ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs font-bold text-bloomora-violet"
                              onClick={() => setMultiSelectMode(true)}
                            >
                              ☑️ Seleccionar
                            </button>
                          ) : null
                        }
                      >
                        {visiblePending.map((it) => (
                          <ListItemRow
                            key={it.id}
                            cedula={cedula}
                            item={it}
                            multiSelectMode={multiSelectMode}
                            selected={selectedItemIds.includes(it.id)}
                            swipeEnabled={!isDesktop && !multiSelectMode}
                            swipeOpen={openSwipeId === it.id}
                            onSwipeOpenChange={handleSwipeOpenChange}
                            showAgenda={isWide && !multiSelectMode}
                            showHoverActions={isDesktop && !multiSelectMode}
                            onSelectToggle={() => toggleSelectedItem(it.id)}
                            onActivateMultiSelect={() => {
                              setMultiSelectMode(true)
                              setSelectedItemIds((prev) =>
                                prev.includes(it.id) ? prev : [...prev, it.id],
                              )
                            }}
                            onToggle={(done) =>
                              toggleItem.mutate({ id: it.id, done })
                            }
                            onRename={(title) =>
                              renameItem.mutate({ id: it.id, title })
                            }
                            onDelete={() => scheduleUndoRemove(it)}
                          />
                        ))}
                      </ItemSection>

                      <ItemSection
                        title="HECHOS"
                        count={visibleDone.length}
                        open={doneSectionOpen}
                        onToggle={() => setDoneSectionOpen((v) => !v)}
                        trailing={
                          visibleDone.length > 0 && !multiSelectMode ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs font-bold text-bloomora-violet"
                              onClick={() => clearCompleted.mutate()}
                            >
                              🧹 Limpiar hechos
                            </button>
                          ) : null
                        }
                      >
                        {visibleDone.map((it) => (
                          <ListItemRow
                            key={it.id}
                            cedula={cedula}
                            item={it}
                            multiSelectMode={multiSelectMode}
                            selected={selectedItemIds.includes(it.id)}
                            swipeEnabled={!isDesktop && !multiSelectMode}
                            swipeOpen={openSwipeId === it.id}
                            onSwipeOpenChange={handleSwipeOpenChange}
                            showAgenda={isWide && !multiSelectMode}
                            showHoverActions={isDesktop && !multiSelectMode}
                            onSelectToggle={() => toggleSelectedItem(it.id)}
                            onActivateMultiSelect={() => {
                              setMultiSelectMode(true)
                              setSelectedItemIds((prev) =>
                                prev.includes(it.id) ? prev : [...prev, it.id],
                              )
                            }}
                            onToggle={(done) =>
                              toggleItem.mutate({ id: it.id, done })
                            }
                            onRename={(title) =>
                              renameItem.mutate({ id: it.id, title })
                            }
                            onDelete={() => scheduleUndoRemove(it)}
                          />
                        ))}
                      </ItemSection>
                    </div>
                  )}

                  {showMobileDetail ? (
                    <form
                      onSubmit={handleAddItem}
                      className="sticky bottom-0 z-10 mt-4 flex items-center gap-2 rounded-pill bg-bloomora-white p-1.5 shadow-[0_8px_28px_-10px_rgba(91,74,140,0.35)] ring-1 ring-bloomora-line/40"
                    >
                      <span className="pl-3 text-bloomora-rose-deep" aria-hidden>
                        +
                      </span>
                      <input
                        ref={newItemInputRef}
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Agregar algo…"
                        className="min-h-11 min-w-0 flex-1 bg-transparent px-1 text-sm font-semibold outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!newItem.trim() || addItem.isPending}
                        aria-label="Agregar ítem"
                        className="grid size-12 shrink-0 place-items-center rounded-full bg-bloomora-rose-deep text-xl font-bold text-white shadow-md disabled:opacity-45"
                      >
                        +
                      </button>
                    </form>
                  ) : null}
                </>
              )}
            </section>
          ) : null}
        </div>
      )}

      {multiSelectMode && selectedItemIds.length > 0
        ? createPortal(
            <div className="bloomora-lists-undo !bottom-[max(5.5rem,calc(72px+env(safe-area-inset-bottom)+1rem))] min-[600px]:!bottom-8">
              <span className="text-sm font-bold">
                {selectedItemIds.length} ítem
                {selectedItemIds.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-pill bg-white px-3 text-sm font-bold text-bloomora-deep"
                onClick={markSelectedDone}
              >
                ✓ Marcar como hechos
              </button>
              <button
                type="button"
                className="inline-flex min-h-10 items-center gap-1 rounded-pill bg-[#e86b8c] px-3 text-sm font-bold text-white"
                onClick={() => void deleteSelected()}
              >
                🗑️ Eliminar
              </button>
            </div>,
            document.body,
          )
        : null}

      {pendingUndo
        ? createPortal(
            <div className="bloomora-lists-undo" role="status">
              <span className="text-sm font-semibold">
                Quitaste “{pendingUndo.item.title}”
              </span>
              <button
                type="button"
                className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-pill bg-white px-3 text-sm font-bold text-bloomora-deep"
                onClick={undoRemove}
              >
                ↩️ Deshacer
              </button>
            </div>,
            document.body,
          )
        : null}

      {selected ? (
        <ListActionsSheet
          open={actionsOpen}
          title={selected.title}
          emoji={selectedEmoji}
          done={selectedDone}
          total={selectedTotal}
          canPostit={canUseGadgets}
          postitOpen={isListGadgetOpen(selected.id)}
          exportBusy={exportBusy}
          onClose={() => setActionsOpen(false)}
          onAction={(id) => void handleSheetAction(id)}
        />
      ) : null}

      {emojiPickerOpen && selected
        ? createPortal(
            <div className="bloomora-lists-sheet" role="presentation">
              <button
                type="button"
                className="bloomora-lists-sheet__backdrop"
                data-backdrop
                aria-label="Cerrar"
                onClick={() => setEmojiPickerOpen(false)}
              />
              <div
                role="dialog"
                aria-modal
                aria-label="Cambiar emoji"
                className="bloomora-lists-sheet__panel max-[599px]:!bottom-0 min-[600px]:inset-auto min-[600px]:left-1/2 min-[600px]:top-1/2 min-[600px]:w-[min(100vw-2rem,22rem)] min-[600px]:-translate-x-1/2 min-[600px]:-translate-y-1/2 min-[600px]:rounded-[1.5rem]"
              >
                <div className="bloomora-lists-sheet__handle min-[600px]:hidden" />
                <p className="mb-3 font-bold text-bloomora-deep">Cambiar emoji</p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {LIST_EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className="grid aspect-square place-items-center rounded-2xl bg-bloomora-mist text-2xl hover:bg-bloomora-blush"
                      onClick={() => {
                        setListEmoji(selected.id, em)
                        setEmojiTick((n) => n + 1)
                        setEmojiPickerOpen(false)
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function EmptyListsState({
  onCreate,
  onIdea,
  busy,
}: {
  onCreate: () => void
  onIdea: (title: string, emoji: string) => void
  busy: boolean
}) {
  return (
    <div className="flex flex-col items-center rounded-[1.75rem] border border-bloomora-line bg-bloomora-white px-6 py-10 text-center shadow-sm">
      <BloomyPose pose="wave" sizePx={160} priority />
      <h2 className="mt-4 text-xl font-bold text-bloomora-deep">
        Aún no tienes listas
      </h2>
      <p className="mt-2 max-w-md text-sm text-bloomora-text-muted">
        Crea una para tus compras, tu próximo viaje o lo que quieras recordar.
      </p>
      <Button
        type="button"
        className="mt-5 min-h-12 rounded-pill px-6"
        onClick={onCreate}
        disabled={busy}
      >
        + Crear mi primera lista
      </Button>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {LIST_IDEA_PRESETS.map((idea) => (
          <button
            key={idea.label}
            type="button"
            disabled={busy}
            onClick={() => onIdea(idea.title, idea.emoji)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-pill bg-bloomora-mist px-3 text-sm font-bold text-bloomora-violet ring-1 ring-bloomora-line/40"
          >
            <span aria-hidden>{idea.emoji}</span>
            {idea.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function EmptyListItemsState() {
  return (
    <div className="mt-6 flex flex-col items-center px-4 py-6 text-center">
      <BloomyPose pose="think" sizePx={120} showSparks={false} />
      <p className="mt-3 max-w-sm text-sm font-semibold leading-relaxed text-bloomora-text-muted">
        Tu lista está vacía. Escribe arriba y presiona Enter. Puedes agregar
        varios seguidos sin soltar el teclado.
      </p>
    </div>
  )
}

function ItemSection({
  title,
  count,
  open,
  onToggle,
  trailing,
  children,
}: {
  title: string
  count: number
  open: boolean
  onToggle: () => void
  trailing?: ReactNode
  children: ReactNode
}) {
  if (count === 0 && title === 'HECHOS') return null
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-bloomora-text-muted"
        >
          <span aria-hidden>{open ? '▾' : '▸'}</span>
          {title}
          <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-pill bg-bloomora-blush px-1.5 text-[0.65rem] font-bold text-bloomora-rose-deep">
            {count}
          </span>
        </button>
        <div className="ml-auto">{trailing}</div>
      </div>
      {open ? <ul className="space-y-2">{children}</ul> : null}
    </section>
  )
}

function ListItemMoreMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target
      if (!(target instanceof Node)) return
      if (rootRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Más acciones"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-bloomora-line/40 bg-bloomora-white/90 text-lg font-bold leading-none text-bloomora-deep shadow-sm ring-1 ring-bloomora-line/20 transition hover:bg-bloomora-lavender-50/80"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        ⋯
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+4px)] z-30 min-w-[10.5rem] overflow-hidden rounded-2xl bg-bloomora-white p-1 shadow-[0_12px_32px_-12px_rgba(91,74,140,0.45)] ring-1 ring-bloomora-line/40"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-bloomora-deep transition hover:bg-bloomora-lavender-50"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              onEdit()
            }}
          >
            <span aria-hidden>✏️</span> Editar
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#d64062] transition hover:bg-bloomora-blush"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              onDelete()
            }}
          >
            <span aria-hidden>🗑️</span> Quitar
          </button>
        </div>
      ) : null}
    </div>
  )
}

function ListItemRow({
  cedula,
  item,
  multiSelectMode,
  selected,
  swipeEnabled,
  swipeOpen,
  onSwipeOpenChange,
  showAgenda,
  showHoverActions,
  onSelectToggle,
  onActivateMultiSelect,
  onToggle,
  onRename,
  onDelete,
}: {
  cedula: string | null
  item: UiListItem
  multiSelectMode: boolean
  selected: boolean
  swipeEnabled: boolean
  swipeOpen: boolean
  onSwipeOpenChange: (id: string | null) => void
  showAgenda: boolean
  showHoverActions: boolean
  onSelectToggle: () => void
  onActivateMultiSelect: () => void
  onToggle: (done: boolean) => void
  onRename: (title: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.title)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const rootRef = useRef<HTMLLIElement | null>(null)
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const startOffset = useRef(0)
  const offsetRef = useRef(0)
  const axisLock = useRef<'none' | 'h' | 'v'>('none')
  const suppressSwipe = useRef(false)
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setDraft(item.title)
  }, [item.title])

  useEffect(() => {
    offsetRef.current = offset
  }, [offset])

  useEffect(() => {
    return () => {
      if (longPress.current) clearTimeout(longPress.current)
    }
  }, [])

  useEffect(() => {
    if (dragging) return
    setOffset(swipeOpen ? SWIPE_OPEN_OFFSET : 0)
  }, [swipeOpen, dragging])

  useEffect(() => {
    if (!swipeEnabled || !swipeOpen) return
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target
      if (!(target instanceof Node)) return
      if (rootRef.current?.contains(target)) return
      onSwipeOpenChange(null)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [swipeEnabled, swipeOpen, onSwipeOpenChange])

  const markAsTransferred = () => {
    if (!item.done) onToggle(true)
  }

  const clearLongPress = () => {
    if (!longPress.current) return
    clearTimeout(longPress.current)
    longPress.current = null
  }

  const closeSwipe = () => {
    setOffset(0)
    onSwipeOpenChange(null)
  }

  const beginEdit = () => {
    closeSwipe()
    setEditing(true)
  }

  const beginDelete = () => {
    closeSwipe()
    onDelete()
  }

  return (
    <li
      ref={rootRef}
      className={cn(
        'group/item relative overflow-hidden rounded-2xl [touch-action:pan-y]',
        multiSelectMode && selected && 'ring-2 ring-bloomora-violet/40',
      )}
      onDoubleClick={() => {
        if (editing || multiSelectMode) return
        onActivateMultiSelect()
      }}
      onTouchStart={(e) => {
        if (!swipeEnabled || editing || multiSelectMode) return
        const t = e.touches[0]
        if (!t) return
        suppressSwipe.current = false
        axisLock.current = 'none'
        if (!swipeOpen) onSwipeOpenChange(null)
        startX.current = t.clientX
        startY.current = t.clientY
        startOffset.current = swipeOpen ? SWIPE_OPEN_OFFSET : 0
        longPress.current = setTimeout(() => {
          suppressSwipe.current = true
          axisLock.current = 'none'
          startX.current = null
          startY.current = null
          setDragging(false)
          setOffset(0)
          onSwipeOpenChange(null)
          onActivateMultiSelect()
        }, LONG_PRESS_MS)
      }}
      onTouchMove={(e) => {
        if (suppressSwipe.current || startX.current == null || startY.current == null) return
        const t = e.touches[0]
        if (!t) return
        const dx = t.clientX - startX.current
        const dy = t.clientY - startY.current

        if (axisLock.current === 'none') {
          if (Math.abs(dx) < SWIPE_AXIS_DEADZONE && Math.abs(dy) < SWIPE_AXIS_DEADZONE) return
          clearLongPress()
          if (Math.abs(dy) > Math.abs(dx)) {
            axisLock.current = 'v'
            startX.current = null
            startY.current = null
            setDragging(false)
            return
          }
          axisLock.current = 'h'
          setDragging(true)
        }

        if (axisLock.current !== 'h') return
        clearLongPress()
        const next = Math.min(0, Math.max(startOffset.current + dx, SWIPE_OPEN_OFFSET))
        offsetRef.current = next
        setOffset(next)
      }}
      onTouchEnd={() => {
        clearLongPress()
        const wasHorizontal = axisLock.current === 'h' && !suppressSwipe.current
        startX.current = null
        startY.current = null
        axisLock.current = 'none'
        setDragging(false)
        if (!wasHorizontal) {
          setOffset(swipeOpen ? SWIPE_OPEN_OFFSET : 0)
          return
        }
        const threshold = Math.abs(SWIPE_OPEN_OFFSET) * SWIPE_OPEN_RATIO
        const open = Math.abs(offsetRef.current) >= threshold
        setOffset(open ? SWIPE_OPEN_OFFSET : 0)
        onSwipeOpenChange(open ? item.id : null)
      }}
      onTouchCancel={() => {
        clearLongPress()
        startX.current = null
        startY.current = null
        axisLock.current = 'none'
        suppressSwipe.current = false
        setDragging(false)
        setOffset(swipeOpen ? SWIPE_OPEN_OFFSET : 0)
      }}
    >
      {swipeEnabled ? (
        <div
          className="absolute inset-y-0 right-0 z-0 flex items-stretch"
          aria-hidden={offset === 0}
        >
          <button
            type="button"
            className="flex h-full min-w-[64px] w-[72px] shrink-0 items-center justify-center gap-1 whitespace-nowrap bg-bloomora-lavender-100 text-xs font-bold text-bloomora-deep"
            onClick={beginEdit}
          >
            <span aria-hidden>✏️</span> Editar
          </button>
          <button
            type="button"
            className="flex h-full min-w-[64px] w-[72px] shrink-0 items-center justify-center gap-1 whitespace-nowrap bg-bloomora-rose-deep text-xs font-bold text-white"
            onClick={beginDelete}
          >
            <span aria-hidden>🗑️</span> Quitar
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          'relative z-10 flex w-full min-w-0 items-start gap-3 p-3 ring-1 ring-bloomora-line/25 sm:p-3.5',
          swipeEnabled
            ? cn('bg-bloomora-white', item.done && 'bg-bloomora-mist')
            : cn('bg-bloomora-mist/40', item.done && 'bg-bloomora-mist/25'),
          selected && multiSelectMode && 'bg-[#ebe4f8]',
        )}
        style={
          swipeEnabled
            ? {
                transform: `translateX(${offset}px)`,
                transition: dragging ? undefined : 'transform 160ms ease',
              }
            : undefined
        }
      >
        {editing ? (
          <form
            className="flex min-w-0 flex-1 flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              onRename(draft.trim() || item.title)
              setEditing(false)
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="bloomora-form-input min-h-10 w-full rounded-xl border border-bloomora-line/50 px-3 text-sm font-semibold outline-none focus:ring-2"
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Guardar
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
            </div>
          </form>
        ) : (
          <>
            <button
              type="button"
              role="checkbox"
              aria-checked={multiSelectMode ? selected : item.done}
              onClick={() => {
                if (multiSelectMode) onSelectToggle()
                else onToggle(!item.done)
              }}
              className={cn(
                'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[0.7rem] border-2 text-sm font-bold transition',
                multiSelectMode
                  ? selected
                    ? 'border-bloomora-violet bg-bloomora-violet text-white'
                    : 'border-bloomora-lilac/50 bg-white'
                  : item.done
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-bloomora-lilac/45 bg-white',
              )}
            >
              {(multiSelectMode ? selected : item.done) ? '✓' : ''}
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'min-w-0 whitespace-normal font-semibold text-bloomora-deep [overflow-wrap:anywhere] [word-break:break-word]',
                  item.done &&
                    'text-bloomora-text-muted line-through decoration-bloomora-lilac/60',
                )}
                style={{
                  fontSize: 'clamp(14px, 3.8vw, 16px)',
                  lineHeight: 1.35,
                }}
              >
                {item.title}
              </p>
            </div>
            {showHoverActions ? (
              <div
                className="pointer-events-none flex shrink-0 items-center gap-1.5 self-center opacity-0 transition-opacity duration-150 group-hover/item:pointer-events-auto group-hover/item:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100"
                aria-hidden={false}
              >
                <button
                  type="button"
                  className="rounded-full bg-bloomora-white px-3 py-1.5 text-xs font-semibold text-bloomora-violet ring-1 ring-bloomora-line/40 transition hover:bg-bloomora-lavender-50"
                  onClick={beginEdit}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="rounded-full bg-bloomora-white px-3 py-1.5 text-xs font-semibold text-[#d64062] ring-1 ring-red-200/60 transition hover:bg-bloomora-blush"
                  onClick={beginDelete}
                >
                  Quitar
                </button>
              </div>
            ) : null}
            {!multiSelectMode ? (
              <ListItemMoreMenu onEdit={beginEdit} onDelete={beginDelete} />
            ) : null}
            {showAgenda ? (
              <ListItemAgendaMenu
                cedula={cedula}
                itemTitle={item.title}
                itemDone={item.done}
                onTransferred={markAsTransferred}
              />
            ) : null}
          </>
        )}
      </div>
    </li>
  )
}
