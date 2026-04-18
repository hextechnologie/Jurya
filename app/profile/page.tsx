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
