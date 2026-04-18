'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-background to-background" />

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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-gray-400 mb-8">Last updated: April 17, 2026</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                <p className="text-gray-300 leading-relaxed">
                  Welcome to Interview Coach ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered interview preparation platform.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                <h3 className="text-xl font-semibold mb-3 text-primary">2.1 Personal Information</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  When you register for an account, we collect:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Full name and email address</li>
                  <li>Password (encrypted and stored securely)</li>
                  <li>Profile information you choose to provide</li>
                  <li>Payment information (processed securely through Stripe)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6 text-primary">2.2 Interview Data</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  During your use of our service, we collect:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Interview session details (job role, industry, difficulty level)</li>
                  <li>Your responses to interview questions</li>
                  <li>AI-generated feedback and scores</li>
                  <li>Session history and performance analytics</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6 text-primary">2.3 Usage Data</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We automatically collect:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>IP address and browser type</li>
                  <li>Device information and operating system</li>
                  <li>Pages visited and features used</li>
                  <li>Time spent on the platform</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use your information to:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Provide and improve our AI interview coaching service</li>
                  <li>Generate personalized interview questions and feedback</li>
                  <li>Process payments and manage subscriptions</li>
                  <li>Send service-related emails and notifications</li>
                  <li>Analyze usage patterns to enhance user experience</li>
                  <li>Detect and prevent fraud or abuse</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">4. AI and Data Processing</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use Claude AI by Anthropic to generate interview questions and provide feedback. Your interview responses are processed by:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Our secure servers</li>
                  <li>Anthropic's API (subject to their privacy policy)</li>
                  <li>Data is encrypted in transit and at rest</li>
                  <li>We do not train AI models on your personal data</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">5. Data Sharing and Disclosure</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We do not sell your personal information. We may share data with:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Service Providers:</strong> Stripe (payments), Supabase (database), Anthropic (AI processing)</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In case of merger, acquisition, or asset sale</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">6. Data Security</h2>
                <p className="text-gray-300 leading-relaxed">
                  We implement industry-standard security measures including:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-4">
                  <li>SSL/TLS encryption for data transmission</li>
                  <li>Encrypted database storage</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                  <li>SOC 2 compliance (in progress)</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">7. Your Rights</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your account and data</li>
                  <li>Export your interview history</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Withdraw consent at any time</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mt-4">
                  To exercise these rights, contact us at <a href="mailto:privacy@interviewcoach.com" className="text-primary hover:underline">privacy@interviewcoach.com</a>
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">8. Data Retention</h2>
                <p className="text-gray-300 leading-relaxed">
                  We retain your data for as long as your account is active or as needed to provide services. After account deletion, we retain certain data for 90 days for backup purposes, then permanently delete it. Some data may be retained longer for legal compliance.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">9. Cookies and Tracking</h2>
                <p className="text-gray-300 leading-relaxed">
                  We use essential cookies for authentication and preferences. We do not use third-party advertising cookies. You can disable cookies in your browser settings, though this may affect functionality.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">10. Children's Privacy</h2>
                <p className="text-gray-300 leading-relaxed">
                  Our service is not directed to individuals under 16. We do not knowingly collect personal information from children. If we discover such collection, we will delete it immediately.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">11. International Data Transfers</h2>
                <p className="text-gray-300 leading-relaxed">
                  Your data may be transferred to and processed in countries outside your residence. We ensure adequate safeguards are in place for such transfers.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">12. Changes to This Policy</h2>
                <p className="text-gray-300 leading-relaxed">
                  We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification. Continued use after changes constitutes acceptance.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">13. Contact Us</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  For questions about this Privacy Policy or our data practices:
                </p>
                <p className="text-gray-300">
                  Email: <a href="mailto:privacy@interviewcoach.com" className="text-primary hover:underline">privacy@interviewcoach.com</a><br />
                  Address: Interview Coach, Inc.<br />
                  Or visit our <Link href="/contact" className="text-primary hover:underline">Contact Page</Link>
                </p>
              </section>
            </div>

            <div className="mt-12 text-center">
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
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
