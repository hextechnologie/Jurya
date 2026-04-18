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
    window.open('https://wa.me/1234567890?text=Hello,%20I%20need%20help%20with%20Interview%20Coach', '_blank')
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
              <span className="text-2xl font-bold gradient-text">Interview Coach</span>
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
            <h1 className="text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Have a question or need support? We're here to help!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div>
              <Card>
                <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
                
                {success && (
                  <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg mb-6">
                    Thank you! We'll get back to you within 24 hours.
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    label="Full Name"
                    type="text"
                    value={name}
                    onChange={setName}
                    placeholder="John Doe"
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                    required
                  />

                  <Input
                    label="Subject"
                    type="text"
                    value={subject}
                    onChange={setSubject}
                    placeholder="Billing, support, partnership..."
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us how we can help you..."
                      required
                      rows={6}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder-gray-500"
                    />
                  </div>

                  <Button type="submit" variant="primary" fullWidth loading={loading}>
                    Send Message
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
                    <h3 className="text-lg font-semibold mb-2">WhatsApp Support</h3>
                    <p className="text-gray-400 mb-4">
                      Get instant help via WhatsApp. We're available Monday to Friday, 9 AM - 6 PM EST.
                    </p>
                    <Button variant="outline" onClick={openWhatsApp} className="gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Chat on WhatsApp
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
                    <h3 className="text-lg font-semibold mb-2">Email Us</h3>
                    <p className="text-gray-400 mb-2">
                      For detailed inquiries or support requests
                    </p>
                    <a href="mailto:support@interviewcoach.com" className="text-primary hover:underline">
                      support@interviewcoach.com
                    </a>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div className="glass p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-2">Looking for Answers?</h3>
                <p className="text-gray-400 mb-4">
                  Check out our FAQ page for quick answers to common questions.
                </p>
                <Link href="/faq">
                  <Button variant="outline">Visit FAQ</Button>
                </Link>
              </div>

              {/* Response Time */}
              <div className="glass p-6 rounded-xl bg-gradient-primary/10 border-primary/20">
                <h3 className="text-lg font-semibold mb-2">⚡ Quick Response Time</h3>
                <p className="text-gray-300">
                  We typically respond to all inquiries within 24 hours on business days.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border mt-20 py-8">
          <div className="container mx-auto px-6">
            <div className="text-center text-gray-400 text-sm">
              <p>&copy; 2026 Interview Coach. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
