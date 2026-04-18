'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Button, Card, Input, Badge } from '@/components/ui'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

function friendlyError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'Incorrect email or password. Please double-check and try again.'
  if (m.includes('email not confirmed'))
    return 'Your email address is not verified yet. Check your inbox for a confirmation link.'
  if (m.includes('too many requests') || m.includes('rate limit'))
    return 'Too many login attempts. Please wait a few minutes and try again.'
  if (m.includes('user not found') || m.includes('no user found'))
    return 'No account found with this email. Did you mean to sign up?'
  if (m.includes('network') || m.includes('fetch'))
    return 'Network error. Please check your connection and try again.'
  return msg || 'An unexpected error occurred. Please try again.'
}

export default function CoachLoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (!password.trim()) {
      setError('Password is required.')
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err: any) {
      setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/coach/dashboard` },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-background to-background" />
      <div className="relative z-10 mx-auto max-w-md">
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to account types
        </Link>

        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold gradient-text">Interview Coach</span>
        </Link>

        <Card>
          <div className="mb-3 flex items-center justify-center">
            <Badge>Coach portal</Badge>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-center">Coach login</h1>
          <p className="mb-6 text-center text-gray-400">Manage sessions, clients, and your earnings.</p>

          {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="coach@example.com" required />

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-12 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-primary transition-colors">Forgot password?</Link>
            </div>
            <Button type="submit" variant="primary" fullWidth loading={loading}>Enter coach dashboard</Button>
          </form>

          <button onClick={handleGoogle} className="mt-4 w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-white hover:bg-white/5">
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-gray-400">
            New here? <Link href="/signup/coach" className="text-primary hover:underline">Create coach profile</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}