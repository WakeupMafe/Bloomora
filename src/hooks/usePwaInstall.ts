import { useCallback, useState, useSyncExternalStore } from 'react'

const DISMISS_KEY = 'bloomora:pwa-install-dismissed-at'
const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  if (typeof window === 'undefined') {
    return () => {
      listeners.delete(onStoreChange)
    }
  }
  let media: MediaQueryList | null = null
  try {
    media = window.matchMedia('(display-mode: standalone)')
    media.addEventListener('change', onStoreChange)
  } catch {
    media = null
  }
  return () => {
    listeners.delete(onStoreChange)
    try {
      media?.removeEventListener('change', onStoreChange)
    } catch {
      /* ignore */
    }
  }
}

function readIsIos(): boolean {
  try {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent || ''
    if (/iphone|ipad|ipod/i.test(ua)) return true
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  } catch {
    return false
  }
}

function readIsIosSafari(): boolean {
  try {
    if (!readIsIos()) return false
    const ua = navigator.userAgent || ''
    return !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|Instagram|FBAN|FBAV/.test(ua)
  } catch {
    return false
  }
}

function readIsStandalone(): boolean {
  try {
    if (typeof window === 'undefined') return installed
    const displayStandalone = window.matchMedia('(display-mode: standalone)').matches
    const iosStandalone =
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    return displayStandalone || iosStandalone || installed
  } catch {
    return installed
  }
}

function readIsDismissed(): boolean {
  try {
    if (typeof window === 'undefined') return false
    const raw = window.localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const at = Number(raw)
    if (!Number.isFinite(at)) return false
    return Date.now() - at < DISMISS_WINDOW_MS
  } catch {
    return false
  }
}

export function getPwaInstallState() {
  return {
    isStandalone: readIsStandalone(),
    isIos: readIsIos(),
    isIosSafari: readIsIosSafari(),
    canPrompt: deferredPrompt != null,
  }
}

export async function promptInstall(): Promise<void> {
  const event = deferredPrompt
  if (!event) return
  try {
    await event.prompt()
    await event.userChoice
  } catch {
    /* el navegador puede rechazar un prompt ya usado */
  } finally {
    deferredPrompt = null
    emit()
  }
}

// El evento puede llegar antes de que React monte.
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('beforeinstallprompt', (event) => {
      try {
        event.preventDefault()
        deferredPrompt = event as BeforeInstallPromptEvent
        emit()
      } catch {
        /* ignore */
      }
    })
    window.addEventListener('appinstalled', () => {
      try {
        deferredPrompt = null
        installed = true
        emit()
      } catch {
        /* ignore */
      }
    })
  } catch {
    /* ignore */
  }
}

export function usePwaInstall() {
  const canPrompt = useSyncExternalStore(
    subscribe,
    () => deferredPrompt != null,
    () => false,
  )
  const isStandalone = useSyncExternalStore(
    subscribe,
    readIsStandalone,
    () => false,
  )
  const [dismissed, setDismissed] = useState(readIsDismissed)

  const isDismissed = useCallback(() => dismissed, [dismissed])

  const dismiss = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
      }
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }, [])

  return {
    isStandalone,
    isIos: readIsIos(),
    isIosSafari: readIsIosSafari(),
    canPrompt,
    promptInstall,
    isDismissed,
    dismiss,
  }
}
