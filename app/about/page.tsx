import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button, Card } from '@/components/ui'

export default function AboutPage() {
  const team = [
    { name: 'Product Lead', role: 'Designing a smarter interview journey' },
    { name: 'AI Engineer', role: 'Building realistic interview feedback systems' },
    { name: 'Growth Lead', role: 'Helping candidates reach more opportunities' },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-background to-background" />
      <div className="relative z-10">
        <header className="border-b border-border bg-card/50 backdrop-blur">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">Interview Coach</span>
            </Link>
            <Link href="/dashboard"><Button variant="outline">Dashboard</Button></Link>
          </div>
        </header>

        <div className="container mx-auto px-6 py-16 max-w-6xl">
          <div className="text-center mb-14">
            <h1 className="text-5xl font-bold mb-4">About Interview Coach</h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              We built Interview Coach to make world-class interview practice accessible, practical, and confidence-boosting for everyone.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-10">
            <Card>
              <h2 className="text-2xl font-bold mb-3">Our Mission</h2>
              <p className="text-gray-300 leading-relaxed">
                Our mission is to help job seekers prepare with confidence using realistic AI-powered mock interviews, fast feedback, and personalized improvement tips.
              </p>
            </Card>
            <Card>
              <h2 className="text-2xl font-bold mb-3">Why We Built This</h2>
              <p className="text-gray-300 leading-relaxed">
                Too many candidates miss great opportunities because they never get enough practice. We wanted to create a private, affordable, always-available coach.
              </p>
            </Card>
          </div>

          <Card className="mb-10">
            <h2 className="text-2xl font-bold mb-4">How the App Works</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div className="rounded-xl border border-border p-4">
                <p className="text-primary font-semibold mb-2">1. Choose your interview</p>
                <p>Select the role, level, language, and interview type.</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-primary font-semibold mb-2">2. Practice with AI</p>
                <p>Answer realistic questions in a guided mock interview experience.</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-primary font-semibold mb-2">3. Improve faster</p>
                <p>Review your score, strengths, weak spots, and coaching suggestions.</p>
              </div>
            </div>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-4">Team</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {team.map((member) => (
                <Card key={member.name}>
                  <div className="w-14 h-14 rounded-full bg-gradient-primary mb-4" />
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{member.role}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
