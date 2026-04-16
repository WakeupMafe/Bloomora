/**
 * Sonido de fin de bloque: cascada corta de notas altas tipo «estrellitas».
 * Usa un único AudioContext; el desbloqueo con gesto del usuario es necesario
 * para que el audio pueda sonar (políticas de autoplay del navegador).
 *
 * Nota: en pestañas en segundo plano el audio puede seguir bloqueado hasta que
 * haya habido al menos un gesto en la página en esta sesión.
 */

let sharedCtx: AudioContext | null = null

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ??
    null
  )
}

async function ensureContext(): Promise<AudioContext | null> {
  const Ctx = getAudioContextClass()
  if (!Ctx) return null
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new Ctx()
  }
  if (sharedCtx.state === 'suspended') {
    await sharedCtx.resume().catch(() => {})
  }
  return sharedCtx
}

/** Cascada pentatónica aguda + eco muy corto para sensación «brillitos». */
export async function playAgendaBlockSparkleSound(): Promise<void> {
  try {
    const ctx = await ensureContext()
    if (!ctx) return

    const t0 = ctx.currentTime
    const notes = [
      { f: 1567.98, len: 0.07 },
      { f: 1760.0, len: 0.06 },
      { f: 2093.0, len: 0.06 },
      { f: 2349.32, len: 0.06 },
      { f: 2637.02, len: 0.07 },
      { f: 2093.0, len: 0.05 },
      { f: 2793.83, len: 0.08 },
      { f: 3136.0, len: 0.1 },
    ]

    let offset = 0
    for (const { f, len } of notes) {
      const start = t0 + offset
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + len)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + len + 0.02)
      offset += len * 0.42
    }

    // Brillo extra: dos notas muy breves tipo «chispa» al final
    const sparkT = t0 + offset + 0.02
    for (let i = 0; i < 2; i++) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'triangle'
      o.frequency.setValueAtTime(3520 + i * 220, sparkT + i * 0.04)
      g.gain.setValueAtTime(0.0001, sparkT + i * 0.04)
      g.gain.exponentialRampToValueAtTime(0.045, sparkT + i * 0.04 + 0.006)
      g.gain.exponentialRampToValueAtTime(0.0001, sparkT + i * 0.04 + 0.035)
      o.connect(g)
      g.connect(ctx.destination)
      o.start(sparkT + i * 0.04)
      o.stop(sparkT + i * 0.04 + 0.04)
    }
  } catch {
    /* ignore */
  }
}

let unlockRegistered = false

/**
 * Registra listeners para desbloquear el AudioContext con el primer gesto
 * y reintentar al volver a la pestaña o enfocar la ventana.
 */
export function registerAgendaBlockSoundUnlock(): void {
  if (typeof document === 'undefined' || unlockRegistered) return
  unlockRegistered = true

  const unlockOnce = () => {
    void ensureContext()
  }

  document.addEventListener('pointerdown', unlockOnce, { capture: true, passive: true, once: true })
  document.addEventListener('keydown', unlockOnce, { capture: true, passive: true, once: true })
  document.addEventListener('touchend', unlockOnce, { capture: true, passive: true, once: true })

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void ensureContext()
  })
  window.addEventListener('focus', () => void ensureContext())
}
