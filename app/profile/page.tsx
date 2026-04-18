'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button, Input, LoadingSpinner } from '@/components/ui'
import { ArrowLeft, Save, CheckCircle, User, Bell, BookOpen, Trophy, GraduationCap } from 'lucide-react'
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
    setAllConcours((data ?? []) as Concours[])
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
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <Input label="Prénom" value={firstName} onChange={setFirstName} placeholder="Votre prénom" />
            <Input label="Nom" value={lastName} onChange={setLastName} placeholder="Votre nom" />
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
'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, CheckCircle, Loader2, Sparkles, X } from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

const statusOptions = [
  { value: 'student',        label: '🎓 Étudiant(e)' },
  { value: 'employed',       label: '👨‍💼 En poste' },
  { value: 'unemployed',     label: '🔍 En recherche active' },
  { value: 'career-change',  label: '🔄 Reconversion' },
  { value: 'fresh-graduate', label: '💼 Jeune diplômé(e)' },
  { value: 'other',          label: '🌍 Autre' },
]

const jobRoleOptions = [
  { value: 'Administrateur territorial',  label: 'Administrateur territorial' },
  { value: 'Attaché territorial',    label: 'Attaché territorial' },
  { value: 'Rédacteur territorial',       label: 'Rédacteur territorial' },
  { value: 'Ingénieur territorial',   label: 'Ingénieur territorial' },
  { value: 'Technicien territorial',  label: 'Technicien territorial' },
  { value: 'Inspecteur des finances', label: 'Inspecteur des finances' },
  { value: 'Inspecteur des douanes',  label: 'Inspecteur des douanes' },
  { value: 'Commissaire de police',   label: 'Commissaire de police' },
  { value: 'Magistrat',              label: 'Magistrat' },
  { value: 'Autre',                  label: 'Autre' },
]

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [firstName, setFirstName]     = useState('')
  const [lastName,  setLastName]      = useState('')
  const [currentStatus, setCurrentStatus] = useState('')
  const [statusDetail,  setStatusDetail]  = useState('')
  const [targetJobRole, setTargetJobRole] = useState('')
  const [customJobRole, setCustomJobRole] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [country, setCountry] = useState('')
  const [city,    setCity]    = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [headline, setHeadline] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [experienceList, setExperienceList] = useState<string[]>([])
  const [experienceInput, setExperienceInput] = useState('')
  const [hasNoExperience, setHasNoExperience] = useState(false)
  const [educationList, setEducationList] = useState<string[]>([])
  const [educationInput, setEducationInput] = useState('')
  const [projectsDetails, setProjectsDetails] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null)

  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  // Pre-fill form from existing profile
  useEffect(() => {
    if (!profile) return
    setFirstName(profile.first_name || (profile.full_name?.split(' ')[0] ?? ''))
    setLastName(profile.last_name  || (profile.full_name?.split(' ').slice(1).join(' ') ?? ''))
    setCurrentStatus(profile.current_status  ?? '')
    setStatusDetail(profile.status_detail    ?? '')
    const savedRole = profile.target_job_role ?? ''
    const isKnownRole = jobRoleOptions.some(o => o.value === savedRole)
    if (isKnownRole || savedRole === '') {
      setTargetJobRole(savedRole)
    } else {
      setTargetJobRole('Autre')
      setCustomJobRole(savedRole)
    }
    setExperienceLevel(profile.experience_level ?? '')
    setCountry(profile.country ?? '')
    setCity(profile.city       ?? '')
    setLinkedinUrl(profile.linkedin_url ?? '')
    setHeadline((profile as any).professional_headline ?? '')
    setAboutMe((profile as any).about_me ?? '')
    const exp = (profile as any).experience_details
    if (exp) {
      const expList = exp.split('\n').filter((e: string) => e.trim())
      setExperienceList(expList)
      setHasNoExperience(expList.length === 0)
    }
    const edu = (profile as any).education_details
    if (edu) {
      setEducationList(edu.split('\n').filter((e: string) => e.trim()))
    }
    setProjectsDetails((profile as any).projects_details ?? '')
    setSkillsText(Array.isArray((profile as any).skills) ? (profile as any).skills.join(', ') : '')
    setAvatarPreview(profile.avatar_url ?? '')
  }, [profile])

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const addExperience = () => {
    if (experienceInput.trim() && !experienceList.includes(experienceInput.trim())) {
      setExperienceList([...experienceList, experienceInput.trim()])
      setExperienceInput('')
    }
  }

  const removeExperience = (exp: string) => setExperienceList(experienceList.filter(e => e !== exp))

  const addEducation = () => {
    if (educationInput.trim() && !educationList.includes(educationInput.trim())) {
      setEducationList([...educationList, educationInput.trim()])
      setEducationInput('')
    }
  }

  const removeEducation = (edu: string) => setEducationList(educationList.filter(e => e !== edu))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validation
    if (!headline.trim()) {
      setError('Le titre professionnel est requis')
      return
    }
    if (!aboutMe.trim()) {
      setError('La section À propos est requise')
      return
    }
    if (!hasNoExperience && experienceList.length === 0) {
      setError('Veuillez ajouter au moins une expérience ou cocher "Je n\'ai pas d\'expérience"')
      return
    }
    if (educationList.length === 0) {
      setError('Veuillez ajouter au moins une formation')
      return
    }
    if (!skillsText.trim()) {
      setError('Les compétences sont requises')
      return
    }

    setError('')
    setSaved(false)
    setSaving(true)

    try {
      let avatarUrl = profile?.avatar_url ?? null

      // Upload new avatar if chosen
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(`${user.id}.${ext}`, avatarFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)
        avatarUrl = urlData.publicUrl
      }

      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name:      firstName.trim() || null,
          last_name:       lastName.trim()  || null,
          full_name:       fullName         || null,
          current_status:  currentStatus    || null,
          status_detail:   statusDetail     || null,
          target_job_role: targetJobRole === 'Autre' ? (customJobRole.trim() || null) : (targetJobRole || null),
          target_job_field: targetJobRole === 'Autre' ? (customJobRole.trim().toLowerCase().replace(/\s+/g, '-') || null) : (targetJobRole?.toLowerCase().replace(/\s+/g, '-') || null),
          experience_level: (experienceLevel as 'junior' | 'mid' | 'senior') || null,
          country:         country    || null,
          city:            city       || null,
          linkedin_url:    linkedinUrl || null,
          professional_headline: headline.trim(),
          about_me:        aboutMe.trim(),
          experience_details: hasNoExperience ? 'No experience' : experienceList.join('\n'),
          education_details: educationList.join('\n'),
          projects_details: projectsDetails.trim() || null,
          skills:          skillsText.split(',').map(s => s.trim()).filter(Boolean),
          avatar_url:      avatarUrl,
          updated_at:      new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Échec de la sauvegarde du profil. Veuillez réessayer.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1e' }}>
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  if (!user || !profile) return null

  return (
    <div className="min-h-screen text-white" style={{ background: '#0a0f1e' }}>
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md" style={{ background: 'rgba(10,15,30,0.92)' }}>
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Sparkles className="w-7 h-7 text-purple-400" />
            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Jurya
            </span>
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Mon profil</h1>
          <p className="text-gray-400 text-sm">Mettez à jour vos informations personnelles et vos préférences.</p>
        </div>

        {/* Avatar */}
        <div className="mb-8 flex items-center gap-5">
          <div className="relative">
            {avatarPreview ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-purple-500/40" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-2xl font-bold">
                {(firstName || user.email || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center cursor-pointer border-2 border-[#0a0f1e] hover:bg-purple-500 transition-colors">
              <Camera className="w-3.5 h-3.5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
          </div>
          <div>
            <p className="font-semibold">{[firstName, lastName].filter(Boolean).join(' ') || 'Your Name'}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
            <p className="text-xs text-gray-500 mt-1 capitalize">{profile.subscription_tier} plan</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Name */}
          <div className="rounded-2xl border border-white/10 p-5 space-y-5" style={{ background: '#111827' }}>
            <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider">Informations personnelles</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Prénom" value={firstName} onChange={setFirstName} placeholder="Jean" />
              <Input label="Nom"  value={lastName}  onChange={setLastName}  placeholder="Dupont"  />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Pays" value={country} onChange={setCountry} placeholder="ex. France" />
              <Input label="Ville"    value={city}    onChange={setCity}    placeholder="ex. Paris"  />
            </div>
            <Input
              label="LinkedIn URL"
              value={linkedinUrl}
              onChange={setLinkedinUrl}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          {/* Career */}
          <div className="rounded-2xl border border-white/10 p-5 space-y-5" style={{ background: '#111827' }}>
            <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider">Parcours</h2>
            <Select
              label="Situation actuelle"
              value={currentStatus}
              onChange={setCurrentStatus}
              options={statusOptions}
              placeholder="Qu'est-ce qui vous décrit le mieux ?"
            />
            {currentStatus && (
              <Input
              label="Détails"
              value={statusDetail}
              onChange={setStatusDetail}
              placeholder={
                  currentStatus === 'student'        ? 'ex. Université Paris-Saclay — Droit public' :
                  currentStatus === 'employed'       ? 'ex. Rédacteur territorial à la Mairie de Lyon' :
                  currentStatus === 'unemployed'     ? 'ex. Attaché territorial — 3 mois de recherche' :
                  currentStatus === 'career-change'  ? 'ex. Finance → Fonction publique' :
                  currentStatus === 'fresh-graduate' ? 'ex. Master Droit public' :
                  'Brève description de votre situation'
                }
              />
            )}
            <Select
              label="Concours visé"
              value={targetJobRole}
              onChange={(val) => { setTargetJobRole(val); if (val !== 'Autre') setCustomJobRole('') }}
              options={jobRoleOptions}
              placeholder="Quel concours préparez-vous ?"
            />
            {targetJobRole === 'Autre' && (
              <Input
                label="Précisez votre concours"
                value={customJobRole}
                onChange={setCustomJobRole}
                placeholder="ex. Administrateur territorial, Inspecteur général…"
              />
            )}
            {targetJobRole && (
              <Select
                label="Niveau d'expérience"
                value={experienceLevel}
                onChange={setExperienceLevel}
                options={[
                  { value: 'junior', label: 'Junior (0–2 ans)' },
                  { value: 'mid',    label: 'Confirmé (3–5 ans)' },
                  { value: 'senior', label: 'Senior (6+ ans)' },
                ]}
                placeholder="Sélectionnez un niveau"
              />
            )}
          </div>

          {/* LinkedIn-style profile */}
          <div className="rounded-2xl border border-white/10 p-5 space-y-5" style={{ background: '#111827' }}>
            <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider">Profil professionnel <span className="text-red-400">*</span></h2>
            <Input
              label="Titre professionnel"
              value={headline}
              onChange={setHeadline}
              placeholder="ex. Préparation concours attaché territorial, spécialité droit public"
              required
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">À propos <span className="text-red-400">*</span></label>
              <textarea
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                rows={4}
                placeholder="Écrivez un court résumé de votre parcours, vos objectifs et ce qui vous distingue..."
                className="w-full rounded-lg border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                style={{ background: '#0a0f1e' }}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">
                Expérience {!hasNoExperience && <span className="text-red-400">*</span>}
              </label>
              <label className="flex items-center gap-2 mb-3 text-sm text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasNoExperience}
                  onChange={(e) => {
                    setHasNoExperience(e.target.checked)
                    if (e.target.checked) setExperienceList([])
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                Je n'ai pas encore d'expérience professionnelle
              </label>
              {!hasNoExperience && (
                <>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {experienceList.map(exp => (
                      <span key={exp} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs bg-purple-600/20 text-purple-200 border border-purple-500/30">
                        {exp}
                        <button type="button" onClick={() => removeExperience(exp)} className="hover:text-white transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={experienceInput}
                      onChange={(e) => setExperienceInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExperience())}
                      placeholder="ex. Rédacteur territorial à la Mairie de Lyon (2020-2023)"
                      className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      style={{ background: '#0a0f1e' }}
                    />
                    <Button type="button" onClick={addExperience} variant="outline">Ajouter</Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Ajoutez chaque expérience, stage ou poste séparément.</p>
                </>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">Formation <span className="text-red-400">*</span></label>
              <div className="flex flex-wrap gap-2 mb-2">
                {educationList.map(edu => (
                  <span key={edu} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs bg-blue-600/20 text-blue-200 border border-blue-500/30">
                    {edu}
                    <button type="button" onClick={() => removeEducation(edu)} className="hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={educationInput}
                  onChange={(e) => setEducationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEducation())}
                    placeholder="ex. Master Droit public - Université Paris-Saclay (2016-2020)"
                    className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ background: '#0a0f1e' }}
                  />
                <Button type="button" onClick={addEducation} variant="outline">Ajouter</Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Ajoutez chaque diplôme, certification ou formation séparément.</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">Projets</label>
              <textarea
                value={projectsDetails}
                onChange={(e) => setProjectsDetails(e.target.value)}
                rows={3}
                placeholder="Mentionnez les projets les plus importants que vous avez réalisés ou auxquels vous avez contribué..."
                className="w-full rounded-lg border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                style={{ background: '#0a0f1e' }}
              />
            </div>
            <Input
              label="Compétences"
              value={skillsText}
              onChange={setSkillsText}
              placeholder="ex. Droit public, Management, Finances publiques, Communication orale"
              required
            />
          </div>

          {/* Messages */}
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              <CheckCircle className="w-4 h-4" /> Profil sauvegardé avec succès !
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth loading={saving}>
            Sauvegarder
          </Button>
        </form>

        {/* Account info (read-only) */}
        <div className="mt-8 rounded-2xl border border-white/10 p-5" style={{ background: '#111827' }}>
          <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider mb-4">Compte</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">E-mail</span>
              <span className="text-white">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Forfait</span>
              <span className="text-white capitalize">{profile.subscription_tier}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Simulations ce mois</span>
              <span className="text-white">{profile.interviews_used_this_month} / {profile.interviews_limit === 999999 ? '∞' : profile.interviews_limit}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Membre depuis</span>
              <span className="text-white">{new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Link href="/pricing" className="flex-1">
              <Button variant="outline" fullWidth className="text-sm">Changer de forfait</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
