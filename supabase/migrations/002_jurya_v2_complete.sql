-- ============================================================
-- Jurya V2 — Complete Database Schema (SELF-CONTAINED)
-- This file creates ALL required tables from scratch.
-- Safe to run on a fresh Supabase project — uses IF NOT EXISTS.
-- ============================================================

-- ============================================================
-- PREREQUISITE: Base tables (from schema.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  user_type TEXT DEFAULT 'candidate' CHECK (user_type IN ('candidate', 'coach', 'both')),
  avatar_url TEXT,
  target_job_field TEXT,
  experience_level TEXT CHECK (experience_level IN ('junior', 'mid', 'senior')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'team')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  interviews_used_this_month INTEGER DEFAULT 0,
  interviews_limit INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.coach_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  title TEXT,
  bio TEXT,
  specializations TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10, 2),
  currency TEXT DEFAULT 'EUR',
  is_active BOOLEAN DEFAULT true,
  stripe_account_id TEXT,
  total_reviews INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================
-- PREREQUISITE: Jurya domain model (from jurya_domain_model.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.concours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('territorial', 'état', 'hospitalière', 'grande_école', 'CRFPA', 'autre')),
  grade TEXT NOT NULL,
  intitulé TEXT NOT NULL,
  coefficient_oral NUMERIC(3,1) DEFAULT 1.0,
  durée_épreuve_minutes INTEGER NOT NULL DEFAULT 30,
  rubrique_jury JSONB DEFAULT '{}'::jsonb,
  country TEXT NOT NULL DEFAULT 'FR',
  organisme_organisateur TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_concours_country ON public.concours(country);
CREATE INDEX IF NOT EXISTS idx_concours_type ON public.concours(type);

CREATE TABLE IF NOT EXISTS public.simulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  concours_id UUID REFERENCES public.concours(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('grand_oral', 'mise_en_situation', 'exposé_motivation', 'épreuve_technique')),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  overall_score DECIMAL(3, 1),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_questions INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  simulation_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_simulations_user ON public.simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_concours ON public.simulations(concours_id);

CREATE TABLE IF NOT EXISTS public.concours_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concours_id UUID REFERENCES public.concours(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  country TEXT NOT NULL DEFAULT 'FR',
  inscription_open_date DATE,
  inscription_close_date DATE,
  épreuves_écrites_date DATE,
  épreuves_orales_start_date DATE,
  épreuves_orales_end_date DATE,
  résultats_date DATE,
  source_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(concours_id, year, country)
);

-- Add coach jury columns if not present
ALTER TABLE public.coach_profiles
  ADD COLUMN IF NOT EXISTS ancien_membre_jury BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS spécialités_concours TEXT[] DEFAULT '{}';

-- ============================================================
-- PREREQUISITE SEED: Concours + Sessions (needed by later SEEDs)
-- ============================================================

