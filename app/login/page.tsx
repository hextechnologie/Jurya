'use client'

import Link from 'next/link'
import { ArrowRight, Briefcase, Sparkles, UserRound } from 'lucide-react'
import { Button, Card, Badge } from '@/components/ui'
import { motion } from 'framer-motion'

const loginTypes = [
  {
    title: "I'm looking for a job 🎯",
    description: 'Practice with AI, book expert coaches, and track your progress.',
    icon: UserRound,
    href: '/login/candidate',
    signupHref: '/signup/candidate',
    badge: 'Candidate',
  },
  {
    title: "I'm a Coach 💼",
    description: 'Create your profile, accept bookings, and earn with Stripe Connect.',
    icon: Briefcase,
    href: '/login/coach',
    signupHref: '/signup/coach',
    badge: 'Coach',
  },
]

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-6 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.24),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_35%)]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <Link href="/" className="mb-10 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold gradient-text">Interview Coach</span>
        </Link>

        <div className="mx-auto mb-10 max-w-3xl text-center">
          <Badge className="mb-4">Choose your path</Badge>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Login by account type</h1>
          <p className="text-lg text-gray-300">
            Candidates can practice and book sessions. Coaches can manage clients, availability, and payouts.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {loginTypes.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-primary/20 bg-card/80 backdrop-blur">
                  <div className="mb-5 flex items-start justify-between">
                    <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 p-3">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <Badge>{item.badge}</Badge>
                  </div>

                  <h2 className="mb-3 text-2xl font-bold">{item.title}</h2>
                  <p className="mb-8 text-gray-300">{item.description}</p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link href={item.href}>
                      <Button variant="primary" fullWidth className="gap-2">
                        Login
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={item.signupHref}>
                      <Button variant="outline" fullWidth>
                        Signup
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
