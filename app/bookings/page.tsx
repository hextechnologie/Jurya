'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, MapPin, X } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { CancellationModal } from '@/components/CancellationModal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

type Booking = {
  id: string
  scheduled_at: string
  duration_minutes: number
  status: string
  notes: string | null
  credits_cost: number | null
  cancellation_deadline: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  coach_id: string
  candidate_id: string
  coach_name_snapshot: string | null
  candidate_name_snapshot: string | null
  google_calendar_url: string | null
}

export default function BookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming')
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null)
  const [userRole, setUserRole] = useState<'coach' | 'candidate'>('candidate')

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return

      // Check if user is a coach
      const { data: coachProfile } = await supabase
        .from('coach_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      const isCoach = !!coachProfile
      setUserRole(isCoach ? 'coach' : 'candidate')

      // Fetch bookings
      let query = supabase
        .from('bookings')
        .select('*')
        .order('scheduled_at', { ascending: false })

      if (isCoach) {
        query = query.eq('coach_id', user.id)
      } else {
        query = query.eq('candidate_id', user.id)
      }

      const { data, error } = await query

      if (!error && data) {
        setBookings(data)
      }
      setLoading(false)
    }

    fetchBookings()
  }, [user])

  const filteredBookings = bookings.filter((booking) => {
    const scheduledAt = new Date(booking.scheduled_at)
    const now = new Date()

    if (filter === 'upcoming') {
      return booking.status === 'confirmed' && scheduledAt > now
    } else if (filter === 'past') {
      return booking.status === 'completed' || (booking.status === 'confirmed' && scheduledAt < now)
    } else if (filter === 'cancelled') {
      return booking.status === 'cancelled'
    }
    return false
  })

  const handleCancelSuccess = () => {
    setCancellingBooking(null)
    // Refresh bookings
    window.location.reload()
  }

  const canCancel = (booking: Booking) => {
    if (booking.status !== 'confirmed') return false
    const scheduledAt = new Date(booking.scheduled_at)
    const now = new Date()
    return scheduledAt > now
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white">
        <p>Please log in to view your bookings</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-white px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'upcoming' 
                ? 'bg-primary text-white' 
                : 'bg-background/40 border border-border text-gray-300 hover:border-primary/40'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'past' 
                ? 'bg-primary text-white' 
                : 'bg-background/40 border border-border text-gray-300 hover:border-primary/40'
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'cancelled' 
                ? 'bg-primary text-white' 
                : 'bg-background/40 border border-border text-gray-300 hover:border-primary/40'
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Bookings list */}
        {loading ? (
          <Card>
            <p className="text-gray-400 text-center">Loading...</p>
          </Card>
        ) : filteredBookings.length === 0 ? (
          <Card>
            <p className="text-gray-400 text-center">No {filter} bookings found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const otherPartyName = userRole === 'coach' 
                ? booking.candidate_name_snapshot 
                : booking.coach_name_snapshot

              return (
                <Card key={booking.id} className="border-primary/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">{otherPartyName || 'Unknown'}</h3>
                      <p className="text-xs text-gray-500">
                        {userRole === 'coach' ? 'Candidate' : 'Coach'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        booking.status === 'confirmed' ? 'default' :
                        booking.status === 'completed' ? 'success' :
                        'danger'
                      }>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Calendar className="h-4 w-4 text-primary" />
                      {new Date(booking.scheduled_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Clock className="h-4 w-4 text-primary" />
                      {new Date(booking.scheduled_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} • {booking.duration_minutes} minutes
                    </div>
                    {booking.credits_cost && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-primary">⭐</span>
                        {booking.credits_cost} credits
                      </div>
                    )}
                  </div>

                  {booking.notes && (
                    <div className="mb-4 p-3 rounded-lg bg-background/40 border border-border">
                      <p className="text-xs text-gray-500 mb-1">Notes:</p>
                      <p className="text-sm text-gray-300">{booking.notes}</p>
                    </div>
                  )}

                  {booking.status === 'cancelled' && booking.cancelled_at && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/40">
                      <p className="text-xs text-red-300">
                        Cancelled on {new Date(booking.cancelled_at).toLocaleDateString()} by {booking.cancelled_by}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {booking.google_calendar_url && booking.status === 'confirmed' && (
                      <a href={booking.google_calendar_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button variant="secondary" fullWidth className="text-sm">
                          Add to Calendar
                        </Button>
                      </a>
                    )}
                    {canCancel(booking) && (
                      <Button 
                        variant="secondary" 
                        onClick={() => setCancellingBooking(booking)}
                        fullWidth
                        className="text-sm border-red-500/40 hover:bg-red-500/10 text-red-300"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {cancellingBooking && (
        <CancellationModal
          booking={cancellingBooking}
          userRole={userRole}
          onClose={() => setCancellingBooking(null)}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  )
}
