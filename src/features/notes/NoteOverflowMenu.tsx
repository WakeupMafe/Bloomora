import { useCallback, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFixedPopoverPosition } from '@/hooks/useFixedPopoverPosition'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePopoverDismiss } from '@/hooks/usePopoverDismiss'
import { cn } from '@/utils/cn'

const MENU_WIDTH = 232
const MENU_HEIGHT_EST = 280
const Z_MENU = 10_080
const Z_BACKDROP = 10_075

export type NoteOverflowMenuMode = 'active' | 'trash'

type NoteOverflowMenuProps = {
  noteTitle: string
  open: boolean
  mode?: NoteOverflowMenuMode
  isFavorite?: boolean
  onClose: () => void
  onTriggerClick: () => void
  onRename?: () => void
  onMoveFolder?: () => void
  onToggleFavorite?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onRestore?: () => void
  onPermanentDelete?: () => void
  triggerClassName?: string
}

function MenuItem({
  label,
  danger,
  onSelect,
}: {
  label: string
  danger?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'notes-overflow-item',
        danger && 'notes-overflow-item--danger',
      )}
      onClick={onSelect}
    >
      {label}
    </button>
  )
}

export function NoteOverflowMenu({
  noteTitle,
  open,
  mode = 'active',
  isFavorite = false,
  onClose,
  onTriggerClick,
  onRename,
  onMoveFolder,
  onToggleFavorite,
  onDuplicate,
  onDelete,
  onRestore,
  onPermanentDelete,
  triggerClassName,
}: NoteOverflowMenuProps) {
  const uid = useId().replace(/:/g, '')
  const triggerId = `note-menu-trigger-${uid}`
  const menuId = `note-menu-${uid}`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => onClose(), [onClose])
  usePopoverDismiss(open, triggerRef, menuRef, close)

  const isNarrow = useMediaQuery('(max-width: 699px)')
  const coords = useFixedPopoverPosition(
    open && !isNarrow,
    triggerRef,
    MENU_WIDTH,
    MENU_HEIGHT_EST,
  )

  const run = (action?: () => void) => {
    action?.()
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
            className="notes-overflow-backdrop"
            style={{ zIndex: Z_BACKDROP }}
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
            'notes-overflow-menu',
            isNarrow && 'notes-overflow-menu--sheet',
          )}
          style={
            isNarrow
              ? {
                  zIndex: Z_MENU,
                  left: 'max(12px, env(safe-area-inset-left))',
                  right: 'max(12px, env(safe-area-inset-right))',
                  bottom: 'max(12px, env(safe-area-inset-bottom))',
                }
              : coords
                ? {
                    zIndex: Z_MENU,
                    top: coords.top,
                    left: coords.left,
                    width: coords.width,
                  }
                : {
                    zIndex: Z_MENU,
                    top: 10,
                    left: 10,
                    width: MENU_WIDTH,
                    visibility: 'hidden',
                  }
          }
        >
          {mode === 'trash' ? (
            <>
              <MenuItem label="Restaurar" onSelect={() => run(onRestore)} />
              <MenuItem
                label="Eliminar definitivamente"
                danger
                onSelect={() => run(onPermanentDelete)}
              />
            </>
          ) : (
            <>
              <MenuItem label="Renombrar" onSelect={() => run(onRename)} />
              <MenuItem label="Mover a carpeta" onSelect={() => run(onMoveFolder)} />
              <MenuItem
                label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                onSelect={() => run(onToggleFavorite)}
              />
              <MenuItem label="Duplicar" onSelect={() => run(onDuplicate)} />
              <MenuItem
                label="Eliminar"
                danger
                onSelect={() => run(onDelete)}
              />
            </>
          )}
        </div>
      </>,
      document.body,
    )

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        className={triggerClassName}
        aria-label={`Opciones de ${noteTitle}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(e) => {
          e.stopPropagation()
          onTriggerClick()
        }}
      >
        ⋯
      </button>
      {overlay}
    </>
  )
}
