import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          storage: {
            getItem: (key: string) => cookieStore.get(key)?.value ?? null,
            setItem: () => {},
            removeItem: () => {},
          },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check for existing Stripe Connect account
    const { data: coachProfile } = await supabaseAdmin
      .from('coach_profiles')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single()

    let accountId = coachProfile?.stripe_account_id

    // Create a new Stripe Connect account if none exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        metadata: { user_id: user.id },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })

      accountId = account.id

      // Save the Stripe account ID to coach_profiles
      await supabaseAdmin
        .from('coach_profiles')
        .upsert(
          { user_id: user.id, stripe_account_id: accountId },
          { onConflict: 'user_id' }
        )
    }

    // Generate the onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/coaching/onboarding?stripe=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/coaching/onboarding?stripe=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne'
    console.error('[stripe/connect]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
