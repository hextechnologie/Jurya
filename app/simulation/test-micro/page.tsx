'use client'

import React, { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mic, CheckCircle2, AlertTriangle, RotateCcw, HelpCircle } from 'lucide-react'
import { useMicTest, MicTestStatus } from '@/hooks/useMicTest'

/* ── Result badge ── */
function ResultBadge({
  type, title, desc, onRetry,
}: {
  type: 'warning' | 'error'
  title: string
  desc: string
  onRetry: () => void
}) {
  const isWarning = type === 'warning'
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className={`flex items-start gap-3 rounded-xl px-5 py-4 border w-full ${
        isWarning
          ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
          : 'text-red-400 bg-red-400/10 border-red-400/20'
      }`}>
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{desc}</p>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <RotateCcw className="w-4 h-4" /> Réessayer
      </button>
    </div>
  )
}

/* ── Help modal (no-sound case) ── */
function MicHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h2 className="text-base font-semibold text-white">Aide micro par navigateur</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <p><strong className="text-white">Chrome / Edge :</strong> Cliquez sur l&rsquo;icône cadenas à gauche de l&rsquo;URL → Autorisations du site → Microphone → Autoriser.</p>
          <p><strong className="text-white">Firefox :</strong> Cliquez sur l&rsquo;icône micro dans la barre d&rsquo;adresse → Autoriser l&rsquo;accès.</p>
          <p><strong className="text-white">Safari :</strong> Menu Safari → Préférences → Sites web → Microphone → Autoriser pour ce site.</p>
          <p className="text-xs text-gray-500">Après avoir modifié les permissions, rechargez la page.</p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}

/* ── Main content ── */
function MicTestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('id')
  const { status, rmsLevel, waveData, start, reset } = useMicTest()
  const [showHelp, setShowHelp] = React.useState(false)

  const isRecording = status === 'testing'
  const isSuccess = status === 'success'
  const isDone = status !== 'idle' && status !== 'testing'

  const handleRetry = () => {
    reset()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0F1629' }}>
      {showHelp && <MicHelpModal onClose={() => setShowHelp(false)} />}

      <div className="w-full max-w-[640px] space-y-8">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-[28px] font-medium text-white leading-tight">Testons votre micro</h1>
          <p className="text-base text-slate-400 mt-3">
            Lisez la phrase suivante à voix haute, comme si vous parliez au jury.
          </p>
        </div>

        {/* Phrase card */}
        <div className="bg-slate-900/80 border border-white/8 rounded-2xl p-8 text-center">
          <p className="text-2xl font-medium text-white leading-relaxed">
            &ldquo;Je suis prêt pour ma simulation d&rsquo;oral.&rdquo;
          </p>
        </div>

        {/* Record button + waveform */}
        {(status === 'idle' || isRecording) && (
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={start}
              disabled={isRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isRecording
                  ? 'bg-red-600 shadow-red-600/40 animate-pulse cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 hover:scale-105'
              }`}
            >
              <Mic className="w-9 h-9 text-white" />
            </button>
            <p className="text-sm text-slate-500">
              {isRecording ? 'Enregistrement en cours… parlez maintenant' : 'Appuyer pour parler'}
            </p>

            {/* Waveform visualiser */}
            {isRecording && (
              <div className="flex items-center gap-0.5 h-14 w-full max-w-xs">
                {waveData.map((v, i) => {
                  const h = Math.max(4, Math.abs(v) * 100)
                  const isHigh = rmsLevel > 0.5
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-75 ${isHigh ? 'bg-indigo-400' : 'bg-indigo-600/60'}`}
                      style={{ height: `${h}%` }}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {isDone && (
          <div className="flex flex-col items-center gap-4">
            {isSuccess && (
              <div className="flex items-center gap-3 text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-5 py-4 w-full">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Votre micro est bien configuré</p>
                  <p className="text-xs text-emerald-400/70 mt-0.5">Volume optimal, pas de saturation détectée.</p>
                </div>
              </div>
            )}

            {status === 'low_volume' && (
              <ResultBadge
                type="warning"
                title="Volume insuffisant"
                desc="Rapprochez-vous du micro ou augmentez le volume d'entrée dans vos paramètres système."
                onRetry={handleRetry}
              />
            )}

            {status === 'saturated' && (
              <ResultBadge
                type="warning"
                title="Micro saturé"
                desc="Éloignez-vous légèrement du micro ou baissez le volume d'entrée dans vos paramètres système."
                onRetry={handleRetry}
              />
            )}

            {status === 'no_sound' && (
              <div className="flex flex-col items-center gap-3 w-full">
                <ResultBadge
                  type="error"
                  title="Aucun son détecté"
                  desc="Vérifiez que votre micro est bien connecté et autorisé dans votre navigateur."
                  onRetry={handleRetry}
                />
                <button
                  onClick={() => setShowHelp(true)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Aide micro par navigateur
                </button>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => router.push(`/simulation/${sessionId}`)}
          disabled={!isSuccess}
          className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Commencer la simulation &rarr;
        </button>

      </div>
    </div>
  )
}

export default function MicTestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F1629' }}>
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MicTestContent />
    </Suspense>
  )
}
