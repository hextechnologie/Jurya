'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Button, Card, Badge } from '@/components/ui'
import { Sparkles, Check, X } from 'lucide-react'
import Link from 'next/link'

const PLANS = [
  {
    name: 'Gratuit',
    monthlyPrice: 0,
    annualPrice: 0,
    interviews: 3,
    priceId: { monthly: null, annual: null },
    tier: 'free',
    features: [
      '3 simulations par mois',
      'Feedback IA basique',
      'Concours limités',
      'Suivi des scores',
    ],
    comparison: {
      interviews: '3/mois',
      feedback: 'Basique',
      roles: 'Limité',
      analytics: false,
      history: '7 jours',
      export: false,
      support: 'Communauté',
      custom: false,
    },
  },
  {
    name: 'Essentiel',
    monthlyPrice: 9,
    annualPrice: 7,
    interviews: 20,
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || 'price_basic_monthly',
      annual: process.env.NEXT_PUBLIC_STRIPE_BASIC_ANNUAL_PRICE_ID || 'price_basic_annual',
    },
    tier: 'basic',
    features: [
      '20 simulations par mois',
      'Feedback IA détaillé',
      'Tous les concours',
      'Suivi de progression',
      'Historique des sessions',
      'Support par email',
    ],
    comparison: {
      interviews: '20/mois',
      feedback: 'Détaillé',
      roles: 'Tous',
      analytics: 'Basique',
      history: '30 jours',
      export: false,
      support: 'Email',
      custom: false,
    },
  },
  {
    name: 'Pro',
    monthlyPrice: 19,
    annualPrice: 15,
    interviews: '∞',
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID || 'price_pro_annual',
    },
    tier: 'pro',
    popular: true,
    features: [
      'Simulations illimitées',
      'Feedback IA avancé',
      'Tous les concours',
      'Analytiques détaillées',
      'Export de rapports (PDF)',
      'Support prioritaire',
      "Scénarios d'oral personnalisés",
    ],
    comparison: {
      interviews: 'Illimité',
      feedback: 'Avancé',
      roles: 'Tous',
      analytics: 'Détaillé',
      history: 'Illimité',
      export: 'PDF',
      support: 'Prioritaire',
      custom: true,
    },
  },
  {
    name: 'Équipe',
    monthlyPrice: 49,
    annualPrice: 39,
    interviews: '∞',
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID || 'price_team_monthly',
      annual: process.env.NEXT_PUBLIC_STRIPE_TEAM_ANNUAL_PRICE_ID || 'price_team_annual',
    },
    tier: 'team',
    features: [
      'Tout le plan Pro inclus',
      "5 membres d'équipe",
      "Tableau de bord d'équipe",
      'Planification de simulations en lot',
      'Accès API',
      'Gestionnaire de compte dédié',
      'Image de marque personnalisée',
    ],
    comparison: {
      interviews: 'Illimité',
      feedback: 'Avancé',
      roles: 'Tous + Personnalisés',
      analytics: 'Tableau de bord',
      history: 'Illimité',
      export: 'PDF + CSV',
      support: 'Dédié',
      custom: true,
    },
  },
]

