import { useCallback, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFixedPopoverPosition } from '@/hooks/useFixedPopoverPosition'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePopoverDismiss } from '@/hooks/usePopoverDismiss'
import { cn } from '@/utils/cn'

const MENU_WIDTH = 200
const MENU_HEIGHT_EST = 108
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
}

export function GoalActionsMenu({
  goalTitle,
  open,
  onClose,
  onTriggerClick,
  onEdit,
  onDelete,
}: GoalActionsMenuProps) {
  const uid = useId().replace(/:/g, '')
  const triggerId = `goal-menu-trigger-${uid}`
  const menuId = `goal-menu-${uid}`

  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => onClose(), [onClose])
  usePopoverDismiss(open, triggerRef, menuRef, close)

  const isNarrow = useMediaQuery('(max-width: 639px)')
  const coords = useFixedPopoverPosition(
    open && !isNarrow,
    triggerRef,
    MENU_WIDTH,
    MENU_HEIGHT_EST,
  )

  const runDelete = () => {
    onDelete()
    close()
  }

  const runEdit = () => {
    onEdit()
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
            className="fixed inset-0 border-0 bg-bloomora-deep/15 p-0 transition-[background-color] duration-200 ease-out hover:bg-bloomora-deep/22 active:bg-bloomora-deep/28"
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
            'min-w-[11.5rem] overflow-hidden rounded-xl bg-bloomora-blush/[0.98] py-1 shadow-[0_14px_40px_rgba(91,74,140,0.18)] ring-1 ring-bloomora-line/40 backdrop-blur-sm',
            isNarrow
              ? 'fixed rounded-[18px] p-1'
              : 'fixed rounded-xl p-1',
          )}
          style={
            isNarrow
              ? {
                  position: 'fixed',
                  zIndex: Z_MENU,
                  left: 'max(12px, env(safe-area-inset-left))',
                  right: 'max(12px, env(safe-area-inset-right))',
                  bottom: 'max(12px, env(safe-area-inset-bottom))',
                  width: 'auto',
                  maxWidth: 'min(100vw - 24px, 16rem)',
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
            className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-bloomora-deep transition hover:bg-bloomora-mist/90"
            onClick={runEdit}
          >
            Ir a la edición
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-bloomora-blush/60"
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
        className="relative z-0 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-bloomora-violet/75 transition hover:bg-white/90 hover:text-bloomora-deep active:scale-95"
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
