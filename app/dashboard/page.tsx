'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { supabase, getFirstName } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import CandidateNavbar from '@/components/CandidateNavbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import {
  Mic, TrendingUp, ChevronRight, Clock, Target,
  CheckCircle2, Circle, Calendar, BookOpen, Zap, AlertTriangle,
  RotateCcw, ArrowRight, Users,
} from 'lucide-react'
import { format, differenceInDays, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

/* ── Types ── */
type SimulationConfig = {
  concoursIntitulé?: string
  durationMinutes?: number
}

type Simulation = {
  id: string
  created_at: string
  completed_at: string | null
  actual_duration_seconds: number | null
  status: 'in_progress' | 'completed' | string
  simulation_config: SimulationConfig | null
}

type ReportData = {
  axisScores?: Record<string, number>
  overallLevel?: string
  synthesePhrase?: string
  impressionGlobale?: string
  sessionMeta?: { concoursIntitulé?: string; durationMinutes?: number }
}

type SimReport = { simulation_id: string; report_data: ReportData | null; created_at: string }

type Goal = {
  id: string
  target_date: string | null
  status: string
  concours?: { intitulé?: string } | null
}

type Booking = {
  id: string
  scheduled_at: string | null
  status: string
  coach?: { full_name?: string | null } | null
}

type DashboardState = 'new' | 'active' | 'exam_imminent'

const AXIS_LABELS: Record<string, string> = {
  structure: 'Structure',
  motivation: 'Motivation',
  connaissances: 'Connaissances',
  communication: 'Communication',
  stress: 'Gestion du stress',
  argumentation: 'Argumentation',
}

const AXIS_COLORS: Record<string, string> = {
  structure: '#818CF8',
  motivation: '#34D399',
  connaissances: '#F59E0B',
  communication: '#60A5FA',
  stress: '#F472B6',
  argumentation: '#A78BFA',
}

/* ── Shared card ── */
function DCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 bg-slate-900/50 border border-white/8 ${className}`}>
      {children}
    </div>
  )
}

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <h2 className="text-base font-medium text-white flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-indigo-400" />{children}
    </h2>
  )
}

/* ── Common header (all states) ── */
function DashboardHeader({ firstName, credits, showLaunch = true }: { firstName: string; credits: number; showLaunch?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-2xl font-medium text-white">Bonjour {firstName}.</h1>
      <div className="flex items-center gap-3">
        {/* Credits CTA — conditional on balance */}
        {credits === 0 ? (
          <Link href="/credits" className="flex items-center gap-1.5 text-sm bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-xl hover:bg-amber-500/20 transition-colors whitespace-nowrap">
            <Zap className="w-4 h-4" />
            Crédits épuisés — Recharger
          </Link>
        ) : credits <= 10 ? (
          <Link href="/credits" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-300 transition-colors whitespace-nowrap">
            <Zap className="w-4 h-4" />
            {credits} crédits restants
          </Link>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-indigo-300 whitespace-nowrap">
            <Zap className="w-4 h-4" />
            {credits} crédits
          </span>
        )}
        {showLaunch && (
          <Link
            href="/simulation/setup"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors"
          >
            <Mic className="w-4 h-4" />
            Lancer une simulation
          </Link>
        )}
      </div>
    </div>
  )
}

/* ── Last simulation card ── */
function LastSimulationCard({ sim, report }: { sim: Simulation; report: ReportData | null }) {
  const concoursName = report?.sessionMeta?.concoursIntitulé ?? sim.simulation_config?.concoursIntitulé ?? '—'
  const duration = report?.sessionMeta?.durationMinutes ?? sim.simulation_config?.durationMinutes
  const dateStr = sim.completed_at
    ? format(new Date(sim.completed_at), 'dd MMM yyyy', { locale: fr })
    : format(new Date(sim.created_at), 'dd MMM yyyy', { locale: fr })

  const level = report?.overallLevel
  const levelColor: Record<string, string> = {
    excellent: 'text-emerald-400', solide: 'text-emerald-400',
    correct: 'text-amber-400', 'à travailler': 'text-amber-400', lacunaire: 'text-red-400',
  }

  const topAxes = report?.axisScores
    ? (Object.entries(report.axisScores) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
    : []

  return (
    <DCard>
      <SectionTitle icon={Mic}>Dernière simulation</SectionTitle>
      <p className="text-xs text-gray-500 mb-3">{dateStr} · {concoursName}{duration ? ` · ${duration} min` : ''}</p>
      {report?.synthesePhrase && (
        <p className="text-sm text-gray-300 leading-relaxed mb-4 border-l-2 border-indigo-500/40 pl-3">{report.synthesePhrase}</p>
      )}
      {topAxes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {topAxes.map(([axis, score]) => {
            const color = score >= 4 ? 'text-emerald-400 bg-emerald-400/10' : score >= 3 ? 'text-amber-400 bg-amber-400/10' : 'text-red-400 bg-red-400/10'
            const lvl = score >= 4 ? 'solide' : score >= 3 ? 'correct' : 'à travailler'
            return (
              <span key={axis} className={`text-xs px-2 py-1 rounded-lg font-medium ${color}`}>
                {AXIS_LABELS[axis] ?? axis} : {lvl}
              </span>
            )
          })}
        </div>
      )}
      {level && <p className={`text-sm font-medium mb-4 capitalize ${levelColor[level] ?? 'text-gray-400'}`}>Niveau global : {level}</p>}
      <div className="flex gap-2">
        <Link href={`/simulation/rapport/${sim.id}`} className="flex-1 text-center py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
          Voir le rapport complet
        </Link>
        <Link href="/simulation/setup" className="flex-1 text-center py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-sm transition-colors">
          Refaire une simulation
        </Link>
      </div>
    </DCard>
  )
}

/* ── Score evolution chart ── */
function ScoreEvolutionChart({ sims, reportMap }: { sims: Simulation[]; reportMap: Map<string, ReportData> }) {
  const simsWithReports = sims.filter(s => s.status === 'completed' && reportMap.has(s.id))
    .slice(-10).reverse()

  if (simsWithReports.length < 2) {
    return (
      <DCard>
        <SectionTitle icon={TrendingUp}>Évolution des scores</SectionTitle>
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <p className="text-sm text-gray-500 text-center">Faites une deuxième simulation pour voir votre progression apparaître ici.</p>
          <Link href="/simulation/setup" className="flex items-center gap-1 text-indigo-400 text-sm hover:underline">
            Lancer une simulation <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </DCard>
    )
  }

  const chartData = simsWithReports.map((s, idx) => {
    const rd = reportMap.get(s.id)!
    const base: Record<string, number | string> = {
      name: `S${idx + 1}`,
      date: format(new Date(s.completed_at || s.created_at), 'dd/MM', { locale: fr }),
    }
    if (rd?.axisScores) {
      Object.entries(rd.axisScores).forEach(([k, v]) => { base[k] = v })
    }
    return base
  })

  return (
    <DCard>
      <SectionTitle icon={TrendingUp}>Évolution des scores</SectionTitle>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" stroke="#4b5563" fontSize={11} />
          <YAxis domain={[1, 5]} stroke="#4b5563" fontSize={11} ticks={[1, 2, 3, 4, 5]} />
          <Tooltip
            contentStyle={{ background: '#1e2a45', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
            labelStyle={{ color: '#9ca3af', fontSize: 12 }}
            itemStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          {Object.keys(AXIS_LABELS).map(axis => (
            <Line key={axis} type="monotone" dataKey={axis} stroke={AXIS_COLORS[axis]} strokeWidth={2}
              name={AXIS_LABELS[axis]} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </DCard>
  )
}

/* ── Competency radar ── */
function CompetencyRadar({ reports }: { reports: ReportData[] }) {
  const last3 = reports.slice(-3)
  const axisTotals: Record<string, { sum: number; count: number }> = {}
  for (const r of last3) {
    const ax = r?.axisScores
    if (ax) Object.entries(ax).forEach(([k, v]) => {
      if (!axisTotals[k]) axisTotals[k] = { sum: 0, count: 0 }
      axisTotals[k].sum += v; axisTotals[k].count += 1
    })
  }
  const radarData = Object.entries(AXIS_LABELS).map(([key, label]) => ({
    axis: label,
    score: axisTotals[key] ? Math.round((axisTotals[key].sum / axisTotals[key].count) * 10) / 10 : 0,
    seuil: 3,
  }))

  const sorted = [...Object.entries(axisTotals)].sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count))
  const best = sorted[0] ? AXIS_LABELS[sorted[0][0]] : null
  const worst = sorted[sorted.length - 1] ? AXIS_LABELS[sorted[sorted.length - 1][0]] : null

  return (
    <DCard>
      <SectionTitle icon={Target}>Radar des compétences</SectionTitle>
      <p className="text-xs text-gray-500 mb-3">Moyenne des {last3.length} dernière{last3.length > 1 ? 's' : ''} session{last3.length > 1 ? 's' : ''}</p>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={radarData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <PolarGrid stroke="rgba(255,255,255,0.07)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <Radar dataKey="seuil" stroke="rgba(156,163,175,0.35)" fill="rgba(156,163,175,0.05)" strokeDasharray="4 4" strokeWidth={1.5} />
          <Radar dataKey="score" stroke="#818CF8" fill="#818CF8" fillOpacity={0.25} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
      {best && worst && (
        <p className="text-xs text-gray-500 text-center mt-1">
          Axe le plus solide : <span className="text-emerald-400">{best}</span> · Axe prioritaire : <span className="text-amber-400">{worst}</span>
        </p>
      )}
    </DCard>
  )
}

/* ── Credits widget ── */
function CreditsWidget({ used, limit }: { used: number; limit: number }) {
  const available = Math.max(0, limit - used)
  return (
    <DCard>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">{available} crédits disponibles</p>
          <p className="text-xs text-gray-500 mt-0.5">{used}/{limit} utilisés ce mois</p>
        </div>
        <Link href="/credits" className="text-xs text-indigo-400 hover:underline">Gérer</Link>
      </div>
      <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, (available / limit) * 100)}%` }} />
      </div>
    </DCard>
  )
}

