'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { getFirstName } from '@/lib/supabase'
import CoachNavbar from '@/components/CoachNavbar'
import { LoadingSpinner } from '@/components/ui'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

type EarningRow = { id: string; amount: number; created_at: string; booking_id: string; status: string }
type MonthStat = { month: string; amount: number; sessions: number }

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl p-5 border border-white/10 flex items-center gap-4" style={{ background: '#111827' }}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-400 mb-0.5">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  )
}

export default function CoachEarningsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [earnings, setEarnings] = useState<EarningRow[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthStat[]>([])
  const [profileName, setProfileName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) init()
    else if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  const init = async () => {
    const [{ data: profile }, { data: earningsData }] = await Promise.all([
      supabase.from('profiles').select('full_name, role').eq('id', user!.id).single(),
      supabase.from('earnings').select('*').eq('coach_id', user!.id).order('created_at', { ascending: false })
    ])
    if (profile?.role !== 'coach') { router.push('/dashboard'); return }
    setProfileName(getFirstName(profile?.full_name, user?.email))
    const rows: EarningRow[] = earningsData || []
    setEarnings(rows)

    // Build last 6 months stats
    const stats: MonthStat[] = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i)
      const start = startOfMonth(d)
      const end = endOfMonth(d)
      const inMonth = rows.filter((r) => {
        const d2 = new Date(r.created_at)
        return d2 >= start && d2 <= end
      })
      stats.push({
        month: format(d, 'MMM'),
        amount: inMonth.reduce((s, r) => s + (r.amount || 0), 0),
        sessions: inMonth.length
      })
    }
    setMonthlyStats(stats)
    setLoading(false)
  }

  const totalEarnings = earnings.reduce((s, r) => s + (r.amount || 0), 0)
  const thisMonthStart = startOfMonth(new Date())
  const thisMonthEarnings = earnings.filter((r) => new Date(r.created_at) >= thisMonthStart).reduce((s, r) => s + (r.amount || 0), 0)
  const avgPerSession = earnings.length ? totalEarnings / earnings.length : 0
  const pending = earnings.filter((r) => r.status === 'pending').reduce((s, r) => s + (r.amount || 0), 0)

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1e' }}><LoadingSpinner size="lg" /></div>

  return (
    <div className="min-h-screen text-white" style={{ background: '#0a0f1e' }}>
      <CoachNavbar />
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Earnings</h1>
          <p className="text-gray-400">Track your revenue, session stats and payment history.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={DollarSign} label="Total Earned" value={`$${totalEarnings.toFixed(0)}`} color="bg-green-500/20 text-green-400" />
          <StatCard icon={TrendingUp} label="This Month" value={`$${thisMonthEarnings.toFixed(0)}`} color="bg-purple-500/20 text-purple-400" />
          <StatCard icon={Calendar} label="Avg / Session" value={`$${avgPerSession.toFixed(0)}`} color="bg-blue-500/20 text-blue-400" />
          <StatCard icon={Clock} label="Pending" value={`$${pending.toFixed(0)}`} color="bg-yellow-500/20 text-yellow-400" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="md:col-span-2 rounded-2xl p-5 border border-white/10" style={{ background: '#111827' }}>
            <h2 className="text-lg font-bold mb-4">Revenue (Last 6 Months)</h2>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyStats}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 12, color: '#fff' }} formatter={(v: number) => [`$${v}`, 'Revenue']} />
                <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} fill="url(#earningsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sessions chart */}
          <div className="rounded-2xl p-5 border border-white/10" style={{ background: '#111827' }}>
            <h2 className="text-lg font-bold mb-4">Sessions / Month</h2>
            <div className="space-y-3">
              {monthlyStats.map((s) => {
                const max = Math.max(...monthlyStats.map((x) => x.sessions), 1)
                return (
                  <div key={s.month} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-8 shrink-0">{s.month}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full bg-purple-500" style={{ width: `${(s.sessions / max) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-300 w-5 text-right shrink-0">{s.sessions}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="mt-6 rounded-2xl border border-white/10 overflow-hidden" style={{ background: '#111827' }}>
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold">Transaction History</h2>
          </div>
          {earnings.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-500">No transactions yet.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {earnings.map((row) => (
                <div key={row.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div>
                    <p className="text-sm font-medium">Session payment</p>
                    <p className="text-xs text-gray-500">{format(new Date(row.created_at), 'MMM d, yyyy · h:mm a')}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${row.status === 'pending' ? 'text-yellow-400' : 'text-green-400'}`}>+${row.amount?.toFixed(2)}</p>
                    <p className={`text-xs capitalize ${row.status === 'pending' ? 'text-yellow-400/70' : 'text-gray-500'}`}>{row.status || 'paid'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
