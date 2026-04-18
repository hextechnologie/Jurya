import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { hasSufficientCredits, calculateCreditsDistribution } from '@/lib/credits'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { coachId, coachName, scheduledAt, durationMinutes, notes, creditsCost } = await request.json()

    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has sufficient credits
    const hasCredits = await hasSufficientCredits(user.id, creditsCost)
    if (!hasCredits) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    const candidateName = String(user.user_metadata?.full_name || '').trim() || 'Candidate'
    const coachDisplayName = String(coachName || '').trim() || 'Coach'

    // Calculate cancellation deadline (48 hours before session)
    const scheduledDate = new Date(scheduledAt)
    const cancellationDeadline = new Date(scheduledDate.getTime() - 48 * 60 * 60 * 1000)
    const cancellationDeadlineStr = cancellationDeadline.toISOString()

    // Create booking in database
    const baseBookingPayload = {
      candidate_id: user.id,
      coach_id: coachId,
      duration_minutes: durationMinutes,
      status: 'confirmed',
      notes: notes || null,
      scheduled_at: scheduledAt,
      credits_cost: creditsCost,
      cancellation_deadline: cancellationDeadlineStr,
      google_calendar_url: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Session with ${coachDisplayName}`)}&details=${encodeURIComponent(notes || 'Coaching session')}`,
    }

    let { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        ...baseBookingPayload,
        candidate_name_snapshot: candidateName,
        coach_name_snapshot: coachDisplayName,
      })
      .select()
      .single()

    if (bookingError && /candidate_name_snapshot|coach_name_snapshot/i.test(bookingError.message || '')) {
      const retry = await supabase
        .from('bookings')
        .insert(baseBookingPayload)
        .select()
        .single()
      booking = retry.data
      bookingError = retry.error
    }

    if (bookingError) {
      console.error('Booking creation error:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    const bookingId = booking.id
    const calendarUrl = booking.google_calendar_url

    // Calculate credits distribution (platform fee 20%, coach gets 80%)
    const { platformFee, coachEarnings } = calculateCreditsDistribution(creditsCost)

    // Get current balance and deduct credits atomically
    const { data: userCreditsData, error: fetchError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !userCreditsData) {
      console.error('Failed to fetch user credits:', fetchError)
      await supabase.from('bookings').delete().eq('id', bookingId)
      return NextResponse.json({ error: 'Failed to fetch credits balance' }, { status: 500 })
    }

    const newBalance = userCreditsData.balance - creditsCost

    if (newBalance < 0) {
      await supabase.from('bookings').delete().eq('id', bookingId)
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    // Update balance
    const { error: deductError } = await supabase
      .from('user_credits')
      .update({ balance: newBalance })
      .eq('user_id', user.id)

    if (deductError) {
      console.error('Credits deduction error:', deductError)
      // Rollback booking
      await supabase.from('bookings').delete().eq('id', bookingId)
      return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 })
    }

    // Create credit transaction record
    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      credits: -creditsCost,
      transaction_type: 'spent',
      description: `Booked ${durationMinutes}min session with ${coachDisplayName}`,
      booking_id: bookingId,
    })

    // Place credits in escrow
    await supabase.from('credits_escrow').insert({
      booking_id: bookingId,
      coach_id: coachId,
      candidate_id: user.id,
      total_credits: creditsCost,
      platform_fee: platformFee,
      coach_earnings: coachEarnings,
      status: 'held',
    })

    // Send notification to coach
    await supabase.from('notifications').insert({
      user_id: coachId,
      title: 'New booking request',
      message: `${candidateName} booked a ${durationMinutes}-minute session for ${scheduledAt}.`,
      type: 'booking',
      read: false,
    })

    // Update earnings record
    await supabase.from('earnings').insert({
      coach_id: coachId,
      booking_id: bookingId,
      gross_amount: creditsCost,
      platform_fee: platformFee,
      net_amount: coachEarnings,
      status: 'pending',
    })

    // Send confirmation email
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Interview Coach <onboarding@resend.dev>',
        to: [user.email || 'candidate@example.com'],
        subject: `Booking confirmed with ${coachName}`,
        html: `<p>Your ${durationMinutes}-minute session with ${coachName} is booked for ${scheduledAt}.</p><p>Cost: ${creditsCost} credits</p><p>Notes: ${notes || 'None'}</p><p>You can cancel for a full refund up to 48 hours before your session.</p>`,
      })
    }

    return NextResponse.json({ bookingId, calendarUrl, message: 'Booking created successfully' })
  } catch (error: any) {
    console.error('Booking checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}