/* ── Recommended actions ── */
function RecommendedActions({ sims, reports, bookings }: { sims: Simulation[]; reports: ReportData[]; bookings: Booking[] }) {
  const actions: Array<{ icon: React.ComponentType<{ className?: string }>; text: string; href: string }> = []

  // Weak axis
  const axisTotals: Record<string, { sum: number; count: number }> = {}
  for (const r of reports.slice(-3)) {
    const ax = r?.axisScores
    if (ax) Object.entries(ax).forEach(([k, v]) => {
      if (!axisTotals[k]) axisTotals[k] = { sum: 0, count: 0 }
      axisTotals[k].sum += v; axisTotals[k].count += 1
    })
  }
  const weakest = Object.entries(axisTotals).sort((a, b) => (a[1].sum / a[1].count) - (b[1].sum / b[1].count))[0]
  if (weakest && (weakest[1].sum / weakest[1].count) < 3) {
    actions.push({ icon: AlertTriangle, text: `Travaillez ${AXIS_LABELS[weakest[0]] ?? weakest[0]} — votre axe le plus faible`, href: '/simulation/setup' })
  }

  // Inactive
  const lastSim = sims.find(s => s.status === 'completed')
  if (lastSim) {
    const days = differenceInDays(new Date(), new Date(lastSim.completed_at ?? lastSim.created_at))
    if (days >= 7) {
      actions.push({ icon: RotateCcw, text: `Reprenez votre rythme — dernière session il y a ${days} jours`, href: '/simulation/setup' })
    }
  }

  // No coach
  const completedCount = sims.filter(s => s.status === 'completed').length
  if (completedCount >= 3 && bookings.length === 0) {
    actions.push({ icon: Users, text: 'Testez une session avec un ancien juré', href: '/coaches' })
  }

  if (actions.length === 0) return null

  return (
    <DCard>
      <SectionTitle icon={Target}>Actions recommandées</SectionTitle>
      <div className="space-y-2">
        {actions.map((a, i) => (
          <Link key={i} href={a.href} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors group">
            <a.icon className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-sm text-gray-300 flex-1">{a.text}</span>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
          </Link>
        ))}
      </div>
    </DCard>
  )
}

