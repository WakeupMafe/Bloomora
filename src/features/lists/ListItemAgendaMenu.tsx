import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQueries } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import {
  computeNextAgendaBlockMinutes,
  useListItemAgendaMutations,
} from '@/hooks/useListItemAgendaMutations'
import { useFixedPopoverPosition } from '@/hooks/useFixedPopoverPosition'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePopoverDismiss } from '@/hooks/usePopoverDismiss'
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

const MENU_WIDTH = 220
const MENU_HEIGHT_EST = 120
const Z_MENU = 10_060
const Z_BACKDROP_MOBILE = 10_055
const Z_MODAL_BACKDROP = 10_070
const Z_MODAL = 10_075

type ListItemAgendaMenuProps = {
  cedula: string | null
  itemTitle: string
  itemDone: boolean
  onTransferred: () => void
}

export function ListItemAgendaMenu({
  cedula,
  itemTitle,
  itemDone,
  onTransferred,
}: ListItemAgendaMenuProps) {
  const uid = useId().replace(/:/g, '')
  const triggerId = `list-agenda-trigger-${uid}`
  const menuId = `list-agenda-menu-${uid}`

  const [menuOpen, setMenuOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [subtaskModalOpen, setSubtaskModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const closeMenu = () => setMenuOpen(false)
  usePopoverDismiss(menuOpen, triggerRef, menuRef, closeMenu)

  const isNarrow = useMediaQuery('(max-width: 639px)')
  const coords = useFixedPopoverPosition(
    menuOpen && !isNarrow,
    triggerRef,
    MENU_WIDTH,
    MENU_HEIGHT_EST,
  )

  const trimmed = itemTitle.trim()
  const disabled = !cedula || !trimmed

  const { dayKeys, dayDates } = useMemo(() => {
    const today = startOfLocalDay(new Date())
    const keys: string[] = []
    const dates: Date[] = []
    for (let i = 0; i < 3; i++) {
      const d = addLocalDays(today, i)
      dates.push(d)
      keys.push(toDateKeyLocal(d))
    }
    return { dayKeys: keys, dayDates: dates }
  }, [])

  const loadAgenda = Boolean(cedula && (taskModalOpen || subtaskModalOpen))
  const agendaQueries = useQueries({
    queries: dayKeys.map((dayKey) => ({
      // Clave dedicada: evita colisión con `useBloomoraAgenda` (forma distinta de datos).
      queryKey: ['agenda-lite', cedula, dayKey] as const,
      queryFn: async () => {
        const sb = requireSupabase()
        await requireExistingProfileByCedula(sb, cedula!)
        return listAgendaTasks(sb, cedula!, dayKey)
      },
      enabled: loadAgenda,
      staleTime: 30_000,
    })),
  })

  const {
    createTaskFromListItem,
    addSubtaskFromListItem,
    showToast,
  } = useListItemAgendaMutations(cedula)

  const openTaskModal = () => {
    setMenuOpen(false)
    setTaskModalOpen(true)
  }

  const openSubtaskModal = () => {
    setMenuOpen(false)
    setSelectedTaskId(null)
    setSubtaskModalOpen(true)
  }

  const closeTaskModal = () => setTaskModalOpen(false)
  const closeSubtaskModal = () => {
    setSubtaskModalOpen(false)
    setSelectedTaskId(null)
  }

  useEffect(() => {
    if (!taskModalOpen && !subtaskModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setTaskModalOpen(false)
      setSubtaskModalOpen(false)
      setSelectedTaskId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [taskModalOpen, subtaskModalOpen])

  const handleCreateTask = (dayKey: string, label: string) => {
    createTaskFromListItem.mutate(
      { dayKey, title: trimmed },
      {
        onSuccess: () => {
          if (!itemDone) onTransferred()
          showToast(`Tarea creada y agregada: ${label}.`)
          closeTaskModal()
        },
        onError: (e) => {
          showToast(e instanceof Error ? e.message : 'No se pudo crear la tarea.')
        },
      },
    )
  }

  const handleAssignSubtask = () => {
    if (selectedTaskId == null) {
      showToast('Elige una tarea.')
      return
    }
    addSubtaskFromListItem.mutate(
      { taskId: selectedTaskId, title: trimmed },
      {
        onSuccess: () => {
          if (!itemDone) onTransferred()
          showToast('Genial! Agregaste este item como paso.')
          closeSubtaskModal()
        },
        onError: (e) => {
          showToast(e instanceof Error ? e.message : 'No se pudo agregar el paso.')
        },
      },
    )
  }

  if (disabled) return null

  const menuPortal =
    menuOpen &&
    createPortal(
      <>
        {isNarrow ? (
          <button
            type="button"
            data-backdrop
            className="fixed inset-0 border-0 bg-bloomora-deep/15 p-0 transition-[background-color] duration-200 ease-out hover:bg-bloomora-deep/22 active:bg-bloomora-deep/28"
            style={{ zIndex: Z_BACKDROP_MOBILE }}
            aria-label="Cerrar menú"
            onClick={closeMenu}
          />
        ) : null}

        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          className={cn(
            'min-w-[11rem] overflow-hidden rounded-xl bg-bloomora-blush/[0.98] py-1 shadow-[0_14px_40px_rgba(91,74,140,0.18)] ring-1 ring-bloomora-line/40 backdrop-blur-sm',
            isNarrow ? 'fixed rounded-[18px] p-1' : 'fixed rounded-xl p-1',
          )}
          style={
            isNarrow
              ? {
                  position: 'fixed',
                  zIndex: Z_MENU,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 'min(100vw - 24px, 18rem)',
                }
              : coords
                ? {
                    position: 'fixed',
                    zIndex: Z_MENU,
                    top: coords.top,
                    left: coords.left,
                    width: coords.width,
                  }
                : {
                    position: 'fixed',
                    zIndex: Z_MENU,
                    top: 10,
                    left: 10,
                    width: MENU_WIDTH,
                    visibility: 'hidden' as const,
                  }
          }
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-bloomora-deep transition hover:bg-bloomora-lavender-50/90"
            onClick={openTaskModal}
          >
            Crear como tarea
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-bloomora-deep transition hover:bg-bloomora-lavender-50/90"
            onClick={openSubtaskModal}
          >
            Crear como paso
          </button>
        </div>
      </>,
      document.body,
    )

  const taskModal =
    taskModalOpen &&
    createPortal(
      <>
        <button
          type="button"
          data-bloomora-modal-backdrop
          className="fixed inset-0 border-0 bg-bloomora-deep/20 p-0 backdrop-blur-[2px] transition-[background-color] duration-200 ease-out hover:bg-bloomora-deep/26 active:bg-bloomora-deep/30"
          style={{ zIndex: Z_MODAL_BACKDROP }}
          aria-label="Cerrar"
          onClick={closeTaskModal}
        />
        <div
          role="dialog"
          aria-modal
          className={cn(
            'bloomora-modal-panel fixed flex max-h-[min(85vh,28rem)] flex-col gap-4 overflow-hidden bg-bloomora-blush/[0.98] shadow-[0_16px_48px_rgba(91,74,140,0.22)] ring-1 ring-bloomora-line/40 backdrop-blur-md',
            isNarrow
              ? 'rounded-[22px] p-5'
              : 'left-1/2 top-1/2 max-w-[min(100vw-2rem,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6',
          )}
          style={
            isNarrow
              ? {
                  zIndex: Z_MODAL,
                  left: 'max(12px, env(safe-area-inset-left))',
                  right: 'max(12px, env(safe-area-inset-right))',
                  bottom: 'max(12px, env(safe-area-inset-bottom))',
                  width: 'auto',
                }
              : { zIndex: Z_MODAL }
          }
        >
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-bloomora-text-muted">
              Agregar a la agenda
            </p>
            <h2 className="bloomora-modal-title mt-1 text-base font-bold leading-snug tracking-tight text-bloomora-deep sm:text-lg">
              Crear como tarea
            </h2>
            <p className="mt-1 text-sm text-bloomora-text-muted">
              Elige el día. Se sugerirá un bloque de 30 min tras la última tarea
              del día (o 9:00–9:30 si no hay tareas).
            </p>
          </div>
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-0.5">
            {dayKeys.map((dayKey, i) => {
              const label = titleCaseAgendaDate(dayDates[i]!)
              const q = agendaQueries[i]
              const tasks = q?.data ?? []
              const { startMin, endMin } = computeNextAgendaBlockMinutes(tasks)
              const range = `${formatMinutes12h(startMin)} – ${formatMinutes12h(endMin)}`
              const loading = q?.isLoading
              return (
                <li key={dayKey}>
                  <button
                    type="button"
                    disabled={createTaskFromListItem.isPending}
                    onClick={() => handleCreateTask(dayKey, label)}
                    className="flex w-full flex-col items-start gap-0.5 rounded-2xl border border-bloomora-line/35 bg-bloomora-white/80 px-4 py-3 text-left transition hover:border-bloomora-lilac/50 hover:bg-bloomora-lavender-50/60 disabled:opacity-60"
                  >
                    <span className="text-sm font-bold text-bloomora-deep">{label}</span>
                    <span className="text-xs font-medium text-bloomora-text-muted">
                      {loading ? 'Calculando hora…' : `Sugerido: ${range}`}
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
            onClick={closeTaskModal}
          >
            Cancelar
          </Button>
        </div>
      </>,
      document.body,
    )

  const subtaskModal =
    subtaskModalOpen &&
    createPortal(
      <>
        <button
          type="button"
          data-bloomora-modal-backdrop
          className="fixed inset-0 border-0 bg-bloomora-deep/20 p-0 backdrop-blur-[2px] transition-[background-color] duration-200 ease-out hover:bg-bloomora-deep/26 active:bg-bloomora-deep/30"
          style={{ zIndex: Z_MODAL_BACKDROP }}
          aria-label="Cerrar"
          onClick={closeSubtaskModal}
        />
        <div
          role="dialog"
          aria-modal
          className={cn(
            'bloomora-modal-panel fixed flex max-h-[min(88vh,32rem)] flex-col gap-4 overflow-hidden bg-bloomora-blush/[0.98] shadow-[0_16px_48px_rgba(91,74,140,0.22)] ring-1 ring-bloomora-line/40 backdrop-blur-md',
            isNarrow
              ? 'rounded-[22px] p-5'
              : 'left-1/2 top-1/2 max-w-[min(100vw-2rem,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6',
          )}
          style={
            isNarrow
              ? {
                  zIndex: Z_MODAL,
                  left: 'max(12px, env(safe-area-inset-left))',
                  right: 'max(12px, env(safe-area-inset-right))',
                  bottom: 'max(12px, env(safe-area-inset-bottom))',
                  width: 'auto',
                }
              : { zIndex: Z_MODAL }
          }
        >
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-bloomora-text-muted">
              Agenda
            </p>
            <h2 className="bloomora-modal-title mt-1 text-base font-bold leading-snug tracking-tight text-bloomora-deep sm:text-lg">
              Selecciona la tarea
            </h2>
            <p className="mt-1 text-sm text-bloomora-text-muted">
              Elige una tarea de hoy o de los dos días siguientes. El texto del
              ítem se añadirá como paso.
            </p>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
            {dayKeys.map((dayKey, i) => {
              const dayLabel = titleCaseAgendaDate(dayDates[i]!)
              const q = agendaQueries[i]
              const tasks = q?.data ?? []
              const loading = q?.isLoading
              return (
                <div key={dayKey}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-bloomora-violet">
                    {dayLabel}
                  </p>
                  {loading ? (
                    <p className="text-sm text-bloomora-text-muted">Cargando…</p>
                  ) : tasks.length === 0 ? (
                    <p className="text-sm text-bloomora-text-muted">
                      Sin tareas este día.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {tasks.map((t) => (
                        <li key={t.id}>
                          <label
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition',
                              selectedTaskId === t.id
                                ? 'border-bloomora-rose/50 bg-bloomora-lavender-50/90 ring-1 ring-bloomora-rose/25'
                                : 'border-bloomora-line/30 bg-bloomora-white/70 hover:border-bloomora-lilac/40',
                            )}
                          >
                            <input
                              type="radio"
                              name={`task-pick-${uid}`}
                              className="mt-1"
                              checked={selectedTaskId === t.id}
                              onChange={() => setSelectedTaskId(t.id)}
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
              onClick={closeSubtaskModal}
              disabled={addSubtaskFromListItem.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={selectedTaskId == null || addSubtaskFromListItem.isPending}
              onClick={handleAssignSubtask}
            >
              {addSubtaskFromListItem.isPending ? '…' : 'Asignar'}
            </Button>
          </div>
        </div>
      </>,
      document.body,
    )

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-label="Opciones de agenda"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-bloomora-line/40 bg-bloomora-white/90 text-lg font-bold text-bloomora-deep shadow-sm ring-1 ring-bloomora-line/20 transition hover:bg-bloomora-lavender-50/80 touch-manipulation"
        onClick={(e) => {
          e.stopPropagation()
          setMenuOpen((o) => !o)
        }}
      >
        ⋮
      </button>
      {menuPortal}
      {taskModal}
      {subtaskModal}
    </>
  )
}
