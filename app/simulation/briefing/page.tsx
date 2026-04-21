'use client'

import React, { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { VolumeX, Clock, Mic, User } from 'lucide-react'

const CHECKLIST = [
  {
    icon: VolumeX,
    title: 'Un endroit calme',
    desc: "Trouvez une pièce fermée, sans bruit de fond ni interruption. L'IA analyse votre voix — un environnement bruyant dégrade la qualité du feedback.",
  },
  {
    icon: Clock,
    title: '15 à 30 minutes de disponibilité',
    desc: "Bloquez le créneau complet. Une simulation interrompue ne peut pas être reprise et consomme vos crédits.",
  },
  {
    icon: Mic,
    title: 'Un micro testé',
    desc: "Utilisez un micro de casque ou le micro de votre ordinateur. Évitez le micro du téléphone en haut-parleur, la qualité n'est pas suffisante.",
  },
  {
    icon: User,
    title: "L'état d'esprit du jour J",
    desc: "Tenez-vous debout si possible, comme à l'oral réel. Cela change votre voix et votre posture. Fermez vos autres onglets.",
  },
]

function BriefingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('id')
  const [checked, setChecked] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0F1629' }}>
      <div className="w-full max-w-[640px] space-y-8">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-[28px] font-medium text-white leading-tight">Avant de commencer</h1>
          <p className="text-base text-slate-400 mt-3 leading-relaxed">
            Prenez 30 secondes pour préparer votre environnement.<br />
            La qualité de votre simulation en dépend.
          </p>
        </div>

        {/* Checklist card */}
        <div className="bg-slate-900/80 border border-white/8 rounded-2xl p-6 space-y-6">
          {CHECKLIST.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Confirmation checkbox */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            className="w-5 h-5 rounded border-white/20 accent-indigo-600 cursor-pointer"
          />
          <span className="text-sm text-gray-300">Je confirme être prêt et dans de bonnes conditions.</span>
        </label>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => router.push(`/simulation/test-micro?id=${sessionId}`)}
            disabled={!checked}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Tester mon micro &rarr;
          </button>
        </div>

      </div>
    </div>
  )
}

export default function BriefingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F1629' }}>
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BriefingContent />
    </Suspense>
  )
}