INSERT INTO public.concours (type, grade, "intitulé", coefficient_oral, "durée_épreuve_minutes", rubrique_jury, country, organisme_organisateur)
VALUES
(
  'territorial', 'B', 'Rédacteur territorial', 3.0, 20,
  '{"exposé_motivation":{"durée_minutes":5,"description":"Exposé du candidat sur son parcours et sa motivation pour exercer les fonctions de rédacteur territorial."},"entretien_jury":{"durée_minutes":15,"description":"Questions du jury portant sur les connaissances administratives, la culture territoriale, les missions du cadre d''emplois et la mise en situation professionnelle."}}'::jsonb,
  'FR', 'CNFPT / CDG'
),
(
  'territorial', 'A', 'Attaché territorial', 4.0, 25,
  '{"exposé_parcours":{"durée_minutes":5,"description":"Présentation par le candidat de son parcours, ses compétences et sa motivation."},"entretien_jury":{"durée_minutes":20,"description":"Échange avec le jury sur les aptitudes du candidat à exercer les missions d''attaché, ses connaissances de l''environnement territorial, le management et la conduite de projets."}}'::jsonb,
  'FR', 'CNFPT / CDG'
),
(
  'état', 'A', 'IRA – Instituts Régionaux d''Administration (concours externe)', 4.0, 25,
  '{"mise_en_situation_collective":{"durée_minutes":null,"description":"Épreuve collective de mise en situation : les candidats interagissent en groupe sur un cas pratique."},"entretien_individuel":{"durée_minutes":25,"description":"Entretien de motivation et de mise en situation avec le jury portant sur le parcours, les compétences, la connaissance de l''administration et les qualités relationnelles."}}'::jsonb,
  'FR', 'DGAFP'
),
(
  'CRFPA', 'N/A', 'CRFPA – Grand oral', 3.0, 45,
  '{"exposé":{"durée_minutes":15,"description":"Exposé sur un sujet portant sur les libertés et droits fondamentaux, tiré au sort parmi deux sujets."},"entretien_jury":{"durée_minutes":30,"description":"Discussion avec le jury sur l''exposé, puis échange sur le parcours, la motivation pour la profession d''avocat et la déontologie."}}'::jsonb,
  'FR', 'CNB / Universités'
),
(
  'grande_école', 'N/A', 'HEC Paris – Oral d''admission', 8.0, 30,
  '{"entretien_personnalité":{"durée_minutes":30,"description":"Entretien de personnalité avec un jury de trois personnes. Le candidat présente son parcours, ses expériences, sa personnalité et sa motivation. Le jury évalue la maturité, l''ouverture d''esprit, la capacité d''analyse et les qualités humaines."}}'::jsonb,
  'FR', 'HEC Paris'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.concours_sessions (concours_id, year, country, inscription_open_date, inscription_close_date, "épreuves_écrites_date", "épreuves_orales_start_date", "épreuves_orales_end_date", "résultats_date", source_url, notes)
VALUES
(
  (SELECT id FROM public.concours WHERE "intitulé" = 'Rédacteur territorial' LIMIT 1),
  2026, 'FR', NULL, NULL, NULL, NULL, NULL, NULL,
  'https://www.cig929394.fr/liste-des-concours/',
  'Dates 2026 non encore publiées par les CDG.'
),
(
  (SELECT id FROM public.concours WHERE "intitulé" = 'Attaché territorial' LIMIT 1),
  2026, 'FR', NULL, NULL, NULL, NULL, NULL, NULL,
  'https://www.cig929394.fr/calendrier',
  'Dates 2026 non encore publiées par les CDG.'
),
(
  (SELECT id FROM public.concours WHERE "intitulé" LIKE 'IRA%' LIMIT 1),
  2026, 'FR', NULL, NULL, NULL, NULL, NULL, NULL,
  'https://www.fonction-publique.gouv.fr/score',
  'Dates 2026 non encore publiées par la DGAFP.'
),
(
  (SELECT id FROM public.concours WHERE "intitulé" LIKE 'CRFPA%' LIMIT 1),
  2026, 'FR', NULL, NULL, NULL, NULL, NULL, NULL,
  'https://cnb.avocat.fr',
  'Écrit début septembre, oral novembre-décembre. Dates 2026 à confirmer.'
),
(
  (SELECT id FROM public.concours WHERE "intitulé" LIKE 'HEC%' LIMIT 1),
  2026, 'FR', NULL, NULL, '2026-04-22'::date, '2026-06-15'::date, '2026-07-06'::date, '2026-07-08'::date,
  'https://www.concours-bce.com/',
  'Écrits : 22-29 avril. Oraux : 15 juin – 6 juillet. Résultats : 8-9 juillet 2026.'
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DOMAIN 1 — Users & Identity (extends existing profiles)
-- ============================================================

-- User preferences (separate from profiles to avoid wide-row contention)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  email_notifications JSONB DEFAULT '{"simulation_complete": true, "booking_reminder": true, "concours_deadline": true, "marketing": false}'::jsonb,
  push_notifications JSONB DEFAULT '{}'::jsonb,
  preferred_session_duration_minutes INTEGER DEFAULT 25,
  difficulty_preference TEXT DEFAULT 'adaptive' CHECK (difficulty_preference IN ('adaptive', 'easy', 'medium', 'hard')),
  voice_for_jury TEXT DEFAULT 'default',
  reminders_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Consent log for RGPD
CREATE TABLE IF NOT EXISTS public.consent_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms', 'privacy', 'voice_recording', 'marketing', 'data_sharing')),
  granted BOOLEAN NOT NULL,
  version TEXT NOT NULL,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_consent_log_user ON public.consent_log(user_id);

-- ============================================================
-- DOMAIN 2 — Concours Catalog (extends existing concours table)
-- ============================================================

-- Organismes
CREATE TABLE IF NOT EXISTS public.organismes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_code TEXT UNIQUE NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'FR',
  website_url TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Concours topics
CREATE TABLE IF NOT EXISTS public.concours_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concours_id UUID REFERENCES public.concours(id) ON DELETE CASCADE NOT NULL,
  topic_slug TEXT NOT NULL,
  label_fr TEXT NOT NULL,
  frequency TEXT DEFAULT 'common' CHECK (frequency IN ('very_common', 'common', 'occasional', 'rare')),
  last_seen_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_concours_topics_concours ON public.concours_topics(concours_id);

-- Questions bank
CREATE TABLE IF NOT EXISTS public.questions_bank (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concours_id UUID REFERENCES public.concours(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES public.concours_topics(id) ON DELETE SET NULL,
  question_text_fr TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('motivation', 'parcours', 'technique', 'mise_en_situation', 'culture_générale', 'actualité')),
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'trap')),
  expected_duration_seconds INTEGER DEFAULT 120,
  ideal_answer_structure JSONB,
  source TEXT DEFAULT 'ai_generated' CHECK (source IN ('rapport_jury_officiel', 'retour_candidat', 'coach', 'ai_generated')),
  source_reference TEXT,
  year_observed INTEGER,
  times_used INTEGER DEFAULT 0,
  avg_candidate_score NUMERIC(4,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_questions_bank_concours ON public.questions_bank(concours_id, difficulty);
CREATE INDEX idx_questions_bank_topic ON public.questions_bank(topic_id);

-- Rapports de jury (official PDF reports)
CREATE TABLE IF NOT EXISTS public.rapports_jury (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concours_id UUID REFERENCES public.concours(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  extracted_text TEXT,
  summary_fr TEXT,
  key_insights JSONB,
  published_at DATE,
  ingested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_rapports_jury_concours ON public.rapports_jury(concours_id, year);

-- ============================================================
-- DOMAIN 3 — Candidate Profiles & Preparation
-- ============================================================

-- Extended candidate profile
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio_fr TEXT,
  current_profession TEXT,
  years_experience INTEGER,
  education_level TEXT CHECK (education_level IN ('bac', 'bac+2', 'bac+3', 'bac+5', 'doctorat')),
  education_field TEXT,
  previous_attempts JSONB DEFAULT '[]'::jsonb,
  linkedin_url TEXT,
  statement_of_purpose TEXT,
  strengths JSONB,
  weaknesses JSONB,
  learning_style TEXT CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'mixed')),
  anxiety_level TEXT CHECK (anxiety_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User concours goals (what they're preparing for)
CREATE TABLE IF NOT EXISTS public.user_concours_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  concours_id UUID REFERENCES public.concours(id) ON DELETE CASCADE NOT NULL,
  target_session_id UUID REFERENCES public.concours_sessions(id) ON DELETE SET NULL,
  target_date DATE,
  status TEXT DEFAULT 'preparing' CHECK (status IN ('preparing', 'inscribed', 'passed_written', 'waiting_oral', 'succeeded', 'failed', 'abandoned')),
  priority INTEGER DEFAULT 1,
  started_preparing_at DATE DEFAULT CURRENT_DATE,
  hours_invested INTEGER DEFAULT 0,
  current_skill_level NUMERIC(4,2),
  motivation_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, concours_id)
);

CREATE INDEX idx_user_goals_user ON public.user_concours_goals(user_id);

-- Preparation plans (8-week programs)
CREATE TABLE IF NOT EXISTS public.preparation_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES public.user_concours_goals(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_weeks INTEGER NOT NULL DEFAULT 8,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  generated_by TEXT DEFAULT 'ai' CHECK (generated_by IN ('ai', 'coach', 'template', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_prep_plans_user ON public.preparation_plans(user_id);

-- Preparation milestones (weekly checkpoints)
CREATE TABLE IF NOT EXISTS public.preparation_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES public.preparation_plans(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL,
  title_fr TEXT NOT NULL,
  description_fr TEXT,
  target_simulations_count INTEGER DEFAULT 3,
  target_topics JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  score_achieved NUMERIC(4,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_milestones_plan ON public.preparation_milestones(plan_id);

-- ============================================================
-- DOMAIN 4 — Simulations (extends existing simulations table)
-- ============================================================

-- Add columns to existing simulations table
ALTER TABLE public.simulations
  ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES public.user_concours_goals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES public.preparation_milestones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'ai_only' CHECK (mode IN ('ai_only', 'ai_with_coach_review', 'live_coach')),
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  ADD COLUMN IF NOT EXISTS planned_duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS actual_duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS sujet_tirage TEXT,
  ADD COLUMN IF NOT EXISTS jury_persona JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS model_used TEXT DEFAULT 'claude-sonnet-4-6',
  ADD COLUMN IF NOT EXISTS total_input_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_output_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_platform TEXT DEFAULT 'web' CHECK (client_platform IN ('web', 'mobile_pwa'));

-- Simulation turns (Q&A exchanges with audio)
CREATE TABLE IF NOT EXISTS public.simulation_turns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL,
  turn_index INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('jury', 'candidate')),
  content_text TEXT NOT NULL,
  content_audio_url TEXT,
  audio_duration_ms INTEGER,
  question_bank_id UUID REFERENCES public.questions_bank(id) ON DELETE SET NULL,
  phase TEXT NOT NULL CHECK (phase IN ('exposé_libre', 'questions_jury', 'mise_en_situation')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ended_at TIMESTAMP WITH TIME ZONE,
  silence_before_ms INTEGER,
  word_count INTEGER,
  filler_words_count INTEGER,
  speaking_pace_wpm NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_simulation_turns ON public.simulation_turns(simulation_id, turn_index);

-- Simulation reports (detailed evaluation)
CREATE TABLE IF NOT EXISTS public.simulation_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  overall_score NUMERIC(4,2) NOT NULL,
  overall_verdict TEXT CHECK (overall_verdict IN ('très_insuffisant', 'insuffisant', 'moyen', 'bien', 'très_bien', 'excellent')),
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  axis_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  jury_perception_fr TEXT,
  improvement_plan JSONB DEFAULT '[]'::jsonb,
  reformulation_examples JSONB DEFAULT '[]'::jsonb,
  transcript_annotations JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  generation_model TEXT,
  reviewed_by_coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  coach_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Simulation recordings
CREATE TABLE IF NOT EXISTS public.simulation_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('full_audio', 'full_video', 'turn_audio', 'transcript_pdf')),
  storage_url TEXT NOT NULL,
  size_bytes BIGINT,
  duration_ms INTEGER,
  retention_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_recordings_simulation ON public.simulation_recordings(simulation_id);

-- ============================================================
-- DOMAIN 5 — Coaches & Marketplace (extends existing coach_profiles)
-- ============================================================

-- Add verification fields to coach_profiles
ALTER TABLE public.coach_profiles
  ADD COLUMN IF NOT EXISTS jury_verification_status TEXT DEFAULT 'pending' CHECK (jury_verification_status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS jury_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(4,3) DEFAULT 0.200,
  ADD COLUMN IF NOT EXISTS is_accepting_bookings BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS response_time_hours INTEGER,
  ADD COLUMN IF NOT EXISTS total_sessions_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS total_earnings_cents BIGINT DEFAULT 0;

-- ============================================================
-- DOMAIN 6 — Payments & Billing
-- ============================================================

-- Subscription plans catalog
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_fr TEXT NOT NULL,
  description_fr TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('month', 'year', 'one_time')),
  trial_days INTEGER DEFAULT 0,
  stripe_price_id TEXT,
  features JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'unpaid', 'incomplete')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('subscription', 'booking', 'one_time_purchase', 'refund', 'payout_to_coach')),
  related_booking_id UUID,
  related_subscription_id UUID,
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
  payment_method TEXT CHECK (payment_method IN ('card', 'sepa', 'bank_transfer', 'cpf')),
  processed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_payments_user ON public.payments(user_id);

-- ============================================================
-- DOMAIN 7 — Reminders & Notifications (extends existing)
-- ============================================================

-- Reminders tied to concours dates
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  concours_session_id UUID REFERENCES public.concours_sessions(id) ON DELETE CASCADE NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('inscription_opens', 'inscription_closes', 'written_exam', 'oral_exam', 'custom')),
  offset_days INTEGER DEFAULT -7,
  channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'push', 'sms')),
  sent_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_reminders_user ON public.reminders(user_id);

-- ============================================================
-- DOMAIN 8 — Content Library
-- ============================================================

-- Resources (articles, fiches, videos, podcasts)
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('article', 'fiche_thématique', 'video', 'podcast', 'masterclass', 'template')),
  title_fr TEXT NOT NULL,
  excerpt_fr TEXT,
  body_fr TEXT,
  cover_image_url TEXT,
  media_url TEXT,
  duration_seconds INTEGER,
  author_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  concours_ids JSONB DEFAULT '[]'::jsonb,
  topic_ids JSONB DEFAULT '[]'::jsonb,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_premium BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_resources_kind ON public.resources(kind);
