'use client'

import Link from 'next/link'
import { ArrowRight, Briefcase, Sparkles, UserRound } from 'lucide-react'
import { Button, Card, Badge } from '@/components/ui'

const signupTypes = [
  {
    title: 'Compte candidat',
    description: 'Entraînez-vous aux oraux avec l\'IA, réservez un membre de jury et suivez votre progression.',
    href: '/signup/candidate',
    icon: UserRound,
  },
  {
    title: 'Compte jury',
    description: 'Créez votre profil d\'expert, fixez vos tarifs et gagnez de l\'argent grâce aux sessions.',
    href: '/signup/coach',
    icon: Briefcase,
  },
]

export default function SignupPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-6 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.24),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_35%)]" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <Link href="/" className="mb-10 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold gradient-text">Jurya</span>
        </Link>

        <div className="mb-10 text-center">
          <Badge className="mb-4">Créez votre compte</Badge>
          <h1 className="mb-3 text-4xl font-bold">Choisissez votre inscription</h1>
          <p className="text-lg text-gray-300">Choisissez l'expérience qui correspond à votre utilisation de la plateforme.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {signupTypes.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title} className="border-primary/20 bg-card/80 backdrop-blur">
                <div className="mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 p-3 w-fit">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">{item.title}</h2>
                <p className="mb-6 text-gray-300">{item.description}</p>
                <Link href={item.href}>
                  <Button variant="primary" className="gap-2">
                    Continuer
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
