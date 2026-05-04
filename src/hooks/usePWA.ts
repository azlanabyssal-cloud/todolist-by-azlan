import { useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled]     = useState(false)
  const savedPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      const pwa = e as BeforeInstallPromptEvent
      savedPrompt.current = pwa
      setInstallPrompt(pwa)
    }

    window.addEventListener('beforeinstallprompt', handler)

    const installed = window.matchMedia('(display-mode: standalone)').matches
    setIsInstalled(installed)

    const onInstalled = () => {
      savedPrompt.current = null
      setInstallPrompt(null)
      setIsInstalled(true)
    }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async (): Promise<boolean> => {
    if (!savedPrompt.current) return false
    await savedPrompt.current.prompt()
    const { outcome } = await savedPrompt.current.userChoice
    if (outcome === 'accepted') {
      savedPrompt.current = null
      setInstallPrompt(null)
      return true
    }
    return false
  }

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (!r) return
      setInterval(() => void r.update(), 60 * 60 * 1000)
    },
  })

  return { installPrompt, isInstalled, install, needRefresh, updateServiceWorker }
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready
  if (!registration.pushManager) return null
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  })
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buf     = new ArrayBuffer(rawData.length)
  const view    = new Uint8Array(buf)
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i)
  }
  return buf
}
