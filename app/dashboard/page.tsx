'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Button, Card, LoadingSpinner, Badge } from '@/components/ui'
import { NotificationBell } from '@/components/NotificationBell'
import CreditBalanceButton from '@/components/CreditBalanceButton'
import { supabase, InterviewSession, InterviewAnswer, getFirstName } from '@/lib/supabase'
import JobOffers from '@/components/JobOffers'
import {
  Sparkles,
  LogOut,
  TrendingUp,
  Award,
  Calendar,
  Plus,
  CreditCard,
  Trash2,
  Flame,
  ArrowRight,
  Target,
  User,
  ChevronDown,
  Menu,
  X,
  Settings,
  Wallet,
  Bell,
} from 'lucide-react'
import Link from 'next/link'
import { format, subDays } from 'date-fns'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

const DAILY_TIPS = [
  { tip: 'Use the STAR method (Situation, Task, Action, Result) to keep your answers structured and memorable.', category: 'Structure 📋' },
  { tip: 'Add specific numbers and outcomes to prove the impact of your work.', category: 'Confidence 💪' },
  { tip: 'Take 2-3 seconds to pause before answering — it shows composure, not hesitation.', category: 'Confidence 💪' },
  { tip: 'Keep each answer focused on one strong example instead of listing many weak ones.', category: 'Structure 📋' },
  { tip: "Research the company's latest product launches or news before your interview.", category: 'Preparation 📚' },
  { tip: 'Prepare 3 genuine questions to ask the interviewer to demonstrate your interest.', category: 'Communication 💬' },
  { tip: 'Avoid filler words like "um", "uh", and "like" by practicing answers out loud daily.', category: 'Communication 💬' },
  { tip: 'Mirror the calm energy of the interviewer — composure always wins.', category: 'Confidence 💪' },
  { tip: 'Tailor each answer to the specific job description and company values.', category: 'Preparation 📚' },
  { tip: 'End each answer with a brief summary sentence to reinforce your key point.', category: 'Structure 📋' },
]

type BookingWithCoach = {
  id: string
  scheduled_at: string | null
  duration_minutes: number
  status: string
  notes: string | null
  coach: { full_name: string | null; email: string } | null
}

function calculateStreak(completedSessions: InterviewSession[]) {
  if (completedSessions.length === 0) return 0

  const completedDates = new Set(
    completedSessions.map((session) =>
      format(new Date(session.completed_at || session.created_at), 'yyyy-MM-dd')
    )
  )

  let streak = 0
  let cursor = new Date()

  if (!completedDates.has(format(cursor, 'yyyy-MM-dd'))) {
    cursor = subDays(cursor, 1)
  }

  while (completedDates.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1
    cursor = subDays(cursor, 1)
  }

  return streak
}

function getInterviewType(session: InterviewSession) {
  return session.interview_config?.interviewType || 'Mixed'
}

