-- Diagnostic: Check what's actually in the database
-- Run this in Supabase SQL Editor

-- 1. Check raw database value (bypasses RLS)
SELECT 
  id,
  email,
  subscription_tier,
  interviews_limit,
  interviews_used_this_month,
  created_at,
  updated_at
FROM public.profiles
WHERE email = 'abdelkarim.boudara@gmail.com';

-- 2. Check if there are multiple profiles (shouldn't be, but check)
SELECT 
  COUNT(*) as profile_count,
  email
FROM public.profiles
WHERE email LIKE '%boudara%'
GROUP BY email;

-- 3. Force update again with explicit casting
UPDATE public.profiles
SET 
  subscription_tier = 'pro'::text,
  interviews_limit = 999999::integer,
  interviews_used_this_month = 0::integer,
  updated_at = NOW()
WHERE email = 'abdelkarim.boudara@gmail.com';

-- 4. Verify the update with explicit column types
SELECT 
  email,
  subscription_tier::text as tier,
  interviews_limit::integer as limit,
  interviews_used_this_month::integer as used,
  pg_typeof(interviews_limit) as limit_type
FROM public.profiles
WHERE email = 'abdelkarim.boudara@gmail.com';