CREATE INDEX idx_resources_published ON public.resources(published_at) WHERE published_at IS NOT NULL;

-- Resource views tracking
CREATE TABLE IF NOT EXISTS public.resource_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  duration_seconds INTEGER,
  completed BOOLEAN DEFAULT false
);

CREATE INDEX idx_resource_views ON public.resource_views(user_id, resource_id);

-- ============================================================
-- DOMAIN 9 — Analytics & Tracking
-- ============================================================

-- Skill progression over time
CREATE TABLE IF NOT EXISTS public.skill_progression (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  concours_id UUID REFERENCES public.concours(id) ON DELETE CASCADE NOT NULL,
  axis_code TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  score NUMERIC(4,2) NOT NULL,
  sample_size INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_skill_progression ON public.skill_progression(user_id, concours_id, date);

-- Pass rate reports (the sacred metric)
CREATE TABLE IF NOT EXISTS public.pass_rate_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  concours_id UUID REFERENCES public.concours(id) ON DELETE CASCADE NOT NULL,
  concours_session_id UUID REFERENCES public.concours_sessions(id) ON DELETE SET NULL,
  result TEXT NOT NULL CHECK (result IN ('passed', 'failed', 'passed_list_complémentaire', 'not_taken')),
  score_obtained NUMERIC(4,2),
  verified BOOLEAN DEFAULT false,
  testimonial_fr TEXT,
  testimonial_public BOOLEAN DEFAULT false,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_pass_rate_user ON public.pass_rate_reports(user_id);
CREATE INDEX idx_pass_rate_concours ON public.pass_rate_reports(concours_id);

-- ============================================================
-- DOMAIN 10 — Documents & Files
-- ============================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('cv', 'lettre_motivation', 'attestation_jury', 'admission_letter', 'diplome', 'rapport_jury_pdf', 'other')),
  filename TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  size_bytes INTEGER,
  mime_type TEXT,
  extracted_text TEXT,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'shared_with_coach', 'public')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_documents_owner ON public.documents(owner_user_id);

