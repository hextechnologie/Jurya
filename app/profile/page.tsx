'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import CandidateNavbar from '@/components/CandidateNavbar'
import { LoadingSpinner } from '@/components/ui'
import {
  ArrowLeft, Save, CheckCircle, User, Bell, BookOpen, Shield,
  Camera, Mail, Lock, AlertCircle, GraduationCap, Trophy,
} from 'lucide-react'
import Link from 'next/link'

type Tab = 'identite' | 'preparation' | 'notifications' | 'confidentialite'
type PrepLevel = 'debutant' | 'intermediaire' | 'avance'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'identite', label: 'Identité', icon: User },
  { id: 'preparation', label: 'Ma préparation', icon: BookOpen },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'confidentialite', label: 'Confidentialité', icon: Shield },
]

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${value ? 'bg-indigo-600' : 'bg-white/10'}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </div>
  )
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
    >
      {saving ? (
        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement&hellip;</>
      ) : (
        <><Save className="w-4 h-4" /> Enregistrer</>
      )}
    </button>
  )
}

type Concours = { id: string; intitulé: string }

export default function ProfilePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<Tab>('identite')
  const [loading, setLoading] = useState(true)

  // — Identité —
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // — Ma préparation —
  const [allConcours, setAllConcours] = useState<Concours[]>([])
  const [selectedConcours, setSelectedConcours] = useState<string[]>([])
  const [targetYear, setTargetYear] = useState('2026')
  const [prepLevel, setPrepLevel] = useState<PrepLevel>('debutant')

  // — Notifications —
  const [emailReminders, setEmailReminders] = useState(true)
  const [simulationReminders, setSimulationReminders] = useState(true)
  const [coachMessages, setCoachMessages] = useState(true)

  // — UI —
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadConcours()
      if (profile) loadProfile()
      else setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, authLoading])

  async function loadConcours() {
    const { data } = await supabase.from('concours').select('id, intitulé').order('intitulé')
    setAllConcours((data ?? []) as unknown as Concours[])
  }

  async function loadProfile() {
    const uid = user!.id
    setFirstName(profile!.first_name || profile!.full_name?.split(' ')[0] || '')
    setLastName(profile!.last_name || profile!.full_name?.split(' ').slice(1).join(' ') || '')

    const { data: goals } = await supabase
      .from('user_concours_goals')
      .select('concours_id, target_date')
      .eq('user_id', uid)
    if (goals?.length) {
      setSelectedConcours(goals.map((g: { concours_id: string; target_date: string | null }) => g.concours_id))
      const y = goals[0].target_date ? new Date(goals[0].target_date).getFullYear().toString() : '2026'
      setTargetYear(y)
    }

    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('email_notifications, difficulty_preference')
      .eq('user_id', uid)
      .maybeSingle()
    if (prefs) {
      if (prefs.email_notifications && typeof prefs.email_notifications === 'object') {
        const n = prefs.email_notifications as Record<string, boolean>
        setEmailReminders(n.concours_deadline ?? true)
        setSimulationReminders(n.simulation_complete ?? true)
        setCoachMessages(n.booking_reminder ?? true)
      }
      const diffMap: Record<string, PrepLevel> = {
        easy: 'debutant', adaptive: 'intermediaire', medium: 'intermediaire', hard: 'avance',
      }
      if (prefs.difficulty_preference) setPrepLevel(diffMap[prefs.difficulty_preference] ?? 'debutant')
    }
    setLoading(false)
  }

  const onAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const feedbackReset = () => { setSaved(false); setSaveError('') }

  async function saveIdentite() {
    if (!user) return
    const errors: Record<string, string> = {}
    if (!firstName.trim() || firstName.trim().length < 2) errors.firstName = 'Prénom requis (min. 2 caractères)'
    if (!lastName.trim() || lastName.trim().length < 2) errors.lastName = 'Nom requis (min. 2 caractères)'
    setFieldErrors(errors)
    if (Object.keys(errors).length) return

    setSaving(true); feedbackReset()
    try {
      let avatarUrl: string | undefined
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const { data: up } = await supabase.storage
          .from('avatars')
          .upload(`${user.id}.${ext}`, avatarFile, { upsert: true })
        if (up) avatarUrl = supabase.storage.from('avatars').getPublicUrl(up.path).data.publicUrl
      }
      await supabase.from('profiles').update({
        full_name: `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      }).eq('id', user.id)
      await refreshProfile()
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally { setSaving(false) }
  }

  async function savePreparation() {
    if (!user) return
    setSaving(true); feedbackReset()
    try {
      await supabase.from('user_concours_goals').delete().eq('user_id', user.id)
      if (selectedConcours.length > 0) {
        await supabase.from('user_concours_goals').insert(
          selectedConcours.map(cid => ({
            user_id: user.id, concours_id: cid,
            target_date: `${targetYear}-12-31`, status: 'preparing',
          }))
        )
      }
      const diffMap: Record<PrepLevel, string> = { debutant: 'easy', intermediaire: 'adaptive', avance: 'hard' }
      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        difficulty_preference: diffMap[prepLevel],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally { setSaving(false) }
  }

  async function saveNotifications() {
    if (!user) return
    setSaving(true); feedbackReset()
    try {
      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        email_notifications: {
          concours_deadline: emailReminders,
          simulation_complete: simulationReminders,
          booking_reminder: coachMessages,
          marketing: false,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally { setSaving(false) }
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U'
  const currentAvatarUrl = avatarPreview || profile?.avatar_url

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F1629' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#0F1629' }}>
      <CandidateNavbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Mon profil</h1>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setFieldErrors({}); feedbackReset() }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Feedback banners */}
        {saved && (
          <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Enregistré avec succès
          </div>
        )}
        {saveError && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">{saveError}</div>
        )}

        {/* ── Tab: Identité ── */}
        {activeTab === 'identite' && (
          <div className="space-y-5">
            <section className="bg-slate-900/50 border border-white/8 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative shrink-0">
                {currentAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentAvatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-indigo-400/40" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-3xl font-bold">
                    {initials}
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center cursor-pointer hover:bg-indigo-500 transition-colors border-2 border-slate-900"
                  title="Changer la photo"
                >
                  <Camera className="w-4 h-4 text-white" />
                </label>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wide">Prénom</label>
                    <input
                      value={firstName} onChange={e => setFirstName(e.target.value)}
                      placeholder="Votre prénom"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    {fieldErrors.firstName && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wide">Nom</label>
                    <input
                      value={lastName} onChange={e => setLastName(e.target.value)}
                      placeholder="Votre nom"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    {fieldErrors.lastName && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-300">{user?.email}</span>
                  <span className="ml-auto text-xs text-gray-600">Non modifiable</span>
                </div>
                <Link href="/reset-password" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  <Lock className="w-4 h-4" /> Modifier mon mot de passe
                </Link>
              </div>
            </section>
            <SaveButton onClick={saveIdentite} saving={saving} />
          </div>
        )}

        {/* ── Tab: Ma préparation ── */}
        {activeTab === 'preparation' && (
          <div className="space-y-5">
            <section className="bg-slate-900/50 border border-white/8 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-base flex items-center gap-2 text-white">
                <Trophy className="w-4 h-4 text-indigo-400" /> Concours préparés
              </h2>
              <p className="text-sm text-gray-500">Sélectionnez les concours que vous préparez.</p>
              <div className="flex flex-wrap gap-2">
                {allConcours.map(c => (
                  <button
                    key={c.id} type="button"
                    onClick={() => setSelectedConcours(prev =>
                      prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id]
                    )}
                    className={`px-4 py-2 rounded-lg text-sm border transition ${
                      selectedConcours.includes(c.id)
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'border-white/10 text-gray-400 hover:border-white/30'
                    }`}
                  >
                    {c.intitulé}
                  </button>
                ))}
                {allConcours.length === 0 && <p className="text-gray-500 text-sm">Aucun concours disponible.</p>}
              </div>
            </section>

            <section className="bg-slate-900/50 border border-white/8 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-base flex items-center gap-2 text-white">
                <GraduationCap className="w-4 h-4 text-indigo-400" /> Session visée
              </h2>
              <div className="flex gap-3">
                {['2025', '2026', '2027'].map(y => (
                  <button key={y} type="button" onClick={() => setTargetYear(y)}
                    className={`px-5 py-2 rounded-lg border text-sm transition ${
                      targetYear === y
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'border-white/10 text-gray-400 hover:border-white/30'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-slate-900/50 border border-white/8 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-base text-white">Niveau de préparation</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                {([
                  { value: 'debutant' as const, label: 'Débutant', desc: 'Je découvre le concours' },
                  { value: 'intermediaire' as const, label: 'Intermédiaire', desc: "J'ai déjà travaillé quelques sujets" },
                  { value: 'avance' as const, label: 'Avancé', desc: 'Je maîtrise le format et les attendus' },
                ]).map(level => (
                  <button key={level.value} type="button" onClick={() => setPrepLevel(level.value)}
                    className={`flex-1 p-4 rounded-xl border text-left transition ${
                      prepLevel === level.value ? 'bg-indigo-600/20 border-indigo-500' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <p className="font-medium text-sm text-white">{level.label}</p>
                    <p className="text-xs text-gray-400 mt-1">{level.desc}</p>
                  </button>
                ))}
              </div>
            </section>

            <SaveButton onClick={savePreparation} saving={saving} />
          </div>
        )}

        {/* ── Tab: Notifications ── */}
        {activeTab === 'notifications' && (
          <div className="space-y-5">
            <section className="bg-slate-900/50 border border-white/8 rounded-2xl p-6 space-y-1">
              <h2 className="font-semibold text-base flex items-center gap-2 text-white mb-4">
                <Bell className="w-4 h-4 text-indigo-400" /> Préférences de notifications
              </h2>
              {[
                { label: 'Rappels des échéances concours', state: emailReminders, set: setEmailReminders },
                { label: 'Rappels de simulation', state: simulationReminders, set: setSimulationReminders },
                { label: 'Messages des coachs', state: coachMessages, set: setCoachMessages },
              ].map((pref, i) => (
                <label key={i} className="flex items-center justify-between cursor-pointer py-3 border-b border-white/5 last:border-0">
                  <span className="text-sm text-gray-300">{pref.label}</span>
                  <Toggle value={pref.state} onChange={pref.set} />
                </label>
              ))}
            </section>
            <SaveButton onClick={saveNotifications} saving={saving} />
          </div>
        )}

        {/* ── Tab: Confidentialité & compte ── */}
        {activeTab === 'confidentialite' && (
          <div className="space-y-5">
            <section className="bg-slate-900/50 border border-white/8 rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-base flex items-center gap-2 text-white">
                <Shield className="w-4 h-4 text-indigo-400" /> Confidentialité &amp; compte
              </h2>
              <p className="text-sm text-gray-500">Gérez vos données personnelles et les paramètres de votre compte.</p>

              <div className="border-t border-white/5 pt-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Export de mes données</p>
                  <p className="text-xs text-gray-500 mt-0.5">Téléchargez une copie de toutes vos données Jurya au format JSON.</p>
                </div>
                <button
                  onClick={() => alert('Export en cours de développement. Disponible prochainement.')}
                  className="shrink-0 text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-400/30 rounded-xl px-4 py-2 transition-colors"
                >
                  Exporter
                </button>
              </div>

              <div className="border-t border-white/5 pt-5">
                <button
                  onClick={() => {
                    if (window.confirm('Supprimer définitivement votre compte et toutes vos données ? Cette action est irréversible.')) {
                      alert('Suppression en cours de développement. Contactez support@jurya.fr pour toute demande urgente.')
                    }
                  }}
                  className="text-red-400 text-sm hover:text-red-300 transition-colors"
                >
                  Supprimer mon compte
                </button>
                <p className="text-xs text-gray-600 mt-1">Cette action est irréversible et supprime toutes vos données.</p>
              </div>
            </section>
          </div>
        )}

      </div>
    </div>
  )
}
