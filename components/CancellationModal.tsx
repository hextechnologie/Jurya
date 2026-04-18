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
  'Urgence',
  'Maladie',
  'Conflit d\'emploi du temps',
  'Problème technique',
  'Autre'
]

const CANDIDATE_CANCELLATION_REASONS = [
  'Changement de planning',
  'Plus nécessaire',
  'Autre membre de jury trouvé',
  'Problème technique',
  'Autre'
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
      setError('Veuillez sélectionner une raison')
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
        throw new Error(data.error || 'Échec de l\'annulation')
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
            <h2 className="text-xl font-bold">Annuler la réservation</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning message */}
        {userRole === 'coach' && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4">
            <p className="text-sm text-red-300 font-semibold mb-1">⚠️ Attention — annulation jury</p>
            <p className="text-xs text-gray-300">
              • Remboursement intégral au candidat ({creditsCost} crédits)<br />
              • Un avertissement sera ajouté à votre compte<br />
              • 5 avertissements en 30 jours entraînent la suspension de votre compte
            </p>
          </div>
        )}

        {userRole === 'candidate' && !isFree && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4">
            <p className="text-sm text-red-300 font-semibold mb-1">⚠️ Annulation tardive — Pas de remboursement</p>
            <p className="text-xs text-gray-300">
              Vous annulez dans les 48 heures précédant la session. Aucun crédit ne sera remboursé ({creditsCost} crédits iront au membre de jury).
            </p>
          </div>
        )}

        {userRole === 'candidate' && isFree && (
          <div className="mb-4 rounded-lg border border-green-500/40 bg-green-500/10 p-4">
            <p className="text-sm text-green-300 font-semibold mb-1">✅ Annulation gratuite</p>
            <p className="text-xs text-gray-300">
              Remboursement intégral de {creditsCost} crédits.
            </p>
          </div>
        )}

        {/* Booking details */}
        <div className="mb-4 p-3 rounded-lg bg-background/40 border border-border">
          <p className="text-sm text-gray-400 mb-1">Détails de la session</p>
          <p className="text-sm">
            {userRole === 'coach' ? booking.candidate_name_snapshot : booking.coach_name_snapshot}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(booking.scheduled_at).toLocaleString()} • {booking.duration_minutes} min
          </p>
        </div>

        {/* Reason selection */}
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">Raison de l'annulation *</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white text-sm"
          >
            <option value="">Sélectionnez une raison...</option>
            {reasons.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Additional details */}
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">Détails supplémentaires (facultatif)</label>
          <textarea
            value={reasonDetail}
            onChange={(e) => setReasonDetail(e.target.value)}
            placeholder="Précisez les circonstances..."
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
            Conserver la réservation
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCancel} 
            loading={loading}
            disabled={!reason}
            fullWidth
            className="bg-red-600 hover:bg-red-700"
          >
            Confirmer l'annulation
          </Button>
        </div>
      </Card>
    </div>
  )
}