-- ============================================================
-- RLS POLICIES FOR ALL NEW TABLES
-- ============================================================

-- User preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- Consent log
ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_consent" ON public.consent_log FOR ALL USING (auth.uid() = user_id);

-- Organismes (public read)
ALTER TABLE public.organismes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organismes_public_read" ON public.organismes FOR SELECT USING (true);

-- Concours topics (public read)
ALTER TABLE public.concours_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topics_public_read" ON public.concours_topics FOR SELECT USING (true);

-- Questions bank (public read active questions)
ALTER TABLE public.questions_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_public_read" ON public.questions_bank FOR SELECT USING (is_active = true);

-- Rapports de jury (public read)
ALTER TABLE public.rapports_jury ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rapports_public_read" ON public.rapports_jury FOR SELECT USING (true);

-- Candidate profiles
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "candidates_own_profile" ON public.candidate_profiles FOR ALL USING (auth.uid() = user_id);

-- User concours goals
ALTER TABLE public.user_concours_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_goals" ON public.user_concours_goals FOR ALL USING (auth.uid() = user_id);

-- Preparation plans
ALTER TABLE public.preparation_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_plans" ON public.preparation_plans FOR ALL USING (auth.uid() = user_id);

-- Preparation milestones (via plan ownership)
ALTER TABLE public.preparation_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_milestones" ON public.preparation_milestones FOR ALL
  USING (EXISTS (SELECT 1 FROM public.preparation_plans p WHERE p.id = plan_id AND p.user_id = auth.uid()));

