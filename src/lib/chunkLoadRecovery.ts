const RELOAD_FLAG = 'bloomora_chunk_reload_once'

export function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '')
  return /Failed to fetch dynamically imported module|Loading chunk|Loading CSS chunk|error loading dynamically imported module|Importing a module script failed/i.test(
    msg,
  )
}

/** Tras un deploy, el shell viejo pide hashes que ya no existen. Recarga una sola vez. */
export function reloadOnceForStaleChunk(reason: string): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG) === '1') return false
    sessionStorage.setItem(RELOAD_FLAG, '1')
  } catch {
    return false
  }
  // #region agent log
  fetch('http://127.0.0.1:7456/ingest/594cd47e-fee9-409f-a398-14304ffe61d5', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '06df44',
    },
    body: JSON.stringify({
      sessionId: '06df44',
      runId: 'post-fix',
      hypothesisId: 'A',
      location: 'chunkLoadRecovery.ts:reloadOnceForStaleChunk',
      message: 'reloading once for stale chunk',
      data: { reason, href: window.location.href },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
  window.location.reload()
  return true
}

/** Limpia el flag tras un boot sano (evita loops si el error no era de chunk). */
export function clearChunkReloadFlag(): void {
  try {
    sessionStorage.removeItem(RELOAD_FLAG)
  } catch {
    /* ignore */
  }
}
