'use client'

import { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, CheckCircle, Loader2, X } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import CoachNavbar from '@/components/CoachNavbar'
import { marketplaceSpecializations } from '@/lib/coach-marketplace'
import ExperienceCardsSection from '@/components/coach/ExperienceCardsSection'
import EducationCardsSection from '@/components/coach/EducationCardsSection'
import SkillsSelector from '@/components/coach/SkillsSelector'
import AchievementsCardsSection from '@/components/coach/AchievementsCardsSection'

export default function CoachProfilePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  // Personal info (profiles table)
  const [firstName,   setFirstName]   = useState('')
  const [lastName,    setLastName]    = useState('')
  const [country,     setCountry]     = useState('')
  const [city,        setCity]        = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [headline, setHeadline] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null)

  // Coach-specific (coach_profiles table)
  const [title,           setTitle]           = useState('')
  const [bio,             setBio]             = useState('')
  const [price,           setPrice]           = useState('75')
  const [yearsExperience, setYearsExperience] = useState('3')
  const [companies,       setCompanies]       = useState<string[]>([])
  const [companyInput,    setCompanyInput]    = useState('')
  const [selectedSpecs,   setSelectedSpecs]   = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user || !profile) return

    // Pre-fill personal info from profiles
    setFirstName(profile.first_name || (profile.full_name?.split(' ')[0] ?? ''))
    setLastName(profile.last_name   || (profile.full_name?.split(' ').slice(1).join(' ') ?? ''))
    setCountry(profile.country      ?? '')
    setCity(profile.city            ?? '')
    setLinkedinUrl(profile.linkedin_url ?? '')
    setHeadline((profile as any).professional_headline ?? '')
    setAboutMe((profile as any).about_me ?? '')
    setAvatarPreview(profile.avatar_url ?? '')

    // Fetch coach_profiles + specializations
    const fetchCoachData = async () => {
      const [{ data: cp }, { data: specs }] = await Promise.all([
        supabase.from('coach_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('coach_specializations').select('specialization').eq('coach_id', user.id),
      ])
      if (cp) {
        setTitle(cp.title ?? '')
        setBio(cp.bio ?? '')
        setLinkedinUrl(prev => prev || (cp.linkedin_url ?? ''))
        setPrice(String(cp.price_per_hour ?? 75))
        setYearsExperience(String(cp.years_experience ?? 3))
        setCompanies(Array.isArray(cp.companies) ? cp.companies : [])
      }
      if (specs) {
        setSelectedSpecs(specs.map((s: any) => s.specialization))
      }
    }
    fetchCoachData()
  }, [user, profile])

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const onCompanyKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && companyInput.trim()) {
      e.preventDefault()
      const value = companyInput.trim()
      if (!companies.includes(value)) setCompanies(prev => [...prev, value])
      setCompanyInput('')
    }
  }

  const removeCompany = (c: string) => setCompanies(prev => prev.filter(x => x !== c))

  const toggleSpec = (spec: string) =>
    setSelectedSpecs(prev => prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec])

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

    setError('')
    setSaved(false)
    setSaving(true)

    try {
      // 1. Upload avatar
      let avatarUrl = profile?.avatar_url ?? null
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(`${user.id}.${ext}`, avatarFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)
        avatarUrl = urlData.publicUrl
      }

      // 2. Update profiles table
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
      const { error: profileError } = await supabase.from('profiles').update({
        first_name:   firstName.trim()  || null,
        last_name:    lastName.trim()   || null,
        full_name:    fullName          || null,
        country:      country           || null,
        city:         city              || null,
        linkedin_url: linkedinUrl       || null,
        professional_headline: headline.trim(),
        about_me:     aboutMe.trim(),
        avatar_url:   avatarUrl,
        updated_at:   new Date().toISOString(),
      }).eq('id', user.id)
      if (profileError) throw profileError

      // 3. Upsert coach_profiles table
      const { error: coachError } = await supabase.from('coach_profiles').upsert({
        user_id:          user.id,
        title:            title           || null,
        bio:              bio             || null,
        linkedin_url:     linkedinUrl     || null,
        price_per_hour:   Number(price)   || 0,
        years_experience: Number(yearsExperience) || 0,
        companies:        companies,
      }, { onConflict: 'user_id' })
      if (coachError) throw coachError

      // 4. Sync specializations (delete + re-insert)
      await supabase.from('coach_specializations').delete().eq('coach_id', user.id)
      if (selectedSpecs.length > 0) {
        const { error: specError } = await supabase.from('coach_specializations').insert(
          selectedSpecs.map(s => ({ coach_id: user.id, specialization: s }))
        )
        if (specError) throw specError
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Échec de la sauvegarde. Veuillez réessayer.')
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
      <CoachNavbar />

      <div className="container mx-auto max-w-2xl px-4 py-10">
        <div className="mb-2">
          <Link href="/coach/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold mb-1">Profil jury</h1>
          <p className="text-gray-400 text-sm">Mettez à jour votre profil visible par les candidats.</p>
        </div>

        {/* Avatar */}
        <div className="my-8 flex items-center gap-5">
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
            <p className="font-semibold">{[firstName, lastName].filter(Boolean).join(' ') || 'Votre nom'}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
            {title && <p className="text-xs text-purple-400 mt-1">{title}</p>}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Personal Info */}
          <div className="rounded-2xl border border-white/10 p-5 space-y-5" style={{ background: '#111827' }}>
            <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider">Informations personnelles</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Prénom" value={firstName} onChange={setFirstName} placeholder="Prénom" />
              <Input label="Nom"  value={lastName}  onChange={setLastName}  placeholder="Nom" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Pays" value={country} onChange={setCountry} placeholder="ex. France" />
              <Input label="Ville"    value={city}    onChange={setCity}    placeholder="ex. Paris" />
            </div>
            <Input label="URL LinkedIn" value={linkedinUrl} onChange={setLinkedinUrl} placeholder="https://linkedin.com/in/votre-profil" />
          </div>

          {/* Coach Info */}
          <div className="rounded-2xl border border-white/10 p-5 space-y-5" style={{ background: '#111827' }}>
            <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider">Informations jury</h2>
            <Input label="Titre professionnel" value={title} onChange={setTitle} placeholder="Membre de jury · Attaché principal · 10 ans exp" />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Tarif horaire (€)" type="number" value={price} onChange={setPrice} placeholder="75" />
              <Input label="Années d'expérience" type="number" value={yearsExperience} onChange={setYearsExperience} placeholder="3" />
            </div>

            {/* Bio */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={5}
                placeholder="Présentez votre parcours, votre style d'accompagnement et ce que vous pouvez apporter aux candidats..."
                className="w-full rounded-lg border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                style={{ background: '#0a0f1e' }}
              />
            </div>

            {/* Companies */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">Organismes / Institutions</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {companies.map(c => (
                  <span key={c} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30">
                    {c}
                    <button type="button" onClick={() => removeCompany(c)} className="hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={companyInput}
                onChange={e => setCompanyInput(e.target.value)}
                onKeyDown={onCompanyKeyDown}
                placeholder="Saisissez un organisme et appuyez sur Entrée (ex. Préfecture, Région)"
                className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{ background: '#0a0f1e' }}
              />
              <p className="text-xs text-gray-500 mt-1">Appuyez sur Entrée ou virgule pour ajouter.</p>
            </div>

            {/* Specializations */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">Spécialisations</label>
              <div className="flex flex-wrap gap-2">
                {marketplaceSpecializations.map(spec => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpec(spec)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selectedSpecs.includes(spec)
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/50 hover:text-white'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LinkedIn-style profile */}
          <div className="rounded-2xl border border-white/10 p-5 space-y-5" style={{ background: '#111827' }}>
            <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider">Points forts professionnels <span className="text-red-400">*</span></h2>
            <Input label="Titre" value={headline} onChange={setHeadline} placeholder="ex. Membre de jury — concours de la fonction publique" required />
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">À propos <span className="text-red-400">*</span></label>
              <textarea
                value={aboutMe}
                onChange={e => setAboutMe(e.target.value)}
                rows={4}
                placeholder="Rédigez un court résumé professionnel, votre philosophie d'accompagnement et votre impact..."
                className="w-full rounded-lg border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                style={{ background: '#0a0f1e' }}
                required
              />
            </div>
          </div>

          {/* Structured Profile Sections */}
          <div className="rounded-2xl border border-white/10 p-5 space-y-8" style={{ background: '#111827' }}>
            <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider">Expérience professionnelle</h2>
            <ExperienceCardsSection coachId={user.id} />
          </div>

          <div className="rounded-2xl border border-white/10 p-5 space-y-8" style={{ background: '#111827' }}>
            <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider">Formation & Certifications</h2>
            <EducationCardsSection coachId={user.id} userCountry={country || undefined} />
          </div>

          <div className="rounded-2xl border border-white/10 p-5 space-y-8" style={{ background: '#111827' }}>
            <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider">Compétences & Expertise</h2>
            <SkillsSelector coachId={user.id} />
          </div>

          <div className="rounded-2xl border border-white/10 p-5 space-y-8" style={{ background: '#111827' }}>
            <h2 className="font-semibold text-sm text-gray-300 uppercase tracking-wider">Réalisations & Points forts</h2>
            <AchievementsCardsSection coachId={user.id} />
          </div>

          {/* Messages */}
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              <CheckCircle className="w-4 h-4" /> Profil enregistré avec succès !
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth loading={saving}>
            Enregistrer
          </Button>
        </form>
      </div>
    </div>
  )
}