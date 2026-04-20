'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import CandidateNavbar from '@/components/CandidateNavbar'
import Link from 'next/link'
import { CheckCircle2, Zap, Star, ChevronLeft, AlertTriangle, Package } from 'lucide-react'

/* â”€â”€â”€ Plan data â”€â”€â”€ */
const PLANS = [
  {
    id: 'free', tier: 'free', name: 'DÃ©couverte', price: null, credits: 30, highlighted: false,
    features: ['30 crÃ©dits/mois offerts', 'AccÃ¨s Ã  tous les concours', 'Rapport IA aprÃ¨s chaque simulation', 'Support communautaire'],
  },
  {
    id: 'basic', tier: 'basic', name: 'Essentiel', price: 19, credits: 60, highlighted: false,
    features: ['60 crÃ©dits/mois', 'Historique complet des rapports', 'Support email prioritaire'],
  },
  {
    id: 'pro', tier: 'pro', name: 'Intensif', price: 49, credits: 200, highlighted: true, badge: 'Le plus choisi',
    features: ['200 crÃ©dits/mois', 'Analyses comparatives multi-sessions', 'Support prioritaire', 'AccÃ¨s anticipÃ© aux nouveautÃ©s'],
  },
  {
    id: 'team', tier: 'team', name: 'Premium', price: 129, credits: 500, highlighted: false,
    features: ['500 crÃ©dits/mois', '1 session coaching/mois incluse', 'Support dÃ©diÃ© 7j/7', 'Rapports PDF avancÃ©s'],
  },
]

const CREDIT_PACKS = [
  { id: 'pack_50', credits: 50, price: 15, highlighted: false, ppc: '0,30 â‚¬/crÃ©dit' },
  { id: 'pack_150', credits: 150, price: 39, highlighted: true, badge: 'Meilleur rapport qualitÃ©/prix', ppc: '0,26 â‚¬/crÃ©dit' },
  { id: 'pack_500', credits: 500, price: 99, highlighted: false, ppc: '0,20 â‚¬/crÃ©dit' },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(n)

/* â”€â”€â”€ Purchase modal â”€â”€â”€ */
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
            {loading ? 'Redirectionâ€¦' : 'Payer â†’'}
          </button>
        </div>
        <p className="text-gray-600 text-xs text-center">Paiement sÃ©curisÃ© via Stripe</p>
      </div>
    </div>
  )
}

/* â”€â”€â”€ Main â”€â”€â”€ */
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
            <h1 className="text-2xl font-bold">CrÃ©dits &amp; Abonnement</h1>
          </div>
          <div className="bg-slate-900/80 border border-white/8 rounded-2xl px-5 py-4 text-center min-w-[150px]">
            <div className="text-3xl font-bold text-indigo-400">{available}</div>
            <div className="text-xs text-gray-500 mt-1">crÃ©dits disponibles</div>
            <div className="text-xs text-gray-600 mt-0.5">{profile.interviews_used_this_month}/{profile.interviews_limit} utilisÃ©s ce mois</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
          {([['abonnements', 'Abonnements'], ['packs', 'Packs crÃ©dits']] as const).map(([key, label]) => (
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
                      <p className="text-indigo-400 text-xs mt-1 font-medium">{plan.credits} crÃ©dits/mois</p>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />{f}
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <div className="w-full py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm text-center font-medium">Plan actuel âœ“</div>
                    ) : (
                      <button
                        onClick={() => plan.price !== null && setModal({ label: `Abonnement ${plan.name} â€” ${plan.credits} crÃ©dits/mois`, price: plan.price, productId: plan.id, kind: 'plan' })}
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
            <p className="text-gray-500 text-sm">CrÃ©dits supplÃ©mentaires sans engagement. S&apos;ajoutent Ã  votre solde et n&apos;expirent pas.</p>
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
                      <span className="text-xl font-bold text-white">{pack.credits} crÃ©dits</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{fmt(pack.price)}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{pack.ppc}</div>
                    </div>
                    <button
                      onClick={() => setModal({ label: `Pack ${pack.credits} crÃ©dits`, price: pack.price, productId: pack.id, kind: 'pack' })}
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
          <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> 1 crÃ©dit = 1 simulation complÃ¨te</span>
          <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> Packs : crÃ©dits sans expiration</span>
        </div>
      </div>
    </div>
  )
}
