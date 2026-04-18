-- ============================================================
-- Credits System Migration
-- Replaces direct payments with credits-based economy
-- ============================================================

-- Credits balance per user
CREATE TABLE IF NOT EXISTS public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  balance integer DEFAULT 0 CHECK (balance >= 0),
  total_purchased integer DEFAULT 0,
  total_spent integer DEFAULT 0,
  total_earned integer DEFAULT 0,
  total_withdrawn integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Credits transactions history
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('purchase', 'spent', 'refund', 'earned', 'withdrawn', 'bonus', 'admin_adjustment')),
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  description text,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  stripe_payment_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now()
);

-- Credits escrow (held during active sessions)
CREATE TABLE IF NOT EXISTS public.credits_escrow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
  candidate_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_credits integer NOT NULL,
  platform_fee integer NOT NULL,
  coach_earnings integer NOT NULL,
  status text DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
  released_at timestamp,
  created_at timestamp DEFAULT now()
);

-- Coach cancellation tracking
CREATE TABLE IF NOT EXISTS public.cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  cancelled_by text NOT NULL CHECK (cancelled_by IN ('coach', 'candidate', 'admin')),
  reason_category text,
  reason_detail text,
  hours_before_session numeric,
  refund_amount integer DEFAULT 0,
  refund_status text CHECK (refund_status IN ('full', 'none', 'partial')),
  cancelled_at timestamp DEFAULT now()
);

-- Coach strike tracking
CREATE TABLE IF NOT EXISTS public.coach_strikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  strike_type text DEFAULT 'cancellation' CHECK (strike_type IN ('cancellation', 'behavior', 'quality', 'other')),
  expires_at timestamp DEFAULT (now() + interval '30 days'),
  resolved boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- Credit packages configuration
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_usd integer NOT NULL,
  base_credits integer NOT NULL,
  bonus_credits integer DEFAULT 0,
  total_credits integer GENERATED ALWAYS AS (base_credits + bonus_credits) STORED,
  is_popular boolean DEFAULT false,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- Insert default credit packages
INSERT INTO public.credit_packages (name, price_usd, base_credits, bonus_credits, is_popular, display_order) VALUES
  ('Starter Pack', 20, 20, 0, false, 1),
  ('Popular Pack', 50, 50, 5, true, 2),
  ('Pro Pack', 100, 100, 15, false, 3),
  ('Elite Pack', 200, 200, 40, false, 4)
ON CONFLICT DO NOTHING;

-- Update bookings table to use credits
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS credits_cost integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancellation_deadline timestamp;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamp;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancelled_by text;

-- Update coach_profiles to use credits pricing
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS credits_per_hour integer DEFAULT 45 CHECK (credits_per_hour >= 10 AND credits_per_hour <= 500);

-- Backfill credits_per_hour from existing price_per_hour
UPDATE public.coach_profiles 
SET credits_per_hour = COALESCE(price_per_hour, 45)
WHERE credits_per_hour IS NULL;

-- Add admin role to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'candidate' CHECK (role IN ('candidate', 'coach', 'admin'));

-- Initialize credits balance for all existing users
INSERT INTO public.user_credits (user_id, balance, total_purchased)
SELECT id, 100, 100 FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credits_escrow_booking_id ON public.credits_escrow(booking_id);
CREATE INDEX IF NOT EXISTS idx_credits_escrow_status ON public.credits_escrow(status);
CREATE INDEX IF NOT EXISTS idx_cancellations_booking_id ON public.cancellations(booking_id);
CREATE INDEX IF NOT EXISTS idx_coach_strikes_coach_id ON public.coach_strikes(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_strikes_expires_at ON public.coach_strikes(expires_at);

-- Row Level Security Policies

-- user_credits policies
DROP POLICY IF EXISTS "Users can view their own credits" ON public.user_credits;
CREATE POLICY "Users can view their own credits" ON public.user_credits
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all credits" ON public.user_credits;
CREATE POLICY "Admins can view all credits" ON public.user_credits
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- credit_transactions policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view their own transactions" ON public.credit_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.credit_transactions;
CREATE POLICY "Admins can view all transactions" ON public.credit_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- credits_escrow policies
DROP POLICY IF EXISTS "Users can view escrow for their bookings" ON public.credits_escrow;
CREATE POLICY "Users can view escrow for their bookings" ON public.credits_escrow
  FOR SELECT TO authenticated
  USING (auth.uid() = candidate_id OR auth.uid() = coach_id);

-- cancellations policies
DROP POLICY IF EXISTS "Users can view cancellations for their bookings" ON public.cancellations;
CREATE POLICY "Users can view cancellations for their bookings" ON public.cancellations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = cancellations.booking_id 
      AND (b.candidate_id = auth.uid() OR b.coach_id = auth.uid())
    )
  );

-- coach_strikes policies
DROP POLICY IF EXISTS "Coaches can view their own strikes" ON public.coach_strikes;
CREATE POLICY "Coaches can view their own strikes" ON public.coach_strikes
  FOR SELECT TO authenticated
  USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Anyone can view strike counts" ON public.coach_strikes;
CREATE POLICY "Anyone can view strike counts" ON public.coach_strikes
  FOR SELECT TO authenticated
  USING (true);

-- credit_packages policies
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.credit_packages;
CREATE POLICY "Anyone can view active packages" ON public.credit_packages
  FOR SELECT TO authenticated
  USING (active = true);

-- Enable Row Level Security
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_strikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

-- Function to update credits balance timestamp
CREATE OR REPLACE FUNCTION update_credits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_credits_timestamp ON public.user_credits;
CREATE TRIGGER update_user_credits_timestamp
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_credits_timestamp();

-- Function to calculate coach cancellation rate
CREATE OR REPLACE FUNCTION get_coach_cancellation_rate(coach_uuid uuid, days integer DEFAULT 30)
RETURNS numeric AS $$
  SELECT CASE 
    WHEN total_count = 0 THEN 0
    ELSE ROUND((cancelled_count::numeric / total_count::numeric) * 100, 2)
  END
  FROM (
    SELECT 
      COUNT(*) FILTER (WHERE status IN ('completed', 'cancelled')) as total_count,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM public.cancellations c 
          WHERE c.booking_id = b.id AND c.cancelled_by = 'coach'
        )
      ) as cancelled_count
    FROM public.bookings b
    WHERE b.coach_id = coach_uuid
      AND b.scheduled_at >= now() - (days * interval '1 day')
  ) counts;
$$ LANGUAGE sql STABLE;

-- Function to get active coach strikes count
CREATE OR REPLACE FUNCTION get_active_strikes_count(coach_uuid uuid)
RETURNS integer AS $$
  SELECT COUNT(*)::integer
  FROM public.coach_strikes
  WHERE coach_id = coach_uuid
    AND resolved = false
    AND expires_at > now();
$$ LANGUAGE sql STABLE;

-- Comments for documentation
COMMENT ON TABLE public.user_credits IS 'Stores credit balance for each user';
COMMENT ON TABLE public.credit_transactions IS 'Tracks all credit movements (purchases, spending, refunds, earnings)';
COMMENT ON TABLE public.credits_escrow IS 'Holds credits during active sessions until completion';
COMMENT ON TABLE public.cancellations IS 'Tracks all booking cancellations with reasons and refund status';
COMMENT ON TABLE public.coach_strikes IS 'Tracks coach violations and penalties';
COMMENT ON TABLE public.credit_packages IS 'Configurable credit packages for purchase';
