import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { isFreeCancellation } from '@/lib/credits'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { bookingId, reason, reasonDetail } = await request.json()

    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, coach_profiles!inner(user_id)')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if user is authorized to cancel
    const isCoach = booking.coach_id === user.id
    const isCandidate = booking.candidate_id === user.id

    if (!isCoach && !isCandidate) {
      return NextResponse.json({ error: 'Not authorized to cancel this booking' }, { status: 403 })
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking already cancelled' }, { status: 400 })
    }

    // Calculate hours before session
    const scheduledAt = new Date(booking.scheduled_at)
    const now = new Date()
    const hoursBeforeSession = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Get escrow record
    const { data: escrow } = await supabase
      .from('credits_escrow')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (!escrow) {
      return NextResponse.json({ error: 'No escrow record found' }, { status: 404 })
    }

    const creditsCost = booking.credits_cost || 0
    let refundAmount = 0
    let refundStatus: 'full' | 'none' | 'partial' = 'none'
    let strikeIssued = false

    // COACH CANCELLATION
    if (isCoach) {
      // Coach always gives full refund to candidate
      refundAmount = creditsCost
      refundStatus = 'full'

      // Issue strike to coach
      await supabase.from('coach_strikes').insert({
        coach_id: user.id,
        reason: reasonDetail || 'Coach cancelled booking',
        booking_id: bookingId,
        strike_type: 'cancellation',
      })
      strikeIssued = true

      // Refund credits to candidate
      const { data: candidateCredits } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', booking.candidate_id)
        .single()

      const newCandidateBalance = (candidateCredits?.balance || 0) + refundAmount

      await supabase
        .from('user_credits')
        .update({ balance: newCandidateBalance })
        .eq('user_id', booking.candidate_id)

      // Record refund transaction
      await supabase.from('credit_transactions').insert({
        user_id: booking.candidate_id,
        type: 'refund',
        amount: refundAmount,
        balance_after: 0, // Will be updated by trigger
        description: `Refund: Coach cancelled ${booking.duration_minutes}min session`,
        booking_id: bookingId,
      })

      // Update escrow status
      await supabase
        .from('credits_escrow')
        .update({ status: 'refunded' })
        .eq('booking_id', bookingId)
    }
    // CANDIDATE CANCELLATION
    else if (isCandidate) {
      const isFree = isFreeCancellation(new Date(booking.scheduled_at))

      if (isFree) {
        // Free cancellation: full refund
        refundAmount = creditsCost
        refundStatus = 'full'

        // Refund credits to candidate
        const { data: userCredits } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('user_id', user.id)
          .single()

        const newBalance = (userCredits?.balance || 0) + refundAmount

        await supabase
          .from('user_credits')
          .update({ balance: newBalance })
          .eq('user_id', user.id)

        // Record refund transaction
        await supabase.from('credit_transactions').insert({
          user_id: user.id,
          type: 'refund',
          amount: refundAmount,
          balance_after: 0,
          description: `Refund: Cancelled ${booking.duration_minutes}min session (free cancellation)`,
          booking_id: bookingId,
        })

        // Update escrow status
        await supabase
          .from('credits_escrow')
          .update({ status: 'refunded' })
          .eq('booking_id', bookingId)
      } else {
        // Late cancellation: no refund, credits go to coach
        refundAmount = 0
        refundStatus = 'none'

        // Release credits to coach
        const { data: coachCredits } = await supabase
          .from('user_credits')
          .select('balance, total_earned')
          .eq('user_id', booking.coach_id)
          .single()

        const newCoachBalance = (coachCredits?.balance || 0) + escrow.coach_earnings
        const newTotalEarned = (coachCredits?.total_earned || 0) + escrow.coach_earnings

        await supabase
          .from('user_credits')
          .update({ 
            balance: newCoachBalance,
            total_earned: newTotalEarned
          })
          .eq('user_id', booking.coach_id)

        // Record coach earnings
        await supabase.from('credit_transactions').insert({
          user_id: booking.coach_id,
          type: 'earned',
          amount: escrow.coach_earnings,
          balance_after: 0,
          description: `Earned: Candidate late cancellation (${booking.duration_minutes}min session)`,
          booking_id: bookingId,
        })

        // Update escrow status
        await supabase
          .from('credits_escrow')
          .update({ status: 'released', released_at: new Date().toISOString() })
          .eq('booking_id', bookingId)

        // Update earnings record
        await supabase
          .from('earnings')
          .update({ status: 'completed' })
          .eq('booking_id', bookingId)
      }
    }

    // Create cancellation record
    await supabase.from('cancellations').insert({
      booking_id: bookingId,
      cancelled_by: isCoach ? 'coach' : 'candidate',
      reason_category: reason,
      reason_detail: reasonDetail,
      hours_before_session: hoursBeforeSession,
      refund_amount: refundAmount,
      refund_status: refundStatus,
    })

    // Update booking status
    await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: isCoach ? 'coach' : 'candidate'
      })
      .eq('id', bookingId)

    // Send notification
    const recipientId = isCoach ? booking.candidate_id : booking.coach_id
    const recipientName = isCoach ? booking.candidate_name_snapshot : booking.coach_name_snapshot
    const cancellor = isCoach ? 'coach' : 'candidate'

    await supabase.from('notifications').insert({
      user_id: recipientId,
      title: 'Booking cancelled',
      message: `Your session has been cancelled by the ${cancellor}. ${refundAmount > 0 ? `${refundAmount} credits refunded.` : ''}`,
      type: 'booking',
      read: false,
    })

    // Send email notification
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', recipientId)
        .single()

      if (recipientProfile?.email) {
        await resend.emails.send({
          from: 'Interview Coach <onboarding@resend.dev>',
          to: [recipientProfile.email],
          subject: 'Booking Cancelled',
          html: `
            <p>Your ${booking.duration_minutes}-minute session scheduled for ${booking.scheduled_at} has been cancelled by the ${cancellor}.</p>
            ${refundAmount > 0 ? `<p>✅ ${refundAmount} credits have been refunded to your account.</p>` : ''}
            ${strikeIssued ? `<p>⚠️ A strike has been issued to the coach for this cancellation.</p>` : ''}
            <p>Reason: ${reasonDetail || 'No reason provided'}</p>
          `,
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      refundAmount,
      refundStatus,
      message: refundAmount > 0 ? `${refundAmount} credits refunded` : 'Cancellation processed'
    })
  } catch (error: any) {
    console.error('Cancellation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
