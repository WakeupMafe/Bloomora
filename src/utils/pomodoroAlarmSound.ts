import alarmSrc from '@/assets/soundalarmcute.mp3'

let alarmAudio: HTMLAudioElement | null = null
let unlockRegistered = false
let unlockedByGesture = false

function getAlarmAudio(): HTMLAudioElement {
  if (!alarmAudio) {
    alarmAudio = new Audio(alarmSrc)
    alarmAudio.preload = 'auto'
    alarmAudio.volume = 1
    alarmAudio.loop = true
  }
  return alarmAudio
}

/** Desbloquea el audio con un gesto (requerido por el navegador). */
export function unlockPomodoroAlarm(): void {
  unlockedByGesture = true
  const audio = getAlarmAudio()
  const prevVolume = audio.volume
  audio.volume = 0.001
  void audio
    .play()
    .then(() => {
      audio.pause()
      audio.currentTime = 0
      audio.volume = prevVolume
    })
    .catch(() => {
      audio.volume = prevVolume
    })
}

export function registerPomodoroAlarmUnlock(): void {
  if (typeof document === 'undefined' || unlockRegistered) return
  unlockRegistered = true

  const unlockOnce = () => unlockPomodoroAlarm()

  document.addEventListener('pointerdown', unlockOnce, {
    capture: true,
    passive: true,
    once: true,
  })
  document.addEventListener('keydown', unlockOnce, {
    capture: true,
    passive: true,
    once: true,
  })
  document.addEventListener('touchend', unlockOnce, {
    capture: true,
    passive: true,
    once: true,
  })

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && unlockedByGesture) {
      const audio = alarmAudio
      if (audio && !audio.paused) {
        void audio.play().catch(() => {})
      }
    }
  })
}

/** Reproduce la alarma en bucle (volumen máximo). */
export async function playPomodoroAlarm(): Promise<void> {
  const audio = getAlarmAudio()
  audio.currentTime = 0
  audio.volume = 1
  audio.loop = true
  try {
    await audio.play()
  } catch {
    if (!unlockedByGesture) return
    try {
      await audio.play()
    } catch {
      /* sin gesto previo el navegador puede bloquear */
    }
  }
}

export function stopPomodoroAlarm(): void {
  const audio = alarmAudio
  if (!audio) return
  audio.pause()
  audio.currentTime = 0
  audio.loop = false
}

export function isPomodoroAlarmPlaying(): boolean {
  return alarmAudio != null && !alarmAudio.paused
}

export async function requestPomodoroNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function notifyPomodoroComplete(options: {
  title: string
  body: string
}): void {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  try {
    const n = new Notification(options.title, {
      body: options.body,
      tag: 'bloomora-pomodoro',
      requireInteraction: true,
      silent: false,
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    /* ignore */
  }
}
