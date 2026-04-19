'use client'

import { useEffect, useState } from 'react'
import { supabase, getFirstName } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import CandidateNavbar from '@/components/CandidateNavbar'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts'
import { Calendar, Mic, BookOpen, TrendingUp, Clock, Target, Award, ChevronRight, CreditCard, User, CalendarCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LoadingSpinner, Badge } from '@/components/ui'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

/* ---------- types ---------- */
type Simulation = {
  id: string
  created_at: string
  completed_at: string | null
  overall_score: number | null
  actual_duration_seconds: number | null
  status: string
  concours: { intitulé: string } | null
}

type SimReport = {
  simulation_id: string
  overall_score: number
  overall_verdict: string | null
  axis_scores: Record<string, number>
}

type Goal = {
  id: string
  concours_id: string
  target_date: string | null
  status: string
  concours: { intitulé: string } | null
}

type Plan = {
  id: string
  start_date: string
  end_date: string
  total_weeks: number
  status: string
}

type Milestone = {
  id: string
  plan_id: string
  week_number: number
  title_fr: string
  completed_at: string | null
}

type Booking = {
  id: string
  scheduled_at: string | null
  status: string
  coach: { full_name: string | null } | null
}

const MOTIVATIONAL_QUOTES = [
  "Le succès, c'est aller d'échec en échec sans perdre son enthousiasme.",
  "La préparation d'aujourd'hui détermine la réussite de demain.",
  'Chaque simulation vous rapproche un peu plus de l\'admission.',
  'Le travail paie toujours. Continuez !',
  'Votre meilleur investissement, c\'est vous-même.',
]

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [reports, setReports] = useState<SimReport[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [plan, setPlan] = useState<Plan | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && profile?.user_type === 'coach') router.replace('/coach/dashboard')
  }, [user, authLoading, profile, router])

  useEffect(() => {
    if (user) fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchAll() {
    setLoading(true)
    const uid = user!.id

    const [simRes, goalRes, planRes, bookRes] = await Promise.all([
      supabase
        .from('simulations')
        .select('id, created_at, completed_at, overall_score, actual_duration_seconds, status, concours:concours_id(intitulé)')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('user_concours_goals')
        .select('id, concours_id, target_date, status, concours:concours_id(intitulé)')
        .eq('user_id', uid),
      supabase
        .from('preparation_plans')
        .select('id, start_date, end_date, total_weeks, status')
        .eq('user_id', uid)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('bookings')
        .select('id, scheduled_at, status, coach:coach_id(full_name)')
        .eq('candidate_id', uid)
        .in('status', ['confirmed', 'pending'])
        .order('scheduled_at', { ascending: true })
        .limit(3),
    ])

    const sims = (simRes.data ?? []) as unknown as Simulation[]
    setSimulations(sims)
    setGoals((goalRes.data ?? []) as unknown as Goal[])
    setBookings((bookRes.data ?? []) as unknown as Booking[])

    const activePlan = (planRes.data ?? [])[0] as Plan | undefined
    setPlan(activePlan ?? null)

    // fetch reports for loaded sims
    if (sims.length > 0) {
      const ids = sims.map(s => s.id)
      const { data: reps } = await supabase
        .from('simulation_reports')
        .select('simulation_id, overall_score, overall_verdict, axis_scores')
        .in('simulation_id', ids)
      setReports((reps ?? []) as SimReport[])
    }

    // milestones
    if (activePlan) {
      const { data: ms } = await supabase
        .from('preparation_milestones')
        .select('id, plan_id, week_number, title_fr, completed_at')
        .eq('plan_id', activePlan.id)
        .order('week_number')
      setMilestones((ms ?? []) as Milestone[])
    }

    setLoading(false)
  }

  /* ---------- derived data ---------- */
  const firstName = getFirstName(profile?.full_name, user?.email)
  const quote = MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length]

  const completedSims = simulations.filter(s => s.status === 'completed')
  const totalSims = completedSims.length

  const reportMap = new Map(reports.map(r => [r.simulation_id, r]))

  // avg score
  const scores = reports.map(r => r.overall_score).filter(Boolean)
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0

  // total training time (hours)
  const totalSeconds = completedSims.reduce((acc, s) => acc + (s.actual_duration_seconds ?? 0), 0)
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10

  // next concours countdown
  const nextGoal = goals
    .filter(g => g.target_date)
    .sort((a, b) => new Date(a.target_date!).getTime() - new Date(b.target_date!).getTime())[0]
  const daysUntilConcours = nextGoal?.target_date
    ? differenceInDays(new Date(nextGoal.target_date), new Date())
    : null

  // chart data (last 10 completed with reports)
  const chartData = completedSims
    .filter(s => reportMap.has(s.id))
    .slice(0, 10)
    .reverse()
    .map(s => ({
      date: format(new Date(s.completed_at || s.created_at), 'dd/MM', { locale: fr }),
      score: reportMap.get(s.id)!.overall_score,
    }))

  // radar data (average per axis)
  const axisTotals: Record<string, { sum: number; count: number }> = {}
  for (const r of reports) {
    if (r.axis_scores && typeof r.axis_scores === 'object') {
      for (const [axis, val] of Object.entries(r.axis_scores)) {
        if (typeof val === 'number') {
          if (!axisTotals[axis]) axisTotals[axis] = { sum: 0, count: 0 }
          axisTotals[axis].sum += val
          axisTotals[axis].count += 1
        }
      }
    }
  }
  const axisLabels: Record<string, string> = {
    structure: 'Structure',
    motivation: 'Motivation',
    connaissances: 'Connaissances',
    communication: 'Communication',
  }
  const radarData = Object.entries(axisLabels).map(([key, label]) => ({
    axis: label,
    score: axisTotals[key]
      ? Math.round((axisTotals[key].sum / axisTotals[key].count) * 10) / 10
      : 0,
  }))

  // prep progress
  const completedMilestones = milestones.filter(m => m.completed_at).length
  const totalMilestones = milestones.length
  const prepPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
  const currentWeek = plan
    ? Math.max(1, Math.min(plan.total_weeks, Math.ceil(differenceInDays(new Date(), new Date(plan.start_date)) / 7) + 1))
    : null

  // verdict badge helper
  function verdictBadge(v: string | null | undefined) {
    if (!v) return null
    const map: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      excellent: 'success', 'très_bien': 'success', bien: 'success',
      moyen: 'warning', insuffisant: 'danger', 'très_insuffisant': 'danger',
    }
    return <Badge variant={map[v] ?? 'default'}>{v.replace(/_/g, ' ')}</Badge>
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CandidateNavbar />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* ── Welcome Banner ── */}
        <section className="glass rounded-2xl p-8 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Bonjour {firstName} 👋</h1>
              <p className="text-gray-400 mt-2 italic">&ldquo;{quote}&rdquo;</p>
            </div>
            <div className="flex items-center gap-3">
              {daysUntilConcours !== null && daysUntilConcours > 0 && (
                <div className="flex items-center gap-3 bg-white/5 rounded-xl px-6 py-4 border border-white/10">
                  <Target className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-primary">{daysUntilConcours}</p>
                    <p className="text-xs text-gray-400">jours avant le concours</p>
                  </div>
                </div>
              )}
              <Link
                href="/simulation/setup"
                className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-4 font-semibold transition-colors"
              >
                <Mic className="w-5 h-5" />
                Lancer une simulation
              </Link>
            </div>
          </div>
        </section>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score evolution */}
          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Évolution des scores
            </h2>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis domain={[0, 20]} stroke="#666" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="url(#scoreLine)" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-gray-500">
                <p>Complétez au moins 2 simulations pour voir votre progression.</p>
              </div>
            )}
          </div>

          {/* Radar */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" /> Radar des compétences
            </h2>
            {reports.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#2a2a3a" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#a78bfa', fontSize: 12 }} />
                  <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-gray-500 text-sm text-center">
                Pas encore de données.<br />Lancez une simulation !
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Mic, label: 'Simulations effectuées', value: totalSims, color: 'text-purple-400' },
            { icon: TrendingUp, label: 'Score moyen', value: avgScore ? `${avgScore.toFixed(1)}/20` : '—', color: 'text-blue-400' },
            { icon: Clock, label: "Temps d'entraînement", value: `${totalHours}h`, color: 'text-emerald-400' },
            { icon: Calendar, label: 'Jours avant concours', value: daysUntilConcours ?? '—', color: 'text-amber-400' },
          ].map((s, i) => (
            <div key={i} className="glass rounded-xl p-5 flex flex-col items-center text-center gap-2">
              <s.icon className={`w-7 h-7 ${s.color}`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Upcoming Section ── */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> À venir
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* next sim */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Prochaine simulation</p>
              <p className="font-medium">{plan && currentWeek ? `Semaine ${currentWeek} du plan` : 'Planifiez votre prochaine session'}</p>
              <Link href="/simulation/setup" className="text-primary text-sm mt-2 inline-flex items-center gap-1 hover:underline">
                Lancer <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {/* next coach session */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Prochaine séance coach</p>
              {bookings[0] ? (
                <>
                  <p className="font-medium">{bookings[0].coach?.full_name ?? 'Coach'}</p>
                  <p className="text-sm text-gray-400">
                    {bookings[0].scheduled_at
                      ? format(new Date(bookings[0].scheduled_at), 'dd MMM yyyy à HH:mm', { locale: fr })
                      : 'Date à confirmer'}
                  </p>
                </>
              ) : (
                <p className="text-gray-500 text-sm">Aucune séance planifiée</p>
              )}
              <Link href="/coaches" className="text-primary text-sm mt-2 inline-flex items-center gap-1 hover:underline">
                Voir les coachs <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {/* next milestone */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Prochain objectif</p>
              {(() => {
                const next = milestones.find(m => !m.completed_at)
                return next ? (
                  <p className="font-medium">Semaine {next.week_number}: {next.title_fr}</p>
                ) : (
                  <p className="text-gray-500 text-sm">{plan ? 'Tous les jalons complétés !' : 'Activez un plan de préparation'}</p>
                )
              })()}
              <Link href="/pathway" className="text-primary text-sm mt-2 inline-flex items-center gap-1 hover:underline">
                Voir le plan <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Recent Simulations ── */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" /> Simulations récentes
            </h2>
            {completedSims.length > 5 && (
              <Link href="/simulation/setup" className="text-primary text-sm hover:underline flex items-center gap-1">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          {completedSims.length === 0 ? (
            <div className="text-center py-8">
              <Mic className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">Aucune simulation terminée pour le moment.</p>
              <Link
                href="/simulation/setup"
                className="inline-flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              >
                Lancer ma première simulation <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="text-left py-3 px-2">Date</th>
                    <th className="text-left py-3 px-2">Concours</th>
                    <th className="text-center py-3 px-2">Score</th>
                    <th className="text-center py-3 px-2">Verdict</th>
                    <th className="text-right py-3 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {completedSims.slice(0, 5).map(sim => {
                    const rep = reportMap.get(sim.id)
                    return (
                      <tr key={sim.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-3 px-2">
                          {format(new Date(sim.completed_at || sim.created_at), 'dd MMM yyyy', { locale: fr })}
                        </td>
                        <td className="py-3 px-2">{sim.concours?.intitulé ?? '—'}</td>
                        <td className="py-3 px-2 text-center font-semibold">
                          {rep ? `${rep.overall_score}/20` : '—'}
                        </td>
                        <td className="py-3 px-2 text-center">{verdictBadge(rep?.overall_verdict)}</td>
                        <td className="py-3 px-2 text-right">
                          <Link href={`/review/${sim.id}`} className="text-primary hover:underline text-xs">
                            Détails
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { href: '/simulation/setup', icon: Mic, title: 'Nouvelle simulation', desc: 'Entraînez-vous dans les conditions du concours', gradient: 'from-purple-600/20 to-blue-600/20' },
            { href: '/calendar', icon: Calendar, title: 'Voir le calendrier', desc: 'Dates et échéances des concours', gradient: 'from-blue-600/20 to-cyan-600/20' },
            { href: '/coaches', icon: BookOpen, title: 'Contacter un coach', desc: "Bénéficiez de l'expertise d'un ancien jury", gradient: 'from-emerald-600/20 to-teal-600/20' },
            { href: '/profile', icon: User, title: 'Modifier mon profil', desc: 'Mettez à jour vos informations personnelles', gradient: 'from-amber-600/20 to-orange-600/20' },
            { href: '/credits', icon: CreditCard, title: 'Mes crédits', desc: 'Gérez votre solde et achetez des crédits', gradient: 'from-pink-600/20 to-rose-600/20' },
            { href: '/bookings', icon: CalendarCheck, title: 'Mes réservations', desc: 'Consultez vos séances planifiées', gradient: 'from-indigo-600/20 to-violet-600/20' },
          ].map((action, i) => (
            <Link key={i} href={action.href} className={`glass rounded-xl p-6 bg-gradient-to-br ${action.gradient} hover:scale-[1.02] transition-transform group`}>
              <action.icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-lg">{action.title}</h3>
              <p className="text-gray-400 text-sm mt-1">{action.desc}</p>
              <span className="text-primary text-sm mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Commencer <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>

        {/* ── Prep Pathway Progress ── */}
        {plan && (
          <section className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Plan de préparation
              </h2>
              <Link href="/pathway" className="text-primary text-sm hover:underline flex items-center gap-1">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex items-center gap-4 mb-2">
              <p className="text-sm text-gray-400">
                Semaine {currentWeek}/{plan.total_weeks} &middot; {completedMilestones}/{totalMilestones} jalons
              </p>
              <p className="text-sm font-semibold text-primary">{prepPercent}%</p>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                style={{ width: `${prepPercent}%` }}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
