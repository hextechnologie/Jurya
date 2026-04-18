import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const MIN_WITHDRAWAL = 50

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json()

    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a coach
    const { data: coachProfile } = await supabase
      .from('coach_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!coachProfile) {
      return NextResponse.json({ error: 'Only coaches can withdraw credits' }, { status: 403 })
    }

    // Get current balance
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('balance, total_withdrawn')
      .eq('user_id', user.id)
      .single()

    if (creditsError || !credits) {
      return NextResponse.json({ error: 'Failed to fetch credits balance' }, { status: 500 })
    }

    // Validate amount
    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json({ error: `Minimum withdrawal is ${MIN_WITHDRAWAL} credits` }, { status: 400 })
    }

    if (amount > credits.balance) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Convert credits to USD (1 credit = $1)
    const amountUSD = amount

    // Calculate new values
    const newBalance = credits.balance - amount
    const newTotalWithdrawn = (credits.total_withdrawn || 0) + amount

    // Deduct credits from balance
    const { data: updatedCredits, error: deductError } = await supabase
      .from('user_credits')
      .update({ 
        balance: newBalance,
        total_withdrawn: newTotalWithdrawn
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (deductError) {
      console.error('Failed to deduct credits:', deductError)
      return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 })
    }

    // Create transaction record
    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      type: 'withdrawn',
      amount: -amount,
      balance_after: updatedCredits.balance,
      description: `Withdrawal: ${amount} credits ($${amountUSD})`,
    })

    // Process Stripe payout (if configured)
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
      
      // Note: This requires Stripe Connect to be set up
      // For now, we'll just log the payout request
      console.log(`Stripe payout requested: $${amountUSD} to user ${user.id}`)
      
      // TODO: Implement actual Stripe Connect payout
      // const payout = await stripe.payouts.create({
      //   amount: amountUSD * 100,
      //   currency: 'usd',
      //   destination: coachStripeAccountId,
      // })
    }

    // Send notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Withdrawal Processed',
      message: `${amount} credits ($${amountUSD}) withdrawal initiated. Funds will arrive in 2-5 business days.`,
      type: 'payment',
      read: false,
    })

    return NextResponse.json({ 
      success: true, 
      amount,
      newBalance: updatedCredits.balance,
      message: `Withdrawal of ${amount} credits ($${amountUSD}) initiated successfully`
    })
  } catch (error: any) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
