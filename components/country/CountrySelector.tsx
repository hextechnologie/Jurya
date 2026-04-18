'use client'

import React from 'react'
import { getEnabledCountries, isMultiCountryEnabled } from '@/lib/countries'
import { Globe } from 'lucide-react'

interface CountrySelectorProps {
  currentCountry: string
  onCountryChange: (code: string) => void
}

export function CountrySelector({ currentCountry, onCountryChange }: CountrySelectorProps) {
  const enabledCountries = getEnabledCountries()

  // Hide if only one country is enabled
  if (!isMultiCountryEnabled()) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-400" />
      <select
        value={currentCountry}
        onChange={(e) => onCountryChange(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg text-sm px-2 py-1 text-white focus:outline-none focus:border-violet-500"
      >
        {enabledCountries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.displayName}
          </option>
        ))}
      </select>
    </div>
  )
}
