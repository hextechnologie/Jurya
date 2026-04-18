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
    return 'E-mail ou mot de passe incorrect. Veuillez vérifier et réessayer.'
  if (m.includes('email not confirmed'))
    return 'Votre adresse e-mail n\'est pas encore vérifiée. Vérifiez votre boîte de réception.'
  if (m.includes('too many requests') || m.includes('rate limit'))
    return 'Trop de tentatives de connexion. Veuillez patienter quelques minutes.'
  if (m.includes('user not found') || m.includes('no user found'))
    return 'Aucun compte trouvé avec cet e-mail. Vouliez-vous vous inscrire ?'
  if (m.includes('network') || m.includes('fetch'))
    return 'Erreur réseau. Vérifiez votre connexion et réessayez.'
  return msg || 'Une erreur inattendue s\'est produite. Veuillez réessayer.'
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
      setError('Veuillez entrer une adresse e-mail valide.')
      return
    }

    if (!password.trim()) {
      setError('Le mot de passe est requis.')
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
          Retour aux types de compte
        </Link>

        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold gradient-text">Jurya</span>
        </Link>

        <Card>
          <div className="mb-3 flex items-center justify-center">
            <Badge>Espace jury</Badge>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-center">Connexion jury</h1>
          <p className="mb-6 text-center text-gray-400">Gérez vos sessions, vos candidats et vos revenus.</p>

          {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="E-mail" type="email" value={email} onChange={setEmail} placeholder="jury@exemple.com" required />

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Mot de passe</label>
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
              <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-primary transition-colors">Mot de passe oublié ?</Link>
            </div>
            <Button type="submit" variant="primary" fullWidth loading={loading}>Accéder à l'éspace jury</Button>
          </form>

          <button onClick={handleGoogle} className="mt-4 w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-white hover:bg-white/5">
            Continuer avec Google
          </button>

          <p className="mt-6 text-center text-sm text-gray-400">
            Nouveau ici ? <Link href="/signup/coach" className="text-primary hover:underline">Créer un profil jury</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}