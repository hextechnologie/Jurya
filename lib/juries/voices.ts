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
  /** Full name used for TTS introduction: "M. François Bernard" or "Mme Catherine Laurent" */
  name: string
  /** Display name for the tile (civility + last name only): "M. Bernard" or "Mme Laurent" */
  displayName: string
  /** 2-letter initials (first letter of first name + first letter of last name): "FB" or "CL" */
  initials: string
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
  FEMALE_1: 'd3AXX0BlgJHYFCuH9X88', // Bella — authoritative female
  MALE_1:   'c365oriviHmAhyLhpuN6', // Arnold — measured male
  FEMALE_2: '5OnMHwgTFgvPVwE8jP6B', // Dorothy — warm female
  MALE_2:   'ErXwobaYiN019PkySvjV', // Antoni — firm & natural male
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
const MALE_FIRST_NAMES = [
  'François', 'Jean-Pierre', 'Michel', 'Philippe', 'Laurent',
  'Alain', 'Pierre', 'Jean-Paul', 'Denis', 'Gilles',
]

const FEMALE_FIRST_NAMES = [
  'Catherine', 'Isabelle', 'Anne', 'Sophie', 'Claire',
  'Sylvie', 'Nathalie', 'Brigitte', 'Monique', 'Françoise',
]

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function shuffled<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

type NameResult = { name: string; displayName: string; initials: string }
function mName(first: string, last: string): NameResult {
  return { name: `M. ${first} ${last}`, displayName: `M. ${last}`, initials: first[0] + last[0] }
}
function fName(first: string, last: string): NameResult {
  return { name: `Mme ${first} ${last}`, displayName: `Mme ${last}`, initials: first[0] + last[0] }
}

// ── Default jury (stable fallback used server-side or when config missing) ─
export const DEFAULT_JURY: JuryMemberConfig[] = [
  {
    id: 'president',
    name: 'Mme Catherine Laurent',
    displayName: 'Mme Laurent',
    initials: 'CL',
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
    name: 'M. Marc Bernard',
    displayName: 'M. Bernard',
    initials: 'MB',
    roleLabel: 'Expert technique',
    gender: 'male',
    elevenlabsVoiceId: V.MALE_1,
    breathingDelay: 2.7,
    fallbackPitch: 0.70,
    fallbackRate: 0.88,
    voiceSettings: { stability: 0.45, similarity_boost: 0.85, style: 0.20, use_speaker_boost: true },
  },
  {
    id: 'rh',
    name: 'Mme Sophie Moreau',
    displayName: 'Mme Moreau',
    initials: 'SM',
    roleLabel: 'Ressources humaines',
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
 * - President is 50 % male / 50 % female
 * - Two distinct male ElevenLabs voices (MALE_1 / MALE_2) used interchangeably
 * - Technique member has 35 % chance of being female for variety
 * - RH is always female for current defaults (can be extended)
 * - Web Speech fallback pitches are more distinct between genders
 */
export function getRandomJury(): JuryMemberConfig[] {
  const femaleSurnames  = shuffled(FEMALE_SURNAMES)
  const femaleFirstNames = shuffled(FEMALE_FIRST_NAMES)
  const maleSurnames    = shuffled(MALE_SURNAMES)
  const maleFirstNames  = shuffled(MALE_FIRST_NAMES)
  let fi = 0, mi = 0

  const nextFemale = (): NameResult => fName(femaleFirstNames[fi % femaleFirstNames.length], femaleSurnames[fi++ % femaleSurnames.length])
  const nextMale   = (): NameResult => mName(maleFirstNames[mi % maleFirstNames.length], maleSurnames[mi++ % maleSurnames.length])

  // Rotate female voices between roles
  const femaleVoices = Math.random() < 0.5
    ? [V.FEMALE_1, V.FEMALE_2] as const
    : [V.FEMALE_2, V.FEMALE_1] as const

  // Two distinct male voices to randomise
  const maleVoices = Math.random() < 0.5
    ? [V.MALE_1, V.MALE_2] as const
    : [V.MALE_2, V.MALE_1] as const

  const presidentIsMale = Math.random() < 0.5
  const techniqueIsFemale = Math.random() < 0.35

  const pn = presidentIsMale ? nextMale() : nextFemale()
  const president: JuryMemberConfig = presidentIsMale
    ? {
        id: 'president',
        name: pn.name, displayName: pn.displayName, initials: pn.initials,
        roleLabel: 'Président',
        gender: 'male',
        elevenlabsVoiceId: maleVoices[0],
        breathingDelay: 0,
        fallbackPitch: 0.62 + Math.random() * 0.10,
        fallbackRate: 0.84 + Math.random() * 0.08,
        voiceSettings: { stability: 0.42, similarity_boost: 0.80, style: 0.38, use_speaker_boost: true },
      }
    : {
        id: 'president',
        name: pn.name, displayName: pn.displayName, initials: pn.initials,
        roleLabel: 'Présidente',
        gender: 'female',
        elevenlabsVoiceId: femaleVoices[0],
        breathingDelay: 0,
        fallbackPitch: 1.02 + Math.random() * 0.12,
        fallbackRate: 0.84 + Math.random() * 0.08,
        voiceSettings: { stability: 0.38, similarity_boost: 0.78, style: 0.40, use_speaker_boost: true },
      }

  const tn = techniqueIsFemale ? nextFemale() : nextMale()
  const technique: JuryMemberConfig = techniqueIsFemale
    ? {
        id: 'technique',
        name: tn.name, displayName: tn.displayName, initials: tn.initials,
        roleLabel: 'Expert technique',
        gender: 'female',
        elevenlabsVoiceId: femaleVoices[1],
        breathingDelay: 2.7,
        fallbackPitch: 1.06 + Math.random() * 0.08,
        fallbackRate: 0.88 + Math.random() * 0.08,
        voiceSettings: { stability: 0.52, similarity_boost: 0.82, style: 0.18, use_speaker_boost: true },
      }
    : {
        id: 'technique',
        name: tn.name, displayName: tn.displayName, initials: tn.initials,
        roleLabel: 'Expert technique',
        gender: 'male',
        elevenlabsVoiceId: presidentIsMale ? maleVoices[1] : maleVoices[0],
        breathingDelay: 2.7,
        fallbackPitch: 0.68 + Math.random() * 0.08,
        fallbackRate: 0.88 + Math.random() * 0.08,
        voiceSettings: { stability: 0.52, similarity_boost: 0.82, style: 0.18, use_speaker_boost: true },
      }

  const rn = nextFemale()
  const rh: JuryMemberConfig = {
    id: 'rh',
    name: rn.name, displayName: rn.displayName, initials: rn.initials,
    roleLabel: 'Ressources humaines',
    gender: 'female',
    elevenlabsVoiceId: techniqueIsFemale ? V.FEMALE_1 : femaleVoices[0],
    breathingDelay: 5.1,
    fallbackPitch: 1.10 + Math.random() * 0.10,
    fallbackRate: 0.88 + Math.random() * 0.06,
    voiceSettings: { stability: 0.35, similarity_boost: 0.75, style: 0.45, use_speaker_boost: true },
  }

  return [president, technique, rh]
}

export function getJuryMember(id: SpeakerId, jury?: JuryMemberConfig[]): JuryMemberConfig {
  const source = jury ?? DEFAULT_JURY
  return source.find(m => m.id === id) ?? source[0]
}
