import { supabase } from './supabase'
import type { CreditTransactionType, UserCredits, CreditTransaction, CreditPackage } from './types/credits'
import { PLATFORM_FEE_PERCENTAGE } from './types/credits'

/**
 * Get user's credit balance
 */
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user credits:', error)
    return null
  }

  return data
}

/**
 * Get credit balance only (lightweight)
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching credit balance:', error)
    return 0
  }

  return data?.balance || 0
}

/**
 * Get credit transactions history
 */
export async function getCreditTransactions(
  userId: string,
  type?: CreditTransactionType,
  limit = 50
): Promise<CreditTransaction[]> {
  let query = supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching credit transactions:', error)
    return []
  }

  return data || []
}

/**
 * Get available credit packages
 */
export async function getCreditPackages(): Promise<CreditPackage[]> {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching credit packages:', error)
    return []
  }

  return data || []
}

/**
 * Calculate credits cost for a session
 */
export function calculateSessionCreditsCost(
  creditsPerHour: number,
  durationMinutes: number
): number {
  return Math.ceil((creditsPerHour * durationMinutes) / 60)
}

/**
 * Calculate platform fee and coach earnings
 */
export function calculateCreditsDistribution(totalCredits: number): {
  platformFee: number
  coachEarnings: number
} {
  const platformFee = Math.ceil((totalCredits * PLATFORM_FEE_PERCENTAGE) / 100)
  const coachEarnings = totalCredits - platformFee

  return { platformFee, coachEarnings }
}

/**
 * Check if user has sufficient credits
 */
export async function hasSufficientCredits(
  userId: string,
  requiredCredits: number
): Promise<boolean> {
  const balance = await getCreditBalance(userId)
  return balance >= requiredCredits
}

/**
 * Calculate hours until session
 */
export function getHoursUntilSession(sessionDate: Date): number {
  const now = new Date()
  const diff = sessionDate.getTime() - now.getTime()
  return diff / (1000 * 60 * 60)
}

/**
 * Check if cancellation is free (48+ hours before)
 */
export function isFreeCancellation(sessionDate: Date): boolean {
  const hours = getHoursUntilSession(sessionDate)
  return hours >= 48
}

/**
 * Calculate cancellation deadline (48 hours before session)
 */
export function getCancellationDeadline(sessionDate: Date): Date {
  const deadline = new Date(sessionDate)
  deadline.setHours(deadline.getHours() - 48)
  return deadline
}

/**
 * Format credits with icon
 */
export function formatCredits(amount: number, showIcon = true): string {
  const icon = showIcon ? '💳 ' : ''
  return `${icon}${amount} credit${amount !== 1 ? 's' : ''}`
}

/**
 * Get credit balance color based on amount
 */
export function getCreditBalanceColor(balance: number): {
  textColor: string
  bgColor: string
  borderColor: string
} {
  if (balance >= 50) {
    return {
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    }
  } else if (balance >= 20) {
    return {
      textColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    }
  } else {
    return {
      textColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    }
  }
}

/**
 * Subscribe to real-time credit balance updates
 */
export function subscribeToCreditsUpdates(
  userId: string,
  callback: (credits: UserCredits) => void
) {
  const channel = supabase
    .channel(`credits:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_credits',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as UserCredits)
      }
    )
    .subscribe()

  return channel
}

/**
 * Get coach active strikes count
 */
export async function getCoachActiveStrikesCount(coachId: string): Promise<number> {
  const { count, error } = await supabase
    .from('coach_strikes')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', coachId)
    .eq('resolved', false)
    .gt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error fetching coach strikes:', error)
    return 0
  }

  return count || 0
}

/**
 * Get coach cancellation rate
 */
export async function getCoachCancellationRate(coachId: string, days = 30): Promise<number> {
  const { data, error } = await supabase.rpc('get_coach_cancellation_rate', {
    coach_uuid: coachId,
    days,
  })

  if (error) {
    console.error('Error fetching cancellation rate:', error)
    return 0
  }

  return data || 0
}
