'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'

export default function TermsPage() {
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
            <h1 className="text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-gray-400 mb-8">Last updated: April 17, 2026</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-300 leading-relaxed">
                  By accessing or using Interview Coach ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service. We reserve the right to modify these Terms at any time, and your continued use constitutes acceptance of such changes.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Interview Coach provides an AI-powered interview preparation platform that:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Simulates realistic job interview scenarios</li>
                  <li>Generates personalized interview questions</li>
                  <li>Provides AI-driven feedback and performance analysis</li>
                  <li>Tracks your progress over multiple sessions</li>
                  <li>Supports multiple languages and industries</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
                <h3 className="text-xl font-semibold mb-3 text-primary">3.1 Account Creation</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  To use our Service, you must:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Be at least 16 years old</li>
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your password</li>
                  <li>Notify us immediately of any unauthorized access</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6 text-primary">3.2 Account Responsibility</h3>
                <p className="text-gray-300 leading-relaxed">
                  You are responsible for all activities under your account. We are not liable for any loss or damage from your failure to maintain account security.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">4. Subscription Plans and Billing</h2>
                <h3 className="text-xl font-semibold mb-3 text-primary">4.1 Plan Types</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We offer Free, Basic, and Pro subscription plans with different interview limits and features.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">4.2 Billing</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Subscriptions are billed monthly or annually in advance</li>
                  <li>All fees are non-refundable except as required by law</li>
                  <li>We offer a 7-day money-back guarantee for first-time subscribers</li>
                  <li>Prices may change with 30 days notice</li>
                  <li>Failed payments may result in service suspension</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6 text-primary">4.3 Cancellation</h3>
                <p className="text-gray-300 leading-relaxed">
                  You may cancel your subscription at any time. Access continues until the end of the billing period. No refunds for partial months.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">5. Acceptable Use Policy</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You agree NOT to:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Use the Service for any illegal purpose</li>
                  <li>Attempt to circumvent usage limits or payment requirements</li>
                  <li>Share your account credentials with others</li>
                  <li>Reverse engineer, decompile, or hack the Service</li>
                  <li>Use automated scripts or bots (except browser automation features we provide)</li>
                  <li>Upload malicious content or code</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Scrape or extract data without permission</li>
                  <li>Resell or redistribute the Service</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
                <h3 className="text-xl font-semibold mb-3 text-primary">6.1 Our Content</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  All content, features, and functionality of the Service are owned by Interview Coach and protected by copyright, trademark, and other intellectual property laws.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">6.2 Your Content</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You retain ownership of your interview responses. By using the Service, you grant us a license to:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Process and analyze your responses to provide feedback</li>
                  <li>Store your data for service delivery</li>
                  <li>Use anonymized, aggregated data to improve our AI</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">7. AI-Generated Content</h2>
                <p className="text-gray-300 leading-relaxed">
                  Our Service uses AI to generate interview questions and feedback. While we strive for accuracy, AI-generated content may contain errors or biases. The feedback is for educational purposes only and should not be considered professional career advice. We are not liable for decisions made based on AI feedback.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">8. Disclaimers and Limitations of Liability</h2>
                <h3 className="text-xl font-semibold mb-3 text-primary">8.1 Service "As Is"</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  The Service is provided "as is" and "as available" without warranties of any kind, either express or implied.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">8.2 No Guarantee of Results</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We do not guarantee that use of our Service will result in job offers, improved interview performance, or any specific outcome.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">8.3 Limitation of Liability</h3>
                <p className="text-gray-300 leading-relaxed">
                  To the maximum extent permitted by law, Interview Coach shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability shall not exceed the amount you paid in the 12 months preceding the claim.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">9. Indemnification</h2>
                <p className="text-gray-300 leading-relaxed">
                  You agree to indemnify and hold harmless Interview Coach from any claims, damages, or expenses arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">10. Termination</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may suspend or terminate your account if you:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Violate these Terms</li>
                  <li>Engage in fraudulent activity</li>
                  <li>Fail to pay subscription fees</li>
                  <li>Abuse the Service or harm other users</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mt-4">
                  Upon termination, your right to use the Service ceases immediately. You may request data export within 30 days.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">11. Data Privacy</h2>
                <p className="text-gray-300 leading-relaxed">
                  Your use of the Service is also governed by our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">12. Dispute Resolution</h2>
                <h3 className="text-xl font-semibold mb-3 text-primary">12.1 Informal Resolution</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Before filing a claim, you agree to contact us at <a href="mailto:legal@interviewcoach.com" className="text-primary hover:underline">legal@interviewcoach.com</a> to resolve the dispute informally.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">12.2 Arbitration</h3>
                <p className="text-gray-300 leading-relaxed">
                  Any disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You waive your right to a jury trial or class action.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">13. Governing Law</h2>
                <p className="text-gray-300 leading-relaxed">
                  These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of law principles.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">14. Severability</h2>
                <p className="text-gray-300 leading-relaxed">
                  If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full effect.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">15. Contact Information</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  For questions about these Terms:
                </p>
                <p className="text-gray-300">
                  Email: <a href="mailto:legal@interviewcoach.com" className="text-primary hover:underline">legal@interviewcoach.com</a><br />
                  Company: Interview Coach, Inc.<br />
                  Or visit our <Link href="/contact" className="text-primary hover:underline">Contact Page</Link>
                </p>
              </section>

              <section className="glass p-8 rounded-xl bg-gradient-primary/10 border-primary/20">
                <h2 className="text-2xl font-bold mb-4">Agreement</h2>
                <p className="text-gray-300 leading-relaxed">
                  By clicking "I Accept" during registration or by using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
