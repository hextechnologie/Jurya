'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { CalendarIcon, Clock, BookOpen, Bell, BellOff, ExternalLink } from 'lucide-react'

interface ConcoursDetail {
  id: string
  type: string
  grade: string
  intitulé: string
  coefficient_oral: number
  durée_épreuve_minutes: number
  rubrique_jury: Record<string, any>
  country: string
  organisme_organisateur: string
}

interface SessionDetail {
  id: string
  year: number
  inscription_open_date: string | null
  inscription_close_date: string | null
  épreuves_écrites_date: string | null
  épreuves_orales_start_date: string | null
  épreuves_orales_end_date: string | null
  résultats_date: string | null
  source_url: string | null
  notes: string | null
}

const TYPE_LABELS: Record<string, string> = {
  territorial: 'Fonction publique territoriale',
  état: 'Fonction publique d\'État',
  hospitalière: 'Fonction publique hospitalière',
  grande_école: 'Grande école',
  CRFPA: 'CRFPA',
  autre: 'Autre',
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'À confirmer'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function ConcoursDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [concours, setConcours] = useState<ConcoursDetail | null>(null)
  const [sessions, setSessions] = useState<SessionDetail[]>([])
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConcours()
  }, [id])

  async function loadConcours() {
    setLoading(true)

    const { data: concoursData } = await supabase
      .from('concours')
      .select('*')
      .eq('id', id)
      .single()

    if (concoursData) {
      setConcours(concoursData as ConcoursDetail)

      const { data: sessionData } = await supabase
        .from('concours_sessions')
        .select('*')
        .eq('concours_id', id)
        .order('year', { ascending: false })

      if (sessionData) {
        setSessions(sessionData as SessionDetail[])
      }

      // Check if reminder is enabled
      if (user) {
        const nextSession = sessionData?.[0]
        if (nextSession) {
          const { data: reminder } = await supabase
            .from('user_concours_reminders')
            .select('enabled')
            .eq('user_id', user.id)
            .eq('concours_session_id', nextSession.id)
            .single()

          if (reminder) {
            setReminderEnabled(reminder.enabled)
          }
        }
      }
    }

    setLoading(false)
  }

  async function toggleReminder() {
    if (!user || sessions.length === 0) return
    const nextSession = sessions[0]

    if (reminderEnabled) {
      await supabase
        .from('user_concours_reminders')
        .update({ enabled: false })
        .eq('user_id', user.id)
        .eq('concours_session_id', nextSession.id)
    } else {
      await supabase
        .from('user_concours_reminders')
        .upsert({
          user_id: user.id,
          concours_session_id: nextSession.id,
          enabled: true,
        })
    }

    setReminderEnabled(!reminderEnabled)
    // TODO(mouj): wire up email notifications
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    )
  }

  if (!concours) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">Concours introuvable.</div>
      </div>
    )
  }

  const nextSession = sessions[0]
  const daysToClose = nextSession ? daysUntil(nextSession.inscription_close_date) : null

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
            {TYPE_LABELS[concours.type] || concours.type}
          </span>
          <h1 className="text-3xl font-bold mt-2">{concours.intitulé}</h1>
          <p className="text-gray-400 mt-1">
            Grade : {concours.grade} · Organisateur : {concours.organisme_organisateur}
          </p>
        </div>

        {/* Exam details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-violet-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Durée de l&apos;oral</span>
            </div>
            <p className="text-2xl font-bold">{concours.durée_épreuve_minutes} min</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-violet-400 mb-2">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Coefficient oral</span>
            </div>
            <p className="text-2xl font-bold">{concours.coefficient_oral}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-violet-400 mb-2">
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Pays</span>
            </div>
            <p className="text-2xl font-bold">{concours.country}</p>
          </div>
        </div>

        {/* Prochaine session */}
        {nextSession && (
          <div className="bg-gradient-to-r from-violet-900/30 to-indigo-900/30 border border-violet-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-violet-400" />
                Prochaine session — {nextSession.year}
              </h2>
              {user && (
                <button
                  onClick={toggleReminder}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    reminderEnabled
                      ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {reminderEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  {reminderEnabled ? 'Rappel activé' : 'Activer le rappel'}
                </button>
              )}
            </div>

            {/* Deadline countdown */}
            {daysToClose !== null && daysToClose >= 0 && (
              <div className={`text-lg font-semibold mb-4 ${daysToClose <= 14 ? 'text-amber-400' : 'text-green-400'}`}>
                Clôture des inscriptions dans {daysToClose === 0 ? "moins d'un jour" : `${daysToClose} jour${daysToClose > 1 ? 's' : ''}`}
              </div>
            )}
            {daysToClose !== null && daysToClose < 0 && (
              <div className="text-gray-500 mb-4">Inscriptions closes</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Ouverture inscriptions :</span>{' '}
                <span className="text-white">{formatDate(nextSession.inscription_open_date)}</span>
              </div>
              <div>
                <span className="text-gray-400">Clôture inscriptions :</span>{' '}
                <span className="text-white">{formatDate(nextSession.inscription_close_date)}</span>
              </div>
              <div>
                <span className="text-gray-400">Épreuves écrites :</span>{' '}
                <span className="text-white">{formatDate(nextSession.épreuves_écrites_date)}</span>
              </div>
              <div>
                <span className="text-gray-400">Épreuves orales :</span>{' '}
                <span className="text-white">
                  {formatDate(nextSession.épreuves_orales_start_date)}
                  {nextSession.épreuves_orales_end_date && nextSession.épreuves_orales_end_date !== nextSession.épreuves_orales_start_date
                    ? ` — ${formatDate(nextSession.épreuves_orales_end_date)}`
                    : ''}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Résultats :</span>{' '}
                <span className="text-white">{formatDate(nextSession.résultats_date)}</span>
              </div>
              {nextSession.source_url && (
                <div>
                  <a
                    href={nextSession.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Source officielle
                  </a>
                </div>
              )}
            </div>

            {nextSession.notes && (
              <p className="text-xs text-gray-500 mt-3 italic">{nextSession.notes}</p>
            )}
          </div>
        )}

        {/* Rubrique du jury */}
        {concours.rubrique_jury && Object.keys(concours.rubrique_jury).length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Grille d&apos;évaluation du jury</h2>
            <div className="space-y-3">
              {Object.entries(concours.rubrique_jury).map(([key, value]) => (
                <div key={key} className="border-b border-gray-800 pb-3 last:border-0">
                  <h3 className="font-medium text-violet-300">{key}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {typeof value === 'string' ? value : JSON.stringify(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
