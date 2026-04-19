'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import CandidateNavbar from '@/components/CandidateNavbar'
import { Button, Input, LoadingSpinner } from '@/components/ui'
import { ArrowLeft, Save, CheckCircle, User, Bell, BookOpen, Trophy, GraduationCap, Mail, Lock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

/* ---------- types ---------- */
type Concours = { id: string; intitulé: string }

type PreviousAttempt = {
  year: string
  score: string
  feedback: string
}

export default function ProfilePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const router = useRouter()

  // identity
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  // concours selection
  const [allConcours, setAllConcours] = useState<Concours[]>([])
  const [selectedConcours, setSelectedConcours] = useState<string[]>([])
  const [targetYear, setTargetYear] = useState('2026')

  // experience & motivation
  const [parcoursPro, setParcoursPro] = useState('')
  const [motivations, setMotivations] = useState('')

  // previous attempts
  const [hasPreviousAttempt, setHasPreviousAttempt] = useState(false)
  const [previousAttempts, setPreviousAttempts] = useState<PreviousAttempt[]>([{ year: '', score: '', feedback: '' }])

  // preparation level
  const [prepLevel, setPrepLevel] = useState<'débutant' | 'intermédiaire' | 'avancé'>('débutant')

  // notification prefs
  const [emailReminders, setEmailReminders] = useState(true)
  const [simulationReminders, setSimulationReminders] = useState(true)
  const [coachMessages, setCoachMessages] = useState(true)

  // ui
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && profile) {
      loadProfile()
      loadConcours()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile])

  async function loadConcours() {
    const { data } = await supabase.from('concours').select('id, intitulé').order('intitulé')
    setAllConcours((data ?? []) as unknown as Concours[])
  }

  async function loadProfile() {
    const uid = user!.id

    // name from profile
    setFirstName(profile!.first_name || (profile!.full_name?.split(' ')[0] ?? ''))
    setLastName(profile!.last_name || (profile!.full_name?.split(' ').slice(1).join(' ') ?? ''))

    // candidate_profiles
    const { data: cp } = await supabase
      .from('candidate_profiles')
      .select('bio_fr, current_profession, previous_attempts, statement_of_purpose, learning_style, anxiety_level')
      .eq('user_id', uid)
      .single()

    if (cp) {
      setParcoursPro(cp.current_profession ?? '')
      setMotivations(cp.statement_of_purpose ?? '')
      if (Array.isArray(cp.previous_attempts) && cp.previous_attempts.length > 0) {
        setHasPreviousAttempt(true)
        setPreviousAttempts(cp.previous_attempts as PreviousAttempt[])
      }
    }

    // user_concours_goals
    const { data: goals } = await supabase
      .from('user_concours_goals')
      .select('concours_id, target_date, status')
      .eq('user_id', uid)
    if (goals && goals.length > 0) {
      setSelectedConcours(goals.map(g => g.concours_id))
      const firstTarget = goals[0].target_date
      if (firstTarget) setTargetYear(new Date(firstTarget).getFullYear().toString())
    }

    // user_preferences
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('email_notifications, difficulty_preference')
      .eq('user_id', uid)
      .single()
    if (prefs?.email_notifications && typeof prefs.email_notifications === 'object') {
      const notifs = prefs.email_notifications as Record<string, boolean>
      setEmailReminders(notifs.concours_deadline ?? true)
      setSimulationReminders(notifs.simulation_complete ?? true)
      setCoachMessages(notifs.booking_reminder ?? true)
    }
    if (prefs?.difficulty_preference) {
      const map: Record<string, 'débutant' | 'intermédiaire' | 'avancé'> = {
        easy: 'débutant', adaptive: 'intermédiaire', medium: 'intermédiaire', hard: 'avancé',
      }
      setPrepLevel(map[prefs.difficulty_preference] ?? 'débutant')
    }

    setLoading(false)
  }

  async function handleSave() {
    if (!user) return

    // Validate required fields
    const errors: Record<string, string> = {}
    if (!firstName.trim()) errors.firstName = 'Le prénom est requis'
    if (!lastName.trim()) errors.lastName = 'Le nom est requis'
    if (firstName.trim().length > 0 && firstName.trim().length < 2) errors.firstName = 'Le prénom doit contenir au moins 2 caractères'
    if (lastName.trim().length > 0 && lastName.trim().length < 2) errors.lastName = 'Le nom doit contenir au moins 2 caractères'
    if (selectedConcours.length === 0) errors.concours = 'Sélectionnez au moins un concours'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setError('Veuillez corriger les erreurs ci-dessous')
      return
    }

    setSaving(true)
    setError('')
    setSaved(false)
    const uid = user.id

    try {
      // update profiles
      const fullName = `${firstName} ${lastName}`.trim()
      await supabase.from('profiles').update({
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
      }).eq('id', uid)

      // upsert candidate_profiles
      await supabase.from('candidate_profiles').upsert({
        user_id: uid,
        current_profession: parcoursPro,
        statement_of_purpose: motivations,
        previous_attempts: hasPreviousAttempt ? previousAttempts : [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      // sync user_concours_goals
      await supabase.from('user_concours_goals').delete().eq('user_id', uid)
      if (selectedConcours.length > 0) {
        const goals = selectedConcours.map(cid => ({
          user_id: uid,
          concours_id: cid,
          target_date: `${targetYear}-12-31`,
          status: 'preparing' as const,
        }))
        await supabase.from('user_concours_goals').insert(goals)
      }

      // upsert user_preferences
      const difficultyMap: Record<string, string> = {
        'débutant': 'easy', 'intermédiaire': 'adaptive', 'avancé': 'hard',
      }
      await supabase.from('user_preferences').upsert({
        user_id: uid,
        email_notifications: {
          simulation_complete: simulationReminders,
          booking_reminder: coachMessages,
          concours_deadline: emailReminders,
          marketing: false,
        },
        difficulty_preference: difficultyMap[prepLevel] ?? 'adaptive',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message ?? 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  function toggleConcours(id: string) {
    setSelectedConcours(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  function updateAttempt(index: number, field: keyof PreviousAttempt, value: string) {
    setPreviousAttempts(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))
  }

  function addAttempt() {
    setPreviousAttempts(prev => [...prev, { year: '', score: '', feedback: '' }])
  }

  function removeAttempt(index: number) {
    setPreviousAttempts(prev => prev.filter((_, i) => i !== index))
  }

  // initials
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U'

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
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Mon profil</h1>
        </div>

        {/* ── 1. Avatar + Name ── */}
        <section className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 space-y-4 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input label="Prénom" value={firstName} onChange={setFirstName} placeholder="Votre prénom" />
                {fieldErrors.firstName && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.firstName}
                  </p>
                )}
              </div>
              <div>
                <Input label="Nom" value={lastName} onChange={setLastName} placeholder="Votre nom" />
                {fieldErrors.lastName && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>
            {/* Email (read-only) */}
            <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3 border border-white/10">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">{user?.email}</span>
              <span className="ml-auto text-xs text-gray-500">Non modifiable</span>
            </div>
            {/* Password change link */}
            <Link
              href="/reset-password"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Lock className="w-4 h-4" /> Modifier mon mot de passe
            </Link>
          </div>
        </section>

        {/* ── 2. Concours Selection ── */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" /> Concours préparés
          </h2>
          <p className="text-sm text-gray-400">Sélectionnez les concours que vous préparez :</p>
          <div className="flex flex-wrap gap-2">
            {allConcours.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleConcours(c.id)}
                className={`px-4 py-2 rounded-lg text-sm border transition ${
                  selectedConcours.includes(c.id)
                    ? 'bg-primary/20 border-primary text-primary-light'
                    : 'border-white/10 text-gray-400 hover:border-white/30'
                }`}
              >
                {c.intitulé}
              </button>
            ))}
            {allConcours.length === 0 && (
              <p className="text-gray-500 text-sm">Aucun concours disponible.</p>
            )}
          </div>
          {fieldErrors.concours && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {fieldErrors.concours}
            </p>
          )}
        </section>

        {/* ── 3. Session préparée ── */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" /> Session préparée
          </h2>
          <div className="flex gap-3">
            {['2025', '2026', '2027'].map(y => (
              <button
                key={y}
                type="button"
                onClick={() => setTargetYear(y)}
                className={`px-5 py-2 rounded-lg border text-sm transition ${
                  targetYear === y
                    ? 'bg-primary/20 border-primary text-primary-light'
                    : 'border-white/10 text-gray-400 hover:border-white/30'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </section>

        {/* ── 4. Expérience ── */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Parcours professionnel
          </h2>
          <textarea
            value={parcoursPro}
            onChange={e => setParcoursPro(e.target.value)}
            placeholder="Décrivez votre parcours professionnel, vos fonctions actuelles ou passées…"
            rows={4}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </section>

        {/* ── 5. Motivations ── */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Motivations
          </h2>
          <textarea
            value={motivations}
            onChange={e => setMotivations(e.target.value)}
            placeholder="Pourquoi préparez-vous ce concours ? Quelles sont vos motivations profondes ?"
            rows={4}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </section>

        {/* ── 6. Previous Attempts ── */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Tentatives précédentes</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-12 h-6 rounded-full transition-colors relative ${hasPreviousAttempt ? 'bg-primary' : 'bg-white/10'}`}
              onClick={() => setHasPreviousAttempt(!hasPreviousAttempt)}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${hasPreviousAttempt ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-300">Avez-vous déjà passé ce concours ?</span>
          </label>
          {hasPreviousAttempt && (
            <div className="space-y-4 mt-2">
              {previousAttempts.map((attempt, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-300">Tentative {i + 1}</p>
                    {previousAttempts.length > 1 && (
                      <button type="button" onClick={() => removeAttempt(i)} className="text-red-400 text-xs hover:underline">
                        Supprimer
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Année" value={attempt.year} onChange={v => updateAttempt(i, 'year', v)} placeholder="2024" />
                    <Input label="Score obtenu" value={attempt.score} onChange={v => updateAttempt(i, 'score', v)} placeholder="12/20" />
                  </div>
                  <textarea
                    value={attempt.feedback}
                    onChange={e => updateAttempt(i, 'feedback', e.target.value)}
                    placeholder="Retour / commentaires sur cette tentative…"
                    rows={2}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                  />
                </div>
              ))}
              <button type="button" onClick={addAttempt} className="text-primary text-sm hover:underline">
                + Ajouter une tentative
              </button>
            </div>
          )}
        </section>

        {/* ── 7. Preparation Level ── */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Niveau de préparation</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            {([
              { value: 'débutant' as const, label: 'Débutant', desc: 'Je découvre le concours' },
              { value: 'intermédiaire' as const, label: 'Intermédiaire', desc: "J'ai déjà travaillé quelques sujets" },
              { value: 'avancé' as const, label: 'Avancé', desc: 'Je maîtrise le format et les attendus' },
            ]).map(level => (
              <button
                key={level.value}
                type="button"
                onClick={() => setPrepLevel(level.value)}
                className={`flex-1 p-4 rounded-xl border text-left transition ${
                  prepLevel === level.value
                    ? 'bg-primary/20 border-primary'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <p className="font-medium text-sm">{level.label}</p>
                <p className="text-xs text-gray-400 mt-1">{level.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ── 8. Notification Preferences ── */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Notifications
          </h2>
          {[
            { label: 'Rappels des échéances concours', state: emailReminders, set: setEmailReminders },
            { label: 'Rappels de simulation', state: simulationReminders, set: setSimulationReminders },
            { label: 'Messages des coachs', state: coachMessages, set: setCoachMessages },
          ].map((pref, i) => (
            <label key={i} className="flex items-center justify-between cursor-pointer py-2">
              <span className="text-sm text-gray-300">{pref.label}</span>
              <div
                className={`w-12 h-6 rounded-full transition-colors relative ${pref.state ? 'bg-primary' : 'bg-white/10'}`}
                onClick={() => pref.set(!pref.state)}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${pref.state ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </div>
            </label>
          ))}
        </section>

        {/* ── 9. Save ── */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Profil sauvegardé avec succès !
          </div>
        )}
        <Button onClick={handleSave} loading={saving} fullWidth className="!py-4 text-lg">
          <Save className="w-5 h-5" /> Enregistrer le profil
        </Button>
      </div>
    </div>
  )
}
