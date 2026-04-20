'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CandidateNavbar from '@/components/CandidateNavbar'
import Link from 'next/link'
import {
  CheckCircle2, AlertCircle, Sparkles, RotateCcw, ArrowRight,
  BookOpen, MessageSquare, Loader2, Tag, ChevronRight,
} from 'lucide-react'

/* ─── Types ─── */
interface ReportStrength {
  label: string
  detail: string
  turnIndex: number | null
}
interface ReportWeakness {
  label: string
  detail: string
  turnIndex: number | null
}
interface ExtraitMarquant {
  turnIndex: number
  role: string
  quote: string
  comment: string
  type: 'force' | 'faiblesse' | 'point_cle'
}
interface Reformulation {
  original: string
  suggested: string
  context: string
}
interface QualReport {
  impressionGlobale: string
  tags: string[]
  strengths: ReportStrength[]
  weaknesses: ReportWeakness[]
  extraitsMarquants: ExtraitMarquant[]
  reformulations: Reformulation[]
  planAction: string[]
}

const TAG_COLORS: Record<string, string> = {
  'très solide': 'bg-green-500/20 text-green-300 border-green-500/30',
  'solide': 'bg-green-500/15 text-green-400 border-green-500/20',
  'satisfaisante': 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  'à consolider': 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20',
  'à travailler': 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  'lacunaire': 'bg-red-500/15 text-red-300 border-red-500/20',
  'incomplète': 'bg-gray-500/15 text-gray-400 border-gray-500/20',
}

function getTagColor(tag: string): string {
  for (const [key, cls] of Object.entries(TAG_COLORS)) {
    if (tag.toLowerCase().includes(key)) return cls
  }
  return 'bg-primary/15 text-primary border-primary/20'
}

export default function SimulationRapportPage() {
  const params = useParams()
  const router = useRouter()
  const simulationId = params.id as string

  const [report, setReport] = useState<QualReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReport() {
      // 1. Try sessionStorage (fastest — set by live session page)
      const cached = typeof window !== 'undefined'
        ? sessionStorage.getItem(`sim_report_${simulationId}`)
        : null
      if (cached) {
        setReport(JSON.parse(cached))
        setLoading(false)
        return
      }

      // 2. Try DB
      try {
        const { data } = await supabase
          .from('simulation_reports')
          .select('report_data')
          .eq('simulation_id', simulationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (data?.report_data) {
          setReport(data.report_data as QualReport)
          setLoading(false)
          return
        }
      } catch { /* fall through */ }

      setError('Rapport introuvable. Il se peut que la génération n\'ait pas abouti.')
      setLoading(false)
    }
    loadReport()
  }, [simulationId])

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-gray-400 text-sm">Génération du rapport en cours…</p>
      </div>
    )
  }

  /* ── Error ── */
  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <CandidateNavbar />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="glass rounded-2xl p-8 max-w-md space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h1 className="text-xl font-bold">{error ?? 'Rapport introuvable'}</h1>
            <Link href="/simulation/setup">
              <button className="px-6 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90 transition-all">
                Nouvelle simulation
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <CandidateNavbar />

      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-8">

        {/* ── Header ── */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-2">
            <Sparkles className="w-4 h-4" />
            Rapport de simulation
          </div>
          <h1 className="text-3xl font-bold gradient-text">Votre bilan</h1>
        </div>

        {/* ── Tags ── */}
        {report.tags && report.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {report.tags.map((tag, i) => (
              <span
                key={i}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getTagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* ── 1. Impression globale ── */}
        <section className="glass rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <MessageSquare className="w-5 h-5 text-primary" />
            Impression globale du jury
          </div>
          <p className="text-gray-300 leading-relaxed text-sm">{report.impressionGlobale}</p>
        </section>

        {/* ── 2. Ce qui a marché ── */}
        {report.strengths && report.strengths.length > 0 && (
          <section className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Ce qui a marché
            </div>
            <ul className="space-y-3">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.detail}</p>
                    {s.turnIndex !== null && (
                      <span className="inline-block mt-1 text-xs text-gray-600 bg-card px-2 py-0.5 rounded">
                        Tour {s.turnIndex}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── 3. Ce qu'il faut travailler ── */}
        {report.weaknesses && report.weaknesses.length > 0 && (
          <section className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Ce qu'il faut travailler
            </div>
            <ul className="space-y-3">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <ChevronRight className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{w.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{w.detail}</p>
                    {w.turnIndex !== null && (
                      <span className="inline-block mt-1 text-xs text-gray-600 bg-card px-2 py-0.5 rounded">
                        Tour {w.turnIndex}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── 4. Extraits marquants ── */}
        {report.extraitsMarquants && report.extraitsMarquants.length > 0 && (
          <section className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Extraits marquants
            </div>
            <div className="space-y-4">
              {report.extraitsMarquants.map((e, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 border-l-4 ${
                    e.type === 'force'
                      ? 'bg-green-500/10 border-green-500 border border-green-500/20'
                      : e.type === 'faiblesse'
                      ? 'bg-red-500/10 border-red-400 border border-red-500/20'
                      : 'bg-primary/10 border-primary border border-primary/20'
                  }`}
                >
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      e.type === 'force' ? 'text-green-400' :
                      e.type === 'faiblesse' ? 'text-red-400' : 'text-primary'
                    }`}>
                      {e.type === 'force' ? 'Force' : e.type === 'faiblesse' ? 'Faiblesse' : 'Point clé'}
                    </span>
                    {e.role === 'jury' ? 'Jury' : 'Vous'} — Tour {e.turnIndex}
                  </p>
                  <blockquote className="text-sm text-gray-300 italic mb-2">"{e.quote}"</blockquote>
                  <p className="text-xs text-gray-400">{e.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 5. Reformulations ── */}
        {report.reformulations && report.reformulations.length > 0 && (
          <section className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Tag className="w-5 h-5 text-violet-400" />
              Meilleures formulations
            </div>
            <div className="space-y-4">
              {report.reformulations.map((r, i) => (
                <div key={i} className="space-y-2">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                    <p className="text-xs text-red-400 mb-1 font-medium">Ce qui a été dit :</p>
                    <p className="text-sm text-gray-300 italic">"{r.original}"</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5">
                    <p className="text-xs text-green-400 mb-1 font-medium">Meilleure version :</p>
                    <p className="text-sm text-gray-200">"{r.suggested}"</p>
                  </div>
                  {r.context && (
                    <p className="text-xs text-gray-500 pl-1">{r.context}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 6. Plan d'action ── */}
        {report.planAction && report.planAction.length > 0 && (
          <section className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <ArrowRight className="w-5 h-5 text-primary" />
              Plan d'action
            </div>
            <ol className="space-y-2">
              {report.planAction.map((action, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-300">{action}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/simulation/setup" className="flex-1">
            <button className="w-full py-3 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Refaire une simulation
            </button>
          </Link>
          <Link href="/coaches" className="flex-1">
            <button className="w-full py-3 px-4 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2">
              Réserver un coach
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <button className="w-full py-3 px-4 rounded-xl border border-border text-sm font-medium text-gray-400 hover:text-foreground hover:border-gray-500 transition-all">
              Tableau de bord
            </button>
          </Link>
        </section>

      </div>
    </div>
  )
}
