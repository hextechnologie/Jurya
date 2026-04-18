'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('cookieConsent') || localStorage.getItem('cookie-consent')
    if (!saved) setVisible(true)
  }, [])

  const handleChoice = (choice: 'accepted' | 'declined') => {
    localStorage.setItem('cookieConsent', choice)
    localStorage.removeItem('cookie-consent')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-3xl rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">Préférences de cookies</p>
          <p className="text-sm text-gray-400">
            Nous utilisons des cookies essentiels pour assurer le bon fonctionnement de votre compte, de la langue et de votre expérience de simulation.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleChoice('declined')}>Refuser</Button>
          <Button variant="primary" onClick={() => handleChoice('accepted')}>Accepter</Button>
        </div>
      </div>
    </div>
  )
}
