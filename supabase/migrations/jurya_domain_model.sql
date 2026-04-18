-- ============================================================
-- Jurya Domain Model Migration
-- Transforms Interview Coach → Concours oral platform
-- ============================================================

-- 1. Concours table (replaces free-text job_role)
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

CREATE INDEX idx_concours_country ON public.concours(country);
CREATE INDEX idx_concours_type ON public.concours(type);

-- 2. Simulations table (replaces interview_sessions)
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

CREATE INDEX idx_simulations_user ON public.simulations(user_id);
CREATE INDEX idx_simulations_concours ON public.simulations(concours_id);

-- 3. Simulation answers (replaces interview_answers)
CREATE TABLE IF NOT EXISTS public.simulation_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  ai_feedback JSONB,
  score DECIMAL(3, 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_simulation_answers_session ON public.simulation_answers(session_id);

-- 4. CoachJury additions (extends coach_profiles)
ALTER TABLE public.coach_profiles
  ADD COLUMN IF NOT EXISTS ancien_membre_jury BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS spécialités_concours TEXT[] DEFAULT '{}';

-- 5. ConcoursSession (calendar / deadlines)
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

CREATE INDEX idx_concours_sessions_country ON public.concours_sessions(country);
CREATE INDEX idx_concours_sessions_year ON public.concours_sessions(year);
CREATE INDEX idx_concours_sessions_inscription_close ON public.concours_sessions(inscription_close_date);

-- 6. User concours reminders (opt-in email toggle)
CREATE TABLE IF NOT EXISTS public.user_concours_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  concours_session_id UUID REFERENCES public.concours_sessions(id) ON DELETE CASCADE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, concours_session_id)
);

-- TODO(mouj): wire up email notifications — this table stores the opt-in only

-- 7. RLS policies for new tables

ALTER TABLE public.concours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concours_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_concours_reminders ENABLE ROW LEVEL SECURITY;

-- Concours: anyone can read
CREATE POLICY "concours_public_read" ON public.concours
  FOR SELECT USING (true);

-- Simulations: users see only their own
CREATE POLICY "simulations_user_read" ON public.simulations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "simulations_user_insert" ON public.simulations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "simulations_user_update" ON public.simulations
  FOR UPDATE USING (auth.uid() = user_id);

-- Simulation answers: users see only their own (via session)
CREATE POLICY "simulation_answers_user_read" ON public.simulation_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.simulations s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "simulation_answers_user_insert" ON public.simulation_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.simulations s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- Concours sessions: anyone can read
CREATE POLICY "concours_sessions_public_read" ON public.concours_sessions
  FOR SELECT USING (true);

-- User reminders: users manage only their own
CREATE POLICY "user_reminders_read" ON public.user_concours_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_reminders_insert" ON public.user_concours_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_reminders_update" ON public.user_concours_reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_reminders_delete" ON public.user_concours_reminders
  FOR DELETE USING (auth.uid() = user_id);
