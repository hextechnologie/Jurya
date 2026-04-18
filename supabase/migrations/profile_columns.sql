-- ============================================================
-- Profile Columns Migration
-- Adds new user profile fields: split name, status, location, linkedin
-- Safe to run multiple times (IF NOT EXISTS guards)
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url       TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_job_field TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('junior', 'mid', 'senior'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name       TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name        TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_status   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status_detail    TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_job_role  TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country              TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city                 TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url         TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS professional_headline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS about_me             TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_details   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education_details    TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS projects_details     TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills               TEXT[];

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS candidate_name_snapshot TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS coach_name_snapshot     TEXT;

UPDATE public.bookings b
SET candidate_name_snapshot = COALESCE(NULLIF(p.full_name, ''), NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''))
FROM public.profiles p
WHERE b.candidate_id = p.id
  AND (b.candidate_name_snapshot IS NULL OR b.candidate_name_snapshot = '');

UPDATE public.bookings b
SET coach_name_snapshot = COALESCE(NULLIF(p.full_name, ''), NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''))
FROM public.profiles p
WHERE b.coach_id = p.id
  AND (b.coach_name_snapshot IS NULL OR b.coach_name_snapshot = '');

DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Back-fill first_name / last_name from existing full_name where not yet set
UPDATE public.profiles
SET
  first_name = TRIM(SPLIT_PART(full_name, ' ', 1)),
  last_name  = TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))
WHERE full_name IS NOT NULL
  AND first_name IS NULL;
