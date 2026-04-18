'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Badge, Button, Card, LoadingSpinner } from '@/components/ui'
import { NotificationBell } from '@/components/NotificationBell'
import CoachNavbar from '@/components/CoachNavbar'
import { supabase } from '@/lib/supabase'
import { CalendarDays, DollarSign, PencilLine, Wallet } from 'lucide-react'

type CoachDashboardStats = {
  totalEarned: number
  thisMonth: number
  pending: number
  withdrawn: number
  totalSessions: number
  averageRating: number
  repeatClients: number
}

export default function CoachDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [welcome, setWelcome] = useState(false)
  const [loading, setLoading] = useState(true)
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [stats, setStats] = useState<CoachDashboardStats>({
    totalEarned: 0,
    thisMonth: 0,
    pending: 0,
    withdrawn: 0,
    totalSessions: 0,
    averageRating: 0,
    repeatClients: 0,
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWelcome(new URLSearchParams(window.location.search).get('welcome') === '1')
    }
  }, [])

  useEffect(() => {
    const fetchCoachData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const [{ data: bookings }, { data: reviewsData }, { data: earnings }] = await Promise.all([
          supabase
            .from('bookings')
            .select('*, candidate:profiles!bookings_candidate_id_fkey(full_name, first_name, last_name, email)')
            .eq('coach_id', user.id)
            .order('created_at', { ascending: false }),
          supabase.from('reviews').select('*').eq('coach_id', user.id).order('created_at', { ascending: false }),
          supabase.from('earnings').select('*').eq('coach_id', user.id),
        ])

        const safeBookings = bookings || []
        const safeReviews = reviewsData || []
        const safeEarnings = earnings || []

        setUpcoming(safeBookings.filter((item: any) => item.status === 'confirmed' || item.status === 'pending'))
        setReviews(safeReviews)

        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        setStats({
          totalEarned: safeEarnings.reduce((sum: number, item: any) => sum + Number(item.net_amount || 0), 0),
          thisMonth: safeEarnings
            .filter((item: any) => {
              const created = new Date(item.created_at)
              return created.getMonth() === currentMonth && created.getFullYear() === currentYear
            })
            .reduce((sum: number, item: any) => sum + Number(item.net_amount || 0), 0),
          pending: safeEarnings
            .filter((item: any) => item.status === 'pending')
            .reduce((sum: number, item: any) => sum + Number(item.net_amount || 0), 0),
          withdrawn: safeEarnings
            .filter((item: any) => item.status === 'paid_out')
            .reduce((sum: number, item: any) => sum + Number(item.net_amount || 0), 0),
          totalSessions: safeBookings.length,
          averageRating: safeReviews.length ? Number((safeReviews.reduce((sum: number, item: any) => sum + Number(item.rating || 0), 0) / safeReviews.length).toFixed(1)) : 0,
          repeatClients: new Set(safeBookings.map((item: any) => item.candidate_id).filter(Boolean)).size,
        })
      } catch (error) {
        console.error('Coach dashboard fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && !user) {
      setLoading(false)
      router.replace('/login/coach')
      return
    }

    if (!authLoading && user) {
      fetchCoachData()
    }
  }, [authLoading, router, user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <CoachNavbar />
      <div className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {welcome && (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4 text-primary">
            Welcome aboard. Complete your profile and connect Stripe to start accepting bookings.
          </div>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Coach dashboard</h1>
            <p className="mt-2 text-gray-400">Manage bookings, earnings, and candidate relationships from one place.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NotificationBell />
            <Link href="/bookings"><Button variant="outline"><CalendarDays className="h-4 w-4" />My Bookings</Button></Link>
            <Link href="/earnings"><Button variant="outline"><DollarSign className="h-4 w-4" />Earnings</Button></Link>
            <Link href="/coach/profile"><Button variant="outline"><PencilLine className="h-4 w-4" />Edit profile</Button></Link>
            <Link href="/earnings/withdraw"><Button variant="primary"><Wallet className="h-4 w-4" />Withdraw</Button></Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total earned', value: `$${stats.totalEarned.toFixed(0)}`, icon: DollarSign },
            { label: 'This month', value: `$${stats.thisMonth.toFixed(0)}`, icon: DollarSign },
            { label: 'Pending', value: `$${stats.pending.toFixed(0)}`, icon: Wallet },
            { label: 'Withdrawn', value: `$${stats.withdrawn.toFixed(0)}`, icon: Wallet },
          ].map((item) => (
            <Card key={item.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{item.label}</p>
                  <p className="text-3xl font-bold">{item.value}</p>
                </div>
                <item.icon className="h-6 w-6 text-primary" />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Card>
              <h2 className="mb-4 text-2xl font-bold">Upcoming bookings</h2>
              {upcoming.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background/40 p-6 text-sm text-gray-400">
                  No real bookings yet. They will appear here when candidates book your sessions.
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((session: any) => {
                    const candidateName = session.candidate_name_snapshot
                      || session.candidate?.full_name
                      || [session.candidate?.first_name, session.candidate?.last_name].filter(Boolean).join(' ')
                      || 'Candidate'

                    const scheduledText = session.scheduled_at
                      ? new Date(session.scheduled_at).toLocaleString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Not scheduled yet'

                    return (
                      <div key={session.id} className="rounded-xl border border-border bg-background/40 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <p className="font-semibold text-white">{candidateName}</p>
                            <div className="space-y-1 text-sm text-gray-400">
                              <p><span className="text-gray-500">When:</span> {scheduledText}</p>
                              <p><span className="text-gray-500">Duration:</span> {session.duration_minutes || 60} min</p>
                              <p><span className="text-gray-500">Notes:</span> {session.notes || 'No session notes provided'}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={session.status === 'confirmed' ? 'success' : 'warning'}>{session.status}</Badge>
                            <Link href={`/candidates/${session.candidate_id}`}>
                              <Button variant="outline" className="text-xs">View Profile</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-4 text-2xl font-bold">Recent reviews</h2>
              {reviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background/40 p-6 text-sm text-gray-400">
                  No reviews yet. Your first real candidate review will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="rounded-xl border border-border bg-background/40 p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="font-semibold">Candidate review</p>
                        <span className="text-yellow-300">⭐ {review.rating}</span>
                      </div>
                      <p className="text-sm text-gray-300">{review.comment || 'No written comment provided.'}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="mb-4 text-2xl font-bold">Quick stats</h2>
              <div className="space-y-3 text-sm text-gray-300">
                <p>Total sessions: <span className="font-semibold text-white">{stats.totalSessions}</span></p>
                <p>Average rating: <span className="font-semibold text-white">{stats.averageRating || 0}</span></p>
                <p>Repeat clients: <span className="font-semibold text-white">{stats.repeatClients}</span></p>
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-2xl font-bold">Payout status</h2>
              <p className="text-sm text-gray-300">Stripe Connect will be shown here once your account is connected and you complete paid sessions.</p>
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-gray-300">
                Platform fee: 20% • Coach payout: 80%
              </div>
            </Card>

            {profile?.full_name && (
              <Card>
                <h2 className="mb-2 text-xl font-bold">Your coach account</h2>
                <p className="text-sm text-gray-300">Signed in as {profile.full_name}</p>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}