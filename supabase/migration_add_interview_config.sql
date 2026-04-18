-- Add interview_config column to interview_sessions table to store extended configuration
ALTER TABLE public.interview_sessions
ADD COLUMN IF NOT EXISTS interview_config JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN public.interview_sessions.interview_config IS 'Stores extended interview configuration including language, interviewer type, skills, etc.';
