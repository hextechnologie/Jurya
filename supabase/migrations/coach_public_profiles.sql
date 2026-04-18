-- ============================================================
-- Public Profiles Policy
-- Makes all profile rows publicly readable (names, locations, etc.)
-- Required for the /coaches browse page and all coach listings to work.
-- The old restrictive policy (auth.uid() = id) blocked reads of other users' profiles.
-- Safe to run multiple times (DROP IF EXISTS guards)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Coach profile rows are publicly readable" ON public.profiles;

CREATE POLICY "Profiles are publicly readable"
  ON public.profiles
  FOR SELECT
  USING (true);
