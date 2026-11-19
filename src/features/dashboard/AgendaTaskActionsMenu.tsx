import { useCallback, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFixedPopoverPosition } from '@/hooks/useFixedPopoverPosition'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePopoverDismiss } from '@/hooks/usePopoverDismiss'
import { cn } from '@/utils/cn'

const MENU_WIDTH = 192
/** Por encima del selector de color del tracker (10050) */
const Z_MENU = 10_060
const Z_BACKDROP_MOBILE = 10_055

export function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type AgendaTaskActionsMenuProps = {
  taskTitle: string
  open: boolean
  onClose: () => void
  /** Clic en el botón ⋮ (toggle abierto/cerrado desde el padre) */
  onTriggerClick: () => void
  onEdit?: () => void
  onDelete?: () => void
  onOpenBlockCountdown?: () => void
}

export function AgendaTaskActionsMenu({
  taskTitle,
  open,
  onClose,
  onTriggerClick,
  onEdit,
  onDelete,
  onOpenBlockCountdown,
}: AgendaTaskActionsMenuProps) {
  const uid = useId().replace(/:/g, '')
  const triggerId = `agenda-task-menu-trigger-${uid}`
  const menuId = `agenda-task-menu-${uid}`

  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => onClose(), [onClose])
  usePopoverDismiss(open, triggerRef, menuRef, close)

  const itemCount = [onEdit, onOpenBlockCountdown, onDelete].filter(Boolean).length
  const menuHeight = 12 + itemCount * 42

  const isNarrow = useMediaQuery('(max-width: 639px)')
  const coords = useFixedPopoverPosition(
    open,
    triggerRef,
    MENU_WIDTH,
    menuHeight,
    isNarrow ? 72 + 8 : 0,
  )

  const runEdit = () => {
    onEdit?.()
    close()
  }

  const runCountdown = () => {
    onOpenBlockCountdown?.()
    close()
  }

  const runDelete = () => {
    onDelete?.()
    close()
  }

  const overlay =
    open &&
    createPortal(
      <>
        {isNarrow ? (
          <button
            type="button"
            data-backdrop
            className="fixed inset-0 border-0 bg-transparent p-0"
            style={{ zIndex: Z_BACKDROP_MOBILE }}
            aria-label="Cerrar menú"
            onClick={close}
          />
        ) : null}

        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          className={cn(
            'fixed min-w-[180px] overflow-hidden rounded-xl bg-bloomora-blush/[0.98] p-1 shadow-[0_14px_40px_rgba(91,74,140,0.18)] ring-1 ring-[color:var(--bloomora-border)] backdrop-blur-sm',
          )}
          style={
            coords
              ? {
                  top: coords.top,
                  left: coords.left,
                  width: coords.width,
                  zIndex: Z_MENU,
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
          {onEdit ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-bloomora-deep transition hover:bg-[color:var(--bloomora-surface-3)]/90"
              onClick={runEdit}
            >
              Editar
            </button>
          ) : null}
          {onOpenBlockCountdown ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-bloomora-deep transition hover:bg-[color:var(--bloomora-surface-3)]/90"
              onClick={runCountdown}
            >
              <ClockIcon className="size-[1.125rem] shrink-0" />
              Contador regresivo
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-[color:var(--bloomora-surface-3)]"
              onClick={runDelete}
            >
              Eliminar
            </button>
          ) : null}
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
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-label={`Opciones de ${taskTitle}`}
        className="relative z-0 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-bloomora-violet/75 transition hover:bg-[color:var(--bloomora-surface-1)] hover:text-bloomora-deep active:scale-95"
        onClick={(e) => {
          e.stopPropagation()
          onTriggerClick()
        }}
      >
        <span className="select-none text-lg leading-none" aria-hidden>
          ⋮
        </span>
      </button>
      {overlay}
    </>
  )
}
