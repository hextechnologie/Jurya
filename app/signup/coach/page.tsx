'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Plus, Sparkles, X } from 'lucide-react'
import { Button, Card, Input, Badge } from '@/components/ui'
import { supabase } from '@/lib/supabase'

const specializationOptions = [
  'Attaché territorial',
  'IRA',
  'INSP / ENA',
  'Commissaire de police',
  'Directeur d\'hôpital',
  'Administrateur civil',
  'Agrégation',
  'CAPES',
  'Magistrat (ENM)',
  'Inspecteur du travail',
  'Douanes',
  'Ingénieur territorial',
  'Autre',
]

export default function CoachSignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [title, setTitle] = useState('')
  const [experience, setExperience] = useState('5-10 ans')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>(['Tech'])
  const [companyInput, setCompanyInput] = useState('')
  const [companies, setCompanies] = useState<string[]>([])
  const [price, setPrice] = useState(120)
  const [bio, setBio] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const platformFee = useMemo(() => (price * 0.2).toFixed(0), [price])

  const strength = useMemo(() => {
    if (password.length < 6) return 'Weak'
    if (password.length < 10) return 'Medium'
    return 'Strong'
  }, [password])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag])
  }

  const addCompany = () => {
    if (!companyInput.trim()) return
    setCompanies((prev) => [...prev, companyInput.trim()])
    setCompanyInput('')
  }

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

    if (!firstName.trim() || !email.includes('@') || password.length < 6 || !title.trim()) {
      setError('Veuillez remplir les champs obligatoires.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (bio.length > 300) {
      setError('La biographie ne doit pas dépasser 300 caractères.')
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
        if (existingProfile.user_type === 'coach' || existingProfile.user_type === 'both') {
          throw new Error('Cet e-mail est déjà enregistré en tant que membre de jury. Veuillez vous connecter.')
        }

        // user_type === 'candidate' → add coach role to existing account
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          throw new Error('Cet e-mail possède déjà un compte candidat. Entrez votre mot de passe actuel pour activer également le rôle jury.')
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

        await supabase.from('profiles').update({
          user_type: 'both',
          full_name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          ...(avatarUrl && { avatar_url: avatarUrl }),
          country: country || null,
          city: city || null,
          linkedin_url: linkedinUrl || null,
          experience_level: Number(experience) >= 8 ? 'senior' : Number(experience) >= 4 ? 'mid' : 'junior',
        }).eq('id', userId)

        await supabase.from('coach_profiles').upsert({
          user_id: userId,
          title,
          bio,
          years_experience: experience.startsWith('Moins') ? 1 : experience.startsWith('2') ? 3 : experience.startsWith('5') ? 7 : 15,
          price_per_hour: price,
          linkedin_url: linkedinUrl,
          companies,
          is_verified: false,
        })

        if (selectedTags.length > 0) {
          await supabase.from('coach_specializations').insert(
            selectedTags.map((specialization) => ({ coach_id: userId, specialization }))
          )
        }

        await supabase.auth.signOut()
        setSuccess('Le rôle jury a été ajouté à votre compte ! Veuillez vous connecter.')
        return
      }

      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, user_type: 'coach' },
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

        await supabase.from('profiles').upsert({
          id: userId,
          email,
          full_name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          user_type: 'coach',
          avatar_url: avatarUrl,
          country: country || null,
          city: city || null,
          linkedin_url: linkedinUrl || null,
          experience_level: Number(experience) >= 8 ? 'senior' : Number(experience) >= 4 ? 'mid' : 'junior',
        })

        await supabase.from('coach_profiles').upsert({
          user_id: userId,
          title,
          bio,
          years_experience: experience.startsWith('Moins') ? 1 : experience.startsWith('2') ? 3 : experience.startsWith('5') ? 7 : 15,
          price_per_hour: price,
          linkedin_url: linkedinUrl,
          companies,
          is_verified: false,
        })

        if (selectedTags.length > 0) {
          await supabase.from('coach_specializations').insert(
            selectedTags.map((specialization) => ({ coach_id: userId, specialization }))
          )
        }

        // Send welcome email (fire-and-forget)
        fetch('/api/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, firstName: firstName.trim(), userType: 'coach', title }),
        }).catch(() => {/* non-critical */})
      }

      if (data.session) await supabase.auth.signOut()

      setSuccess('Compte jury créé avec succès. Vérifiez votre e-mail, confirmez votre compte, puis reconnectez-vous en tant que membre de jury.')
    } catch (err: any) {
      setError(err.message || 'Impossible de créer votre compte jury pour le moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-background to-background" />
      <div className="relative z-10 mx-auto max-w-3xl">
        <Link href="/signup" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Retour aux options d'inscription
        </Link>

        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold gradient-text">Jurya</span>
        </Link>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Badge>Commission plateforme : 20 %</Badge>
            <span className="text-sm text-gray-400">Les membres de jury reçoivent 80 % après chaque session.</span>
          </div>

          <h1 className="mb-2 text-3xl font-bold">Inscription jury</h1>
          <p className="mb-6 text-gray-400">Créez votre profil professionnel et commencez à gagner de l'argent grâce aux simulations d'oral.</p>

          {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="grid gap-5 md:grid-cols-2">
                <Input label="Prénom *" value={firstName} onChange={setFirstName} placeholder="Jean" required />
                <Input label="Nom" value={lastName} onChange={setLastName} placeholder="Martin" />
              </div>

              {/* Credentials */}
              <Input label="E-mail *" type="email" value={email} onChange={setEmail} placeholder="jury@exemple.com" required />

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Mot de passe *</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  <p className={`mt-1.5 text-xs ${strength === 'Strong' ? 'text-green-400' : strength === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>Sécurité : {strength === 'Strong' ? 'Fort' : strength === 'Medium' ? 'Moyen' : 'Faible'}</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Confirmez le mot de passe *</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              {/* Professional info */}
          <div className="grid gap-5 md:grid-cols-2">
                <Input label="Titre professionnel *" value={title} onChange={setTitle} placeholder="Professeur agrégé de droit" required />
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Expérience dans le domaine *</label>
                  <div className="flex flex-wrap gap-2">
                    {['Moins de 2 ans', '2–5 ans', '5–10 ans', '10+ ans'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setExperience(opt)}
                        className={`px-4 py-2 rounded-lg border text-sm transition ${experience === opt ? 'bg-primary/20 border-primary text-primary' : 'border-border bg-background text-gray-400 hover:border-gray-500'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="grid gap-5 md:grid-cols-2">
                <Input label="Pays" value={country} onChange={setCountry} placeholder="ex. France" />
                <Input label="Ville" value={city} onChange={setCity} placeholder="ex. Paris" />
              </div>

              {/* Specializations */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Secteurs et spécialisations</label>
                <div className="flex flex-wrap gap-2">
                  {specializationOptions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-3 py-2 text-sm ${selectedTags.includes(tag) ? 'bg-primary text-white' : 'bg-background border border-border text-gray-300'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Companies */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Employeurs précédents</label>
                <div className="flex gap-2">
                  <input
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCompany() } }}
                    placeholder="Ajouter un employeur"
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button type="button" variant="outline" onClick={addCompany}><Plus className="h-4 w-4" />Ajouter</Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {companies.map((company) => (
                    <Badge key={company} className="flex items-center gap-1">
                      {company}
                      <button type="button" onClick={() => setCompanies((prev) => prev.filter((item) => item !== company))}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Prix par session : {price} €/heure</label>
                <input type="range" min="10" max="500" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full accent-primary" />
                <p className="mt-2 text-sm text-gray-400">Commission : {platformFee} € • Vous gardez ~{(price * 0.8).toFixed(0)} €</p>
              </div>

              {/* Bio */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Courte biographie</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={4} placeholder="Décrivez votre style de coaching et vos domaines d'expertise." className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <p className="mt-1 text-xs text-gray-400">{bio.length}/300</p>
              </div>

              {/* LinkedIn */}
              <Input label="URL LinkedIn (facultatif)" value={linkedinUrl} onChange={setLinkedinUrl} placeholder="https://linkedin.com/in/votreprofil" />

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

              <Button type="submit" variant="primary" fullWidth loading={loading}>Créer mon compte jury</Button>
            </form>
          ) : (
            <div className="pt-2">
              <Link href="/login/coach">
                <Button variant="primary" fullWidth>Accéder à la connexion jury</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}