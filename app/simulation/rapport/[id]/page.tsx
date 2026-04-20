'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CandidateNavbar from '@/components/CandidateNavbar'
import Link from 'next/link'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import {
  CheckCircle2, AlertCircle, Loader2, ChevronLeft, RotateCcw,
  ArrowRight, Mic, Calendar, BookOpen, TrendingUp, Clock,
  MessageSquare, Star, AlertTriangle, ChevronDown, ChevronUp, Download,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

/* ─── Types ─── */
interface AxisScores {
  structure: number
  motivation: number
  communication: number
  connaissances: number
  stress: number
  argumentation: number
}

interface WeaknessItem {
  label: string
  detail: string
  turnIndex: number | null
  priority?: 1 | 2 | 3
}

interface StrengthItem {
  label: string
  detail: string
  turnIndex: number | null
}

interface ExtractItem {
  turnIndex: number
  role: string
  quote: string
  comment: string
  type: 'force' | 'faiblesse' | 'point_cle'
}

interface ReformItem {
  original: string
  suggested: string
  context: string
}

interface ActionItem {
  action: string
  duree?: string
  priorite?: 1 | 2 | 3
}

interface Metrics {
  totalWords: number
  hesitations: number
  wpm: number
  candidateRatio: number
}

interface QualReport {
  axisScores?: AxisScores
  overallLevel?: string
  synthesePhrase?: string
  impressionGlobale: string
  tags?: string[]
  strengths: StrengthItem[]
  weaknesses: WeaknessItem[]
  extraitsMarquants: ExtractItem[]
  reformulations: ReformItem[]
  planAction: (string | ActionItem)[]
  metrics?: Metrics
  sessionMeta?: {
    startedAt: string
    durationMinutes: number
    concoursIntitulé: string
    difficulty: string
    turnCount: number
  }
}

/* ─── Constants ─── */
const AXIS_LABELS: Record<keyof AxisScores, string> = {
  structure: 'Structure',
  motivation: 'Motivation',
  communication: 'Communication',
  connaissances: 'Connaissances',
  stress: 'Gestion du stress',
  argumentation: 'Argumentation',
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'Lacunaire',
  2: 'À travailler',
  3: 'Correct',
  4: 'Solide',
  5: 'Excellent',
}

const LEVEL_COLOR: Record<string, string> = {
  excellent: 'text-emerald-400',
  solide: 'text-emerald-400',
  correct: 'text-amber-400',
  'à travailler': 'text-amber-400',
  lacunaire: 'text-red-400',
}

const PRIORITY_LABELS: Record<number, { label: string; color: string; border: string }> = {
  1: { label: 'Priorité 1 — critique', color: 'text-red-400', border: 'border-l-red-400' },
  2: { label: 'Priorité 2 — importante', color: 'text-amber-400', border: 'border-l-amber-400' },
  3: { label: 'Priorité 3 — à améliorer', color: 'text-indigo-400', border: 'border-l-indigo-400' },
}

/* ─── Helper Components ─── */
function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <h2 className="text-lg font-semibold flex items-center gap-2 text-white mb-4">
      <Icon className="w-5 h-5 text-indigo-400" />
      {children}
    </h2>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border p-5 ${className}`}
      style={{ background: 'rgba(15,22,41,0.7)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      {children}
    </div>
  )
}

function MetricCard({
  label, value, sub, color = 'text-white',
}: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <Card>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </Card>
  )
}

function ExpandableCard({
  title, detail, extraContent, borderClass = 'border-l-indigo-400',
}: {
  title: string; detail: string; extraContent?: React.ReactNode; borderClass?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <Card className={`border-l-4 ${borderClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-medium text-white text-sm">{title}</p>
          {(open || detail.length < 120) && (
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">{detail}</p>
          )}
          {!open && detail.length >= 120 && (
            <p className="text-sm text-gray-400 mt-1">{detail.slice(0, 100)}…</p>
          )}
          {open && extraContent}
        </div>
        {detail.length >= 120 && (
          <button onClick={() => setOpen(v => !v)} className="shrink-0 text-gray-600 hover:text-gray-400 mt-0.5">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
    </Card>
  )
}

/* ─── Main Page ─── */
export default function SimulationRapportPage() {
  const params = useParams()
  const router = useRouter()
  const simulationId = params.id as string

  const [report, setReport] = useState<QualReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({})
  const [sessionDate] = useState(() => format(new Date(), 'dd MMMM yyyy', { locale: fr }))

  /* ── Load from storage / DB with polling ── */
  useEffect(() => {
    let stopped = false

    async function tryLoad(): Promise<boolean> {
      const cached = typeof window !== 'undefined'
        ? sessionStorage.getItem(`sim_report_${simulationId}`)
        : null
      if (cached) {
        if (!stopped) { setReport(JSON.parse(cached)); setLoading(false) }
        return true
      }
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data } = await supabase
          .from('simulation_reports')
          .select('report_data')
          .eq('simulation_id', simulationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (data?.report_data) {
          if (!stopped) { setReport(data.report_data as QualReport); setLoading(false) }
          return true
        }
      } catch { /* not ready yet */ }
      return false
    }

    async function loadReport() {
      const immediate = await tryLoad()
      if (immediate) return
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        const found = await tryLoad()
        if (found || stopped) { clearInterval(poll); return }
        if (attempts >= 45) {
          clearInterval(poll)
          if (!stopped) { setError("La génération du rapport a pris trop de temps. Veuillez réessayer."); setLoading(false) }
        }
      }, 2000)
    }

    loadReport()
    return () => { stopped = true }
  }, [simulationId])

  /* ── Load checked actions from localStorage ── */
  useEffect(() => {
    const saved = localStorage.getItem(`actions_${simulationId}`)
    if (saved) setCheckedActions(JSON.parse(saved))
  }, [simulationId])

  const toggleAction = useCallback((i: number) => {
    setCheckedActions(prev => {
      const next = { ...prev, [i]: !prev[i] }
      localStorage.setItem(`actions_${simulationId}`, JSON.stringify(next))
      return next
    })
  }, [simulationId])

  /* ── Loading messages rotation ── */
  const LOADING_MESSAGES = [
    'Analyse de votre prestation en cours…',
    'Évaluation des axes de compétence…',
    'Identification des points forts…',
    'Rédaction de l\'impression globale du jury…',
    'Génération du plan d\'action…',
    'Finalisation du rapport…',
  ]
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  useEffect(() => {
    if (!loading) return
    const t = setInterval(() => setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 4000)
    return () => clearInterval(t)
  }, [loading])
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0F1629' }}>
        <CandidateNavbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-400/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-indigo-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-t-violet-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          </div>
          <div className="text-center">
            <p className="text-white text-base font-medium transition-all">{LOADING_MESSAGES[loadingMsgIdx]}</p>
            <p className="text-gray-600 text-xs mt-1">Cela prend généralement 30 à 60 secondes</p>
          </div>
          <div className="flex gap-1.5 mt-2">
            {LOADING_MESSAGES.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i === loadingMsgIdx ? 'bg-indigo-400 scale-125' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0F1629' }}>
        <CandidateNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-gray-300">{error ?? 'Rapport introuvable.'}</p>
          <button
            onClick={() => router.push('/simulation/setup')}
            className="text-indigo-400 underline text-sm"
          >
            Relancer une simulation
          </button>
        </div>
      </div>
    )
  }

  /* ── Derived data ── */
  const axes = report.axisScores
  const radarData = axes
    ? (Object.entries(AXIS_LABELS) as [keyof AxisScores, string][]).map(([key, label]) => ({
        axis: label,
        score: axes[key] ?? 1,
        seuil: 3,
      }))
    : null

  const metrics = report.metrics
  const meta = report.sessionMeta
  const level = report.overallLevel ?? 'correct'
  const actions = report.planAction ?? []
  const checkedCount = Object.values(checkedActions).filter(Boolean).length

  const levelColor = LEVEL_COLOR[level] ?? 'text-amber-400'
  const avgAxisScore = axes
    ? Math.round((Object.values(axes).reduce((a, b) => a + b, 0) / Object.values(axes).length) * 10) / 10
    : null

  const recommendCoach = avgAxisScore !== null && avgAxisScore < 3

  const startDateFormatted = meta?.startedAt
    ? format(new Date(meta.startedAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })
    : sessionDate

  const handlePrint = () => window.print()

  return (
    <div className="min-h-screen text-white" style={{ background: '#0F1629' }}>
      <style>{`
        @media print {
          nav, button, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-page { background: white !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <CandidateNavbar />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 print-page">

        {/* ══ 1. Header ══ */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link
              href="/dashboard"
              className="no-print inline-flex items-center gap-1 text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Retour au tableau de bord
            </Link>
            <h1 className="text-2xl font-bold">Rapport de simulation</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {startDateFormatted}
              </span>
              {meta?.durationMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {meta.durationMinutes} min prévues
                </span>
              )}
              {meta?.concoursIntitulé && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {meta.concoursIntitulé}
                </span>
              )}
              {meta?.turnCount !== undefined && (
                <span>{meta.turnCount} tours d'échange</span>
              )}
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="no-print shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 hover:bg-white/5 text-gray-300 text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>

        {/* ══ 2. Radar chart ══ */}
        {radarData && (
          <Card>
            <SectionTitle icon={TrendingUp}>Évaluation par axe</SectionTitle>

            <div aria-label="Graphique radar des 6 axes d'évaluation : structure, motivation, communication, connaissances, gestion du stress, argumentation. Échelle de 1 (lacunaire) à 5 (excellent). Le seuil d'admissibilité est de 3.">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                  />
                  {/* Threshold trace */}
                  <Radar
                    dataKey="seuil"
                    stroke="rgba(156,163,175,0.4)"
                    fill="rgba(156,163,175,0.05)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  {/* Candidate trace */}
                  <Radar
                    dataKey="score"
                    stroke="#818CF8"
                    fill="#818CF8"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-4 justify-center mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-indigo-400 inline-block" />
                Votre prestation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-t border-dashed border-gray-500 inline-block" />
                Seuil admissibilité
              </span>
            </div>

            {/* Axis score chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              {(Object.entries(AXIS_LABELS) as [keyof AxisScores, string][]).map(([key, label]) => {
                const score = axes![key] ?? 1
                const levelLabel = LEVEL_LABELS[score] ?? ''
                const color = score >= 4 ? 'text-emerald-400' : score >= 3 ? 'text-amber-400' : 'text-red-400'
                return (
                  <div key={key} className="flex flex-col items-center bg-white/5 rounded-lg px-3 py-2 min-w-[90px]">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className={`text-sm font-bold ${color}`}>{levelLabel}</span>
                  </div>
                )
              })}
            </div>

            {/* Synthese phrase */}
            {report.synthesePhrase && (
              <p className="text-center text-gray-300 text-base leading-relaxed mt-5 border-t border-white/5 pt-4">
                {report.synthesePhrase}
              </p>
            )}
          </Card>
        )}

        {/* ══ 3. Metric cards ══ */}
        {metrics && (
          <div>
            <SectionTitle icon={Clock}>Métriques de la session</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Mots prononcés"
                value={`${metrics.totalWords}`}
                sub="Total candidat pendant la session"
                color="text-white"
              />
              <MetricCard
                label="Débit moyen"
                value={metrics.wpm > 0 ? `${metrics.wpm} mots/min` : '—'}
                sub={
                  metrics.wpm === 0 ? 'Non calculable'
                  : metrics.wpm < 110 ? 'Rythme lent — ralentir peut aider mais ici c\'est limite'
                  : metrics.wpm > 170 ? 'Rythme rapide — veillez à l\'articulation'
                  : 'Rythme correct (idéal 120-160 mots/min)'
                }
                color={metrics.wpm >= 110 && metrics.wpm <= 170 ? 'text-emerald-400' : 'text-amber-400'}
              />
              <MetricCard
                label="Hésitations détectées"
                value={`${metrics.hesitations}`}
                sub={metrics.hesitations <= 5 ? 'Excellent — peu d\'hésitations' : metrics.hesitations <= 12 ? 'Acceptable — à réduire' : 'Élevé — travaillez les transitions'}
                color={metrics.hesitations <= 5 ? 'text-emerald-400' : metrics.hesitations <= 12 ? 'text-amber-400' : 'text-red-400'}
              />
              <MetricCard
                label="Niveau global"
                value={level.charAt(0).toUpperCase() + level.slice(1)}
                sub={avgAxisScore !== null ? `Moyenne axes : ${avgAxisScore}/5` : undefined}
                color={levelColor}
              />
            </div>
          </div>
        )}

        {/* ══ 4. Global impression ══ */}
        <Card>
          <SectionTitle icon={MessageSquare}>Impression globale du jury</SectionTitle>
          <p className="text-gray-200 leading-[1.8] text-[17px]">{report.impressionGlobale}</p>
        </Card>

        {/* ══ 5. Strengths ══ */}
        {report.strengths.length > 0 && (
          <div>
            <SectionTitle icon={CheckCircle2}>Ce qui a marché</SectionTitle>
            <div className="space-y-3">
              {report.strengths.map((s, i) => (
                <ExpandableCard
                  key={i}
                  title={s.label}
                  detail={s.detail}
                  borderClass="border-l-emerald-400"
                />
              ))}
            </div>
          </div>
        )}

        {/* ══ 6. Weaknesses with priorities ══ */}
        {report.weaknesses.length > 0 && (
          <div>
            <SectionTitle icon={AlertTriangle}>Ce qu'il faut travailler</SectionTitle>
            <div className="space-y-3">
              {report.weaknesses.map((w, i) => {
                const prio = w.priority ?? 2
                const prioInfo = PRIORITY_LABELS[prio]
                return (
                  <ExpandableCard
                    key={i}
                    title={w.label}
                    detail={w.detail}
                    borderClass={`border-l-4 ${prioInfo.border}`}
                    extraContent={
                      <span className={`text-xs font-medium mt-2 inline-block ${prioInfo.color}`}>
                        {prioInfo.label}
                      </span>
                    }
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* ══ 7. Notable excerpts ══ */}
        {report.extraitsMarquants.length > 0 && (
          <div>
            <SectionTitle icon={Star}>Extraits marquants</SectionTitle>
            <div className="space-y-4">
              {report.extraitsMarquants.map((ex, i) => {
                const typeStyle = ex.type === 'force'
                  ? { badge: 'bg-emerald-400/15 text-emerald-400', label: 'Point fort' }
                  : ex.type === 'faiblesse'
                  ? { badge: 'bg-red-400/15 text-red-400', label: 'Faiblesse' }
                  : { badge: 'bg-indigo-400/15 text-indigo-400', label: 'Point clé' }

                // Find reformulation for this extract
                const reform = ex.type === 'faiblesse'
                  ? report.reformulations.find(r =>
                      ex.quote && r.original.toLowerCase().includes(ex.quote.slice(0, 20).toLowerCase())
                    ) ?? report.reformulations[Math.min(i, report.reformulations.length - 1)]
                  : null

                return (
                  <Card key={i}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle.badge}`}>
                        {typeStyle.label}
                      </span>
                      <span className="text-xs text-gray-600">Tour {ex.turnIndex}</span>
                    </div>
                    <blockquote className="border-l-2 border-white/20 pl-3 text-gray-300 text-sm italic leading-relaxed mb-2">
                      &ldquo;{ex.quote}&rdquo;
                    </blockquote>
                    <p className="text-gray-500 text-sm">{ex.comment}</p>
                    {reform && (
                      <details className="mt-3">
                        <summary className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300 select-none">
                          Voir la meilleure formulation
                        </summary>
                        <div className="mt-2 bg-indigo-400/10 border border-indigo-400/20 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">{reform.context}</p>
                          <p className="text-sm text-indigo-200 italic">&ldquo;{reform.suggested}&rdquo;</p>
                        </div>
                      </details>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ 8. Action plan ══ */}
        {actions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon={TrendingUp}>Plan d'action</SectionTitle>
              <span className="text-xs text-gray-500">
                {checkedCount}/{actions.length} actions effectuées
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                style={{ width: `${actions.length > 0 ? (checkedCount / actions.length) * 100 : 0}%` }}
              />
            </div>

            <div className="space-y-2">
              {actions.map((a, i) => {
                const isObj = typeof a === 'object' && a !== null && 'action' in a
                const text = isObj ? (a as ActionItem).action : String(a)
                const duree = isObj ? (a as ActionItem).duree : undefined
                const checked = !!checkedActions[i]
                return (
                  <button
                    key={i}
                    onClick={() => toggleAction(i)}
                    className="w-full text-left"
                  >
                    <Card className={`transition-all duration-200 ${checked ? 'opacity-50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                          checked ? 'bg-indigo-400 border-indigo-400' : 'border-gray-600'
                        }`}>
                          {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${checked ? 'line-through text-gray-600' : 'text-gray-200'}`}>
                            {text}
                          </p>
                          {duree && !checked && (
                            <p className="text-xs text-gray-600 mt-0.5">Estimé : {duree}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ 9. CTAs ══ */}
        <div className="space-y-3 pt-2 pb-12">
          <Link
            href="/simulation/setup"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Refaire une simulation
          </Link>

          {recommendCoach && (
            <Link
              href="/coaches"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-white/15 hover:bg-white/5 text-gray-200 font-medium transition-colors relative"
            >
              <BookOpen className="w-4 h-4" />
              Réserver une session avec un ancien juré
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-amber-400/20 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full">
                recommandé
              </span>
            </Link>
          )}

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3 text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Retour au tableau de bord
          </Link>
        </div>

      </div>
    </div>
  )
}
