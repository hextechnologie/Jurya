import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    interviews: 3,
    features: ['3 interviews per month', 'Basic feedback', 'Limited roles'],
  },
  basic: {
    name: 'Basic',
    price: 9,
    priceId: process.env.STRIPE_BASIC_PRICE_ID!,
    interviews: 20,
    features: ['20 interviews per month', 'Detailed AI feedback', 'All job roles', 'Progress tracking'],
  },
  pro: {
    name: 'Pro',
    price: 19,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    interviews: 999999,
    features: ['Unlimited interviews', 'Advanced AI feedback', 'All job roles', 'Priority support', 'Export reports'],
  },
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: {
      userId,
    },
  })

  return session.url!
}

export async function createPortalSession(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })

  return session.url
}
