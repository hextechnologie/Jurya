'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

const DISMISS_KEY = 'jurya-pwa-dismissed'

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show if previously dismissed
    if (localStorage.getItem(DISMISS_KEY)) return

    // Only show on mobile / tablet
    const isMobile = window.innerWidth < 1024 || /Mobi|Android|iPad|iPhone/i.test(navigator.userAgent)
    if (!isMobile) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-slide-up rounded-2xl border border-white/10 bg-[#0a0a12]/95 p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
          <Download className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">Installez Jurya sur votre appareil</p>
          <p className="mt-0.5 text-sm text-gray-400">
            Accédez rapidement à vos simulations, même hors connexion.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              className="rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Installer
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-gray-500 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/* ── TypeScript: extend the global Event types ────────────── */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}
