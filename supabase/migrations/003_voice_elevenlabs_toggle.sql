-- Migration: add explicit ElevenLabs voice toggle to user_preferences
-- voice_for_jury already exists as TEXT ('default' = try ElevenLabs, 'browser' = Web Speech only, 'elevenlabs' = ElevenLabs required)
-- Add a convenience boolean that the UI toggles directly

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS elevenlabs_enabled BOOLEAN DEFAULT true;

-- Sync existing rows: map 'browser' → false, everything else → true
UPDATE public.user_preferences
  SET elevenlabs_enabled = (voice_for_jury != 'browser');
