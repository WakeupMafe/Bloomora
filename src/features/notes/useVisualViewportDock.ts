import { useEffect, useState } from 'react'

export type VisualViewportDock = {
  /** Pixels from the layout viewport bottom to the visual viewport bottom (keyboard inset). */
  bottomOffset: number
  keyboardOpen: boolean
}

/**
 * Tracks soft-keyboard inset via visualViewport so a dock can sit above the keyboard.
 * bottomOffset ≈ innerHeight − vv.height − vv.offsetTop
 */
export function useVisualViewportDock(): VisualViewportDock {
  const [bottomOffset, setBottomOffset] = useState(0)

  useEffect(() => {
    const sync = () => {
      const vv = window.visualViewport
      if (!vv) {
        setBottomOffset(0)
        return
      }
      const next = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setBottomOffset(next)
    }

    sync()
    const vv = window.visualViewport
    vv?.addEventListener('resize', sync)
    vv?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    return () => {
      vv?.removeEventListener('resize', sync)
      vv?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [])

  return {
    bottomOffset,
    keyboardOpen: bottomOffset > 48,
  }
}