-- Simulation turns (via simulation ownership)
ALTER TABLE public.simulation_turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_turns" ON public.simulation_turns FOR ALL
  USING (EXISTS (SELECT 1 FROM public.simulations s WHERE s.id = simulation_id AND s.user_id = auth.uid()));

-- Simulation reports (via simulation ownership)
ALTER TABLE public.simulation_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_reports" ON public.simulation_reports FOR ALL
  USING (EXISTS (SELECT 1 FROM public.simulations s WHERE s.id = simulation_id AND s.user_id = auth.uid()));

-- Simulation recordings (via simulation ownership)
ALTER TABLE public.simulation_recordings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_recordings" ON public.simulation_recordings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.simulations s WHERE s.id = simulation_id AND s.user_id = auth.uid()));

-- Subscription plans (public read)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON public.subscription_plans FOR SELECT USING (is_active = true);

-- Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_payments" ON public.payments FOR ALL USING (auth.uid() = user_id);

-- Reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_reminders" ON public.reminders FOR ALL USING (auth.uid() = user_id);

-- Resources (public read published)
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources_public_read" ON public.resources FOR SELECT USING (published_at IS NOT NULL);

-- Resource views
ALTER TABLE public.resource_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_views" ON public.resource_views FOR ALL USING (auth.uid() = user_id);

