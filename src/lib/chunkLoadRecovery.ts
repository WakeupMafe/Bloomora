const RELOAD_FLAG = 'bloomora_chunk_reload_once'

export function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '')
  return /Failed to fetch dynamically imported module|Loading chunk|Loading CSS chunk|error loading dynamically imported module|Importing a module script failed/i.test(
    msg,
  )
}

/** Tras un deploy, el shell viejo pide hashes que ya no existen. Recarga una sola vez. */
export function reloadOnceForStaleChunk(_reason?: string): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG) === '1') return false
    sessionStorage.setItem(RELOAD_FLAG, '1')
  } catch {
    return false
  }
  window.location.reload()
  return true
}

/** Limpia el flag tras un import exitoso (permite un reload futuro si vuelve a pasar). */
export function clearChunkReloadFlag(): void {
  try {
    sessionStorage.removeItem(RELOAD_FLAG)
  } catch {
    /* ignore */
  }
}
