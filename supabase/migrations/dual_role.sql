-- ============================================================
-- Dual Role Migration
-- Allows a single email/user to hold both coach and candidate roles
-- user_type = 'both' means the user has activated both roles
-- ============================================================

-- Drop the existing check constraint and add 'both' as a valid value
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_type_check
  CHECK (user_type IN ('candidate', 'coach', 'both'));