function trendLabel(val: number) {
  if (val > 0) return <span className="text-green-400">↑ Improving</span>
  if (val < 0) return <span className="text-red-400">↓ Declining</span>
  return <span className="text-gray-400">→ Stable</span>
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [stats, setStats] = useState({ totalInterviews: 0, avgScore: 0, interviewsThisMonth: 0, streakDays: 0 })
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [coachMetrics, setCoachMetrics] = useState({ confidence: 0, clarity: 0, fillerWords: 0, improvement: 0, lastSessionScores: [] as number[] })
  const [activeCoachTab, setActiveCoachTab] = useState<'upcoming' | 'my-coaches'>('upcoming')
  const [bookings, setBookings] = useState<BookingWithCoach[]>([])
  const [profileOpen, setProfileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)
  const [realCoaches, setRealCoaches] = useState<{ id: string; full_name: string | null; coach_profiles: { title: string | null; price_per_hour: number | null } | null; coach_specializations: { specialization: string }[] }[]>([])
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
    // Coaches must never see the candidate dashboard
    if (!authLoading && user && profile?.user_type === 'coach') {
      router.replace('/coach/dashboard')
    }
  }, [user, authLoading, profile, router])

  useEffect(() => {
    if (user && profile) {
      fetchDashboardData()
      fetchBookings()
      fetchRealCoaches()
    }
  }, [user, profile])

  // Daily tip from localStorage
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    try {
      const stored = localStorage.getItem('dailyTip')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.date === today) { setTipIndex(parsed.index); return }
      }
      const idx = new Date().getDate() % DAILY_TIPS.length
      setTipIndex(idx)
      localStorage.setItem('dailyTip', JSON.stringify({ date: today, index: idx }))
    } catch { setTipIndex(new Date().getDate() % DAILY_TIPS.length) }
  }, [])

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchRealCoaches = async () => {
    if (!user) return
    try {
      // Fetch coaches excluding current user
      const { data: cpData } = await supabase
        .from('coach_profiles')
        .select('user_id, title, price_per_hour')
        .neq('user_id', user.id) // Exclude current user
        .limit(6)
      
      if (!cpData || cpData.length === 0) return
      
      const userIds = cpData.map((c) => c.user_id)
      
      // Only get profiles with user_type = 'coach'  
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, user_type')
        .in('id', userIds)
        .eq('user_type', 'coach') // Only coaches
        
      const { data: specsData } = await supabase
        .from('coach_specializations')
        .select('coach_id, specialization')
        .in('coach_id', userIds)
        
      // Filter and merge only valid coach profiles
      const validCoachIds = profileData?.map(p => p.id) || []
      const merged = cpData
        .filter(cp => validCoachIds.includes(cp.user_id))
        .map((cp) => ({
          id: cp.user_id,
          full_name: profileData?.find((p) => p.id === cp.user_id)?.full_name ?? null,
          email: profileData?.find((p) => p.id === cp.user_id)?.email ?? null,
          avatar_url: profileData?.find((p) => p.id === cp.user_id)?.avatar_url ?? null,
          coach_profiles: { title: cp.title, price_per_hour: cp.price_per_hour },
          coach_specializations: (specsData ?? []).filter((s) => s.coach_id === cp.user_id).map((s) => ({ specialization: s.specialization })),
        }))
      setRealCoaches(merged as any)
    } catch (error) {
      console.error('Error fetching coaches:', error)
      setRealCoaches([])
    }
  }

  const fetchBookings = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('bookings')
        .select('id, scheduled_at, duration_minutes, status, notes, coach:profiles!bookings_coach_id_fkey(full_name, email)')
        .eq('candidate_id', user.id)
        .neq('coach_id', user.id) // Exclude self-bookings
        .eq('status', 'confirmed') // Only show confirmed bookings
        .order('scheduled_at', { ascending: true })
      setBookings((data || []) as unknown as BookingWithCoach[])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setBookings([])
    }
  }


  const fetchDashboardData = async () => {
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (sessionsError) throw sessionsError

      const allSessions = (sessionsData || []) as InterviewSession[]
      setSessions(allSessions)

      const completed = allSessions.filter((s) => s.status === 'completed')
      const avgScore = completed.length
        ? completed.reduce((sum, s) => sum + Number(s.overall_score || 0), 0) / completed.length
        : 0

      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const interviewsThisMonth = allSessions.filter(
        (s) => new Date(s.created_at) >= monthStart
      ).length

      setStats({
        totalInterviews: allSessions.length,
        avgScore: Math.round(avgScore * 10) / 10,
        interviewsThisMonth,
        streakDays: calculateStreak(completed),
      })

      if (allSessions.length > 0) {
        const { data: answersData } = await supabase
          .from('interview_answers')
          .select('*')
          .in('session_id', allSessions.map((session) => session.id))

        const answers = (answersData || []) as InterviewAnswer[]
        const metrics = answers
          .map((answer) => answer.ai_feedback?.metrics)
          .filter(Boolean) as NonNullable<InterviewAnswer['ai_feedback']>['metrics'][]

        const scores = answers.map((answer) => Number(answer.score || 0)).filter(Boolean)
        const lastFive = scores.slice(-5)
        const midpoint = Math.max(1, Math.floor(scores.length / 2))
        const earlierAvg = scores.slice(0, midpoint).reduce((sum, value) => sum + value, 0) / midpoint || 0
        const laterCount = Math.max(1, scores.length - midpoint)
        const laterAvg = scores.slice(midpoint).reduce((sum, value) => sum + value, 0) / laterCount || 0

        if (metrics.length > 0) {
          setCoachMetrics({
            confidence: Math.round(metrics.reduce((sum, item) => sum + Number(item?.confidence || 0), 0) / metrics.length),
            clarity: Math.round(metrics.reduce((sum, item) => sum + Number(item?.clarity || 0), 0) / metrics.length),
            fillerWords: Number((metrics.reduce((sum, item) => sum + Number(item?.filler_words || 0), 0) / metrics.length).toFixed(1)),
            improvement: Number((laterAvg - earlierAvg).toFixed(1)),
            lastSessionScores: lastFive,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteInterview = async (sessionId: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    const confirmed = window.confirm(
      'Delete this interview? This action cannot be undone and credits will not be refunded.'
    )

    if (!confirmed) return

    setDeletingId(sessionId)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        alert('Session expired. Please log in again.')
        router.push('/login')
        return
      }

      const response = await fetch(`/api/interview/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to delete interview')
        return
      }

      await fetchDashboardData()
    } catch (error) {
      console.error('Error deleting interview:', error)
      alert('Failed to delete interview')
    } finally {
      setDeletingId(null)
    }
  }

  const advanceTip = () => {
    const next = (tipIndex + 1) % DAILY_TIPS.length
    setTipIndex(next)
    try { localStorage.setItem('dailyTip', JSON.stringify({ date: format(new Date(), 'yyyy-MM-dd'), index: next })) } catch {}
  }

  const chartData = useMemo(() =>
    sessions
      .filter((s) => s.status === 'completed' && typeof s.overall_score === 'number')
      .slice(0, 7).reverse()
      .map((s) => ({ date: format(new Date(s.completed_at || s.created_at), 'MMM d'), score: Number(s.overall_score || 0) })),
    [sessions]
  )

  const upcomingBookings = useMemo(() => bookings.filter((b) => b.status !== 'cancelled'), [bookings])

  const myCoaches = useMemo(() => {
    const seen = new Set<string>()
    return bookings.filter((b) => { const k = b.coach?.email; if (!k || seen.has(k)) return false; seen.add(k); return true })
  }, [bookings])

  const lastSession = sessions.find((s) => s.status === 'completed') || sessions[0]
  const incompleteSession = sessions.find((s) => s.status === 'in_progress')
  const completedCount = sessions.filter((s) => s.status === 'completed').length

  const achievements = [
    { id: 'first', label: 'First Interview', icon: '🎯', earned: completedCount >= 1 },
    { id: 'score7', label: 'Score 7+', icon: '⭐', earned: sessions.some((s) => Number(s.overall_score) >= 7) },
    { id: 'streak3', label: '3-Day Streak', icon: '🔥', earned: stats.streakDays >= 3 },
    { id: 'five', label: '5 Sessions', icon: '🏅', earned: completedCount >= 5 },
    { id: 'ten', label: '10 Sessions', icon: '🏆', earned: completedCount >= 10 },
    { id: 'perfect', label: 'Perfect 10', icon: '💎', earned: sessions.some((s) => Number(s.overall_score) >= 10) },
  ]

  const recommendedCoaches = realCoaches.slice(0, 3)

  const rawName = profile?.first_name || getFirstName(profile?.full_name, user?.email)
  const displayName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : rawName
  const isCoach = profile?.user_type === 'coach'

  const statusLabel = (() => {
    if (!profile?.current_status) return null
    const labels: Record<string, string> = {
      student: '🎓 Student',
      employed: '👨\u200d💼 Employed',
      unemployed: '🔍 Job Seeking',
      'career-change': '🔄 Career Change',
      'fresh-graduate': '💼 Fresh Graduate',
      other: '🌍 Other',
    }
    const base = labels[profile.current_status] || profile.current_status
    return profile.status_detail ? `${base} — ${profile.status_detail}` : base
  })()

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1e' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !profile) return null

  const canStartInterview = profile.interviews_used_this_month < profile.interviews_limit
  const currentTip = DAILY_TIPS[tipIndex]

  return (
    <div className="min-h-screen text-white" style={{ background: '#0a0f1e' }}>
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md" style={{ background: 'rgba(10,15,30,0.92)' }}>
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Sparkles className="w-7 h-7 text-purple-400" />
              <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Interview Coach</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-3">
              <CreditBalanceButton />
              <NotificationBell />
              {!isCoach && <Link href="/bookings"><Button variant="outline" className="text-sm gap-2"><Calendar className="w-4 h-4" />My Bookings</Button></Link>}
              {!isCoach && <Link href="/coaches"><Button variant="outline" className="text-sm gap-2">Find a Coach</Button></Link>}
              {isCoach && <Link href="/coach/dashboard"><Button variant="outline" className="text-sm gap-2">Coach Dashboard</Button></Link>}

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:border-purple-500/40 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold uppercase">
                    {displayName.charAt(0)}
                  </div>
                  <span className="max-w-[120px] truncate">{displayName}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50" style={{ background: '#111827' }}>
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-semibold truncate">{displayName}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/profile" onClick={() => setProfileOpen(false)}>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors">
                          <User className="w-4 h-4" /> My Profile
                        </button>
                      </Link>
                      <Link href="/settings" onClick={() => setProfileOpen(false)}>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors">
                          <Settings className="w-4 h-4" /> Settings
                        </button>
                      </Link>
                      <Link href="/credits" onClick={() => setProfileOpen(false)}>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors">
                          <Wallet className="w-4 h-4" /> My Credits
                        </button>
                      </Link>
                      <Link href="/pricing" onClick={() => setProfileOpen(false)}>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors">
                          <CreditCard className="w-4 h-4" /> Pro Plan
                        </button>
                      </Link>
                      <div className="my-1 border-t border-white/10"></div>
                      <button
                        onClick={() => { setProfileOpen(false); signOut() }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: notification + hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <NotificationBell />
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="p-2 rounded-lg border border-white/10 bg-white/5 text-gray-300"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden mt-4 pb-2 border-t border-white/10 pt-4 space-y-2">
              {!isCoach && <Link href="/coaches" onClick={() => setMenuOpen(false)}><Button variant="outline" fullWidth className="justify-start">Find a Coach</Button></Link>}
              {!isCoach && <Link href="/bookings" onClick={() => setMenuOpen(false)}><Button variant="outline" fullWidth className="justify-start"><Calendar className="w-4 h-4 mr-2" /> My Bookings</Button></Link>}
              {isCoach && <Link href="/coach/dashboard" onClick={() => setMenuOpen(false)}><Button variant="outline" fullWidth className="justify-start">Coach Dashboard</Button></Link>}
              <Link href="/profile" onClick={() => setMenuOpen(false)}><Button variant="outline" fullWidth className="justify-start"><User className="w-4 h-4 mr-2" /> My Profile</Button></Link>
              <Link href="/settings" onClick={() => setMenuOpen(false)}><Button variant="outline" fullWidth className="justify-start"><Settings className="w-4 h-4 mr-2" /> Settings</Button></Link>
              <Link href="/credits" onClick={() => setMenuOpen(false)}><Button variant="outline" fullWidth className="justify-start"><Wallet className="w-4 h-4 mr-2" /> My Credits</Button></Link>
              <Link href="/pricing" onClick={() => setMenuOpen(false)}><Button variant="outline" fullWidth className="justify-start"><CreditCard className="w-4 h-4 mr-2" /> Pro Plan</Button></Link>
              <div className="border-t border-white/10 my-2"></div>
              <Button variant="outline" fullWidth onClick={signOut} className="justify-start text-red-400"><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* WELCOME */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{displayName}</span>! 👋
            </h1>
            {statusLabel && (
              <p className="text-sm text-purple-400 mb-1">{statusLabel}</p>
            )}
            {!isCoach && (
              <p className="text-gray-400">
                You have used <span className="text-white font-semibold">{profile.interviews_used_this_month}</span> of{' '}
                <span className="text-white font-semibold">
                  {profile.interviews_limit === 999999 || profile.interviews_limit >= 999 
                    ? 'Unlimited' 
                    : profile.interviews_limit}
                </span> interviews this month{profile.interviews_limit === 999999 || profile.interviews_limit >= 999 ? ' ✨' : ''}.
              </p>
            )}
            {isCoach && (
              <p className="text-gray-400">Manage your sessions and clients from your <Link href="/coach/dashboard" className="text-purple-400 hover:underline">Coach Dashboard</Link>.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {!isCoach && <Link href="/coaches"><Button variant="outline" className="gap-2">Find a Coach</Button></Link>}
            {!isCoach && <Link href="/interview/setup"><Button variant="primary" className="gap-2"><Plus className="w-4 h-4" /> New Interview</Button></Link>}
            {isCoach && <Link href="/coach/dashboard"><Button variant="primary" className="gap-2"><ArrowRight className="w-4 h-4" /> Go to Coach Dashboard</Button></Link>}
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse border border-white/10" style={{ background: '#111827' }}>
              <div className="h-3 w-24 bg-white/10 rounded mb-4" /><div className="h-7 w-16 bg-white/10 rounded" />
            </div>
          )) : (
            <>
              <StatCard label="Total Interviews Done" value={String(stats.totalInterviews)} icon={<Calendar className="w-5 h-5 text-purple-400" />} accent="bg-purple-500/20" />
              <StatCard label="Average Score" value={`${stats.avgScore}/10`} icon={<TrendingUp className="w-5 h-5 text-blue-400" />} accent="bg-blue-500/20" />
              <StatCard label="This Month" value={String(stats.interviewsThisMonth)} icon={<Award className="w-5 h-5 text-green-400" />} accent="bg-green-500/20" />
              <StatCard label="Streak 🔥" value={`${stats.streakDays} days`} icon={<Flame className="w-5 h-5 text-orange-400" />} accent="bg-orange-500/20" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">

            {/* PROGRESS CHART */}
            <DarkCard>
              <div className="flex items-center justify-between mb-4">
                <div><h2 className="text-xl font-bold">Progress Overview</h2><p className="text-gray-400 text-sm">Your interview scores over time</p></div>
              </div>
              {chartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 10]} stroke="#6b7280" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }} />
                      <Line type="monotone" dataKey="score" stroke="url(#scoreGrad)" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, fill: '#a78bfa' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="relative h-64 flex flex-col items-center justify-center rounded-xl overflow-hidden">
                  <div className="absolute inset-0 opacity-20 blur-sm pointer-events-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{ date: 'Jan 1', score: 4 }, { date: 'Jan 3', score: 6 }, { date: 'Jan 5', score: 5 }, { date: 'Jan 7', score: 8 }, { date: 'Jan 9', score: 7 }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="date" stroke="#6b7280" />
                        <YAxis domain={[0, 10]} stroke="#6b7280" />
                        <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="relative z-10 text-center px-4">
                    <p className="text-gray-300 font-semibold mb-1">Complete a few interviews to unlock your score trend chart.</p>
                    <p className="text-gray-500 text-sm mb-4">Start your first interview to see your progress! 🚀</p>
                    <Link href="/interview/setup"><Button variant="primary" className="gap-2"><Plus className="w-4 h-4" /> Start Interview</Button></Link>
                  </div>
                </div>
              )}
            </DarkCard>

            {/* COACH HUB */}
            <DarkCard>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div><h2 className="text-xl font-bold">Coach Hub</h2><p className="text-gray-400 text-sm">Manage your coaching sessions</p></div>
                <div className="flex gap-2">
                  {(['upcoming', 'my-coaches'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveCoachTab(tab)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${activeCoachTab === tab ? 'bg-purple-600 text-white' : 'border border-white/10 text-gray-300 hover:border-purple-500/40'}`}>
                      {tab === 'upcoming' ? 'Upcoming Sessions' : 'My Coaches'}
                    </button>
                  ))}
                </div>
              </div>
              {activeCoachTab === 'upcoming' ? (
                upcomingBookings.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-gray-300 font-semibold mb-2">No upcoming sessions.</p>
                    <p className="text-gray-500 text-sm mb-4">Find a coach to book your first session!</p>
                    <Link href="/coaches"><Button variant="primary">Find a Coach</Button></Link>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {upcomingBookings.map((booking) => {
                      const coachName = booking.coach?.full_name || 'Coach'
                      const statusLabel = booking.status === 'confirmed' ? '🟢 Upcoming' : booking.status === 'completed' ? '✅ Completed' : '⏳ Pending'
                      const sessionTime = booking.scheduled_at ? new Date(booking.scheduled_at) : null
                      const isJoinable = sessionTime && Math.abs(sessionTime.getTime() - Date.now()) < 10 * 60 * 1000
                      return (
                        <div key={booking.id} className="rounded-xl border border-white/10 p-4 hover:border-purple-500/30 transition-colors" style={{ background: '#0a0f1e' }}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold shrink-0">{coachName.charAt(0).toUpperCase()}</div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{coachName}</p>
                              <span className="text-xs text-gray-400">{statusLabel}</span>
                            </div>
                          </div>
                          {booking.notes && <p className="text-sm text-gray-400 mb-2 line-clamp-1">{booking.notes}</p>}
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span>{sessionTime ? format(sessionTime, 'MMM d, HH:mm') : 'TBD'} • {booking.duration_minutes} min</span>
                            {isJoinable && <Button variant="primary" className="text-xs px-2 py-1">Join Session</Button>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              ) : (
                myCoaches.length === 0 ? (
                  <div className="py-10 text-center"><p className="text-gray-500 text-sm">No coaches yet. Book a session to get started!</p></div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {myCoaches.map((booking) => {
                      const coachName = booking.coach?.full_name || 'Coach'
                      return (
                        <div key={booking.id} className="rounded-xl border border-white/10 p-4 hover:border-purple-500/30 transition-colors" style={{ background: '#0a0f1e' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold shrink-0">{coachName.charAt(0).toUpperCase()}</div>
                            <div><p className="font-semibold">{coachName}</p><p className="text-xs text-gray-400">{booking.status === 'completed' ? '✅ Completed' : '🟢 Active'}</p></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              )}
            </DarkCard>

            {/* RECENT SESSIONS */}
            <DarkCard>
              <div className="flex items-center justify-between mb-4">
                <div><h2 className="text-xl font-bold">Recent Sessions</h2><p className="text-gray-400 text-sm">Track your latest practice sessions</p></div>
              </div>
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No interviews yet!</h3>
                  <p className="text-gray-400 mb-6">Begin practicing now and unlock AI-powered feedback.</p>
                  <Link href="/interview/setup"><Button variant="primary" className="gap-2"><Plus className="w-4 h-4" /> Start Your First Interview</Button></Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[580px] text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-gray-400">
                        <th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Role</th><th className="py-3 pr-4">Level</th>
                        <th className="py-3 pr-4">Score</th><th className="py-3 pr-4">Type</th><th className="py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.slice(0, 10).map((session) => (
                        <tr key={session.id} className="border-b border-white/5 last:border-0">
                          <td className="py-3 pr-4 text-gray-300">{format(new Date(session.created_at), 'MMM dd, yyyy')}</td>
                          <td className="py-3 pr-4 font-medium">{session.job_role}</td>
                          <td className="py-3 pr-4"><Badge variant="default">{session.difficulty_level}</Badge></td>
                          <td className="py-3 pr-4">{session.overall_score ? <span className="text-purple-400 font-semibold">{session.overall_score}/10</span> : <span className="text-gray-500">—</span>}</td>
                          <td className="py-3 pr-4"><Badge variant="default">{getInterviewType(session)}</Badge></td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="danger" className="px-3 py-1.5 text-xs gap-1" onClick={() => handleDeleteInterview(session.id)} loading={deletingId === session.id}>
                                <Trash2 className="w-3 h-3" /> Delete
                              </Button>
                              <Link href={session.status === 'completed' ? `/interview/summary/${session.id}` : `/interview/${session.id}`}>
                                <Button variant="outline" className="px-3 py-1.5 text-xs gap-1">{session.status === 'completed' ? 'View' : 'Continue'} <ArrowRight className="w-3 h-3" /></Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DarkCard>

            {/* JOB OFFERS */}
            <DarkCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Remote Job Opportunities</h2>
                  <p className="text-gray-400 text-sm">Live remote listings matched to your target role</p>
                </div>
                <Link href="/jobs" className="text-purple-400 text-sm hover:text-purple-300 transition-colors whitespace-nowrap">Browse All →</Link>
              </div>
              <JobOffers targetRole={profile?.target_job_role || profile?.target_job_field || ''} limit={4} />
            </DarkCard>

            {/* RECOMMENDED COACHES */}
            <DarkCard>
              <div className="flex items-center justify-between mb-4">
                <div><h2 className="text-xl font-bold">Recommended Coaches for You</h2><p className="text-gray-400 text-sm">Based on your interview history and role</p></div>
                <Link href="/coaches" className="text-purple-400 text-sm hover:text-purple-300 transition-colors whitespace-nowrap">See All →</Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {recommendedCoaches.length === 0 ? (
                  <div className="col-span-3 py-8 text-center text-gray-400 text-sm">
                    <p className="mb-2">More coaches coming soon! 🌟</p>
                    <Link href="/coaches" className="text-purple-400 hover:underline">Browse available coaches →</Link>
                  </div>
                ) : recommendedCoaches.map((coach) => {
                  const name = coach.full_name || 'Coach'
                  const firstName = name.split(' ')[0]
                  const specs = coach.coach_specializations?.map((s: any) => s.specialization) || []
                  const pricePerHour = coach.coach_profiles?.price_per_hour || 0
                  const creditsPerHour = pricePerHour > 0 ? Math.round(pricePerHour * 1.5) : 0 // Convert dollars to credits
                  const avatarUrl = (coach as any).avatar_url
                  
                  return (
                    <div key={coach.id} className="rounded-xl border border-white/10 p-4 hover:border-purple-500/30 transition-all hover:shadow-lg hover:shadow-purple-500/10 flex flex-col gap-3" style={{ background: '#0a0f1e' }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={name} className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/30" />
                      ) : (
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`} 
                          alt={name} 
                          className="w-12 h-12 rounded-full border-2 border-purple-500/30"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold truncate">{name}</p>
                        <p className="text-xs text-gray-400 mb-2 line-clamp-1">{coach.coach_profiles?.title || 'Interview Coach'}</p>
                        <div className="flex flex-wrap items-center gap-1 text-xs mb-2">
                          {specs.length > 0 ? (
                            specs.slice(0, 2).map((s: string) => <span key={s} className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{s}</span>)
                          ) : (
                            <span className="text-gray-500 text-[10px]">General Coaching</span>
                          )}
                        </div>
                        {creditsPerHour > 0 && (
                          <div className="flex items-center gap-1 text-purple-400 text-sm font-semibold">
                            <Wallet className="w-3 h-3" />
                            <span>{creditsPerHour} credits/hr</span>
                          </div>
                        )}
                      </div>
                      <Link href={`/coaches/${coach.id}`}><Button variant="outline" fullWidth className="text-xs">View Profile</Button></Link>
                    </div>
                  )
                })}
              </div>
            </DarkCard>

            {/* ACHIEVEMENTS */}
            <DarkCard>
              <div className="mb-4"><h2 className="text-xl font-bold">Your Achievements</h2><p className="text-gray-400 text-sm">Badges earned from your interview sessions</p></div>
              {completedCount === 0 ? (
                <p className="text-gray-400 text-sm py-4">0 badges earned yet → Complete your first interview to start earning! 🏅</p>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {achievements.map((ach) => (
                    <div key={ach.id} title={ach.earned ? 'Earned!' : 'Not yet earned'}
                      className={`flex flex-col items-center gap-1 rounded-xl p-3 border transition-all ${ach.earned ? 'border-purple-500/40 bg-purple-500/10' : 'border-white/5 bg-white/5 opacity-40 grayscale'}`}>
                      <span className="text-2xl">{ach.icon}</span>
                      <span className="text-[11px] text-center text-gray-300 leading-tight">{ach.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </DarkCard>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            {/* QUICK START */}
            <DarkCard>
              <h2 className="text-xl font-bold mb-1">Quick Start</h2>
              <p className="text-gray-400 text-sm mb-4">Jump into a fresh interview tailored to your role.</p>
              {lastSession?.job_role && (
                <p className="text-xs text-gray-500 mb-3">Last practiced: <span className="text-purple-400 font-semibold">{lastSession.job_role}</span></p>
              )}
              {canStartInterview ? (
                <Link href="/interview/setup"><Button variant="primary" fullWidth className="gap-2"><Plus className="w-4 h-4" /> New Interview Setup</Button></Link>
              ) : (
                <Link href="/pricing"><Button variant="primary" fullWidth>Upgrade to Continue</Button></Link>
              )}
              {incompleteSession && (
                <Link href={`/interview/${incompleteSession.id}`}>
                  <Button variant="outline" fullWidth className="mt-2 gap-2 text-sm"><ArrowRight className="w-3 h-3" /> Continue where you left off</Button>
                </Link>
              )}
            </DarkCard>

            {/* COACH METRICS */}
            <DarkCard>
              <h2 className="text-xl font-bold mb-1">Coach Metrics</h2>
              <p className="text-xs text-gray-500 mb-4">Based on your last session</p>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1"><span className="text-gray-300">Confidence</span><span className="text-green-400 font-semibold">{coachMetrics.confidence}%</span></div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500" style={{ width: `${coachMetrics.confidence}%` }} /></div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1"><span className="text-gray-300">Clarity</span><span className="text-blue-400 font-semibold">{coachMetrics.clarity}%</span></div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500" style={{ width: `${coachMetrics.clarity}%` }} /></div>
                </div>
                {coachMetrics.lastSessionScores.length > 1 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last {coachMetrics.lastSessionScores.length} answer scores</p>
                    <div className="h-12">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={coachMetrics.lastSessionScores.map((s, i) => ({ i, s }))}>
                          <Line type="monotone" dataKey="s" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                <div className="rounded-xl border border-white/10 p-3 space-y-1" style={{ background: '#0a0f1e' }}>
                  <p className="text-sm text-gray-300">Filler words/answer: <span className="text-yellow-300 font-semibold">{coachMetrics.fillerWords}</span></p>
                  <p className="text-sm text-gray-300 flex items-center gap-1">
                    Trend: {trendLabel(coachMetrics.improvement)}{' '}
                    <span className={`font-semibold ml-1 ${coachMetrics.improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>{coachMetrics.improvement >= 0 ? '+' : ''}{coachMetrics.improvement} pts</span>
                  </p>
                </div>
              </div>
            </DarkCard>

            {/* DAILY TIP */}
            <DarkCard>
              <h2 className="text-xl font-bold mb-4">Daily Tip</h2>
              <div className="rounded-xl border border-white/10 p-4" style={{ background: '#0a0f1e' }}>
                <span className="inline-block text-xs font-semibold text-purple-400 border border-purple-500/30 rounded-full px-2 py-0.5 mb-2">{currentTip.category}</span>
                <p className="text-sm text-gray-300 leading-relaxed">{currentTip.tip}</p>
                <button onClick={advanceTip} className="mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors">Next Tip →</button>
              </div>
            </DarkCard>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-2xl p-5 border border-white/10 hover:border-purple-500/30 transition-colors" style={{ background: '#111827' }}>
      <div className="flex items-start justify-between">
        <div><p className="text-gray-400 text-xs mb-1">{label}</p><p className="text-2xl font-bold">{value}</p></div>
        <div className={`w-10 h-10 ${accent} rounded-lg flex items-center justify-center`}>{icon}</div>
      </div>
    </div>
  )
}

function DarkCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 border border-white/10 ${className}`} style={{ background: '#111827' }}>
      {children}
    </div>
  )
}
