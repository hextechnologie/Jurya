-- ============================================================
-- Structured Coach Profile Migration
-- Replaces flat text fields with structured cards
-- ============================================================

-- Coach experience entries
CREATE TABLE IF NOT EXISTS public.coach_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  company_name text NOT NULL,
  employment_type text CHECK (employment_type IN ('Full-time', 'Part-time', 'Freelance', 'Internship', 'Contract', 'Self-employed')),
  location text,
  start_month integer CHECK (start_month >= 1 AND start_month <= 12),
  start_year integer NOT NULL CHECK (start_year >= 1950 AND start_year <= 2100),
  end_month integer CHECK (end_month >= 1 AND end_month <= 12),
  end_year integer CHECK (end_year >= 1950 AND end_year <= 2100),
  is_current boolean DEFAULT false,
  description text,
  order_index integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Coach education entries
CREATE TABLE IF NOT EXISTS public.coach_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  education_type text NOT NULL CHECK (education_type IN ('University', 'Certification', 'High School', 'Online Course', 'Vocational', 'Other')),
  institution_name text NOT NULL,
  degree text,
  field_of_study text,
  start_year integer CHECK (start_year >= 1950 AND start_year <= 2100),
  end_year integer CHECK (end_year >= 1950 AND end_year <= 2100),
  is_ongoing boolean DEFAULT false,
  grade text,
  specialization text,
  platform text,
  credential_id text,
  credential_url text,
  issue_month integer CHECK (issue_month >= 1 AND issue_month <= 12),
  issue_year integer CHECK (issue_year >= 1950 AND issue_year <= 2100),
  expiry_month integer CHECK (expiry_month >= 1 AND expiry_month <= 12),
  expiry_year integer CHECK (expiry_year >= 1950 AND expiry_year <= 2100),
  no_expiry boolean DEFAULT false,
  description text,
  order_index integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Coach skills
CREATE TABLE IF NOT EXISTS public.coach_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  skill_category text CHECK (skill_category IN ('Technical', 'Soft Skills', 'Languages', 'Tools')),
  order_index integer DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- Coach achievements
CREATE TABLE IF NOT EXISTS public.coach_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_type text CHECK (achievement_type IN ('Professional Achievement', 'Project', 'Public Speaking', 'Publication', 'Award', 'Other')),
  title text NOT NULL,
  description text,
  achievement_month integer CHECK (achievement_month >= 1 AND achievement_month <= 12),
  achievement_year integer CHECK (achievement_year >= 1950 AND achievement_year <= 2100),
  url text,
  order_index integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_experience_coach_id ON public.coach_experience(coach_id, order_index);
CREATE INDEX IF NOT EXISTS idx_coach_education_coach_id ON public.coach_education(coach_id, order_index);
CREATE INDEX IF NOT EXISTS idx_coach_skills_coach_id ON public.coach_skills(coach_id, order_index);
CREATE INDEX IF NOT EXISTS idx_coach_achievements_coach_id ON public.coach_achievements(coach_id, order_index);

-- Row Level Security Policies

-- coach_experience policies
DROP POLICY IF EXISTS "Anyone can view coach experience" ON public.coach_experience;
CREATE POLICY "Anyone can view coach experience" ON public.coach_experience
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Coaches can manage their own experience" ON public.coach_experience;
CREATE POLICY "Coaches can manage their own experience" ON public.coach_experience
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- coach_education policies
DROP POLICY IF EXISTS "Anyone can view coach education" ON public.coach_education;
CREATE POLICY "Anyone can view coach education" ON public.coach_education
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Coaches can manage their own education" ON public.coach_education;
CREATE POLICY "Coaches can manage their own education" ON public.coach_education
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- coach_skills policies
DROP POLICY IF EXISTS "Anyone can view coach skills" ON public.coach_skills;
CREATE POLICY "Anyone can view coach skills" ON public.coach_skills
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Coaches can manage their own skills" ON public.coach_skills;
CREATE POLICY "Coaches can manage their own skills" ON public.coach_skills
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- coach_achievements policies
DROP POLICY IF EXISTS "Anyone can view coach achievements" ON public.coach_achievements;
CREATE POLICY "Anyone can view coach achievements" ON public.coach_achievements
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Coaches can manage their own achievements" ON public.coach_achievements;
CREATE POLICY "Coaches can manage their own achievements" ON public.coach_achievements
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Enable Row Level Security
ALTER TABLE public.coach_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_achievements ENABLE ROW LEVEL SECURITY;

-- Functions to update timestamps
CREATE OR REPLACE FUNCTION update_coach_experience_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_coach_education_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_coach_achievements_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_coach_experience_timestamp_trigger ON public.coach_experience;
CREATE TRIGGER update_coach_experience_timestamp_trigger
  BEFORE UPDATE ON public.coach_experience
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_experience_timestamp();

DROP TRIGGER IF EXISTS update_coach_education_timestamp_trigger ON public.coach_education;
CREATE TRIGGER update_coach_education_timestamp_trigger
  BEFORE UPDATE ON public.coach_education
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_education_timestamp();

DROP TRIGGER IF EXISTS update_coach_achievements_timestamp_trigger ON public.coach_achievements;
CREATE TRIGGER update_coach_achievements_timestamp_trigger
  BEFORE UPDATE ON public.coach_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_achievements_timestamp();

-- Comments for documentation
COMMENT ON TABLE public.coach_experience IS 'Structured work experience entries for coaches';
COMMENT ON TABLE public.coach_education IS 'Structured education and certification entries for coaches';
COMMENT ON TABLE public.coach_skills IS 'Tagged skills for coaches with categories';
COMMENT ON TABLE public.coach_achievements IS 'Professional achievements, projects, and recognitions for coaches';
