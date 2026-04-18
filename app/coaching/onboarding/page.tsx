'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  FileText,
  Sparkles,
  Upload,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ── concours list ────────────────────────────────────────── */
const CONCOURS_OPTIONS = [
  'ENA',
  'ENM',
  'Agrégation',
  'CAPES',
  'IRA',
  'Attaché territorial',
  'Inspecteur des finances',
  'Commissaire de police',
  'Administrateur civil',
  'Douanes',
  'Trésor public',
  'Santé publique',
  'IFSI',
  'Sciences Po',
]

/* ── step definitions ─────────────────────────────────────── */
const STEPS = [
  { id: 1, label: 'Profil', icon: User },
  { id: 2, label: 'Qualifications', icon: FileText },
  { id: 3, label: 'Paiements', icon: CreditCard },
  { id: 4, label: 'Confirmation', icon: Check },
]

export default function CoachOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [stripeConnected, setStripeConnected] = useState(false)

  /* ── form state ────────────────────────────────────────── */
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [hourlyRate, setHourlyRate] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [yearsExperience, setYearsExperience] = useState('')
  const [certifications, setCertifications] = useState('')
  const [wasJuryMember, setWasJuryMember] = useState(false)

  /* ── handlers ──────────────────────────────────────────── */
  const toggleSpecialty = (spec: string) =>
    setSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    )

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const canProceed = () => {
    if (step === 1) return fullName.trim() && specialties.length > 0 && hourlyRate
    if (step === 2) return yearsExperience
    if (step === 3) return stripeConnected
    return true
  }

  /* ── Stripe Connect ────────────────────────────────────── */
  const handleStripeConnect = async () => {
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Erreur lors de la connexion Stripe')
      }
    } catch {
      toast.error('Impossible de se connecter à Stripe')
    }
  }

  /* ── final submit ──────────────────────────────────────── */
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Vous devez être connecté')
        router.push('/login')
        return
      }

      // Upload photo if provided
      let avatarUrl: string | null = null
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `avatars/${user.id}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, photoFile, { upsert: true })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
          avatarUrl = urlData.publicUrl
        }
      }

      // Upsert coach profile
      const { error: profileError } = await supabase.from('coach_profiles').upsert(
        {
          user_id: user.id,
          title: `Coach spécialisé ${specialties[0] || 'concours'}`,
          bio,
          years_experience: parseInt(yearsExperience, 10) || 0,
          price_per_hour: parseInt(hourlyRate, 10) || 0,
          certifications,
          was_jury_member: wasJuryMember,
          accepting_bookings: false, // pending verification
          is_verified: false,
        },
        { onConflict: 'user_id' }
      )

      if (profileError) throw profileError

      // Update profile avatar
      if (avatarUrl) {
        await supabase.from('profiles').update({ avatar_url: avatarUrl, full_name: fullName }).eq('id', user.id)
      } else {
        await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
      }

      // Upsert specializations
      const specRows = specialties.map((s) => ({ coach_id: user.id, specialization: s }))
      await supabase.from('coach_specializations').delete().eq('coach_id', user.id)
      await supabase.from('coach_specializations').insert(specRows)

      toast.success('Votre candidature a été soumise pour vérification !')
      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── render ────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">Devenir coach sur Jurya</h1>
        </div>
      </div>

      {/* Progress steps */}
      <div className="mx-auto max-w-3xl px-6 pt-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const active = step === s.id
            const done = step > s.id
            return (
              <div key={s.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      done
                        ? 'bg-green-500 text-white'
                        : active
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                        : 'border border-white/20 text-gray-500'
                    }`}
                  >
                    {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`text-xs ${active || done ? 'text-white' : 'text-gray-500'}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-px flex-1 ${
                      step > s.id ? 'bg-green-500' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          {/* ── Step 1: Profile ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Votre profil coach</h2>
                <p className="mt-1 text-gray-400">
                  Présentez-vous aux candidats qui chercheront un coach.
                </p>
              </div>

              <Input
                label="Nom complet"
                value={fullName}
                onChange={setFullName}
                placeholder="Ex : Marie Dupont"
                required
              />

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Bio <span className="text-gray-500">(optionnel)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Décrivez votre parcours et votre approche pédagogique…"
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a12] px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Spécialités concours <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONCOURS_OPTIONS.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpecialty(spec)}
                      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                        specialties.includes(spec)
                          ? 'bg-purple-600 text-white'
                          : 'border border-white/10 text-gray-400 hover:border-purple-500/40'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Tarif horaire (€)"
                type="number"
                value={hourlyRate}
                onChange={setHourlyRate}
                placeholder="Ex : 80"
                required
              />

              <div>
                <label className="mb-2 block text-sm font-medium">Photo de profil</label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/20 p-4 hover:border-purple-500/40">
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-sm text-gray-400">
                    {photoFile ? photoFile.name : 'Choisir une photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                {photoPreview && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photoPreview}
                    alt="Aperçu"
                    className="mt-3 h-20 w-20 rounded-full object-cover"
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Qualifications ─────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Vos qualifications</h2>
                <p className="mt-1 text-gray-400">
                  Aidez les candidats à connaître votre expertise.
                </p>
              </div>

              <Input
                label="Années d'expérience"
                type="number"
                value={yearsExperience}
                onChange={setYearsExperience}
                placeholder="Ex : 8"
                required
              />

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Certifications / diplômes <span className="text-gray-500">(optionnel)</span>
                </label>
                <textarea
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  rows={3}
                  placeholder="Ex : Agrégé de droit public, ancien auditeur INET…"
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a12] px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 p-4 hover:border-purple-500/40">
                <input
                  type="checkbox"
                  checked={wasJuryMember}
                  onChange={(e) => setWasJuryMember(e.target.checked)}
                  className="h-5 w-5 accent-purple-500"
                />
                <div>
                  <p className="font-medium">Ancien membre de jury</p>
                  <p className="text-sm text-gray-400">
                    J&apos;ai déjà siégé dans un jury de concours
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* ── Step 3: Payments ───────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Configuration des paiements</h2>
                <p className="mt-1 text-gray-400">
                  Connectez votre compte Stripe pour recevoir vos paiements.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                {stripeConnected ? (
                  <div className="space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
                      <Check className="h-7 w-7 text-green-400" />
                    </div>
                    <p className="font-semibold text-green-400">Compte Stripe connecté</p>
                    <p className="text-sm text-gray-400">
                      Vous recevrez vos paiements directement sur votre compte bancaire.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/20">
                      <CreditCard className="h-7 w-7 text-purple-400" />
                    </div>
                    <p className="text-gray-300">
                      Stripe vous permet de recevoir des paiements sécurisés. La commission
                      plateforme est de 20%.
                    </p>
                    <Button variant="primary" onClick={handleStripeConnect}>
                      <Sparkles className="h-4 w-4" />
                      Connecter mon compte Stripe
                    </Button>
                  </div>
                )}
              </div>

              {/* Allow skipping for testing */}
              {!stripeConnected && (
                <button
                  onClick={() => setStripeConnected(true)}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Passer cette étape (mode test)
                </button>
              )}
            </div>
          )}

          {/* ── Step 4: Confirmation ───────────────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Récapitulatif</h2>
                <p className="mt-1 text-gray-400">
                  Vérifiez vos informations avant de soumettre votre candidature.
                </p>
              </div>

              <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
                <SummaryRow label="Nom" value={fullName} />
                <SummaryRow label="Spécialités" value={specialties.join(', ')} />
                <SummaryRow label="Tarif horaire" value={`${hourlyRate}€/h`} />
                <SummaryRow
                  label="Expérience"
                  value={`${yearsExperience} ans`}
                />
                <SummaryRow
                  label="Ancien membre de jury"
                  value={wasJuryMember ? 'Oui' : 'Non'}
                />
                <SummaryRow
                  label="Stripe"
                  value={stripeConnected ? 'Connecté ✓' : 'Non connecté'}
                />
              </div>

              {bio && (
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-400">Bio</p>
                  <p className="text-sm text-gray-300">{bio}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Navigation ─────────────────────────────────── */}
          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Précédent
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                variant="primary"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Suivant <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting}
              >
                Soumettre pour vérification
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── small helper component ───────────────────────────────── */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
