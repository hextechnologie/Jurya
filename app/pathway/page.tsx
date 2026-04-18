'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { LoadingSpinner, Badge } from '@/components/ui'
import { Target, CheckCircle, Circle, ChevronDown, ChevronRight, BookOpen, Mic, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { differenceInDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'

/* ---------- types ---------- */
type Plan = {
  id: string
  start_date: string
  end_date: string
  total_weeks: number
  status: string
  goal: {
    concours: { intitulé: string } | null
  } | null
}

type Milestone = {
  id: string
  plan_id: string
  week_number: number
  title_fr: string
  description_fr: string | null
  target_simulations_count: number
  completed_at: string | null
  score_achieved: number | null
}

/* ---------- default 8-week template ---------- */
const DEFAULT_WEEKS: { theme: string; milestones: string[] }[] = [
  {
    theme: 'Découverte du concours',
    milestones: [
      'Lire la fiche concours complète',
      'Faire votre première simulation découverte',
      'Identifier vos 3 principaux axes d\'amélioration',
    ],
  },
  {
    theme: 'Les bases de la méthodologie',
    milestones: [
      'Faire 2 simulations cette semaine',
      'Lire la fiche sur la méthode STAR',
      'Atteindre un score de 8/20 minimum',
    ],
  },
  {
    theme: 'Structurer son exposé',
    milestones: [
      'Pratiquer 3 exposés chronométrés (5 min)',
      'Lire la fiche "Construire un plan solide"',
      'Obtenir un score Structure ≥ 10/20',
    ],
  },
  {
    theme: 'Motivation & parcours',
    milestones: [
      'Rédiger votre pitch de motivation (2 min)',
      'Faire 2 simulations axées motivation',
      'Atteindre un score Motivation ≥ 12/20',
    ],
  },
  {
    theme: 'Connaissances & culture générale',
    milestones: [
      'Réviser les 5 thèmes clés de votre concours',
      'Faire 3 simulations avec questions techniques',
      'Lire un rapport de jury récent',
    ],
  },
  {
    theme: 'Communication & gestion du stress',
    milestones: [
      'Pratiquer la respiration avant simulation',
      'Faire 2 simulations sans mot de remplissage',
      'Atteindre un score Communication ≥ 12/20',
    ],
  },
  {
    theme: 'Simulation intensive',
    milestones: [
      'Faire 4 simulations complètes cette semaine',
      'Réserver une séance avec un coach',
      'Atteindre un score global ≥ 14/20',
    ],
  },
  {
    theme: 'Dernière ligne droite',
    milestones: [
      'Faire 2 simulations en conditions réelles',
      'Relire toutes vos fiches de révision',
      'Préparer votre tenue et logistique du jour J',
      'Score cible : ≥ 16/20',
    ],
  },
]

export default function PathwayPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [plan, setPlan] = useState<Plan | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) fetchPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchPlan() {
    setLoading(true)
    const uid = user!.id

    const { data: plans } = await supabase
      .from('preparation_plans')
      .select('id, start_date, end_date, total_weeks, status, goal:goal_id(concours:concours_id(intitulé))')
      .eq('user_id', uid)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    const activePlan = (plans ?? [])[0] as unknown as Plan | undefined
    setPlan(activePlan ?? null)

    if (activePlan) {
      const { data: ms } = await supabase
        .from('preparation_milestones')
        .select('id, plan_id, week_number, title_fr, description_fr, target_simulations_count, completed_at, score_achieved')
        .eq('plan_id', activePlan.id)
        .order('week_number')
      setMilestones((ms ?? []) as Milestone[])

      // auto-expand current week
      const daysSinceStart = differenceInDays(new Date(), new Date(activePlan.start_date))
      const currentWeek = Math.max(1, Math.min(activePlan.total_weeks, Math.ceil(daysSinceStart / 7) + 1))
      setExpandedWeek(currentWeek)
    } else {
      setExpandedWeek(1)
    }

    setLoading(false)
  }

  // toggle milestone completion
  async function toggleMilestone(milestoneId: string, isCompleted: boolean) {
    setTogglingId(milestoneId)
    if (isCompleted) {
      await supabase.from('preparation_milestones').update({ completed_at: null }).eq('id', milestoneId)
      setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, completed_at: null } : m))
    } else {
      const now = new Date().toISOString()
      await supabase.from('preparation_milestones').update({ completed_at: now }).eq('id', milestoneId)
      setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, completed_at: now } : m))
    }
    setTogglingId(null)
  }

  // compute progress
  const completedCount = milestones.filter(m => m.completed_at).length
  const totalCount = milestones.length || (DEFAULT_WEEKS.reduce((s, w) => s + w.milestones.length, 0))
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const currentWeek = plan
    ? Math.max(1, Math.min(plan.total_weeks, Math.ceil(differenceInDays(new Date(), new Date(plan.start_date)) / 7) + 1))
    : 1

  // group milestones by week
  const milestonesByWeek: Record<number, Milestone[]> = {}
  for (const m of milestones) {
    if (!milestonesByWeek[m.week_number]) milestonesByWeek[m.week_number] = []
    milestonesByWeek[m.week_number].push(m)
  }

  const totalWeeks = plan?.total_weeks ?? 8
  const usingTemplate = milestones.length === 0

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> Plan de préparation en {totalWeeks} semaines
          </h1>
          {plan?.goal?.concours?.intitulé && (
            <p className="text-gray-400 mt-1">Concours : {plan.goal.concours.intitulé}</p>
          )}
          {!plan && (
            <p className="text-gray-400 mt-1">
              Programme par défaut — <Link href="/profile" className="text-primary hover:underline">configurez votre profil</Link> pour un plan personnalisé.
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400">
              Progression globale — Semaine {currentWeek}/{totalWeeks}
            </p>
            <p className="text-sm font-bold text-primary">{progressPercent}%</p>
          </div>
          <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => {
              const weekMilestones = milestonesByWeek[w] ?? []
              const weekDone = usingTemplate ? false : weekMilestones.length > 0 && weekMilestones.every(m => m.completed_at)
              return (
                <div
                  key={w}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition ${
                    weekDone
                      ? 'bg-primary text-white'
                      : w === currentWeek
                        ? 'bg-primary/30 text-primary border-2 border-primary'
                        : 'bg-white/10 text-gray-500'
                  }`}
                  onClick={() => setExpandedWeek(expandedWeek === w ? null : w)}
                >
                  {w}
                </div>
              )
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative space-y-4">
          {/* vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />

          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(weekNum => {
            const isExpanded = expandedWeek === weekNum
            const isCurrent = weekNum === currentWeek
            const weekMs = milestonesByWeek[weekNum] ?? []
            const templateWeek = DEFAULT_WEEKS[weekNum - 1]
            const items = usingTemplate
              ? (templateWeek?.milestones ?? []).map((title, j) => ({
                  id: `tpl-${weekNum}-${j}`,
                  title_fr: title,
                  completed_at: null as string | null,
                  isTemplate: true,
                }))
              : weekMs.map(m => ({ id: m.id, title_fr: m.title_fr, completed_at: m.completed_at, isTemplate: false }))

            const weekTheme = usingTemplate
              ? (templateWeek?.theme ?? `Semaine ${weekNum}`)
              : (weekMs[0]?.description_fr ?? `Semaine ${weekNum}`)

            const allDone = !usingTemplate && weekMs.length > 0 && weekMs.every(m => m.completed_at)
            const doneCount = items.filter(i => i.completed_at).length

            return (
              <div key={weekNum} className="relative pl-14">
                {/* dot */}
                <div className={`absolute left-4 top-4 w-5 h-5 rounded-full border-2 z-10 ${
                  allDone
                    ? 'bg-primary border-primary'
                    : isCurrent
                      ? 'bg-background border-primary'
                      : 'bg-background border-white/20'
                }`}>
                  {allDone && <CheckCircle className="w-3 h-3 text-white absolute top-0.5 left-0.5" />}
                </div>

                <div
                  className={`glass rounded-xl overflow-hidden transition-all ${isCurrent ? 'border-primary/50' : ''}`}
                >
                  {/* week header */}
                  <button
                    type="button"
                    onClick={() => setExpandedWeek(isExpanded ? null : weekNum)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-sm">
                          Semaine {weekNum}
                          {isCurrent && <Badge variant="default" className="ml-2">En cours</Badge>}
                        </p>
                        <p className="text-xs text-gray-400">{weekTheme}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!usingTemplate && (
                        <span className="text-xs text-gray-500">{doneCount}/{items.length}</span>
                      )}
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {/* expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {items.map(item => {
                        const isDone = !!item.completed_at
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-lg transition ${
                              isDone ? 'bg-primary/5' : 'bg-white/5'
                            } ${item.isTemplate ? '' : 'cursor-pointer hover:bg-white/10'}`}
                            onClick={() => {
                              if (!item.isTemplate) toggleMilestone(item.id, isDone)
                            }}
                          >
                            {isDone ? (
                              <CheckCircle className={`w-5 h-5 shrink-0 text-primary ${togglingId === item.id ? 'animate-pulse' : ''}`} />
                            ) : (
                              <Circle className={`w-5 h-5 shrink-0 text-gray-500 ${togglingId === item.id ? 'animate-pulse' : ''}`} />
                            )}
                            <p className={`text-sm ${isDone ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                              {item.title_fr}
                            </p>
                          </div>
                        )
                      })}

                      {/* quick actions for current week */}
                      {isCurrent && (
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10 mt-2">
                          <Link href="/interview" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs hover:bg-primary/20 transition">
                            <Mic className="w-3 h-3" /> Lancer une simulation
                          </Link>
                          <Link href="/content" className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-xs hover:bg-secondary/20 transition">
                            <BookOpen className="w-3 h-3" /> Voir les fiches
                          </Link>
                          <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg text-xs hover:bg-white/10 transition">
                            <TrendingUp className="w-3 h-3" /> Mes scores
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
