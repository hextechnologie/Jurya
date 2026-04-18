'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Mail, MessageSquare, Phone } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('General Inquiry')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      setSuccess(true)
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const openWhatsApp = () => {
    window.open('https://wa.me/1234567890?text=Bonjour,%20j%27ai%20besoin%20d%27aide%20avec%20Jurya', '_blank')
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-background to-background" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-secondary/10 blur-3xl rounded-full" />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">Jurya</span>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-6 py-20">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">Nous contacter</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Une question ou besoin d'aide ? Nous sommes là pour vous !
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div>
              <Card>
                <h2 className="text-2xl font-bold mb-6">Envoyez-nous un message</h2>
                
                {success && (
                  <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg mb-6">
                    Merci ! Nous vous répondrons dans les 24 heures.
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    label="Nom complet"
                    type="text"
                    value={name}
                    onChange={setName}
                    placeholder="Jean Dupont"
                    required
                  />

                  <Input
                    label="Adresse e-mail"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="vous@exemple.com"
                    required
                  />

                  <Input
                    label="Objet"
                    type="text"
                    value={subject}
                    onChange={setSubject}
                    placeholder="Facturation, support, partenariat..."
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Dites-nous comment nous pouvons vous aider..."
                      required
                      rows={6}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-gray-500"
                    />
                  </div>

                  <Button type="submit" variant="primary" fullWidth loading={loading}>
                    Envoyer le message
                  </Button>
                </form>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              {/* WhatsApp */}
              <div className="glass p-6 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Support WhatsApp</h3>
                    <p className="text-gray-400 mb-4">
                      Obtenez de l'aide instantanée via WhatsApp. Nous sommes disponibles du lundi au vendredi, 9h - 18h.
                    </p>
                    <Button variant="outline" onClick={openWhatsApp} className="gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Discuter sur WhatsApp
                    </Button>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="glass p-6 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">E-mail</h3>
                    <p className="text-gray-400 mb-2">
                      Pour les demandes détaillées ou les demandes de support
                    </p>
                    <a href="mailto:support@jurya.fr" className="text-primary hover:underline">
                      support@jurya.fr
                    </a>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div className="glass p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-2">Vous cherchez des réponses ?</h3>
                <p className="text-gray-400 mb-4">
                  Consultez notre FAQ pour des réponses rapides aux questions courantes.
                </p>
                <Link href="/faq">
                  <Button variant="outline">Voir la FAQ</Button>
                </Link>
              </div>

              {/* Response Time */}
              <div className="glass p-6 rounded-xl bg-gradient-primary/10 border-primary/20">
                <h3 className="text-lg font-semibold mb-2">⚡ Réponse rapide</h3>
                <p className="text-gray-300">
                  Nous répondons généralement à toutes les demandes dans les 24 heures ouvrables.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border mt-20 py-8">
          <div className="container mx-auto px-6">
            <div className="text-center text-gray-400 text-sm">
              <p>&copy; 2026 Jurya. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
