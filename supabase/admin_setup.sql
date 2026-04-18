-- Admin Setup: Give unlimited interviews to test accounts
-- Run this in Supabase SQL Editor

-- Step 1: Check if the profile exists
SELECT 
  id,
  email, 
  subscription_tier, 
  interviews_limit, 
  interviews_used_this_month,
  created_at
FROM public.profiles
WHERE email LIKE '%boudara%';

-- Step 2: Update the profile (use the exact email from Step 1)
UPDATE public.profiles
SET 
  subscription_tier = 'pro',
  interviews_limit = 999999,
  interviews_used_this_month = 0,
  updated_at = NOW()
WHERE email = 'abdelkarim.boudara@gmail.com';

-- Step 3: Update additional admin account
UPDATE public.profiles
SET 
  subscription_tier = 'pro',
  interviews_limit = 999999,
  interviews_used_this_month = 0,
  updated_at = NOW()
WHERE email = 'moujahid.boukane@gmail.com';

-- Step 4: Force update for ALL matching emails (in case of typo)
UPDATE public.profiles
SET 
  subscription_tier = 'pro',
  interviews_limit = 999999,
  interviews_used_this_month = 0,
  updated_at = NOW()
WHERE email LIKE '%boudara%' OR email LIKE '%boukane%';

-- Step 5: Verify the update worked
SELECT 
  '✅ UPDATED:' as status,
  email, 
  subscription_tier, 
  interviews_limit, 
  interviews_used_this_month
FROM public.profiles
WHERE email LIKE '%boudara%' OR email LIKE '%boukane%';

-- If you see interviews_limit = 999999 above, the database is updated!
-- Then: LOG OUT from the website, clear browser cache, and LOG BACK IN

-- ============================================================
-- SET ACCOUNTS AS COACH
-- Run this AFTER coach_platform.sql migration to make specific
-- accounts show the coach dashboard instead of candidate.
-- ============================================================

-- Replace the email below with the account you want to be a coach.
-- You can run this multiple times safely.

UPDATE public.profiles
SET
  user_type = 'coach',
  role      = 'coach',
  full_name = COALESCE(NULLIF(full_name, ''), 'Karim Boudara'),
  updated_at = NOW()
WHERE email LIKE '%boudara%';

UPDATE public.profiles
SET
  user_type = 'coach',
  role      = 'coach',
  full_name = COALESCE(NULLIF(full_name, ''), 'Moujahid Boukane'),
  updated_at = NOW()
WHERE email LIKE '%boukane%';

-- Verify coach setup
SELECT
  email,
  full_name,
  user_type,
  role,
  subscription_tier
FROM public.profiles
WHERE email LIKE '%boudara%' OR email LIKE '%boukane%';
-- You should see user_type = 'coach' and a full_name set.
-- Then LOG OUT and LOG BACK IN for the dashboard to pick it up.
