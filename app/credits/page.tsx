'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import CandidateNavbar from '@/components/CandidateNavbar'
import Link from 'next/link'
import { CheckCircle2, Zap, Star, ChevronLeft, AlertTriangle, Package } from 'lucide-react'

/* ─── Plan data ─── */
const PLANS = [
  {
    id: 'free', tier: 'free', name: 'Découverte', price: null, credits: 30, highlighted: false,
    features: ['30 crédits/mois offerts', 'Accès à tous les concours', 'Rapport IA après chaque simulation', 'Support communautaire'],
  },
  {
    id: 'basic', tier: 'basic', name: 'Essentiel', price: 19, credits: 60, highlighted: false,
    features: ['60 crédits/mois', 'Historique complet des rapports', 'Support email prioritaire'],
  },
  {
    id: 'pro', tier: 'pro', name: 'Intensif', price: 49, credits: 200, highlighted: true, badge: 'Le plus choisi',
    features: ['200 crédits/mois', 'Analyses comparatives multi-sessions', 'Support prioritaire', 'Accès anticipé aux nouveautés'],
  },
  {
    id: 'team', tier: 'team', name: 'Premium', price: 129, credits: 500, highlighted: false,
    features: ['500 crédits/mois', '1 session coaching/mois incluse', 'Support dédié 7j/7', 'Rapports PDF avancés'],
  },
]

