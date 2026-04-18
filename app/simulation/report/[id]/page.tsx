'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import {
  SimulationReport, AxisScore, ReformulationExample,
  getVerdictFromScore,
} from '@/lib/types/simulation'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import {
  Download, Share2, RotateCcw, Target, AlertTriangle,
  TrendingUp, MessageSquare, Sparkles, CheckCircle2, XCircle,
  ChevronRight, Clock,
} from 'lucide-react'
import Link from 'next/link'

interface ReportData {
  id: string
  simulation_id: string
  overall_score: number
  overall_verdict: string
  strengths: Array<{ axis: string; comment: string; evidenceTurnIndex?: number }>
  weaknesses: Array<{ axis: string; comment: string; evidenceTurnIndex?: number }>
  axis_scores: Record<string, AxisScore>
  jury_perception_fr: string
  improvement_plan: string[]
  reformulation_examples: ReformulationExample[]
  transcript_annotations: Array<{
    turnIndex: number
    type: 'filler' | 'strength' | 'weakness'
    text: string
    comment: string
  }>
  generated_at: string
}

interface TurnData {
  turn_index: number
  role: string
  content_text: string
  phase: string
  word_count: number | null
  filler_words_count: number | null
  speaking_pace_wpm: number | null
}

const AXIS_LABELS: Record<string, string> = {
  structure_exposé: 'Structure de l\'exposé',
  motivation_cohérence: 'Motivation et cohérence',
  connaissance_environnement: 'Connaissance de l\'environnement',
  communication_stress: 'Communication et stress',
}

const VERDICT_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  très_bien: 'Très bien',
  bien: 'Bien',
  moyen: 'Moyen',
  insuffisant: 'Insuffisant',
  très_insuffisant: 'Très insuffisant',
}

function getScoreColor(score: number): string {
  if (score >= 16) return '#22c55e'
  if (score >= 12) return '#8b5cf6'
  if (score >= 10) return '#eab308'
  if (score >= 7) return '#f97316'
  return '#ef4444'
}