/* ── Coach session widget ── */
function CoachWidget({ booking }: { booking: Booking | null }) {
  if (booking) {
    const dateStr = booking.scheduled_at
      ? format(new Date(booking.scheduled_at), "dd MMM 'à' HH:mm", { locale: fr })
      : 'Date à confirmer'
    const countdown = booking.scheduled_at
      ? formatDistanceToNow(new Date(booking.scheduled_at), { locale: fr, addSuffix: true })
      : ''
    return (
      <DCard>
        <SectionTitle icon={Calendar}>Prochaine séance coach</SectionTitle>
        <p className="font-medium text-white text-sm">{booking.coach?.full_name ?? 'Coach'}</p>
        <p className="text-xs text-gray-500 mt-0.5">{dateStr}</p>
        {countdown && <p className="text-xs text-indigo-400 mt-1">{countdown}</p>}
        <Link href="/bookings" className="mt-3 block text-xs text-indigo-400 hover:underline">Voir les détails</Link>
      </DCard>
    )
  }

  return (
    <DCard>
      <SectionTitle icon={BookOpen}>Besoin d&apos;un expert ?</SectionTitle>
      <p className="text-sm text-gray-400 mb-3">Réservez une session avec un ancien juré pour approfondir vos points faibles.</p>
      <Link href="/coaches" className="block text-center py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-sm transition-colors">
        Parcourir les coachs
      </Link>
    </DCard>
  )
}

