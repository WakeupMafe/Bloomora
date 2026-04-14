import {
  type RefObject,
  useCallback,
  useLayoutEffect,
  useState,
} from 'react'

export type FixedPopoverCoords = {
  top: number
  left: number
  width: number
}

const MARGIN = 10

/**
 * Calcula posición `fixed` para un panel bajo (o sobre) el trigger,
 * alineado al borde derecho del botón, con clamp al viewport.
 */
export function useFixedPopoverPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  panelWidth: number,
  panelHeightEstimate: number,
): FixedPopoverCoords | null {
  const [coords, setCoords] = useState<FixedPopoverCoords | null>(null)

  const measure = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let top = r.bottom + MARGIN
    let left = r.right - panelWidth

    if (left < MARGIN) left = MARGIN
    if (left + panelWidth > vw - MARGIN) left = vw - panelWidth - MARGIN

    if (top + panelHeightEstimate > vh - MARGIN) {
      top = r.top - panelHeightEstimate - MARGIN
    }
    if (top < MARGIN) top = MARGIN

    const next = {
      top,
      left,
      width: Math.min(panelWidth, vw - 2 * MARGIN),
    }
    requestAnimationFrame(() => {
      setCoords(next)
    })
  }, [triggerRef, panelWidth, panelHeightEstimate])

  useLayoutEffect(() => {
    if (!open) return
    measure()
    return () => {
      requestAnimationFrame(() => setCoords(null))
    }
  }, [open, measure])

  useLayoutEffect(() => {
    if (!open) return
    const on = () => measure()
    window.addEventListener('resize', on)
    window.addEventListener('scroll', on, true)
    return () => {
      window.removeEventListener('resize', on)
      window.removeEventListener('scroll', on, true)
    }
  }, [open, measure])

  return coords
}
