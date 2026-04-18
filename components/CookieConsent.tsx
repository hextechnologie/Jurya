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
          <p className="font-semibold">Cookie preferences</p>
          <p className="text-sm text-gray-400">
            We use essential cookies to keep your account, language, and interview experience working properly.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleChoice('declined')}>Decline</Button>
          <Button variant="primary" onClick={() => handleChoice('accepted')}>Accept</Button>
        </div>
      </div>
    </div>
  )
}
