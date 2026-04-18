'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Sparkles } from 'lucide-react'
import { Button, Card, Input, Select } from '@/components/ui'
import { supabase } from '@/lib/supabase'

const jobRoleOptions = [
  { value: 'Software Engineer', label: 'Software Engineer' },
  { value: 'Product Manager', label: 'Product Manager' },
  { value: 'Data Analyst', label: 'Data Analyst' },
  { value: 'Product Designer', label: 'Product Designer' },
  { value: 'Marketing Manager', label: 'Marketing Manager' },
  { value: 'Sales Executive', label: 'Sales Executive' },
  { value: 'Business Analyst', label: 'Business Analyst' },
  { value: 'DevOps Engineer', label: 'DevOps Engineer' },
  { value: 'Data Scientist', label: 'Data Scientist' },
  { value: 'UX Researcher', label: 'UX Researcher' },
  { value: 'Finance Analyst', label: 'Finance Analyst' },
  { value: 'HR Specialist', label: 'HR Specialist' },
  { value: 'Other', label: 'Other' },
]

const statusOptions = [
  { value: 'student', label: '🎓 Student' },
  { value: 'employed', label: '👨‍💼 Employed' },
  { value: 'unemployed', label: '🔍 Actively Job Seeking' },
  { value: 'career-change', label: '🔄 Career Change' },
  { value: 'fresh-graduate', label: '💼 Fresh Graduate' },
  { value: 'other', label: '🌍 Other' },
]

const statusDetailConfig: Record<string, { label: string; placeholder: string }> = {
  student:        { label: 'University & Major',           placeholder: 'e.g. MIT — Computer Science' },
  employed:       { label: 'Current Job Title & Company',  placeholder: 'e.g. Software Engineer at Google' },
  unemployed:     { label: 'Last Role / How Long Seeking', placeholder: 'e.g. Software Engineer — 3 months' },
  'career-change':{ label: 'Coming From → Target Field',   placeholder: 'e.g. Finance → Software Engineering' },
  'fresh-graduate':{ label: 'Degree & Major',              placeholder: 'e.g. BSc Computer Science' },
  other:          { label: 'Tell us your situation',       placeholder: 'Brief description of your current status' },
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
      setError('Please complete all required fields.')
      return
    }
    if (strength !== 'Strong') {
      setError('Password must be strong (at least 10 characters with uppercase, lowercase, and numbers).')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
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
          throw new Error('This email is already registered as a candidate. Please log in instead.')
        }

        // user_type === 'coach' → add candidate role to existing account
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          throw new Error('This email already has a coach account. Enter your existing password to also activate the candidate role.')
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
        setSuccess('Candidate role added to your account! Please log in.')
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
          throw new Error('This email is already registered. Please log in instead.')
        } else {
          throw new Error('You already signed up with this email but haven\'t confirmed it yet. Please check your inbox (and spam folder) for the confirmation link.')
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

      setSuccess('Account created! Please check your email to confirm, then log in.')
    } catch (err: any) {
      setError(err.message || 'Unable to create your account right now.')
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
          Back to signup options
        </Link>

        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold gradient-text">Interview Coach</span>
        </Link>

        <Card>
          <h1 className="mb-2 text-3xl font-bold">Candidate signup</h1>
          <p className="mb-6 text-gray-400">Create your practice account and start preparing for real interviews.</p>

          {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name row */}
              <div className="grid gap-5 md:grid-cols-2">
                <Input label="First Name *" value={firstName} onChange={setFirstName} placeholder="Jane" required />
                <Input label="Last Name" value={lastName} onChange={setLastName} placeholder="Doe" />
              </div>

              <Input label="Email *" type="email" value={email} onChange={setEmail} placeholder="jane@example.com" required />

              {/* Password row */}
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Password *</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  <p className={`mt-1.5 text-xs ${strength === 'Strong' ? 'text-green-400' : strength === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>Strength: {strength}</p>
                  {strength !== 'Strong' && (
                    <p className="mt-1 text-xs text-gray-400">Must be 10+ characters with uppercase, lowercase & number</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Confirm Password *</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              {/* Current status */}
              <Select
                label="Current Status *"
                value={currentStatus}
                onChange={(v) => { setCurrentStatus(v); setStatusDetail('') }}
                options={statusOptions}
                placeholder="What describes you best?"
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
                label="Target Job Role"
                value={targetJobRole}
                onChange={(v) => { setTargetJobRole(v); setCustomJobRole('') }}
                options={jobRoleOptions}
                placeholder="What role are you aiming for? (optional)"
              />

              {/* Custom job role input - show when "Other" is selected */}
              {targetJobRole === 'Other' && (
                <Input
                  label="Specify Your Target Role *"
                  value={customJobRole}
                  onChange={setCustomJobRole}
                  placeholder="e.g. Machine Learning Engineer"
                  required
                />
              )}

              {targetJobRole && (
                <Select
                  label="Experience Level"
                  value={experienceLevel}
                  onChange={setExperienceLevel}
                  options={[
                    { value: 'junior', label: 'Junior (0–2 yrs)' },
                    { value: 'mid', label: 'Mid-level (3–5 yrs)' },
                    { value: 'senior', label: 'Senior (6+ yrs)' },
                  ]}
                  placeholder="Select level"
                />
              )}

              {/* Country + City */}
              <div className="grid gap-5 md:grid-cols-2">
                <Input label="Country" value={country} onChange={setCountry} placeholder="e.g. United States" />
                <Input label="City" value={city} onChange={setCity} placeholder="e.g. San Francisco" />
              </div>

              {/* LinkedIn */}
              <Input
                label="LinkedIn URL (optional)"
                value={linkedinUrl}
                onChange={setLinkedinUrl}
                placeholder="https://linkedin.com/in/yourprofile"
              />

              {/* Avatar */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Profile photo (optional)</label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-background/40 px-4 py-4 text-sm text-gray-300 hover:bg-white/5">
                  <Camera className="h-5 w-5 text-primary" />
                  <span>{avatarFile ? avatarFile.name : 'Choose image'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </label>
                {avatarPreview && <img src={avatarPreview} alt="Preview" className="mt-3 h-16 w-16 rounded-full object-cover" />}
              </div>

              <Button type="submit" variant="primary" fullWidth loading={loading}>Create candidate account</Button>
            </form>
          ) : (
            <div className="pt-2">
              <Link href="/login/candidate">
                <Button variant="primary" fullWidth>Go to login</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}