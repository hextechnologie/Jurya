-- Verify Profile Data
-- Run this in Supabase SQL Editor to see your ACTUAL profile data

-- Check what the database actually has for your account
SELECT 
  id,
  email,
  subscription_tier,
  interviews_limit,
  interviews_used_this_month,
  updated_at,
  created_at
FROM public.profiles
WHERE email = 'abdelkarim.boudara@gmail.com';

-- Check if RLS is preventing you from seeing the data
-- This query uses service role and should work
SELECT 
  '🔍 What auth.uid() returns:' as info,
  auth.uid() as your_user_id;

-- Check if there are multiple profiles with similar emails
SELECT 
  id,
  email,
  subscription_tier,
  interviews_limit
FROM public.profiles
WHERE email LIKE '%boudara%'
OR email LIKE '%abdelkarim%';
