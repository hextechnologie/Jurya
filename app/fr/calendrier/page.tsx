'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DEFAULT_COUNTRY } from '@/lib/countries'
import { CalendarIcon, Clock, Filter, Search } from 'lucide-react'

interface ConcoursSessionRow {
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
  source_url: string | null
  notes: string | null
  concours?: {
    intitulé: string
    type: string
    grade: string
    organisme_organisateur: string
  }
}

const TYPE_LABELS: Record<string, string> = {
  territorial: 'Territoriale',
  état: 'État',
  hospitalière: 'Hospitalière',
  grande_école: 'Grande école',
  CRFPA: 'CRFPA',
  autre: 'Autre',
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function CalendrierPage() {
  const [sessions, setSessions] = useState<ConcoursSessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterDeadlineDays, setFilterDeadlineDays] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('concours_sessions')
      .select(`
        *,
        concours:concours_id (
          intitulé,
          type,
          grade,
          organisme_organisateur
        )
      `)
      .eq('country', DEFAULT_COUNTRY)
      .order('inscription_close_date', { ascending: true })

    if (!error && data) {
      setSessions(data as unknown as ConcoursSessionRow[])
    }
    setLoading(false)
  }

  const filteredSessions = sessions.filter((s) => {
    if (filterType !== 'all' && s.concours?.type !== filterType) return false
    if (filterDeadlineDays !== null) {
      const days = daysUntil(s.inscription_close_date)
      if (days === null || days < 0 || days > filterDeadlineDays) return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesName = s.concours?.intitulé?.toLowerCase().includes(q)
      const matchesOrg = s.concours?.organisme_organisateur?.toLowerCase().includes(q)
      if (!matchesName && !matchesOrg) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <CalendarIcon className="w-8 h-8 text-violet-400" />
          <h1 className="text-3xl font-bold">Calendrier des concours</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un concours..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-violet-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-violet-500"
          >
            <option value="all">Tous les types</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={filterDeadlineDays ?? ''}
            onChange={(e) => setFilterDeadlineDays(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-violet-500"
          >
            <option value="">Toutes les échéances</option>
            <option value="7">Clôture dans 7 jours</option>
            <option value="30">Clôture dans 30 jours</option>
            <option value="90">Clôture dans 90 jours</option>
          </select>
        </div>

        {/* Sessions list */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Aucune session de concours trouvée.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const daysLeft = daysUntil(session.inscription_close_date)
              const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 14
              const isPast = daysLeft !== null && daysLeft < 0

              return (
                <div
                  key={session.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-violet-500/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                          {TYPE_LABELS[session.concours?.type || ''] || session.concours?.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {session.concours?.organisme_organisateur}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold">
                        {session.concours?.intitulé || 'Concours'}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Grade : {session.concours?.grade} · Session {session.year}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-sm">
                      {session.inscription_close_date && (
                        <div className={`flex items-center gap-1 ${isUrgent ? 'text-amber-400' : isPast ? 'text-gray-500' : 'text-gray-300'}`}>
                          <Clock className="w-4 h-4" />
                          {isPast ? (
                            <span>Inscriptions closes</span>
                          ) : (
                            <span>
                              Clôture inscriptions : {formatDate(session.inscription_close_date)}
                              {daysLeft !== null && daysLeft >= 0 && (
                                <span className="ml-1 font-medium">
                                  ({daysLeft === 0 ? "aujourd'hui" : `dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`})
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                      {session.épreuves_orales_start_date && (
                        <div className="text-gray-400">
                          Oraux : {formatDate(session.épreuves_orales_start_date)}
                          {session.épreuves_orales_end_date && session.épreuves_orales_end_date !== session.épreuves_orales_start_date
                            ? ` — ${formatDate(session.épreuves_orales_end_date)}`
                            : ''}
                        </div>
                      )}
                      {session.source_url && (
                        <a
                          href={session.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-400 hover:text-violet-300 text-xs underline"
                        >
                          Source officielle ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {session.notes && (
                    <p className="text-xs text-gray-500 mt-3 italic">{session.notes}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