export default function PricingPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  const handleSubscribe = async (priceId: string | null, tier: string) => {
    if (!user) {
      router.push('/signup')
      return
    }

    if (!priceId) {
      return // Free plan, no action needed
    }

    setLoading(tier)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    if (!profile?.stripe_customer_id) return

    setLoading('manage')

    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
    } finally {
      setLoading(null)
    }
  }

  const getPrice = (plan: typeof PLANS[0]) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice
  }

  const getPriceId = (plan: typeof PLANS[0]) => {
    return plan.priceId[billingCycle] || null
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-background to-background" />

      <header className="border-b border-border bg-card/50 backdrop-blur relative z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">Jurya</span>
            </Link>
            {user && (
              <Link href="/dashboard">
                <Button variant="outline">Retour au tableau de bord</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-16 relative z-10">

        {/* ── CHOOSE YOUR PATH ── */}
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-semibold mb-2">CHOISISSEZ VOTRE FORMULE</p>
          <h1 className="text-5xl font-bold mb-4">Deux façons de se préparer</h1>
          <p className="text-xl text-gray-400 mb-10">Utilisez l'IA, travaillez avec un vrai membre de jury, ou combinez les deux.</p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* AI Plans */}
            <div className="glass rounded-2xl p-8 border border-primary/30 text-left">
              <div className="text-4xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold mb-2">Formules Simulation IA</h2>
              <p className="text-gray-400 mb-4 text-sm">Simulations d'oral illimitées, feedback instantané et suivi des scores. Choisissez la formule adaptée à votre rythme.</p>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>✓ 3 simulations gratuites par mois — pour toujours</li>
                <li>✓ Passez à l'illimité pour plus de pratique</li>
                <li>✓ Disponible 24h/24, sur tous les appareils</li>
              </ul>
              <p className="text-xs text-gray-500">Voir les formules ci-dessous ↓</p>
            </div>

            {/* Coach Sessions */}
            <div className="glass rounded-2xl p-8 border border-green-500/30 text-left">
              <div className="text-4xl mb-4">👨‍💼</div>
              <h2 className="text-2xl font-bold mb-2">Sessions avec un membre de jury</h2>
              <p className="text-gray-400 mb-4 text-sm">Réservez un entretien individuel avec un véritable membre de jury expérimenté. Paiement à la séance — sans abonnement.</p>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>✓ 30 min — à partir de <span className="text-green-400 font-semibold">15 €</span></li>
                <li>✓ 60 min — à partir de <span className="text-green-400 font-semibold">30 €</span></li>
                <li>✓ 90 min — à partir de <span className="text-green-400 font-semibold">50 €</span></li>
              </ul>
              <Link href="/coaches">
                <Button variant="outline" fullWidth className="border-green-500/40 text-green-400 hover:border-green-500 gap-2">Trouver un membre de jury →</Button>
              </Link>
            </div>
          </div>

          <p className="text-sm text-purple-400 mt-6">
            💡 Les membres Pro bénéficient de <strong>10 % de réduction</strong> sur toutes les sessions avec un membre de jury.
          </p>
        </div>

        {/* ── AI PLANS (existing billing toggle + cards) ── */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">🤖 Formules Simulation IA</h2>
          <p className="text-gray-400 mb-8">Choisissez la formule qui correspond à votre rythme de préparation.</p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
              Mensuel
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                billingCycle === 'annual' ? 'bg-primary' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${billingCycle === 'annual' ? 'text-white' : 'text-gray-400'}`}>
              Annuel
            </span>
            {billingCycle === 'annual' && (
              <Badge variant="success" className="ml-2">Économisez avec le paiement annuel</Badge>
            )}
          </div>
        </div>

        {profile && profile.subscription_tier !== 'free' && (
          <div className="max-w-2xl mx-auto mb-12">
            <Card className="bg-primary/5 border-primary/30 text-center p-6">
              <p className="text-lg mb-4">
                Vous êtes actuellement sur la formule <strong className="text-primary">{profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)}</strong>
              </p>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  loading={loading === 'manage'}
                >
                  Gérer l'abonnement
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
          {PLANS.map((plan) => (
            <Card
              key={plan.tier}
              className={`relative p-6 ${
                plan.popular 
                  ? 'bg-gradient-to-br from-primary/10 to-secondary/10 border-primary shadow-xl shadow-primary/20 transform scale-105' 
                  : 'glass'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 animate-pulse">
                  <Badge variant="success">Le plus populaire</Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold gradient-text">{getPrice(plan)} €</span>
                  <span className="text-gray-400 text-sm">/mois</span>
                </div>
                {billingCycle === 'annual' && plan.monthlyPrice > 0 && (
                  <p className="text-xs text-green-400">
                    facturé annuellement au tarif réduit
                  </p>
                )}
                <p className="text-gray-400 mt-2 text-sm">{plan.interviews} simulations</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-center">
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  className="min-w-[180px] justify-center"
                  onClick={() => handleSubscribe(getPriceId(plan), plan.tier)}
                  loading={loading === plan.tier}
                  disabled={profile?.subscription_tier === plan.tier}
                >
                  {profile?.subscription_tier === plan.tier
                    ? 'Formule actuelle'
                    : plan.monthlyPrice === 0
                    ? 'Commencer gratuitement'
                    : "S'abonner"}
                </Button>
              </div>

              {plan.monthlyPrice > 0 && (
                <p className="mt-3 text-center text-xs text-green-400">
                  Garantie satisfait ou remboursé 30 jours
                </p>
              )}
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Comparer les fonctionnalités</h2>
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-semibold">Fonctionnalité</th>
                    {PLANS.map(plan => (
                      <th key={plan.tier} className="p-4 font-semibold text-center">
                        {plan.name}
                        {plan.popular && <div className="text-xs text-primary font-normal mt-1">Populaire</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50 hover:bg-white/5">
                    <td className="p-4 text-gray-300">Simulations mensuelles</td>
                    {PLANS.map(plan => (
                      <td key={plan.tier} className="p-4 text-center">{plan.comparison.interviews}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-white/5">
                    <td className="p-4 text-gray-300">Qualité du feedback IA</td>
                    {PLANS.map(plan => (
                      <td key={plan.tier} className="p-4 text-center">{plan.comparison.feedback}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-white/5">
                    <td className="p-4 text-gray-300">Concours disponibles</td>
                    {PLANS.map(plan => (
                      <td key={plan.tier} className="p-4 text-center">{plan.comparison.roles}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-white/5">
                    <td className="p-4 text-gray-300">Analytiques</td>
                    {PLANS.map(plan => (
                      <td key={plan.tier} className="p-4 text-center">
                        {plan.comparison.analytics ? (
                          typeof plan.comparison.analytics === 'string' ? plan.comparison.analytics : <Check className="w-5 h-5 text-green-400 inline" />
                        ) : (
                          <X className="w-5 h-5 text-gray-600 inline" />
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-white/5">
                    <td className="p-4 text-gray-300">Historique des sessions</td>
                    {PLANS.map(plan => (
                      <td key={plan.tier} className="p-4 text-center">{plan.comparison.history}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-white/5">
                    <td className="p-4 text-gray-300">Export de rapports</td>
                    {PLANS.map(plan => (
                      <td key={plan.tier} className="p-4 text-center">
                        {plan.comparison.export ? plan.comparison.export : <X className="w-5 h-5 text-gray-600 inline" />}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-white/5">
                    <td className="p-4 text-gray-300">Support</td>
                    {PLANS.map(plan => (
                      <td key={plan.tier} className="p-4 text-center">{plan.comparison.support}</td>
                    ))}
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="p-4 text-gray-300">Scénarios personnalisés</td>
                    {PLANS.map(plan => (
                      <td key={plan.tier} className="p-4 text-center">
                        {plan.comparison.custom ? (
                          <Check className="w-5 h-5 text-green-400 inline" />
                        ) : (
                          <X className="w-5 h-5 text-gray-600 inline" />
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">FAQ Tarifs</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <h3 className="font-semibold mb-2">Puis-je annuler à tout moment ?</h3>
                <p className="text-sm text-gray-400">Oui. Vous pouvez annuler ou changer de formule quand vous le souhaitez depuis votre espace de facturation.</p>
              </Card>
              <Card>
                <h3 className="font-semibold mb-2">Proposez-vous des remboursements ?</h3>
                <p className="text-sm text-gray-400">Oui. Chaque formule payante inclut une garantie satisfait ou remboursé de 30 jours.</p>
              </Card>
              <Card>
                <h3 className="font-semibold mb-2">Que se passe-t-il quand je passe à une formule supérieure ?</h3>
                <p className="text-sm text-gray-400">Vos limites de simulations et fonctionnalités premium sont mises à jour automatiquement après le paiement.</p>
              </Card>
              <Card>
                <h3 className="font-semibold mb-2">Puis-je passer du mensuel à l'annuel ?</h3>
                <p className="text-sm text-gray-400">Absolument. Vous pouvez changer de rythme de facturation quand cela vous convient.</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
