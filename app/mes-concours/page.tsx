'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import CandidateNavbar from '@/components/CandidateNavbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Star, Calendar, Archive, Mic } from 'lucide-react'

type ConcoursGoal = {
  id: string
  concours_id: string
  target_date: string | null
  status: string
  concours?: { intitulé: string } | null
}

export default function MesConcoursPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [goals, setGoals] = useState<ConcoursGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dateInput, setDateInput] = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) fetchGoals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchGoals() {
    const { data } = await supabase
      .from('user_concours_goals')
      .select('id, concours_id, target_date, status, concours:concours_id(intitulé)')
      .eq('user_id', user!.id)
      .neq('status', 'archived')
    setGoals((data ?? []) as unknown as ConcoursGoal[])
    setLoading(false)
  }

  async function setAsPrimary(id: string) {
    const target = goals.find(g => g.id === id)
    if (!target) return
    setGoals(prev => [target, ...prev.filter(g => g.id !== id)])
  }

  async function updateDate(id: string, date: string) {
    await supabase
      .from('user_concours_goals')
      .update({ target_date: date || null })
      .eq('id', id)
    setGoals(prev => prev.map(g => g.id === id ? { ...g, target_date: date || null } : g))
    setEditingId(null)
  }

  async function archiveGoal(id: string) {
    if (!window.confirm('Archiver ce concours ? Il ne sera plus visible sur votre dashboard.')) return
    await supabase.from('user_concours_goals').update({ status: 'archived' }).eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F1629' }}>
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#0F1629' }}>
      <CandidateNavbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Mes concours</h1>
          </div>
          <Link
            href="/profile"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Ajouter un concours
          </Link>
        </div>

        {/* Empty state */}
        {goals.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <Mic className="w-12 h-12 text-gray-600 mx-auto" />
            <p className="text-gray-400">Aucun concours configuré.</p>
            <Link href="/profile" className="text-indigo-400 text-sm hover:underline">
              Ajouter votre premier concours &rarr;
            </Link>
          </div>
        )}

        {/* Concours list */}
        {goals.length > 0 && (
          <div className="space-y-3">
            {goals.map((goal, idx) => (
              <div
                key={goal.id}
                className="bg-slate-900/50 border border-white/8 rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Name + badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white text-sm">
                        {goal.concours?.intitulé ?? goal.concours_id}
                      </p>
                      {idx === 0 && (
                        <span className="inline-flex items-center gap-1 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full px-2 py-0.5">
                          <Star className="w-3 h-3" /> Principal
                        </span>
                      )}
                    </div>

                    {/* Date field */}
                    {editingId === goal.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="date"
                          value={dateInput}
                          onChange={e => setDateInput(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => updateDate(goal.id, dateInput)}
                          className="text-xs text-indigo-400 hover:underline"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(goal.id)
                          setDateInput(goal.target_date?.slice(0, 10) ?? '')
                        }}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mt-2"
                      >
                        <Calendar className="w-3 h-3" />
                        {goal.target_date
                          ? `Oral le ${new Date(goal.target_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                          : "Ajouter une date d'oral"
                        }
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {idx !== 0 && (
                      <button
                        onClick={() => setAsPrimary(goal.id)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Définir comme principal
                      </button>
                    )}
                    <button
                      onClick={() => archiveGoal(goal.id)}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      <Archive className="w-3 h-3" /> Archiver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-600 text-center">
          Le concours marqué &ldquo;Principal&rdquo; est celui qui s&rsquo;affiche par défaut sur votre dashboard.
        </p>
      </div>
    </div>
  )
}
