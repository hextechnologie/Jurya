'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { LoadingSpinner, Badge } from '@/components/ui'
import CandidateNavbar from '@/components/CandidateNavbar'
import { Calendar, ChevronLeft, ChevronRight, Bell, BellOff, Filter } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  addMonths, subMonths, isSameDay, isSameMonth, differenceInDays, isAfter,
} from 'date-fns'
import { fr } from 'date-fns/locale'

/* ---------- types ---------- */
type ConcoursSession = {
  id: string
  concours_id: string
  year: number
  country: string
  inscription_open_date: string | null
  inscription_close_date: string | null
  épreuves_écrites_date: string | null
  épreuves_orales_start_date: string | null
  épreuves_orales_end_date: string | null
  résultats_date: string | null
  concours: { intitulé: string } | null
}

type CalendarEvent = {
  date: Date
  type: 'inscription_ouverture' | 'inscription_clôture' | 'épreuves_écrites' | 'épreuves_orales' | 'résultats'
  label: string
  concoursName: string
  sessionId: string
}

type Reminder = {
  id: string
  concours_session_id: string
  trigger_type: string
  active: boolean
}

const EVENT_COLORS: Record<string, string> = {
  inscription_ouverture: 'bg-green-500',
  inscription_clôture: 'bg-amber-500',
  épreuves_écrites: 'bg-blue-500',
  épreuves_orales: 'bg-purple-500',
  résultats: 'bg-emerald-500',
}

