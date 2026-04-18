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

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata
        const userId = metadata?.user_id || metadata?.userId

        if (!userId) break

        // Check if this is a credit purchase
        if (metadata?.type === 'credit_purchase') {
          const credits = parseInt(metadata.credits || '0')
          const bonusCredits = parseInt(metadata.bonus_credits || '0')
          const amountPaid = session.amount_total ? session.amount_total / 100 : 0

          if (credits > 0) {
            // Get current credits
            const { data: currentCredits } = await supabase
              .from('user_credits')
              .select('balance, total_purchased')
              .eq('user_id', userId)
              .single()

            const newBalance = (currentCredits?.balance || 0) + credits
            const newTotalPurchased = (currentCredits?.total_purchased || 0) + credits

            // Update credits balance
            await supabase
              .from('user_credits')
              .upsert({
                user_id: userId,
                balance: newBalance,
                total_purchased: newTotalPurchased,
                updated_at: new Date().toISOString(),
              })

            // Record transaction
            await supabase.from('credit_transactions').insert({
              user_id: userId,
              type: 'purchase',
              amount: credits,
              balance_after: newBalance,
              description: `Purchased ${credits} credits${bonusCredits > 0 ? ` (includes ${bonusCredits} bonus)` : ''}`,
              stripe_payment_id: session.payment_intent as string,
              metadata: {
                session_id: session.id,
                amount_paid: amountPaid,
                bonus_credits: bonusCredits,
              },
            })

            // Send notification
            await supabase.from('notifications').insert({
              user_id: userId,
              title: 'Credits Added Successfully',
              message: `💳 ${credits} credits have been added to your account${bonusCredits > 0 ? ` (${credits - bonusCredits} + ${bonusCredits} bonus)` : ''}!`,
              type: 'credit_purchase',
              read: false,
            })
          }
        } else if (session.subscription) {
          // Original subscription handling
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          const priceId = subscription.items.data[0].price.id
          let tier = 'basic'
          let interviewsLimit = 20

          if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
            tier = 'pro'
            interviewsLimit = 999999
          }

          await supabase
            .from('profiles')
            .update({
              subscription_tier: tier,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              interviews_limit: interviewsLimit,
            })
            .eq('id', userId)

          await supabase.from('subscription_history').insert({
            user_id: userId,
            subscription_tier: tier,
            stripe_subscription_id: session.subscription as string,
            status: 'active',
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (profile) {
          const status = subscription.status
          if (status === 'canceled' || status === 'incomplete_expired') {
            await supabase
              .from('profiles')
              .update({
                subscription_tier: 'free',
                interviews_limit: 3,
              })
              .eq('id', profile.id)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              subscription_tier: 'free',
              stripe_subscription_id: null,
              interviews_limit: 3,
            })
            .eq('id', profile.id)

          await supabase
            .from('subscription_history')
            .update({ status: 'canceled', ended_at: new Date().toISOString() })
            .eq('stripe_subscription_id', subscription.id)
            .eq('status', 'active')
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