const CREDIT_PACKS = [
  { id: 'pack_50', credits: 50, price: 15, highlighted: false, ppc: '0,30 €/crédit' },
  { id: 'pack_150', credits: 150, price: 39, highlighted: true, badge: 'Meilleur rapport qualité/prix', ppc: '0,26 €/crédit' },
  { id: 'pack_500', credits: 500, price: 99, highlighted: false, ppc: '0,20 €/crédit' },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(n)

/* ─── Purchase modal ─── */
function PurchaseModal({ label, price, productId, kind, onClose }: {
  label: string; price: number; productId: string; kind: 'plan' | 'pack'; onClose: () => void
}) {
  const [promo, setPromo] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const go = async () => {
    setLoading(true); setErr(null)
    try {
      const res = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: productId, amount: price, promo_code: promo.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Erreur.'); setLoading(false); return }
      if (data.url) window.location.href = data.url
    } catch { setErr('Impossible de contacter le serveur.'); setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-5">
        <h2 className="text-lg font-semibold text-white">Finaliser l&apos;achat</h2>
        <p className="text-gray-400 text-sm">{label}</p>
        <div className="flex justify-between bg-white/5 rounded-xl px-4 py-3">
          <span className="text-gray-300 text-sm">Total</span>
          <span className="text-white font-bold text-lg">{fmt(price)}</span>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wide">Code promo</label>
          <input value={promo} onChange={e => setPromo(e.target.value.toUpperCase())} placeholder="JURYA2025"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500" />
          {err && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{err}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition-colors">Annuler</button>
          <button onClick={go} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-60">
            {loading ? 'Redirection…' : 'Payer →'}
          </button>
        </div>
        <p className="text-gray-600 text-xs text-center">Paiement sécurisé via Stripe</p>
      </div>
    </div>
  )
}

/* ─── Main ─── */
export default function CreditsPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'abonnements' | 'packs'>('abonnements')
  const [modal, setModal] = useState<{ label: string; price: number; productId: string; kind: 'plan' | 'pack' } | null>(null)

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F1629' }}>
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) { router.push('/login'); return null }

  const available = Math.max(0, profile.interviews_limit - profile.interviews_used_this_month)
  const currentTier = profile.subscription_tier

  return (
    <div className="min-h-screen text-white" style={{ background: '#0F1629' }}>
      {modal && <PurchaseModal {...modal} onClose={() => setModal(null)} />}
      <CandidateNavbar />
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-300 text-sm mb-3 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Tableau de bord
            </Link>
            <h1 className="text-2xl font-bold">Crédits &amp; Abonnement</h1>
          </div>
          <div className="bg-slate-900/80 border border-white/8 rounded-2xl px-5 py-4 text-center min-w-[150px]">
            <div className="text-3xl font-bold text-indigo-400">{available}</div>
            <div className="text-xs text-gray-500 mt-1">crédits disponibles</div>
            <div className="text-xs text-gray-600 mt-0.5">{profile.interviews_used_this_month}/{profile.interviews_limit} utilisés ce mois</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
          {([['abonnements', 'Abonnements'], ['packs', 'Packs crédits']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Abonnements tab */}
        {tab === 'abonnements' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map(plan => {
              const isCurrent = currentTier === plan.tier
              return (
                <div key={plan.id} className={`relative rounded-2xl p-6 border transition-all ${plan.highlighted ? 'bg-indigo-600/15 border-indigo-500 border-2 shadow-lg shadow-indigo-500/10' : 'bg-slate-900/50 border-white/8'}`}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">{plan.badge}</span>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-white">{plan.name}</h3>
                      <div className="mt-1">
                        {plan.price === null
                          ? <span className="text-2xl font-bold text-white">Gratuit</span>
                          : <span className="text-2xl font-bold text-white">{fmt(plan.price)}<span className="text-sm text-gray-500 font-normal">/mois</span></span>}
                      </div>
                      <p className="text-indigo-400 text-xs mt-1 font-medium">{plan.credits} crédits/mois</p>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />{f}
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <div className="w-full py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm text-center font-medium">Plan actuel ✓</div>
                    ) : (
                      <button
                        onClick={() => plan.price !== null && setModal({ label: `Abonnement ${plan.name} — ${plan.credits} crédits/mois`, price: plan.price, productId: plan.id, kind: 'plan' })}
                        disabled={plan.price === null}
                        className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors ${plan.highlighted ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : plan.price === null ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-white/8 hover:bg-white/12 text-white border border-white/10'}`}>
                        {plan.price === null ? 'Offert' : 'Choisir ce plan'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Packs tab */}
        {tab === 'packs' && (
          <div className="space-y-4">
            <p className="text-gray-500 text-sm">Crédits supplémentaires sans engagement. S&apos;ajoutent à votre solde et n&apos;expirent pas.</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {CREDIT_PACKS.map(pack => (
                <div key={pack.id} className={`relative rounded-2xl p-6 border transition-all ${pack.highlighted ? 'bg-indigo-600/15 border-indigo-500 border-2 shadow-lg shadow-indigo-500/10' : 'bg-slate-900/50 border-white/8'}`}>
                  {pack.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">{pack.badge}</span>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-indigo-400" />
                      <span className="text-xl font-bold text-white">{pack.credits} crédits</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{fmt(pack.price)}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{pack.ppc}</div>
                    </div>
                    <button
                      onClick={() => setModal({ label: `Pack ${pack.credits} crédits`, price: pack.price, productId: pack.id, kind: 'pack' })}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${pack.highlighted ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-white/8 hover:bg-white/12 text-white border border-white/10'}`}>
                      Acheter ce pack
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-600 border-t border-white/5 pt-6">
          <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> 1 crédit = 1 simulation complète</span>
          <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> Packs : crédits sans expiration</span>
        </div>
      </div>
    </div>
  )
}

import type { CreditPackage, CreditTransaction, UserCredits } from '@/lib/types/credits'

export default function CreditsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'purchase' | 'spent' | 'refund'>('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadData()
    }
  }, [user, authLoading, router])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    const [packagesData, creditsData, transactionsData] = await Promise.all([
      getCreditPackages(),
      getUserCredits(user.id),
      getCreditTransactions(user.id),
    ])

    setPackages(packagesData)
    setUserCredits(creditsData)
    setTransactions(transactionsData)
    setLoading(false)
  }

  const handlePurchasePackage = async (pkg: CreditPackage) => {
    if (!user || processingPayment) return

    setProcessingPayment(true)
    setSelectedPackage(pkg.id)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Veuillez vous reconnecter')
        return
      }

      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          package_id: pkg.id,
          amount: pkg.price_usd,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Échec du traitement du paiement')
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Purchase error:', error)
      alert(error.message || 'Échec de l\'achat. Veuillez réessayer.')
    } finally {
      setProcessingPayment(false)
      setSelectedPackage(null)
    }
  }

  const handleCustomPurchase = async () => {
    const amount = parseInt(customAmount)
    if (!user || !amount || amount < 10 || processingPayment) {
      alert('Veuillez entrer un montant d\'au moins 10 €')
      return
    }

    setProcessingPayment(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Veuillez vous reconnecter')
        return
      }

      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          custom_amount: amount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Échec du traitement du paiement')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Purchase error:', error)
      alert(error.message || 'Échec de l\'achat. Veuillez réessayer.')
    } finally {
      setProcessingPayment(false)
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all') return true
    return t.type === filter
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !profile) return null

  const balanceColors = getCreditBalanceColor(userCredits?.balance || 0)

  return (
    <div className="min-h-screen bg-background text-white">
      <CandidateNavbar />
      {/* Header */}
      <header className="border-b border-white/10 bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Retour
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-3xl">⭐</span>
              <h1 className="text-2xl font-bold">Recharger vos crédits</h1>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg border ${balanceColors.borderColor} ${balanceColors.bgColor}`}>
            <span className={`text-lg font-bold ${balanceColors.textColor}`}>
              ⭐ {userCredits?.balance || 0} crédits
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-7xl">
        {/* Balance Warning */}
        {(userCredits?.balance || 0) < 20 && (
          <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10">
            <p className="text-red-400 font-medium">⚠️ Solde bas : il vous reste {userCredits?.balance || 0} crédits. Rechargez maintenant pour réserver plus de sessions !</p>
          </div>
        )}

        {/* Credit Packages */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Choisir un forfait</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative transition-all hover:scale-105 ${
                  pkg.is_popular ? 'border-purple-500 bg-purple-500/5' : ''
                }`}
              >
                {pkg.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-purple-600 text-xs font-bold text-white">
                      🔥 LE PLUS POPULAIRE
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                  <div className="text-4xl font-bold text-purple-400 mb-1">
                    {pkg.price_usd} €
                  </div>
                  <div className="text-gray-400 text-sm mb-4">
                    {pkg.base_credits} crédits
                    {pkg.bonus_credits > 0 && (
                      <span className="text-yellow-400"> + {pkg.bonus_credits} bonus</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>{(pkg.price_usd / pkg.total_credits).toFixed(2)} € par crédit</span>
                  </div>
                  <Button
                    variant={pkg.is_popular ? 'primary' : 'outline'}
                    fullWidth
                    onClick={() => handlePurchasePackage(pkg)}
                    loading={processingPayment && selectedPackage === pkg.id}
                    disabled={processingPayment}
                  >
                    {processingPayment && selectedPackage === pkg.id ? (
                      'Traitement...'
                    ) : (
                      `Obtenir ${pkg.total_credits} crédits`
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <Card className="mb-12">
          <h3 className="text-xl font-bold mb-4">Montant personnalisé</h3>
          <p className="text-gray-400 text-sm mb-4">
            Achetez le nombre de crédits souhaité. Minimum 10 €.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Entrer le montant (min 10 €)"
                  className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {customAmount && parseInt(customAmount) >= 10 && (
                <p className="mt-2 text-sm text-gray-400">
                  Vous recevrez {parseInt(customAmount)} crédits
                </p>
              )}
            </div>
            <Button
              variant="primary"
              onClick={handleCustomPurchase}
              loading={processingPayment && !selectedPackage}
              disabled={!customAmount || parseInt(customAmount) < 10 || processingPayment}
              className="sm:w-auto px-8"
            >
              {processingPayment && !selectedPackage ? 'Traitement...' : 'Acheter'}
            </Button>
          </div>
        </Card>

        {/* Transaction History */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Historique des transactions</h2>
            <div className="flex gap-2">
              {(['all', 'purchase', 'spent', 'refund'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {f === 'all' ? 'Tout' : f === 'purchase' ? 'Achat' : f === 'spent' ? 'Dépensé' : 'Remboursement'}
                </button>
              ))}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <Card className="text-center py-12">
              <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucune transaction</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((txn) => (
                <Card key={txn.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === 'purchase'
                          ? 'bg-blue-500/20 text-blue-400'
                          : txn.type === 'spent'
                          ? 'bg-red-500/20 text-red-400'
                          : txn.type === 'refund'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : txn.type === 'earned'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {txn.type === 'purchase' ? '💳' : txn.type === 'spent' ? '📤' : txn.type === 'refund' ? '↩️' : txn.type === 'earned' ? '💰' : '•'}
                    </div>
                    <div>
                      <p className="font-medium">
                        {txn.description || txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(txn.created_at).toLocaleDateString('fr-FR', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        txn.type === 'purchase' || txn.type === 'refund' || txn.type === 'earned'
                          ? 'text-blue-400'
                          : 'text-red-400'
                      }`}
                    >
                      {txn.type === 'purchase' || txn.type === 'refund' || txn.type === 'earned' ? '+' : '-'}
                      {Math.abs(txn.amount)}
                    </p>
                    <p className="text-sm text-gray-400">Solde : {txn.balance_after}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
