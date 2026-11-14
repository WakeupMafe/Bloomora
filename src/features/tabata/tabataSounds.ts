let audioCtx: AudioContext | null = null
let wakeLock: WakeLockSentinel | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) audioCtx = new Ctx()
  return audioCtx
}

/** Desbloquea AudioContext tras un gesto del usuario. */
export async function unlockTabataAudio(): Promise<void> {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {
      /* ignorar */
    }
  }
}

function beep(freq: number, durationMs: number, gain = 0.45) {
  const ctx = getCtx()
  if (!ctx || ctx.state !== 'running') return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  // square = más presencia/volumen percibido que sine
  osc.type = 'square'
  osc.frequency.value = freq
  const t = ctx.currentTime
  const dur = Math.max(0.05, durationMs / 1000)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012)
  g.gain.exponentialRampToValueAtTime(gain * 0.85, t + dur * 0.55)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + dur + 0.03)
}

/** Beep corto en cuenta regresiva 3-2-1. */
export function playCountdownBeep(muted: boolean) {
  if (muted) return
  void unlockTabataAudio().then(() => beep(880, 110, 0.5))
}

/** Beep al cambiar de fase. */
export function playPhaseChangeBeep(muted: boolean) {
  if (muted) return
  void unlockTabataAudio().then(() => {
    beep(660, 150, 0.55)
    window.setTimeout(() => beep(990, 180, 0.5), 140)
  })
}

export function vibrateTabata(pattern: number | number[] = 40) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  } catch {
    /* sin soporte */
  }
}

export async function requestTabataWakeLock(): Promise<void> {
  try {
    if (typeof navigator === 'undefined' || !navigator.wakeLock?.request) return
    wakeLock = await navigator.wakeLock.request('screen')
    wakeLock.addEventListener('release', () => {
      wakeLock = null
    })
  } catch {
    wakeLock = null
  }
}

export async function releaseTabataWakeLock(): Promise<void> {
  try {
    await wakeLock?.release()
  } catch {
    /* ignorar */
  }
  wakeLock = null
}
