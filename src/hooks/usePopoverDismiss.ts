import { type RefObject, useEffect } from 'react'

/**
 * Cierra el popover con Escape o clic fuera del trigger y del contenido.
 * El listener de mousedown se registra en el siguiente tick para no cerrar
 * con el mismo clic que abrió el menú.
 */
export function usePopoverDismiss(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', onKey)

    let removePointer: (() => void) | null = null
    const tid = window.setTimeout(() => {
      const onPointerDown = (e: PointerEvent) => {
        const n = e.target as Node
        if (triggerRef.current?.contains(n)) return
        if (contentRef.current?.contains(n)) return
        onDismiss()
      }
      document.addEventListener('pointerdown', onPointerDown, true)
      removePointer = () =>
        document.removeEventListener('pointerdown', onPointerDown, true)
    }, 0)

    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(tid)
      removePointer?.()
    }
  }, [open, onDismiss, triggerRef, contentRef])
}
