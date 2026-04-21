// Jury member configurations with ElevenLabs voice mappings

export type SpeakerId = 'president' | 'technique' | 'rh'

export interface VoiceSettings {
  stability: number
  similarity_boost: number
  style: number
  use_speaker_boost: boolean
}

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
  /** Per-voice ElevenLabs settings for naturalness */
  voiceSettings: VoiceSettings
}

// ElevenLabs voice IDs — all support French via eleven_multilingual_v2
const V = {
  FEMALE_1: 'EXAVITQu4vr4xnSDxMaL', // Bella — authoritative female
  MALE_1:   'VR6AewLTigWG4xSOukaG', // Arnold — measured male
  FEMALE_2: 'ThT5KcBeYPX3keUQqHPh', // Dorothy — warm female
} as const

// ── Name pools ─────────────────────────────────────────────────────────────
const FEMALE_SURNAMES = [
  'Laurent', 'Moreau', 'Dupont', 'Martin', 'Petit', 'Roux',
  'Simon', 'Leroy', 'Blanc', 'Girard', 'Robin', 'Legrand',
]
const MALE_SURNAMES = [
  'Bernard', 'Dubois', 'Thomas', 'Lefebvre', 'Garnier', 'Mercier',
  'Boyer', 'Richard', 'Chevalier', 'Perrin', 'Fontaine', 'Morel',
]

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function shuffled<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

// ── Default jury (stable fallback used server-side or when config missing) ─
export const DEFAULT_JURY: JuryMemberConfig[] = [
  {
    id: 'president',
    name: 'Mme Laurent',
    roleLabel: 'Présidente',
    gender: 'female',
    elevenlabsVoiceId: V.FEMALE_1,
    breathingDelay: 0,
    fallbackPitch: 1.05,
    fallbackRate: 0.88,
    voiceSettings: { stability: 0.30, similarity_boost: 0.85, style: 0.45, use_speaker_boost: true },
  },
  {
    id: 'technique',
    name: 'M. Bernard',
    roleLabel: 'Technique',
    gender: 'male',
    elevenlabsVoiceId: V.MALE_1,
    breathingDelay: 2.7,
    fallbackPitch: 0.80,
    fallbackRate: 0.92,
    voiceSettings: { stability: 0.45, similarity_boost: 0.85, style: 0.20, use_speaker_boost: true },
  },
  {
    id: 'rh',
    name: 'Mme Moreau',
    roleLabel: 'RH',
    gender: 'female',
    elevenlabsVoiceId: V.FEMALE_2,
    breathingDelay: 5.1,
    fallbackPitch: 1.12,
    fallbackRate: 0.90,
    voiceSettings: { stability: 0.28, similarity_boost: 0.80, style: 0.50, use_speaker_boost: true },
  },
]

/**
 * Generates a randomised jury for each simulation session.
 * - Randomly picks first/last names from pools (no two same surname)
 * - Rotates which ElevenLabs voice goes to which role so voices feel fresh
 * - Technique member has 35% chance of being female for variety
 */
export function getRandomJury(): JuryMemberConfig[] {
  const femaleSurnames = shuffled(FEMALE_SURNAMES)
  const maleSurnames   = shuffled(MALE_SURNAMES)
  let fi = 0, mi = 0

  const nextFemale = () => `Mme ${femaleSurnames[fi++]}`
  const nextMale   = () => `M. ${maleSurnames[mi++]}`

  // Randomly rotate which female voice goes to president vs rh
  const femaleVoices = Math.random() < 0.5
    ? [V.FEMALE_1, V.FEMALE_2] as const
    : [V.FEMALE_2, V.FEMALE_1] as const

  const techniqueIsFemale = Math.random() < 0.35

  return [
    {
      id: 'president',
      name: nextFemale(),
      roleLabel: 'Présidente',
      gender: 'female',
      elevenlabsVoiceId: femaleVoices[0],
      breathingDelay: 0,
      fallbackPitch: 1.02 + Math.random() * 0.12,
      fallbackRate: 0.84 + Math.random() * 0.08,
      voiceSettings: { stability: 0.38, similarity_boost: 0.78, style: 0.40, use_speaker_boost: true },
    },
    {
      id: 'technique',
      name: techniqueIsFemale ? nextFemale() : nextMale(),
      roleLabel: 'Technique',
      gender: techniqueIsFemale ? 'female' : 'male',
      elevenlabsVoiceId: techniqueIsFemale ? pick([V.FEMALE_1, V.FEMALE_2]) : V.MALE_1,
      breathingDelay: 2.7,
      fallbackPitch: techniqueIsFemale ? 1.06 + Math.random() * 0.08 : 0.78 + Math.random() * 0.08,
      fallbackRate: 0.88 + Math.random() * 0.08,
      voiceSettings: { stability: 0.52, similarity_boost: 0.82, style: 0.18, use_speaker_boost: true },
    },
    {
      id: 'rh',
      name: techniqueIsFemale ? nextFemale() : nextFemale(),
      roleLabel: 'RH',
      gender: 'female',
      elevenlabsVoiceId: femaleVoices[1],
      breathingDelay: 5.1,
      fallbackPitch: 1.10 + Math.random() * 0.10,
      fallbackRate: 0.88 + Math.random() * 0.06,
      voiceSettings: { stability: 0.35, similarity_boost: 0.75, style: 0.45, use_speaker_boost: true },
    },
  ]
}

export function getJuryMember(id: SpeakerId, jury?: JuryMemberConfig[]): JuryMemberConfig {
  const source = jury ?? DEFAULT_JURY
  return source.find(m => m.id === id) ?? source[0]
}
