-- ============================================================
-- Full Database Setup (schema + coach platform)
-- Safe to run on a fresh DB or an existing one — all statements
-- use IF NOT EXISTS / IF EXISTS / DO $$ guards.
-- ============================================================

-- ── BASE TABLES (from schema.sql) ───────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id                         UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email                      TEXT NOT NULL,
  full_name                  TEXT,
  user_type                  TEXT DEFAULT 'candidate' CHECK (user_type IN ('candidate', 'coach')),
  avatar_url                 TEXT,
  target_job_field           TEXT,
  experience_level           TEXT CHECK (experience_level IN ('junior', 'mid', 'senior')),
  subscription_tier          TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'team')),
  stripe_customer_id         TEXT,
  stripe_subscription_id     TEXT,
  interviews_used_this_month INTEGER DEFAULT 0,
  interviews_limit           INTEGER DEFAULT 3,
  created_at                 TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at                 TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  job_role          TEXT NOT NULL,
  industry          TEXT,
  difficulty_level  TEXT NOT NULL CHECK (difficulty_level IN ('junior', 'mid', 'senior')),
  status            TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  overall_score     DECIMAL(3,1),
  started_at        TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at      TIMESTAMP WITH TIME ZONE,
  total_questions   INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  interview_config  JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.interview_answers (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id      UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE NOT NULL,
  question_number INTEGER NOT NULL,
  question_text   TEXT NOT NULL,
  user_answer     TEXT NOT NULL,
  ai_feedback     JSONB,
  score           DECIMAL(3,1),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.subscription_history (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_tier      TEXT NOT NULL,
  stripe_subscription_id TEXT,
  status                 TEXT NOT NULL,
  started_at             TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ended_at               TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  status     TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.coach_profiles (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                  UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  title                    TEXT NOT NULL,
  bio                      TEXT,
  years_experience         INTEGER DEFAULT 0,
  price_per_hour           NUMERIC(10,2) NOT NULL DEFAULT 50,
  rating                   NUMERIC(3,2) DEFAULT 0,
  total_sessions           INTEGER DEFAULT 0,
  linkedin_url             TEXT,
  languages                TEXT[] DEFAULT ARRAY['English'],
  companies                TEXT[] DEFAULT ARRAY[]::TEXT[],
  intro_call_enabled       BOOLEAN DEFAULT true,
  stripe_connect_account_id TEXT,
  is_verified              BOOLEAN DEFAULT false,
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at               TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.coach_specializations (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  specialization TEXT NOT NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.availability (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date           DATE NOT NULL,
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  is_booked      BOOLEAN DEFAULT false,
  is_recurring   BOOLEAN DEFAULT false,
  buffer_minutes INTEGER DEFAULT 15,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id            UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  slot_id             UUID REFERENCES public.availability(id) ON DELETE SET NULL,
  duration_minutes    INTEGER NOT NULL DEFAULT 60,
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  stripe_payment_id   TEXT,
  notes               TEXT,
  scheduled_at        TIMESTAMP WITH TIME ZONE,
  daily_room_url      TEXT,
  google_calendar_url TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id   UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  recommend_coach BOOLEAN DEFAULT true,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id  UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.earnings (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id   UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  gross_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount   NUMERIC(10,2) NOT NULL DEFAULT 0,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid_out')),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT DEFAULT 'booking' CHECK (type IN ('booking', 'review', 'payment', 'reminder')),
  read       BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ── ENSURE CORE COLUMNS EXIST BEFORE INDEXES ───────────────
-- profiles may already exist without user_type; add it safely first
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'candidate';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role      text DEFAULT 'candidate';

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id    ON public.interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status     ON public.interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interview_answers_session_id  ON public.interview_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id   ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at   ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status       ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type            ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id        ON public.coach_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_specializations_coach_id ON public.coach_specializations(coach_id);
CREATE INDEX IF NOT EXISTS idx_availability_coach_date       ON public.availability(coach_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_candidate_id         ON public.bookings(candidate_id);
CREATE INDEX IF NOT EXISTS idx_bookings_coach_id             ON public.bookings(coach_id);
CREATE INDEX IF NOT EXISTS idx_reviews_coach_id              ON public.reviews(coach_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking_id           ON public.messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_earnings_coach_id             ON public.earnings(coach_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id         ON public.notifications(user_id);

-- ── NEW COLUMNS (coach platform additions) ───────────────────
ALTER TABLE public.profiles  ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles  ADD COLUMN IF NOT EXISTS last_name  text;
ALTER TABLE public.bookings  ADD COLUMN IF NOT EXISTS session_type  text DEFAULT 'video';
ALTER TABLE public.bookings  ADD COLUMN IF NOT EXISTS session_notes text;
ALTER TABLE public.messages  ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.messages  ADD COLUMN IF NOT EXISTS read boolean NOT NULL DEFAULT false;
ALTER TABLE public.earnings  ADD COLUMN IF NOT EXISTS amount numeric(10,2) GENERATED ALWAYS AS (net_amount) STORED;
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS coach_id         uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS specializations  jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS companies_worked jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;
UPDATE public.coach_profiles SET coach_id = user_id WHERE coach_id IS NULL;
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages(receiver_id);

-- ── NEW TABLES (coach platform) ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.coach_availability (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id       uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  slots          jsonb NOT NULL DEFAULT '[]',
  blocked_dates  jsonb NOT NULL DEFAULT '[]',
  buffer_minutes int   NOT NULL DEFAULT 15,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interview_templates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id         uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name             text NOT NULL,
  job_role         text,
  industry         text,
  difficulty       text DEFAULT 'mid',
  duration_minutes int  NOT NULL DEFAULT 45,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.template_questions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id        uuid REFERENCES public.interview_templates(id) ON DELETE CASCADE,
  question           text NOT NULL,
  order_index        int  NOT NULL DEFAULT 0,
  time_limit_seconds int  NOT NULL DEFAULT 120
);

CREATE TABLE IF NOT EXISTS public.session_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
  coach_id   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes      text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.answer_scores (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.template_questions(id) ON DELETE CASCADE,
  score       int CHECK (score >= 1 AND score <= 10),
  coach_notes text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_answers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_availability  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_questions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_scores       ENABLE ROW LEVEL SECURITY;

-- Drop all policies (safe to re-run)
DROP POLICY IF EXISTS "Users can view own profile"               ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"             ON public.profiles;
DROP POLICY IF EXISTS "Users can view own sessions"              ON public.interview_sessions;
DROP POLICY IF EXISTS "Users can create own sessions"            ON public.interview_sessions;
DROP POLICY IF EXISTS "Users can update own sessions"            ON public.interview_sessions;
DROP POLICY IF EXISTS "Users can view own answers"               ON public.interview_answers;
DROP POLICY IF EXISTS "Users can create own answers"             ON public.interview_answers;
DROP POLICY IF EXISTS "Users can view own subscription history"  ON public.subscription_history;
DROP POLICY IF EXISTS "Anyone can insert contact messages"       ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can view coach profiles"           ON public.coach_profiles;
DROP POLICY IF EXISTS "Coaches can manage own profile"           ON public.coach_profiles;
DROP POLICY IF EXISTS "Anyone can view coach specializations"    ON public.coach_specializations;
DROP POLICY IF EXISTS "Coaches can manage own specializations"   ON public.coach_specializations;
DROP POLICY IF EXISTS "Anyone can view availability"             ON public.availability;
DROP POLICY IF EXISTS "Coaches can manage own availability"      ON public.availability;
DROP POLICY IF EXISTS "Participants can view bookings"           ON public.bookings;
DROP POLICY IF EXISTS "Candidates can create bookings"           ON public.bookings;
DROP POLICY IF EXISTS "Participants can update bookings"         ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view reviews"                  ON public.reviews;
DROP POLICY IF EXISTS "Candidates can create reviews"            ON public.reviews;
DROP POLICY IF EXISTS "Participants can view messages"           ON public.messages;
DROP POLICY IF EXISTS "Participants can create messages"         ON public.messages;
DROP POLICY IF EXISTS "Coaches can view own earnings"            ON public.earnings;
DROP POLICY IF EXISTS "Users can view own notifications"         ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications"          ON public.notifications;
DROP POLICY IF EXISTS "messages_select"                          ON public.messages;
DROP POLICY IF EXISTS "messages_insert"                          ON public.messages;
DROP POLICY IF EXISTS "messages_update"                          ON public.messages;
DROP POLICY IF EXISTS "coach_availability_select"                ON public.coach_availability;
DROP POLICY IF EXISTS "coach_availability_write"                 ON public.coach_availability;
DROP POLICY IF EXISTS "templates_select"                         ON public.interview_templates;
DROP POLICY IF EXISTS "templates_write"                          ON public.interview_templates;
DROP POLICY IF EXISTS "template_questions_select"                ON public.template_questions;
DROP POLICY IF EXISTS "template_questions_write"                 ON public.template_questions;
DROP POLICY IF EXISTS "session_notes_select"                     ON public.session_notes;
DROP POLICY IF EXISTS "session_notes_write"                      ON public.session_notes;
DROP POLICY IF EXISTS "answer_scores_write"                      ON public.answer_scores;

-- Profiles
CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Interview sessions
CREATE POLICY "Users can view own sessions"   ON public.interview_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON public.interview_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.interview_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Interview answers
CREATE POLICY "Users can view own answers" ON public.interview_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.interview_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
);
CREATE POLICY "Users can create own answers" ON public.interview_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.interview_sessions s WHERE s.id = session_id AND s.user_id = auth.uid())
);

-- Misc
CREATE POLICY "Users can view own subscription history" ON public.subscription_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert contact messages"      ON public.contact_messages FOR INSERT WITH CHECK (true);

-- Coach profiles
CREATE POLICY "Anyone can view coach profiles"  ON public.coach_profiles FOR SELECT USING (true);
CREATE POLICY "Coaches can manage own profile"  ON public.coach_profiles FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Coach specializations
CREATE POLICY "Anyone can view coach specializations"  ON public.coach_specializations FOR SELECT USING (true);
CREATE POLICY "Coaches can manage own specializations" ON public.coach_specializations FOR ALL
  USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

-- Availability
CREATE POLICY "Anyone can view availability"      ON public.availability FOR SELECT USING (true);
CREATE POLICY "Coaches can manage own availability" ON public.availability FOR ALL
  USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

-- Bookings
CREATE POLICY "Participants can view bookings"   ON public.bookings FOR SELECT USING (auth.uid() = candidate_id OR auth.uid() = coach_id);
CREATE POLICY "Candidates can create bookings"   ON public.bookings FOR INSERT WITH CHECK (auth.uid() = candidate_id);
CREATE POLICY "Participants can update bookings" ON public.bookings FOR UPDATE USING (auth.uid() = candidate_id OR auth.uid() = coach_id);

-- Reviews
CREATE POLICY "Anyone can view reviews"      ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Candidates can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = candidate_id);

-- Messages (supports both booking-thread and direct messages)
CREATE POLICY "messages_select" ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.candidate_id = auth.uid() OR b.coach_id = auth.uid()))
  );
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Earnings
CREATE POLICY "Coaches can view own earnings" ON public.earnings FOR SELECT USING (auth.uid() = coach_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications"  ON public.notifications FOR INSERT WITH CHECK (true);

-- Coach availability
CREATE POLICY "coach_availability_select" ON public.coach_availability FOR SELECT USING (true);
CREATE POLICY "coach_availability_write"  ON public.coach_availability FOR ALL USING (auth.uid() = coach_id);

-- Interview templates
CREATE POLICY "templates_select" ON public.interview_templates FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "templates_write"  ON public.interview_templates FOR ALL  USING (auth.uid() = coach_id);

-- Template questions
CREATE POLICY "template_questions_select" ON public.template_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.interview_templates t WHERE t.id = template_id AND t.coach_id = auth.uid())
);
CREATE POLICY "template_questions_write" ON public.template_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.interview_templates t WHERE t.id = template_id AND t.coach_id = auth.uid())
);

-- Session notes
CREATE POLICY "session_notes_select" ON public.session_notes FOR SELECT USING (
  auth.uid() = coach_id OR
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.candidate_id = auth.uid())
);
CREATE POLICY "session_notes_write" ON public.session_notes FOR ALL USING (auth.uid() = coach_id);

-- Answer scores
CREATE POLICY "answer_scores_write" ON public.answer_scores FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE b.id = booking_id AND p.user_type = 'coach'
  )
);

-- ── FUNCTIONS & TRIGGERS ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_type, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'user_type', 'candidate'),
    COALESCE(new.raw_user_meta_data->>'user_type', 'candidate')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── SUPABASE REALTIME ─────────────────────────────────────────
-- Enable in Dashboard → Database → Replication, or uncomment:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
