'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button, Card } from './ui'
import { isFreeCancellation } from '@/lib/credits'

type CancellationModalProps = {
  booking: {
    id: string
    scheduled_at: string
    cancellation_deadline?: string | null
    duration_minutes: number
    credits_cost?: number | null
    coach_name_snapshot?: string | null
    candidate_name_snapshot?: string | null
  }
  userRole: 'coach' | 'candidate'
  onClose: () => void
  onSuccess: () => void
}

const COACH_CANCELLATION_REASONS = [
  'Emergency',
  'Illness',
  'Schedule conflict',
  'Technical issues',
  'Other'
]

const CANDIDATE_CANCELLATION_REASONS = [
  'Schedule changed',
  'No longer needed',
  'Found different coach',
  'Technical issues',
  'Other'
]

export function CancellationModal({ booking, userRole, onClose, onSuccess }: CancellationModalProps) {
  const [reason, setReason] = useState('')
  const [reasonDetail, setReasonDetail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isFree = userRole === 'candidate' 
    ? isFreeCancellation(new Date(booking.scheduled_at))
    : false

  const creditsCost = booking.credits_cost || 0
  const reasons = userRole === 'coach' ? COACH_CANCELLATION_REASONS : CANDIDATE_CANCELLATION_REASONS

  const handleCancel = async () => {
    if (!reason) {
      setError('Please select a reason')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          reason,
          reasonDetail: reasonDetail || reason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-bold">Cancel Booking</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning message */}
        {userRole === 'coach' && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4">
            <p className="text-sm text-red-300 font-semibold mb-1">⚠️ Coach Cancellation Warning</p>
            <p className="text-xs text-gray-300">
              • Full refund will be given to the candidate ({creditsCost} credits)<br />
              • You will receive a strike on your account<br />
              • 5 strikes in 30 days will suspend your account
            </p>
          </div>
        )}

        {userRole === 'candidate' && !isFree && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4">
            <p className="text-sm text-red-300 font-semibold mb-1">⚠️ Late Cancellation - No Refund</p>
            <p className="text-xs text-gray-300">
              You are cancelling within 48 hours of the session. No credits will be refunded ({creditsCost} credits will go to the coach).
            </p>
          </div>
        )}

        {userRole === 'candidate' && isFree && (
          <div className="mb-4 rounded-lg border border-green-500/40 bg-green-500/10 p-4">
            <p className="text-sm text-green-300 font-semibold mb-1">✅ Free Cancellation</p>
            <p className="text-xs text-gray-300">
              Full refund of {creditsCost} credits will be processed.
            </p>
          </div>
        )}

        {/* Booking details */}
        <div className="mb-4 p-3 rounded-lg bg-background/40 border border-border">
          <p className="text-sm text-gray-400 mb-1">Session Details</p>
          <p className="text-sm">
            {userRole === 'coach' ? booking.candidate_name_snapshot : booking.coach_name_snapshot}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(booking.scheduled_at).toLocaleString()} • {booking.duration_minutes} min
          </p>
        </div>

        {/* Reason selection */}
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">Cancellation Reason *</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white text-sm"
          >
            <option value="">Select a reason...</option>
            {reasons.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Additional details */}
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">Additional Details (Optional)</label>
          <textarea
            value={reasonDetail}
            onChange={(e) => setReasonDetail(e.target.value)}
            placeholder="Provide more context about the cancellation..."
            rows={3}
            className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-white text-sm resize-none"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading} fullWidth>
            Keep Booking
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCancel} 
            loading={loading}
            disabled={!reason}
            fullWidth
            className="bg-red-600 hover:bg-red-700"
          >
            Confirm Cancellation
          </Button>
        </div>
      </Card>
    </div>
  )
}