export default function SimulationReportPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const simulationId = params.id as string

  const [report, setReport] = useState<ReportData | null>(null)
  const [turns, setTurns] = useState<TurnData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReport() {
      if (!simulationId) return

      const [reportRes, turnsRes] = await Promise.all([
        supabase
          .from('simulation_reports')
          .select('*')
          .eq('simulation_id', simulationId)
          .single(),
        supabase
          .from('simulation_turns')
          .select('turn_index, role, content_text, phase, word_count, filler_words_count, speaking_pace_wpm')
          .eq('simulation_id', simulationId)
          .order('turn_index'),
      ])

      if (reportRes.error || !reportRes.data) {
        setError('Rapport introuvable. Il est peut-être encore en cours de génération.')
        setLoading(false)
        return
      }

      setReport(reportRes.data)
      if (turnsRes.data) setTurns(turnsRes.data)
      setLoading(false)
    }
    loadReport()
  }, [simulationId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Chargement du rapport…</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-8 max-w-md text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto" />
          <h1 className="text-xl font-bold">{error || 'Rapport introuvable'}</h1>
          <p className="text-gray-400 text-sm">
            Si la simulation vient de se terminer, le rapport peut prendre quelques secondes.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RotateCcw className="w-4 h-4" /> Actualiser
            </Button>
            <Link href="/simulation/setup"><Button variant="primary">Nouvelle simulation</Button></Link>
          </div>
        </div>
      </div>
    )
  }

  const scoreColor = getScoreColor(report.overall_score)
  const verdictLabel = VERDICT_LABELS[report.overall_verdict] || report.overall_verdict

  // Prepare radar data
  const radarData = Object.entries(report.axis_scores).map(([key, axis]) => ({
    axis: AXIS_LABELS[key] || key,
    score: axis.score,
    max: axis.max || 5,
  }))

  // Prosody stats from turns
  const candidateTurns = turns.filter(t => t.role === 'candidate')
  const totalFillers = candidateTurns.reduce((sum, t) => sum + (t.filler_words_count || 0), 0)
  const avgPace = candidateTurns.filter(t => t.speaking_pace_wpm).length > 0
    ? candidateTurns.reduce((s, t) => s + (t.speaking_pace_wpm || 0), 0) / candidateTurns.filter(t => t.speaking_pace_wpm).length
    : 0
  const totalWords = candidateTurns.reduce((s, t) => s + (t.word_count || 0), 0)

  const prosodyData = [
    { name: 'Mots prononcés', value: totalWords },
    { name: 'Mots parasites', value: totalFillers },
    { name: 'Débit moyen (mots/min)', value: Math.round(avgPace) },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/15 via-background to-background" />

      <div className="relative z-10 container mx-auto px-4 py-10 max-w-4xl space-y-8">
        {/* ═══ 1. SCORE OVERVIEW ═══ */}
        <section className="text-center space-y-4">
          <div className="inline-block relative">
            {/* Gradient circle */}
            <div
              className="w-36 h-36 rounded-full flex items-center justify-center mx-auto"
              style={{
                background: `conic-gradient(${scoreColor} ${(report.overall_score / 20) * 360}deg, #1a1a24 0deg)`,
                padding: '6px',
              }}
            >
              <div className="w-full h-full rounded-full bg-background flex flex-col items-center justify-center">
                <span className="text-4xl font-bold" style={{ color: scoreColor }}>
                  {report.overall_score.toFixed(1)}
                </span>
                <span className="text-gray-500 text-sm">/20</span>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text">{verdictLabel}</h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Rapport généré le {new Date(report.generated_at).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </section>

        {/* ═══ 2. RADAR CHART ═══ */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Évaluation par axe
          </h2>
          <div className="w-full h-80">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#2a2a3a" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  domain={[0, 5]}
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  axisLine={false}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* Axis details */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {Object.entries(report.axis_scores).map(([key, axis]) => (
              <div key={key} className="bg-card rounded-xl p-4 border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{AXIS_LABELS[key] || key}</span>
                  <span className="font-bold" style={{ color: getScoreColor(axis.score * 4) }}>
                    {axis.score}/{axis.max || 5}
                  </span>
                </div>
                {axis.recommendationFr && (
                  <p className="text-xs text-gray-400">{axis.recommendationFr}</p>
                )}
                {axis.evidence && axis.evidence.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {axis.evidence.slice(0, 2).map((ev, i) => (
                      <p key={i} className="text-xs text-gray-500 italic">
                        « {ev.quote} » — {ev.comment}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 3. JURY PERCEPTION ═══ */}
        {report.jury_perception_fr && (
          <section className="glass rounded-2xl p-6 border-l-4 border-purple-500">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" /> Ce que le jury a probablement pensé
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed italic">
              « {report.jury_perception_fr} »
            </p>
          </section>
        )}

        {/* ═══ STRENGTHS & WEAKNESSES ═══ */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Strengths */}
          <section className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" /> Points forts
            </h2>
            <ul className="space-y-3">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-green-300 font-medium">{s.axis}</span>
                    <p className="text-gray-400 mt-0.5">{s.comment}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Weaknesses */}
          <section className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" /> Axes d'amélioration
            </h2>
            <ul className="space-y-3">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-red-300 font-medium">{w.axis}</span>
                    <p className="text-gray-400 mt-0.5">{w.comment}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ═══ 4. TRANSCRIPT WITH ANNOTATIONS ═══ */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Transcription annotée
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {turns.map((turn, i) => {
              // Find annotations for this turn
              const annotations = (report.transcript_annotations || []).filter(
                a => a.turnIndex === turn.turn_index
              )
              return (
                <div
                  key={i}
                  className={`rounded-xl px-4 py-3 text-sm ${
                    turn.role === 'jury'
                      ? 'bg-purple-900/20 border border-purple-500/20'
                      : 'bg-secondary/10 border border-secondary/20'
                  }`}
                >
                  <p className="text-xs font-semibold mb-1 opacity-60">
                    {turn.role === 'jury' ? '🎓 Jury' : '🎤 Candidat'}
                    <span className="ml-2 opacity-50">{turn.phase}</span>
                  </p>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {turn.content_text}
                  </p>
                  {annotations.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {annotations.map((a, j) => (
                        <p
                          key={j}
                          className={`text-xs px-2 py-1 rounded inline-block mr-2 ${
                            a.type === 'filler'
                              ? 'bg-orange-500/20 text-orange-300'
                              : a.type === 'strength'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {a.comment}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ═══ 5. REFORMULATION EXAMPLES ═══ */}
        {report.reformulation_examples && report.reformulation_examples.length > 0 && (
          <section className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Exemples de reformulation
            </h2>
            <div className="space-y-4">
              {report.reformulation_examples.map((ex, i) => (
                <div key={i} className="bg-card rounded-xl p-4 border border-border space-y-2">
                  <p className="text-xs text-gray-500">{ex.context}</p>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-400 mb-1">Au lieu de :</p>
                      <p className="text-sm text-gray-300">« {ex.original} »</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 shrink-0 mt-3" />
                    <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-green-400 mb-1">Préférez :</p>
                      <p className="text-sm text-gray-300">« {ex.suggested} »</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══ 6. PROSODY STATS ═══ */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Analyse de l'élocution
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {prosodyData.map((s, i) => (
              <div key={i} className="bg-card rounded-xl p-4 text-center border border-border">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.name}</p>
              </div>
            ))}
          </div>
          {candidateTurns.length > 1 && (
            <div className="w-full h-48">
              <ResponsiveContainer>
                <BarChart data={candidateTurns.map((t, i) => ({
                  name: `Tour ${i + 1}`,
                  mots: t.word_count || 0,
                  parasites: t.filler_words_count || 0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                  <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#fff' }}
                  />
                  <Bar dataKey="mots" fill="#3b82f6" name="Mots" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="parasites" fill="#f97316" name="Parasites" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* ═══ 7. IMPROVEMENT PLAN ═══ */}
        {report.improvement_plan && report.improvement_plan.length > 0 && (
          <section className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Plan d'amélioration
            </h2>
            <ol className="space-y-3">
              {report.improvement_plan.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-gray-300 pt-1">{item}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ═══ 8. ACTIONS ═══ */}
        <section className="flex flex-wrap gap-3 justify-center pb-10">
          <Link href="/simulation/setup">
            <Button variant="primary" className="gap-2">
              <RotateCcw className="w-4 h-4" /> Nouvelle simulation
            </Button>
          </Link>
          <Link href="/coaches">
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" /> Partager avec un coach
            </Button>
          </Link>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => {
              // Simple PDF download via print
              window.print()
            }}
          >
            <Download className="w-4 h-4" /> Télécharger PDF
          </Button>
        </section>
      </div>
    </div>
  )
}
