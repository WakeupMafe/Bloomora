import { useLayoutEffect, useState } from 'react'

/**
 * Suscripción a `window.matchMedia` (SSR-safe).
 * `useLayoutEffect` reduce un frame incorrecto al hidratar en móvil.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useLayoutEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatches(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [query])

  return matches
}