-- Skill progression
ALTER TABLE public.skill_progression ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_progression" ON public.skill_progression FOR ALL USING (auth.uid() = user_id);

-- Pass rate reports
ALTER TABLE public.pass_rate_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_pass_rate" ON public.pass_rate_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "public_pass_rate_read" ON public.pass_rate_reports FOR SELECT USING (testimonial_public = true AND verified = true);

-- Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_documents" ON public.documents FOR ALL USING (auth.uid() = owner_user_id);

-- ============================================================
-- SEED: Subscription Plans
-- ============================================================

INSERT INTO public.subscription_plans (code, name_fr, description_fr, price_cents, currency, billing_interval, trial_days, features, sort_order) VALUES
('jurya_free', 'Gratuit', '2 simulations IA gratuites', 0, 'EUR', 'month', 0, '{"unlimited_ai": false, "simulations_per_month": 2, "coach_sessions_included": 0, "content_library": false}'::jsonb, 0),
('jurya_monthly', 'Mensuel', 'Simulations IA illimitées + bibliothèque', 2900, 'EUR', 'month', 7, '{"unlimited_ai": true, "simulations_per_month": -1, "coach_sessions_included": 0, "content_library": true, "progress_tracking": true}'::jsonb, 1),
('jurya_annual', 'Annuel', 'Tout inclus — économisez 30%', 19900, 'EUR', 'year', 7, '{"unlimited_ai": true, "simulations_per_month": -1, "coach_sessions_included": 2, "content_library": true, "progress_tracking": true, "priority_support": true}'::jsonb, 2),
('jurya_intensif', 'Parcours Intensif', 'Programme 8 semaines + 2 sessions coach', 49900, 'EUR', 'one_time', 0, '{"unlimited_ai": true, "simulations_per_month": -1, "coach_sessions_included": 2, "content_library": true, "progress_tracking": true, "prep_plan": true, "priority_support": true}'::jsonb, 3)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- SEED: Organismes
-- ============================================================

