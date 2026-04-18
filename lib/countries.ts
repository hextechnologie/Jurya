// ============================================================
// Countries configuration — Multi-country readiness
// ============================================================

export interface CountryConfig {
  code: string // ISO 3166-1 alpha-2
  displayName: string // French display name
  defaultLanguage: string // BCP 47 locale
  currency: string // ISO 4217
  timezone: string // IANA timezone
  enabled: boolean
}

export const countries: CountryConfig[] = [
  {
    code: 'FR',
    displayName: 'France',
    defaultLanguage: 'fr-FR',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    enabled: true,
  },
  // TODO(mouj): add BE/LU/CH concours data and enable country
  {
    code: 'BE',
    displayName: 'Belgique',
    defaultLanguage: 'fr-BE',
    currency: 'EUR',
    timezone: 'Europe/Brussels',
    enabled: false,
  },
  {
    code: 'LU',
    displayName: 'Luxembourg',
    defaultLanguage: 'fr-LU',
    currency: 'EUR',
    timezone: 'Europe/Luxembourg',
    enabled: false,
  },
  {
    code: 'CH',
    displayName: 'Suisse',
    defaultLanguage: 'fr-CH',
    currency: 'CHF',
    timezone: 'Europe/Zurich',
    enabled: false,
  },
  {
    code: 'CA',
    displayName: 'Canada (Québec)',
    defaultLanguage: 'fr-CA',
    currency: 'CAD',
    timezone: 'America/Montreal',
    enabled: false,
  },
  {
    code: 'MA',
    displayName: 'Maroc',
    defaultLanguage: 'fr-MA',
    currency: 'MAD',
    timezone: 'Africa/Casablanca',
    enabled: false,
  },
  {
    code: 'TN',
    displayName: 'Tunisie',
    defaultLanguage: 'fr-TN',
    currency: 'TND',
    timezone: 'Africa/Tunis',
    enabled: false,
  },
]

export const DEFAULT_COUNTRY = 'FR'

export function getEnabledCountries(): CountryConfig[] {
  return countries.filter((c) => c.enabled)
}

export function getCountryByCode(code: string): CountryConfig | undefined {
  return countries.find((c) => c.code === code)
}

export function isMultiCountryEnabled(): boolean {
  return getEnabledCountries().length > 1
}