/* ── State: NEW ── */
function StateNew({ firstName }: { firstName: string }) {
  return (
    <div className="space-y-8">
      {/* Welcome + CTA */}
      <div className="flex flex-col items-center text-center space-y-5 py-8">
        <h2 className="text-2xl font-medium text-white">Bienvenue sur Jurya.</h2>
        <p className="text-gray-400 max-w-md leading-relaxed">
          Pour démarrer, lancez votre première simulation.<br />
          Elle prend 15 minutes et vous donne un premier diagnostic de votre niveau.
        </p>
        <Link
          href="/simulation/setup"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-indigo-600/25"
        >
          <Mic className="w-5 h-5" />
          Lancer ma première simulation
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-xs text-gray-600">Vous avez 30 crédits offerts pour découvrir Jurya.</p>
      </div>

      {/* Why simulate — 3 micro-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: 'Un jury IA réaliste', desc: 'Trois jurés distincts, questions adaptées à votre concours, conditions de pression réelles.' },
          { title: 'Un rapport immédiat', desc: "Points forts, axes de travail, extraits de vos réponses, plan d'action personnalisé." },
          { title: 'Une progression mesurable', desc: 'Chaque simulation nourrit votre radar de compétences. Voyez vos progrès, session après session.' },
        ].map((item, i) => (
          <DCard key={i} className="bg-slate-900/30">
            <p className="text-sm font-medium text-white mb-1.5">{item.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
          </DCard>
        ))}
      </div>
    </div>
  )
}

/* ── State: ACTIVE ── */
function StateActive({ sims, reports, reportMap, bookings }: {
  sims: Simulation[]; reports: ReportData[]; reportMap: Map<string, ReportData>; bookings: Booking[]
}) {
  const lastCompletedSim = sims.find(s => s.status === 'completed')
  const lastReport = lastCompletedSim ? reportMap.get(lastCompletedSim.id) ?? null : null
  const inProgressSims = sims.filter(s => s.status === 'in_progress')

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      {/* Main column (2/3) */}
      <div className="lg:col-span-2 space-y-5">
        {/* In-progress sessions */}
        {inProgressSims.length > 0 && (
          <DCard>
            <SectionTitle icon={Mic}>Sessions en cours</SectionTitle>
            <div className="space-y-2">
              {inProgressSims.map(sim => (
                <div key={sim.id} className="flex items-center justify-between py-2 px-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <div>
                    <p className="text-sm text-white">{sim.simulation_config?.concoursIntitulé ?? 'Simulation'}</p>
                    <p className="text-xs text-gray-500">{format(new Date(sim.created_at), 'dd MMM', { locale: fr })}</p>
                  </div>
                  <Link href={`/simulation/${sim.id}`} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                    Continuer
                  </Link>
                </div>
              ))}
            </div>
          </DCard>
        )}

        {lastCompletedSim && <LastSimulationCard sim={lastCompletedSim} report={lastReport} />}

        <ScoreEvolutionChart sims={sims} reportMap={reportMap} />

        {reports.length > 0 && <CompetencyRadar reports={reports} />}

        {/* Recent simulations table */}
        {sims.length > 1 && (
          <DCard>
            <SectionTitle icon={Clock}>Simulations récentes</SectionTitle>
            <div className="space-y-1">
              {sims.slice(0, 6).map(sim => {
                const rep = reportMap.get(sim.id)
                const level = rep?.overallLevel
                const lvlColor: Record<string, string> = {
                  excellent: 'text-emerald-400', solide: 'text-emerald-400',
                  correct: 'text-amber-400', 'à travailler': 'text-amber-400', lacunaire: 'text-red-400',
                }
                const isInProgress = sim.status === 'in_progress'
                return (
                  <div key={sim.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                        {format(new Date(sim.completed_at ?? sim.created_at), 'dd MMM', { locale: fr })}
                      </span>
                      <span className="text-sm text-gray-300 truncate">
                        {sim.simulation_config?.concoursIntitulé ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {isInProgress
                        ? <span className="text-xs text-indigo-400">En cours</span>
                        : level
                          ? <span className={`text-xs font-medium capitalize ${lvlColor[level] ?? 'text-gray-400'}`}>{level}</span>
                          : null
                      }
                      <Link
                        href={isInProgress ? `/simulation/${sim.id}` : `/simulation/rapport/${sim.id}`}
                        className="text-xs text-indigo-400 hover:underline"
                      >
                        {isInProgress ? 'Continuer' : 'Rapport'}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </DCard>
        )}
      </div>

      {/* Sidebar (1/3) */}
      <div className="space-y-5">
        <CoachWidget booking={bookings[0] ?? null} />
        <RecommendedActions sims={sims} reports={reports} bookings={bookings} />
        {/* Credits */}
      </div>
    </div>
  )
}

/* ── State: EXAM IMMINENT ── */
function StateExamImminent({ sims, reports, reportMap, bookings, examGoal }: {
  sims: Simulation[]; reports: ReportData[]; reportMap: Map<string, ReportData>; bookings: Booking[]; examGoal: Goal
}) {
  const days = examGoal.target_date ? differenceInDays(new Date(examGoal.target_date), new Date()) : 0
  const completedCount = sims.filter(s => s.status === 'completed').length
  const targetCount = days <= 7 ? 7 : days <= 14 ? 7 : 10
  const gaugePercent = Math.min(100, Math.round((completedCount / targetCount) * 100))

  const plan = days <= 7
    ? ['1 simulation par jour, focus sur vos points faibles', 'Session coach avant l\'épreuve si possible', 'Révisez votre plan d\'action de la dernière simulation']
    : days <= 14
      ? ['Une simulation tous les 2 jours', '1 session coach cette semaine', 'Travaillez les 2 axes les plus faibles']
      : ['2-3 simulations par semaine', '2 sessions coach réparties sur la période', 'Variez les formats d\'épreuve']

  const lastCompletedSim = sims.find(s => s.status === 'completed')
  const lastReport = lastCompletedSim ? reportMap.get(lastCompletedSim.id) ?? null : null

  const weakAxes = reports.slice(-5).reduce<Record<string, { sum: number; count: number }>>((acc, r) => {
    if (r?.axisScores) Object.entries(r.axisScores).forEach(([k, v]) => {
      if (!acc[k]) acc[k] = { sum: 0, count: 0 }
      acc[k].sum += v; acc[k].count += 1
    })
    return acc
  }, {})
  const weakestAxes = Object.entries(weakAxes)
    .map(([key, v]) => ({ key, avg: v.sum / v.count }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3)

  const [checklist, setChecklist] = useState<Record<number, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem('jurya_exam_checklist') ?? '{}') } catch { return {} }
  })
  const toggleCheck = (i: number) => {
    const next = { ...checklist, [i]: !checklist[i] }
    setChecklist(next)
    localStorage.setItem('jurya_exam_checklist', JSON.stringify(next))
  }
  const checkItems = ['Vérifier la convocation', 'Préparer sa tenue', 'Repérer le lieu de l\'épreuve', 'Préparer le matériel autorisé', 'Imprimer le plan d\'action du dernier rapport']
  const checkCount = Object.values(checklist).filter(Boolean).length

  return (
    <div className="space-y-5">
      {/* Countdown header */}
      <div className="rounded-2xl p-5 border border-amber-500/30 bg-amber-500/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium text-white">Votre oral dans {days} jour{days > 1 ? 's' : ''}</h2>
            {examGoal.target_date && (
              <p className="text-sm text-amber-400/80 mt-1">
                {format(new Date(examGoal.target_date), "dd MMMM yyyy", { locale: fr })}
                {examGoal.concours?.intitulé ? ` · ${examGoal.concours.intitulé}` : ''}
              </p>
            )}
          </div>
          <Link href="/simulation/setup" className="shrink-0 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-amber-500/30">
            Lancer une simulation
          </Link>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Préparation : {completedCount}/{targetCount} simulations recommandées</span>
            <span>{gaugePercent}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${gaugePercent}%` }} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Training plan */}
          <DCard>
            <SectionTitle icon={Target}>Plan d&apos;entraînement recommandé</SectionTitle>
            <div className="space-y-2">
              {plan.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 py-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">{i + 1}</span>
                  <p className="text-sm text-gray-300">{item}</p>
                </div>
              ))}
            </div>
            <Link href="/simulation/setup" className="mt-4 block text-center py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
              Lancer une simulation maintenant
            </Link>
          </DCard>

          {/* Weak axes */}
          {weakestAxes.length > 0 && (
            <DCard>
              <SectionTitle icon={AlertTriangle}>Faiblesses à combler en priorité</SectionTitle>
              <div className="space-y-3">
                {weakestAxes.map(({ key, avg }) => (
                  <div key={key} className="flex items-center justify-between py-2 px-3 bg-white/3 rounded-xl">
                    <div>
                      <p className="text-sm text-white font-medium">{AXIS_LABELS[key] ?? key}</p>
                      <p className="text-xs text-gray-500">Niveau moyen : {avg.toFixed(1)}/5 sur les 5 dernières sessions</p>
                    </div>
                    <Link href="/simulation/setup" className="text-xs bg-indigo-600/80 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                      S&apos;entraîner
                    </Link>
                  </div>
                ))}
              </div>
            </DCard>
          )}

          {lastCompletedSim && <LastSimulationCard sim={lastCompletedSim} report={lastReport} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <CoachWidget booking={bookings[0] ?? null} />

          {/* Day-J checklist */}
          <DCard>
            <SectionTitle icon={CheckCircle2}>Checklist jour J</SectionTitle>
            <p className="text-xs text-gray-500 mb-3">{checkCount}/{checkItems.length} complété</p>
            <div className="space-y-2">
              {checkItems.map((item, i) => (
                <button key={i} onClick={() => toggleCheck(i)} className="flex items-center gap-2.5 w-full text-left py-1.5 hover:opacity-80 transition-opacity">
                  {checklist[i]
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    : <Circle className="w-4 h-4 text-gray-600 shrink-0" />
                  }
                  <span className={`text-sm ${checklist[i] ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{item}</span>
                </button>
              ))}
            </div>
          </DCard>
        </div>
      </div>
    </div>
  )
}

/* ══ Main page ══ */
export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [sims, setSims] = useState<Simulation[]>([])
  const [reports, setReports] = useState<ReportData[]>([])
  const [reportMap, setReportMap] = useState<Map<string, ReportData>>(new Map())
  const [goals, setGoals] = useState<Goal[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && profile?.user_type === 'coach') router.replace('/coach/dashboard')
  }, [user, authLoading, profile, router])

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const uid = user.id

    const [simRes, goalRes, bookRes] = await Promise.all([
      supabase
        .from('simulations')
        .select('id, created_at, completed_at, actual_duration_seconds, status, simulation_config')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('user_concours_goals')
        .select('id, target_date, status, concours:concours_id(intitulé)')
        .eq('user_id', uid),
      supabase
        .from('bookings')
        .select('id, scheduled_at, status, coach:coach_id(full_name)')
        .eq('candidate_id', uid)
        .in('status', ['confirmed', 'pending'])
        .order('scheduled_at', { ascending: true })
        .limit(3),
    ])

    const simsData = (simRes.data ?? []) as unknown as Simulation[]
    setSims(simsData)
    setGoals((goalRes.data ?? []) as unknown as Goal[])
    setBookings((bookRes.data ?? []) as unknown as Booking[])

    if (simsData.length > 0) {
      const { data: reps } = await supabase
        .from('simulation_reports')
        .select('simulation_id, report_data, created_at')
        .in('simulation_id', simsData.map(s => s.id))
        .order('created_at', { ascending: true })

      const repList = (reps ?? []) as SimReport[]
      const map = new Map(repList.map(r => [r.simulation_id, r.report_data as ReportData]))
      setReportMap(map)
      setReports(repList.map(r => r.report_data as ReportData).filter(Boolean))
    }

    setLoading(false)
  }, [user])

  useEffect(() => { if (user) fetchAll() }, [user, fetchAll])

  /* ── Derived ── */
  const firstName = getFirstName(profile?.full_name, user?.email)
  const available = profile ? Math.max(0, profile.interviews_limit - profile.interviews_used_this_month) : 0
  const completedCount = sims.filter(s => s.status === 'completed').length

  // Detect state
  const examGoal = goals
    .filter(g => g.target_date && differenceInDays(new Date(g.target_date), new Date()) >= 0 && differenceInDays(new Date(g.target_date), new Date()) <= 30)
    .sort((a, b) => new Date(a.target_date!).getTime() - new Date(b.target_date!).getTime())[0]

  const state: DashboardState = examGoal ? 'exam_imminent' : completedCount === 0 ? 'new' : 'active'

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F1629' }}>
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#0F1629' }}>
      <CandidateNavbar />
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8 space-y-7">
        {/* Common header */}
        <DashboardHeader
          firstName={firstName}
          credits={available}
          showLaunch={state !== 'new'}
        />

        {/* Exam date nudge for active users without a goal */}
        {state === 'active' && goals.filter(g => g.target_date).length === 0 && (
          <div className="flex items-center justify-between bg-white/3 border border-white/8 rounded-xl px-4 py-3">
            <p className="text-sm text-gray-400">Renseignez votre date d&apos;oral pour activer le mode préparation intensive.</p>
            <Link href="/profile" className="text-xs text-indigo-400 hover:underline shrink-0 ml-4">Ajouter →</Link>
          </div>
        )}

        {/* State-specific content */}
        {state === 'new' && <StateNew firstName={firstName} />}
        {state === 'active' && (
          <StateActive sims={sims} reports={reports} reportMap={reportMap} bookings={bookings} />
        )}
        {state === 'exam_imminent' && examGoal && (
          <StateExamImminent sims={sims} reports={reports} reportMap={reportMap} bookings={bookings} examGoal={examGoal} />
        )}

        {/* Credits widget at bottom for active/exam states */}
        {(state === 'active' || state === 'exam_imminent') && profile && (
          <CreditsWidget used={profile.interviews_used_this_month} limit={profile.interviews_limit} />
        )}
      </div>
    </div>
  )
}
