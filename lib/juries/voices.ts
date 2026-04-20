// Jury member configurations with ElevenLabs voice mappings

export type SpeakerId = 'president' | 'technique' | 'rh'

export interface JuryMemberConfig {
  id: SpeakerId
  name: string
  roleLabel: string
  gender: 'female' | 'male'
  elevenlabsVoiceId: string
  /** Breathing animation stagger (seconds) */
  breathingDelay: number
  /** Web Speech API pitch fallback (varies per member to sound distinct) */
  fallbackPitch: number
  /** Web Speech API rate fallback */
  fallbackRate: number
}

// ElevenLabs voice IDs — all support French via eleven_multilingual_v2
// Replace with your own voice IDs from ElevenLabs dashboard if needed
const V = {
  // Female, authoritative — Présidente
  FEMALE_AUTH: 'EXAVITQu4vr4xnSDxMaL',
  // Male, professional, measured — Technique
  MALE_PROF: 'VR6AewLTigWG4xSOukaG',
  // Female, warm but firm — RH
  FEMALE_WARM: 'ThT5KcBeYPX3keUQqHPh',
} as const

export const DEFAULT_JURY: JuryMemberConfig[] = [
  {
    id: 'president',
    name: 'Mme Laurent',
    roleLabel: 'Présidente',
    gender: 'female',
    elevenlabsVoiceId: V.FEMALE_AUTH,
    breathingDelay: 0,
    fallbackPitch: 1.05,
    fallbackRate: 0.88,
  },
  {
    id: 'technique',
    name: 'M. Bernard',
    roleLabel: 'Technique',
    gender: 'male',
    elevenlabsVoiceId: V.MALE_PROF,
    breathingDelay: 2.7,
    fallbackPitch: 0.80,
    fallbackRate: 0.92,
  },
  {
    id: 'rh',
    name: 'Mme Moreau',
    roleLabel: 'RH',
    gender: 'female',
    elevenlabsVoiceId: V.FEMALE_WARM,
    breathingDelay: 5.1,
    fallbackPitch: 1.12,
    fallbackRate: 0.90,
  },
]

export function getJuryMember(id: SpeakerId): JuryMemberConfig {
  return DEFAULT_JURY.find(m => m.id === id) ?? DEFAULT_JURY[0]
}