INSERT INTO public.organismes (short_code, name, country_code, website_url) VALUES
('CNFPT', 'Centre national de la fonction publique territoriale', 'FR', 'https://www.cnfpt.fr'),
('DGAFP', 'Direction générale de l''administration et de la fonction publique', 'FR', 'https://www.fonction-publique.gouv.fr'),
('CNB', 'Conseil national des barreaux', 'FR', 'https://www.cnb.avocat.fr'),
('HEC', 'HEC Paris', 'FR', 'https://www.hec.edu'),
('CDG', 'Centres de gestion de la FPT', 'FR', 'https://www.fncdg.com')
ON CONFLICT (short_code) DO NOTHING;

-- ============================================================
-- SEED: Sample questions bank
-- ============================================================

INSERT INTO public.questions_bank (concours_id, question_text_fr, question_type, difficulty, source)
SELECT c.id,
  q.text,
  q.qtype,
  q.diff,
  'ai_generated'
FROM public.concours c,
(VALUES
  ('Rédacteur territorial', 'Présentez votre parcours et expliquez pourquoi vous souhaitez devenir rédacteur territorial.', 'motivation', 'easy'),
  ('Rédacteur territorial', 'Quelles sont les principales compétences d''un rédacteur territorial ?', 'technique', 'medium'),
  ('Rédacteur territorial', 'Comment géreriez-vous un conflit entre deux agents de votre service ?', 'mise_en_situation', 'hard'),
  ('Rédacteur territorial', 'Quels sont les principaux enjeux de la décentralisation pour les collectivités ?', 'culture_générale', 'medium'),
  ('Attaché territorial', 'En quoi consiste le management d''une équipe en collectivité territoriale ?', 'technique', 'medium'),
  ('Attaché territorial', 'Présentez un projet que vous avez conduit et les difficultés rencontrées.', 'parcours', 'medium'),
  ('Attaché territorial', 'Comment articuleriez-vous les compétences État / collectivités sur un dossier transversal ?', 'mise_en_situation', 'hard'),
  ('HEC Paris – Oral d''admission', 'Parlez-nous d''une expérience qui vous a transformé.', 'motivation', 'medium'),
  ('HEC Paris – Oral d''admission', 'Quel est le leader qui vous inspire le plus et pourquoi ?', 'culture_générale', 'easy'),
  ('CRFPA – Grand oral', 'Le droit à la vie privée face aux impératifs de sécurité nationale : quel équilibre ?', 'technique', 'hard')
) AS q(concours_name, text, qtype, diff)
WHERE c."intitulé" = q.concours_name;

-- ============================================================
-- SEED: Sample content library
-- ============================================================

