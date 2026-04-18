'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Sparkles } from 'lucide-react'
import { Button, Card, Input, Select } from '@/components/ui'
import { supabase } from '@/lib/supabase'

const jobRoleOptions = [
  { value: 'Software Engineer', label: 'Ingénieur logiciel' },
  { value: 'Product Manager', label: 'Chef de produit' },
  { value: 'Data Analyst', label: 'Analyste de données' },
  { value: 'Product Designer', label: 'Designer produit' },
  { value: 'Marketing Manager', label: 'Responsable marketing' },
  { value: 'Sales Executive', label: 'Responsable commercial' },
  { value: 'Business Analyst', label: 'Analyste métier' },
  { value: 'DevOps Engineer', label: 'Ingénieur DevOps' },
  { value: 'Data Scientist', label: 'Data Scientist' },
  { value: 'UX Researcher', label: 'UX Researcher' },
  { value: 'Finance Analyst', label: 'Analyste financier' },
  { value: 'HR Specialist', label: 'Spécialiste RH' },
  { value: 'Other', label: 'Autre' },
]

const statusOptions = [
  { value: 'student', label: '🎓 Étudiant(e)' },
  { value: 'employed', label: '👨‍💼 En poste' },
  { value: 'unemployed', label: '🔍 En recherche active' },
  { value: 'career-change', label: '🔄 Reconversion professionnelle' },
  { value: 'fresh-graduate', label: '💼 Jeune diplômé(e)' },
  { value: 'other', label: '🌍 Autre' },
]

const statusDetailConfig: Record<string, { label: string; placeholder: string }> = {
  student:        { label: 'Université & filière',               placeholder: 'ex. Sorbonne — Droit public' },
  employed:       { label: 'Poste actuel & employeur',        placeholder: 'ex. Attaché territorial — Mairie de Lyon' },
  unemployed:     { label: 'Dernier poste / Durée de recherche', placeholder: 'ex. Rédacteur territorial — 3 mois' },
  'career-change':{ label: 'Secteur actuel → Secteur visé',    placeholder: 'ex. Privé → Fonction publique' },
  'fresh-graduate':{ label: 'Diplôme & filière',               placeholder: 'ex. Master Droit public' },
  other:          { label: 'Décrivez votre situation',        placeholder: 'Brève description de votre situation actuelle' },
}

