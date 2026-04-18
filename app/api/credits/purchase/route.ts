import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { package_id, custom_amount } = body

    let credits = 0
    let amount_usd = 0
    let bonus_credits = 0
    let description = ''

    if (package_id) {
      // Fetch package details
      const { data: pkg, error: pkgError } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('id', package_id)
        .eq('active', true)
        .single()

      if (pkgError || !pkg) {
        return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
      }

      credits = pkg.total_credits
      amount_usd = pkg.price_usd
      bonus_credits = pkg.bonus_credits
      description = pkg.name
    } else if (custom_amount && custom_amount >= 10) {
      // Custom amount (1:1 ratio, no bonus)
      credits = custom_amount
      amount_usd = custom_amount
      description = 'Custom Credit Purchase'
    } else {
      return NextResponse.json({ error: 'Invalid purchase request' }, { status: 400 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email || profile?.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: description,
              description: `${credits} credits${bonus_credits > 0 ? ` (${credits - bonus_credits} + ${bonus_credits} bonus)` : ''}`,
              images: ['https://your-domain.com/credits-icon.png'], // Optional: add your logo
            },
            unit_amount: amount_usd * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/credits?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/credits?cancelled=true`,
      metadata: {
        user_id: user.id,
        credits: credits.toString(),
        bonus_credits: bonus_credits.toString(),
        type: 'credit_purchase',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Credit purchase error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process purchase' },
      { status: 500 }
    )
  }
}