INSERT INTO public.resources (slug, kind, title_fr, excerpt_fr, body_fr, difficulty, published_at) VALUES
('guide-expose-motivation', 'fiche_thématique', 'Comment structurer votre exposé de motivation', 'Les clés pour un exposé de 5 minutes clair, structuré et convaincant.', '## L''exposé de motivation en 4 étapes

### 1. L''accroche (30 secondes)
Commencez par une phrase d''accroche qui capte l''attention du jury. Évitez le classique « Bonjour, je m''appelle... ». Préférez une anecdote ou un constat lié à votre motivation.

### 2. Votre parcours (1 min 30)
Présentez votre parcours de manière synthétique. Ne récitez pas votre CV — sélectionnez les 2-3 expériences les plus pertinentes pour le poste visé.

### 3. Votre motivation (2 minutes)
C''est le cœur de l''exposé. Expliquez :
- **Pourquoi ce concours** (pas un autre)
- **Pourquoi maintenant** (timing de votre carrière)
- **Ce que vous apportez** (compétences transférables)

### 4. La conclusion (1 minute)
Terminez par une ouverture sur votre projet professionnel. Montrez que vous vous projetez dans le poste.

## Erreurs fréquentes
- ❌ Dépasser le temps imparti
- ❌ Lire des notes
- ❌ Être trop générique
- ❌ Oublier de conclure

## Conseil du jury
> « Les candidats qui réussissent sont ceux qui montrent qu''ils connaissent le métier, pas seulement le concours. »
> — Rapport du jury, Attaché territorial 2024', 'easy', NOW()),

('decentralisation-fiche', 'fiche_thématique', 'La décentralisation : ce qu''il faut savoir', 'Synthèse des actes de décentralisation, compétences et enjeux actuels.', '## Les 3 actes de la décentralisation

### Acte I (1982-1983) — Lois Defferre
- Transfert de l''exécutif départemental au président du conseil général
- Suppression de la tutelle administrative a priori
- Création des régions comme collectivités territoriales

### Acte II (2003-2004)
- Révision constitutionnelle du 28 mars 2003
- Inscription du principe de décentralisation dans la Constitution
- Droit à l''expérimentation pour les collectivités
- Transfert de personnels TOS et routes nationales

### Acte III (2013-2015) — Lois MAPTAM et NOTRe
- Création des métropoles
- Nouvelle carte des régions (de 22 à 13)
- Clarification des compétences
- Suppression de la clause de compétence générale pour départements et régions

## Enjeux actuels (2024-2026)
- **Différenciation territoriale** (loi 3DS de 2022)
- **Autonomie financière** des collectivités
- **Transition écologique** et compétences environnementales
- **Fracture numérique** et accès aux services publics
- **ZAN** (Zéro Artificialisation Nette) et aménagement du territoire', 'medium', NOW()),

('gestion-stress-oral', 'fiche_thématique', 'Gérer son stress le jour de l''oral', 'Techniques concrètes pour maîtriser le stress et rester performant face au jury.', '## Avant l''épreuve

### La veille
- Préparez vos affaires (convocation, pièce d''identité, tenue)
- Relisez vos fiches une dernière fois — pas de nouvelles révisions
- Couchez-vous tôt, pas d''écran après 22h

### Le matin
- Réveil 2h avant le départ minimum
- Petit-déjeuner complet (évitez le café si vous y êtes sensible)
- 5 minutes de respiration abdominale (4-7-8 : inspirez 4s, retenez 7s, expirez 8s)

## Pendant l''attente
- Ne comparez pas vos notes avec les autres candidats
- Écoutez de la musique calme si autorisé
- Visualisez-vous en situation de réussite

## Face au jury
- **Respirez** avant de répondre à chaque question
- **Reformulez** la question si vous avez besoin de temps
- **Acceptez** le silence — 3 secondes de réflexion sont normales
- **Ne vous excusez pas** si vous ne savez pas — redirigez vers ce que vous savez

## Techniques de récupération
Si vous sentez le stress monter :
1. Posez vos deux pieds bien à plat au sol
2. Contractez vos orteils 5 secondes, puis relâchez
3. Cela active le système nerveux parasympathique sans que le jury ne remarque quoi que ce soit', 'easy', NOW())
ON CONFLICT (slug) DO NOTHING;