export default function CandidateSignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentStatus, setCurrentStatus] = useState('')
  const [statusDetail, setStatusDetail] = useState('')
  const [targetJobRole, setTargetJobRole] = useState('')
  const [customJobRole, setCustomJobRole] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const strength = useMemo(() => {
    if (password.length < 6) return 'Weak'
    
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    
    if (password.length >= 10 && hasUpperCase && hasLowerCase && hasNumber) {
      return 'Strong'
    }
    
    return 'Medium'
  }, [password])

  const detailConfig = currentStatus ? statusDetailConfig[currentStatus] : null

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!firstName.trim() || !email.includes('@') || !currentStatus) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    if (strength !== 'Strong') {
      setError('Le mot de passe doit être fort (au moins 10 caractères avec majuscules, minuscules et chiffres).')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      // Pre-check: email already registered?
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('email', email)
        .maybeSingle()

      if (existingProfile) {
        if (existingProfile.user_type === 'candidate' || existingProfile.user_type === 'both') {
          throw new Error('Cet e-mail est déjà enregistré en tant que candidat. Veuillez vous connecter.')
        }

        // user_type === 'coach' → add candidate role to existing account
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          throw new Error('Cet e-mail possède déjà un compte jury. Entrez votre mot de passe actuel pour activer également le rôle candidat.')
        }

        const userId = signInData.user.id
        const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')

        let avatarUrl: string | null = null
        if (avatarFile) {
          const ext = avatarFile.name.split('.').pop()
          const { data: uploadData } = await supabase.storage
            .from('avatars')
            .upload(`${userId}.${ext}`, avatarFile, { upsert: true })
          if (uploadData) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)
            avatarUrl = urlData.publicUrl
          }
        }

        const finalJobRole = targetJobRole === 'Other' ? customJobRole.trim() : targetJobRole

        await supabase.from('profiles').update({
          user_type: 'both',
          full_name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          ...(avatarUrl && { avatar_url: avatarUrl }),
          current_status: currentStatus,
          status_detail: statusDetail || null,
          target_job_role: finalJobRole || null,
          target_job_field: finalJobRole?.toLowerCase().replace(/\s+/g, '-') || null,
          experience_level: (experienceLevel as 'junior' | 'mid' | 'senior') || null,
          country: country || null,
          city: city || null,
          linkedin_url: linkedinUrl || null,
        }).eq('id', userId)

        await supabase.auth.signOut()
        setSuccess('Le rôle candidat a été ajouté à votre compte ! Veuillez vous connecter.')
        return
      }

      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, user_type: 'candidate' },
        },
      })

      if (signUpError) throw signUpError

      // Supabase silently "succeeds" for existing emails — detect via empty identities
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        // Check if a profile exists (= email was confirmed before)
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle()
        if (existing) {
          throw new Error('Cet e-mail est déjà enregistré. Veuillez vous connecter.')
        } else {
          throw new Error('Vous vous êtes déjà inscrit(e) avec cet e-mail mais vous ne l\'avez pas encore confirmé. Vérifiez votre boîte de réception (et le dossier spam) pour le lien de confirmation.')
        }
      }

      if (data.user) {
        const userId = data.user.id

        let avatarUrl: string | null = null
        if (avatarFile) {
          const ext = avatarFile.name.split('.').pop()
          const { data: uploadData } = await supabase.storage
            .from('avatars')
            .upload(`${userId}.${ext}`, avatarFile, { upsert: true })
          if (uploadData) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)
            avatarUrl = urlData.publicUrl
          }
        }

        const finalJobRole = targetJobRole === 'Other' ? customJobRole.trim() : targetJobRole

        await supabase.from('profiles').upsert({
          id: userId,
          email,
          full_name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          user_type: 'candidate',
          avatar_url: avatarUrl,
          current_status: currentStatus,
          status_detail: statusDetail || null,
          target_job_role: finalJobRole || null,
          target_job_field: finalJobRole?.toLowerCase().replace(/\s+/g, '-') || null,
          experience_level: (experienceLevel as 'junior' | 'mid' | 'senior') || null,
          country: country || null,
          city: city || null,
          linkedin_url: linkedinUrl || null,
        })

        // Send welcome email (fire-and-forget)
        fetch('/api/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, firstName: firstName.trim(), userType: 'candidate', targetJobRole: finalJobRole }),
        }).catch(() => {/* non-critical */})
      }

      if (data.session) await supabase.auth.signOut()

      setSuccess('Compte créé ! Vérifiez votre e-mail pour confirmer, puis connectez-vous.')
    } catch (err: any) {
      setError(err.message || 'Impossible de créer votre compte pour le moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-background to-background" />
      <div className="relative z-10 mx-auto max-w-2xl">
        <Link href="/signup" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Retour aux options d'inscription
        </Link>

        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold gradient-text">Jurya</span>
        </Link>

        <Card>
          <h1 className="mb-2 text-3xl font-bold">Inscription candidat</h1>
          <p className="mb-6 text-gray-400">Créez votre compte et commencez à préparer vos oraux de concours.</p>

          {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name row */}
              <div className="grid gap-5 md:grid-cols-2">
                <Input label="Prénom *" value={firstName} onChange={setFirstName} placeholder="Marie" required />
                <Input label="Nom" value={lastName} onChange={setLastName} placeholder="Dupont" />
              </div>

              <Input label="E-mail *" type="email" value={email} onChange={setEmail} placeholder="marie@exemple.com" required />

              {/* Password row */}
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Mot de passe *</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  <p className={`mt-1.5 text-xs ${strength === 'Strong' ? 'text-green-400' : strength === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>Sécurité : {strength === 'Strong' ? 'Fort' : strength === 'Medium' ? 'Moyen' : 'Faible'}</p>
                  {strength !== 'Strong' && (
                    <p className="mt-1 text-xs text-gray-400">10 caractères minimum avec majuscules, minuscules et chiffres</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Confirmez le mot de passe *</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              {/* Current status */}
              <Select
                label="Situation actuelle *"
                value={currentStatus}
                onChange={(v) => { setCurrentStatus(v); setStatusDetail('') }}
                options={statusOptions}
                placeholder="Qu'est-ce qui vous décrit le mieux ?"
                required
              />

              {/* Dynamic detail field */}
              {detailConfig && (
                <Input
                  label={detailConfig.label}
                  value={statusDetail}
                  onChange={setStatusDetail}
                  placeholder={detailConfig.placeholder}
                />
              )}

              {/* Target role + experience */}
              <Select
                label="Concours visé"
                value={targetJobRole}
                onChange={(v) => { setTargetJobRole(v); setCustomJobRole('') }}
                options={jobRoleOptions}
                placeholder="Quel concours préparez-vous ? (facultatif)"
              />

              {/* Custom job role input - show when "Other" is selected */}
              {targetJobRole === 'Other' && (
                <Input
                  label="Précisez le concours visé *"
                  value={customJobRole}
                  onChange={setCustomJobRole}
                  placeholder="ex. Inspecteur des finances publiques"
                  required
                />
              )}

              {targetJobRole && (
                <Select
                  label="Niveau d'expérience"
                  value={experienceLevel}
                  onChange={setExperienceLevel}
                  options={[
                    { value: 'junior', label: 'Débutant (0–2 ans)' },
                    { value: 'mid', label: 'Intermédiaire (3–5 ans)' },
                    { value: 'senior', label: 'Confirmé (6+ ans)' },
                  ]}
                  placeholder="Sélectionnez un niveau"
                />
              )}

              {/* Country + City */}
              <div className="grid gap-5 md:grid-cols-2">
                <Input label="Pays" value={country} onChange={setCountry} placeholder="ex. France" />
                <Input label="Ville" value={city} onChange={setCity} placeholder="ex. Paris" />
              </div>

              {/* LinkedIn */}
              <Input
                label="URL LinkedIn (facultatif)"
                value={linkedinUrl}
                onChange={setLinkedinUrl}
                placeholder="https://linkedin.com/in/votreprofil"
              />

              {/* Avatar */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Photo de profil (facultatif)</label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-background/40 px-4 py-4 text-sm text-gray-300 hover:bg-white/5">
                  <Camera className="h-5 w-5 text-primary" />
                  <span>{avatarFile ? avatarFile.name : 'Choisir une image'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </label>
                {avatarPreview && <img src={avatarPreview} alt="Preview" className="mt-3 h-16 w-16 rounded-full object-cover" />}
              </div>

              <Button type="submit" variant="primary" fullWidth loading={loading}>Créer mon compte candidat</Button>
            </form>
          ) : (
            <div className="pt-2">
              <Link href="/login/candidate">
                <Button variant="primary" fullWidth>Accéder à la connexion</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}