import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** Extract the first name from a full_name or email */
export function getFirstName(fullName?: string | null, email?: string | null): string {
  if (fullName && fullName.trim()) {
    const first = fullName.trim().split(/\s+/)[0]
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  }
  if (email) {
    // Split on dots/underscores/dashes, take first meaningful segment, strip trailing digits
    const parts = email.split('@')[0].split(/[._\-]/)
    const word = parts[0].replace(/\d+$/, '').trim()
    if (word.length >= 2) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    // If first part is too short (e.g. just numbers), try second part
    const fallback = (parts[1] || parts[0]).replace(/\d+$/, '').trim()
    if (fallback.length >= 2) return fallback.charAt(0).toUpperCase() + fallback.slice(1).toLowerCase()
  }
  return 'there'
}

export type Profile = {
  id: string
  email: string
  full_name?: string
  first_name?: string
  last_name?: string
  user_type?: 'candidate' | 'coach'
  avatar_url?: string
  target_job_field?: string
  target_job_role?: string
  experience_level?: 'junior' | 'mid' | 'senior'
  current_status?: string
  status_detail?: string
  country?: string
  city?: string
  linkedin_url?: string
  subscription_tier: 'free' | 'basic' | 'pro' | 'team'
  stripe_customer_id?: string
  stripe_subscription_id?: string
  interviews_used_this_month: number
  interviews_limit: number
  created_at: string
  updated_at: string
}

export type CoachProfile = {
  id: string
  user_id: string
  title: string
  bio?: string
  years_experience?: number
  price_per_hour: number
  rating?: number
  total_sessions?: number
  linkedin_url?: string
  languages?: string[]
  companies?: string[]
  is_verified?: boolean
}

export type CoachBooking = {
  id: string
  candidate_id: string
  coach_id: string
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  stripe_payment_id?: string
  notes?: string
  scheduled_at?: string
  created_at: string
}

export type NotificationItem = {
  id: string
  title: string
  message: string
  type: 'booking' | 'review' | 'payment' | 'reminder'
  read: boolean
  created_at: string
}

export type InterviewSession = {
  id: string
  user_id: string
  job_role: string
  industry?: string
  difficulty_level: 'junior' | 'mid' | 'senior'
  status: 'in_progress' | 'completed' | 'abandoned'
  overall_score?: number
  started_at: string
  completed_at?: string
  total_questions: number
  questions_answered: number
  created_at: string
  interview_config?: {
    resumeText?: string
    resumeFileName?: string
    jobDescription?: string
    language?: string
    interviewerType?: string
    interviewType?: string
    interviewRound?: string
    yearsOfExperience?: number
    mainSkills?: string[]
    weakAreas?: string[]
    role?: string
    targetCompany?: string
    realCompanyMode?: boolean
    personalizationKeywords?: string[]
  }
}

export type InterviewAnswer = {
  id: string
  session_id: string
  question_number: number
  question_text: string
  user_answer: string
  ai_feedback?: {
    score: number
    strengths: string[]
    weaknesses: string[]
    ideal_answer?: string
    improved_answer: string
    quick_fix?: string
    difference_points?: string[]
    language?: string
    metrics?: {
      confidence: number
      clarity: number
      filler_words: number
      star_method_score?: number
      keywords_used?: number
      answer_length?: 'Too Short' | 'Perfect' | 'Too Long'
      tone?: 'Professional 🎯' | 'Casual 😊' | 'Nervous 😰'
    }
  }
  score?: number
  created_at: string
}
