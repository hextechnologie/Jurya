// ============================================================
// Jurya Domain Types — Concours, Simulation, CoachJury
// ============================================================

// --- Concours (replaces Job) ---

export type ConcoursType =
  | 'territorial'
  | 'état'
  | 'hospitalière'
  | 'grande_école'
  | 'CRFPA'
  | 'autre'

export interface Concours {
  id: string
  type: ConcoursType
  grade: string
  intitulé: string
  coefficient_oral: number
  durée_épreuve_minutes: number
  rubrique_jury: Record<string, any> // JSON describing the jury evaluation grid
  country: string // ISO 3166-1 alpha-2, default "FR"
  organisme_organisateur: string // e.g. CNFPT, CNG, DGAFP, CNB, HEC Paris
  created_at: string
  updated_at: string
}

// --- Simulation (replaces Interview) ---

export type SimulationType =
  | 'grand_oral'
  | 'mise_en_situation'
  | 'exposé_motivation'
  | 'épreuve_technique'

export interface Simulation {
  id: string
  user_id: string
  concours_id: string
  type: SimulationType
  status: 'in_progress' | 'completed' | 'abandoned'
  overall_score: number | null
  started_at: string
  completed_at: string | null
  total_questions: number
  questions_answered: number
  simulation_config: {
    concoursIntitulé?: string
    concoursType?: ConcoursType
    duréeMinutes?: number
    rubriqueJury?: Record<string, any>
    language?: string
    exposéSujet?: string
    motivationLettre?: string
    cvText?: string
    cvFileName?: string
  }
  created_at: string
}

export interface SimulationAnswer {
  id: string
  session_id: string
  question_number: number
  question_text: string
  user_answer: string
  ai_feedback: RapportÉvaluationFeedback | null
  score: number | null
  created_at: string
}

// --- RapportÉvaluation (replaces InterviewReport) ---

export interface RapportÉvaluationFeedback {
  score: number // /5 (not /10)
  structure_exposé: AxeÉvaluation
  motivation_cohérence: AxeÉvaluation
  connaissance_environnement_professionnel: AxeÉvaluation
  communication_gestion_stress: AxeÉvaluation
  commentaire_général: string
  points_forts: string[]
  axes_amélioration: string[]
  citations_transcription: string[] // concrete transcript citations
}

export interface AxeÉvaluation {
  note: number // /5
  commentaire: string
  citations: string[] // transcript excerpts backing the score
}

// --- CoachJury (replaces Coach) ---

export interface CoachJury {
  id: string
  user_id: string
  title: string
  bio: string | null
  years_experience: number | null
  price_per_hour: number
  credits_per_hour: number | null
  rating: number | null
  total_sessions: number | null
  linkedin_url: string | null
  languages: string[]
  companies: string[]
  ancien_membre_jury: boolean
  spécialités_concours: string[]
  stripe_connect_account_id: string | null
  is_verified: boolean
  created_at: string
  updated_at: string
}

// --- ConcoursSession (NEW — calendar/deadlines) ---

export interface ConcoursSession {
  id: string
  concours_id: string
  year: number
  country: string // ISO 3166-1 alpha-2, default "FR"
  inscription_open_date: string | null // ISO date
  inscription_close_date: string | null // ISO date
  épreuves_écrites_date: string | null // ISO date
  épreuves_orales_start_date: string | null // ISO date
  épreuves_orales_end_date: string | null // ISO date
  résultats_date: string | null // ISO date
  source_url: string | null // official page to verify
  notes: string | null // markdown
  created_at: string
  updated_at: string
}

// --- User Concours Reminder (opt-in email toggle) ---

export interface UserConcoursReminder {
  id: string
  user_id: string
  concours_session_id: string
  enabled: boolean
  created_at: string
  // TODO(mouj): wire up email notifications
}