const EVENT_LABELS: Record<string, string> = {
  inscription_ouverture: 'Ouverture des inscriptions',
  inscription_clôture: 'Clôture des inscriptions',
  épreuves_écrites: 'Épreuves écrites',
  épreuves_orales: 'Épreuves orales',
  résultats: 'Résultats',
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [sessions, setSessions] = useState<ConcoursSession[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [userGoalConcours, setUserGoalConcours] = useState<string[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [filterMyOnly, setFilterMyOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingReminder, setSavingReminder] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchAll() {
    setLoading(true)
    const uid = user!.id

    const [sessRes, goalRes, remRes] = await Promise.all([
      supabase
        .from('concours_sessions')
        .select('id, concours_id, year, country, inscription_open_date, inscription_close_date, épreuves_écrites_date, épreuves_orales_start_date, épreuves_orales_end_date, résultats_date, concours:concours_id(intitulé)')
        .order('year', { ascending: true }),
      supabase
        .from('user_concours_goals')
        .select('concours_id')
        .eq('user_id', uid),
      supabase
        .from('reminders')
        .select('id, concours_session_id, trigger_type, active')
        .eq('user_id', uid),
    ])

    setSessions((sessRes.data ?? []) as unknown as ConcoursSession[])
    setUserGoalConcours((goalRes.data ?? []).map((g: any) => g.concours_id))
    setReminders((remRes.data ?? []) as Reminder[])
    setLoading(false)
  }

  // build events from sessions
  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = []
    const filtered = filterMyOnly
      ? sessions.filter(s => userGoalConcours.includes(s.concours_id))
      : sessions

    for (const s of filtered) {
      const name = s.concours?.intitulé ?? 'Concours'
      const pairs: [string | null, CalendarEvent['type']][] = [
        [s.inscription_open_date, 'inscription_ouverture'],
        [s.inscription_close_date, 'inscription_clôture'],
        [s.épreuves_écrites_date, 'épreuves_écrites'],
        [s.épreuves_orales_start_date, 'épreuves_orales'],
        [s.résultats_date, 'résultats'],
      ]
      for (const [dateStr, type] of pairs) {
        if (dateStr) {
          events.push({
            date: new Date(dateStr),
            type,
            label: EVENT_LABELS[type],
            concoursName: name,
            sessionId: s.id,
          })
        }
      }
    }
    return events.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [sessions, filterMyOnly, userGoalConcours])

  // calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // pad start (Monday = 0)
  const startDow = (getDay(monthStart) + 6) % 7
  const paddedDays: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...daysInMonth,
  ]
  // pad end to fill last row
  while (paddedDays.length % 7 !== 0) paddedDays.push(null)

  function eventsForDay(day: Date) {
    return allEvents.filter(e => isSameDay(e.date, day))
  }

  // upcoming events (future only)
  const upcomingEvents = allEvents.filter(e => isAfter(e.date, new Date())).slice(0, 10)

  // reminder toggle
  async function toggleReminder(sessionId: string, triggerType: string) {
    if (!user) return
    setSavingReminder(`${sessionId}-${triggerType}`)

    const existing = reminders.find(r => r.concours_session_id === sessionId && r.trigger_type === triggerType)
    if (existing) {
      if (existing.active) {
        await supabase.from('reminders').update({ active: false }).eq('id', existing.id)
        setReminders(prev => prev.map(r => r.id === existing.id ? { ...r, active: false } : r))
      } else {
        await supabase.from('reminders').update({ active: true }).eq('id', existing.id)
        setReminders(prev => prev.map(r => r.id === existing.id ? { ...r, active: true } : r))
      }
    } else {
      const { data } = await supabase.from('reminders').insert({
        user_id: user.id,
        concours_session_id: sessionId,
        trigger_type: triggerType,
        offset_days: -7,
        channel: 'email',
        active: true,
      }).select().single()
      if (data) setReminders(prev => [...prev, data as Reminder])
    }
    setSavingReminder(null)
  }

  function hasActiveReminder(sessionId: string, triggerType: string) {
    return reminders.some(r => r.concours_session_id === sessionId && r.trigger_type === triggerType && r.active)
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
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" /> Calendrier des concours
          </h1>
          <button
            type="button"
            onClick={() => setFilterMyOnly(!filterMyOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition ${
              filterMyOnly ? 'bg-primary/20 border-primary text-primary-light' : 'border-white/10 text-gray-400 hover:border-white/30'
            }`}
          >
            <Filter className="w-4 h-4" />
            {filterMyOnly ? 'Mes concours uniquement' : 'Tous les concours'}
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="glass rounded-2xl p-6">
          {/* month nav */}
          <div className="flex items-center justify-between mb-6">
            <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white/10 rounded-lg transition">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h2>
            <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white/10 rounded-lg transition">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* day cells */}
          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} className="h-20" />
              const dayEvents = eventsForDay(day)
              const isToday = isSameDay(day, new Date())
              const inMonth = isSameMonth(day, currentMonth)
              return (
                <div
                  key={day.toISOString()}
                  className={`h-20 rounded-lg p-1 border transition ${
                    isToday ? 'border-primary bg-primary/10' : 'border-transparent hover:border-white/10'
                  } ${!inMonth ? 'opacity-30' : ''}`}
                >
                  <p className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-gray-400'}`}>
                    {format(day, 'd')}
                  </p>
                  <div className="flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 3).map((ev, j) => (
                      <div
                        key={j}
                        className={`w-2 h-2 rounded-full ${EVENT_COLORS[ev.type]}`}
                        title={`${ev.concoursName} — ${ev.label}`}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/10">
            {Object.entries(EVENT_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className={`w-2.5 h-2.5 rounded-full ${EVENT_COLORS[key]}`} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Prochains événements</h2>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500">Aucun événement à venir.</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((ev, i) => {
                const daysLeft = differenceInDays(ev.date, new Date())
                const reminded = hasActiveReminder(ev.sessionId, ev.type)
                return (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${EVENT_COLORS[ev.type]}`} />
                      <div>
                        <p className="font-medium text-sm">{ev.concoursName}</p>
                        <p className="text-xs text-gray-400">{ev.label} — {format(ev.date, 'dd MMMM yyyy', { locale: fr })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={daysLeft <= 7 ? 'danger' : daysLeft <= 30 ? 'warning' : 'default'}>
                        J-{daysLeft}
                      </Badge>
                      <button
                        type="button"
                        disabled={savingReminder === `${ev.sessionId}-${ev.type}`}
                        onClick={() => toggleReminder(ev.sessionId, ev.type)}
                        className={`p-2 rounded-lg transition ${reminded ? 'text-primary bg-primary/10' : 'text-gray-500 hover:text-primary hover:bg-white/5'}`}
                        title={reminded ? 'Rappel activé' : 'Ajouter un rappel'}
                      >
                        {reminded ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
