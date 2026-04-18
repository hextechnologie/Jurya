export type CreditTransactionType = 
  | 'purchase' 
  | 'spent' 
  | 'refund' 
  | 'earned' 
  | 'withdrawn' 
  | 'bonus' 
  | 'admin_adjustment'

export type EscrowStatus = 'held' | 'released' | 'refunded'

export type CancelledBy = 'coach' | 'candidate' | 'admin'

export type RefundStatus = 'full' | 'none' | 'partial'

export type StrikeType = 'cancellation' | 'behavior' | 'quality' | 'other'

export interface UserCredits {
  id: string
  user_id: string
  balance: number
  total_purchased: number
  total_spent: number
  total_earned: number
  total_withdrawn: number
  created_at: string
  updated_at: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  type: CreditTransactionType
  amount: number
  balance_after: number
  description: string | null
  booking_id: string | null
  stripe_payment_id: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface CreditsEscrow {
  id: string
  booking_id: string
  candidate_id: string
  coach_id: string
  total_credits: number
  platform_fee: number
  coach_earnings: number
  status: EscrowStatus
  released_at: string | null
  created_at: string
}

export interface Cancellation {
  id: string
  booking_id: string
  cancelled_by: CancelledBy
  reason_category: string | null
  reason_detail: string | null
  hours_before_session: number | null
  refund_amount: number
  refund_status: RefundStatus | null
  cancelled_at: string
}

export interface CoachStrike {
  id: string
  coach_id: string
  reason: string
  booking_id: string | null
  strike_type: StrikeType
  expires_at: string
  resolved: boolean
  created_at: string
}

export interface CreditPackage {
  id: string
  name: string
  price_usd: number
  base_credits: number
  bonus_credits: number
  total_credits: number
  is_popular: boolean
  display_order: number
  active: boolean
  created_at: string
}

export interface CreditRechargeRequest {
  package_id?: string
  custom_amount?: number
  payment_method_id: string
}

export interface CreditBalance {
  balance: number
  status: 'healthy' | 'low' | 'critical'
  color: 'blue' | 'yellow' | 'red'
}

export const getCreditBalanceStatus = (balance: number): CreditBalance => {
  if (balance >= 50) {
    return { balance, status: 'healthy', color: 'blue' }
  } else if (balance >= 20) {
    return { balance, status: 'low', color: 'yellow' }
  } else {
    return { balance, status: 'critical', color: 'red' }
  }
}

export const CANCELLATION_REASONS = {
  PERSONAL_EMERGENCY: '🏥 Personal emergency / Health issue',
  TECHNICAL_PROBLEM: '🔧 Technical problem (internet, equipment)',
  SCHEDULING_CONFLICT: '📅 Scheduling conflict',
  UNEXPECTED_TRAVEL: '🌍 Unexpected travel',
  OTHER: 'Other (please specify)',
} as const

export const PLATFORM_FEE_PERCENTAGE = 20
export const MIN_COACH_WITHDRAWAL = 50
export const FREE_CANCELLATION_HOURS = 48
export const STRIKE_REVIEW_THRESHOLD = 3
export const STRIKE_SUSPENSION_THRESHOLD = 5
export const STRIKE_EXPIRY_DAYS = 30
