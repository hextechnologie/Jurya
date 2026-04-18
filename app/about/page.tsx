import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button, Card } from '@/components/ui'

export default function AboutPage() {
  const team = [
    { name: 'Product Lead', role: 'Concevoir un parcours de préparation plus intelligent' },
    { name: 'AI Engineer', role: 'Développer des simulations d\'oral réalistes' },
    { name: 'Growth Lead', role: 'Aider les candidats à maximiser leurs chances' },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-background to-background" />
      <div className="relative z-10">
        <header className="border-b border-border bg-card/50 backdrop-blur">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">Jurya</span>
            </Link>
            <Link href="/dashboard"><Button variant="outline">Tableau de bord</Button></Link>
          </div>
        </header>

        <div className="container mx-auto px-6 py-16 max-w-6xl">
          <div className="text-center mb-14">
            <h1 className="text-5xl font-bold mb-4">À propos de Jurya</h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Nous avons créé Jurya pour démocratiser la préparation aux oraux de concours grâce à des simulations réalistes, accessibles et efficaces.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-10">
            <Card>
              <h2 className="text-2xl font-bold mb-3">Notre mission</h2>
              <p className="text-gray-300 leading-relaxed">
                Notre mission est d'aider les candidats à préparer leurs oraux de concours avec confiance grâce à des simulations réalistes pilotées par l'IA, des retours détaillés et des conseils personnalisés.
              </p>
            </Card>
            <Card>
              <h2 className="text-2xl font-bold mb-3">Pourquoi Jurya</h2>
              <p className="text-gray-300 leading-relaxed">
                Trop de candidats échouent aux oraux faute de pratique suffisante. Nous avons voulu créer un outil accessible, abordable et disponible à tout moment pour s'entraîner.
              </p>
            </Card>
          </div>

          <Card className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Comment ça marche</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div className="rounded-xl border border-border p-4">
                <p className="text-primary font-semibold mb-2">1. Choisissez votre oral</p>
                <p>Sélectionnez le concours, le niveau, la langue et le type d'épreuve.</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-primary font-semibold mb-2">2. Entraînez-vous avec l'IA</p>
                <p>Répondez à des questions réalistes dans une simulation d'oral guidée.</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-primary font-semibold mb-2">3. Progressez plus vite</p>
                <p>Consultez votre note, vos points forts, vos axes d'amélioration et les conseils du jury.</p>
              </div>
            </div>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-4">Équipe</h2>
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
