import { useEffect, useState, type RefObject } from 'react'

export type NotesLayoutMode = 'narrow' | 'compact' | 'wide'

/** Spec Apuntes: phone &lt;700, tablet 700–1279, PC ≥1280. */
export const NOTES_LAYOUT_NARROW_MAX = 699
export const NOTES_LAYOUT_WIDE_MIN = 1280

export function resolveNotesLayoutMode(width: number): NotesLayoutMode {
  if (width < 700) return 'narrow'
  if (width < NOTES_LAYOUT_WIDE_MIN) return 'compact'
  return 'wide'
}

export function useNotesLayout(
  workspaceRef: RefObject<HTMLElement | null>,
): NotesLayoutMode {
  const [layoutMode, setLayoutMode] = useState<NotesLayoutMode>(() => {
    if (typeof window === 'undefined') return 'narrow'
    return resolveNotesLayoutMode(window.innerWidth)
  })

  useEffect(() => {
    const element = workspaceRef.current
    if (!element) return

    const syncMode = () => {
      const width = Math.min(
        element.getBoundingClientRect().width || element.clientWidth,
        typeof window !== 'undefined' ? window.innerWidth : Number.POSITIVE_INFINITY,
      )
      setLayoutMode(resolveNotesLayoutMode(width))
    }

    syncMode()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', syncMode)
      return () => window.removeEventListener('resize', syncMode)
    }

    const observer = new ResizeObserver(() => syncMode())
    observer.observe(element)
    window.addEventListener('resize', syncMode)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncMode)
    }
  }, [workspaceRef])

  return layoutMode
}
