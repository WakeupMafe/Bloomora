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

type GoalActionsMenuProps = {
  goalTitle: string
  open: boolean
  onClose: () => void
  /** Clic en el botón ⋮ (toggle abierto/cerrado desde el padre) */
  onTriggerClick: () => void
  onEdit: () => void
  onDelete: () => void
  onShare?: () => void
}

export function GoalActionsMenu({
  goalTitle,
  open,
  onClose,
  onTriggerClick,
  onEdit,
  onDelete,
  onShare,
}: GoalActionsMenuProps) {
  const uid = useId().replace(/:/g, '')
  const triggerId = `goal-menu-trigger-${uid}`
  const menuId = `goal-menu-${uid}`

  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => onClose(), [onClose])
  usePopoverDismiss(open, triggerRef, menuRef, close)

  const isNarrow = useMediaQuery('(max-width: 639px)')
  const itemCount = 2 + (onShare ? 1 : 0)
  const menuHeight = 12 + itemCount * 42
  const coords = useFixedPopoverPosition(
    open,
    triggerRef,
    MENU_WIDTH,
    menuHeight,
    isNarrow ? 72 + 8 : 0,
  )

  const runDelete = () => {
    onDelete()
    close()
  }

  const runEdit = () => {
    onEdit()
    close()
  }

  const runShare = () => {
    onShare?.()
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
          {onShare ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-bloomora-deep transition hover:bg-[color:var(--bloomora-surface-3)]/90"
              onClick={runShare}
            >
              Compartir mi logro
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-bloomora-deep transition hover:bg-[color:var(--bloomora-surface-3)]/90"
            onClick={runEdit}
          >
            Ir a la edición
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-[color:var(--bloomora-surface-3)]"
            onClick={runDelete}
          >
            Borrar todo
          </button>
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
        aria-label={`Opciones de ${goalTitle}`}
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
