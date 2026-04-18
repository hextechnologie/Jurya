// Voice simulation types and utilities
// Uses Web Speech API (SpeechRecognition) + ElevenLabs/OpenAI TTS

export type SimulationPhase = 'setup' | 'exposé_libre' | 'questions_jury' | 'mise_en_situation' | 'terminé'

export interface VoiceSimulationConfig {
  concoursId: string
  concoursIntitulé: string
  rubriqueJury: Record<string, unknown>
  durée_minutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  sujetTirage?: string
  useVoice: boolean  // true = voice-first, false = text fallback
}

export interface SimulationTurn {
  turnIndex: number
  role: 'jury' | 'candidate'
  contentText: string
  audioUrl?: string
  audioDurationMs?: number
  phase: SimulationPhase
  startedAt: string
  endedAt?: string
  wordCount?: number
  fillerWordsCount?: number
  speakingPaceWpm?: number
  silenceBeforeMs?: number
}

export interface SimulationReport {
  overallScore: number        // /20
  overallVerdict: string
  axisScores: Record<string, AxisScore>
  strengths: ReportItem[]
  weaknesses: ReportItem[]
  juryPerceptionFr: string
  improvementPlan: string[]
  reformulationExamples: ReformulationExample[]
}

export interface AxisScore {
  score: number
  max: number
  evidence: { turnIndex: number; quote: string; comment: string }[]
  recommendationFr: string
}

export interface ReportItem {
  axis: string
  comment: string
  evidenceTurnIndex?: number
}

export interface ReformulationExample {
  original: string
  suggested: string
  context: string
}

// Filler word detection for French
const FILLER_WORDS_FR = [
  'euh', 'heu', 'bah', 'ben', 'voilà', 'donc', 'en fait',
  'du coup', 'genre', 'quoi', 'c\'est-à-dire', 'effectivement',
  'bon', 'enfin', 'disons', 'comment dire',
]

export function countFillerWords(text: string): number {
  const lower = text.toLowerCase()
  return FILLER_WORDS_FR.reduce((count, filler) => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi')
    const matches = lower.match(regex)
    return count + (matches?.length ?? 0)
  }, 0)
}

export function calculateSpeakingPace(text: string, durationMs: number): number {
  if (durationMs <= 0) return 0
  const words = text.split(/\s+/).filter(Boolean).length
  return (words / durationMs) * 60000 // words per minute
}

export function getPhaseLabel(phase: SimulationPhase): string {
  switch (phase) {
    case 'setup': return 'Préparation'
    case 'exposé_libre': return 'Exposé libre'
    case 'questions_jury': return 'Questions du jury'
    case 'mise_en_situation': return 'Mise en situation'
    case 'terminé': return 'Simulation terminée'
  }
}

export function getVerdictFromScore(score: number): string {
  if (score >= 18) return 'excellent'
  if (score >= 15) return 'très_bien'
  if (score >= 12) return 'bien'
  if (score >= 10) return 'moyen'
  if (score >= 7) return 'insuffisant'
  return 'très_insuffisant'
}

export function getVerdictLabel(verdict: string): string {
  const labels: Record<string, string> = {
    'excellent': 'Excellent',
    'très_bien': 'Très bien',
    'bien': 'Bien',
    'moyen': 'Moyen',
    'insuffisant': 'Insuffisant',
    'très_insuffisant': 'Très insuffisant',
  }
  return labels[verdict] ?? verdict
}

export function getVerdictColor(verdict: string): string {
  const colors: Record<string, string> = {
    'excellent': 'text-emerald-400',
    'très_bien': 'text-green-400',
    'bien': 'text-blue-400',
    'moyen': 'text-yellow-400',
    'insuffisant': 'text-orange-400',
    'très_insuffisant': 'text-red-400',
  }
  return colors[verdict] ?? 'text-gray-400'
}
