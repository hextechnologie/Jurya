'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import en from '@/locales/en.json'
import ar from '@/locales/ar.json'
import fr from '@/locales/fr.json'
import es from '@/locales/es.json'

type Locale = 'en' | 'ar' | 'fr' | 'es'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: string) => void
  t: (key: string) => string
  dir: 'ltr' | 'rtl'
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations = { en, ar, fr, es }

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')

  useEffect(() => {
    // Load saved language from localStorage
    const saved = localStorage.getItem('language') as Locale
    if (saved && ['en', 'ar', 'fr', 'es'].includes(saved)) {
      setLocaleState(saved)
    }
  }, [])

  useEffect(() => {
    // Update document direction when language changes
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = (newLocale: string) => {
    if (['en', 'ar', 'fr', 'es'].includes(newLocale)) {
      setLocaleState(newLocale as Locale)
      localStorage.setItem('language', newLocale)
    }
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[locale]
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key
  }

  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
