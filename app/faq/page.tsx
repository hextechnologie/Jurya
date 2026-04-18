'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui'
import { FAQPageSchema } from '@/components/StructuredData'

const faqs = [
  {
    question: 'How does the AI interview work?',
    answer:
      'The platform simulates a realistic interview based on your role, level, and interview type. The AI asks questions, reviews your answers, scores your performance, and gives personalized feedback to help you improve quickly.',
  },
  {
    question: 'How many free interviews do I get?',
    answer:
      'Free users receive 3 mock interviews each month. You can upgrade at any time if you want more practice sessions and deeper analytics.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes. You can cancel at any time from your billing settings, and your access will remain active until the end of your current billing cycle.',
  },
  {
    question: 'What job roles are supported?',
    answer:
      'You can practice for software engineering, product, design, marketing, sales, finance, operations, customer support, and many other professional roles.',
  },
  {
    question: 'Is my data private?',
    answer:
      'Yes. Your interview data is stored securely and used only to run your sessions and generate feedback. We do not sell your personal information.',
  },
  {
    question: 'How is my score calculated?',
    answer:
      'Your score is based on answer relevance, clarity, structure, confidence, and depth. The AI also checks how well you support your answers with examples and measurable impact.',
  },
  {
    question: 'Can I practice in Arabic or other languages?',
    answer:
      'Yes. The app supports Arabic and multiple other languages including English, French, and Spanish, so you can practice in the language you are most comfortable with.',
  },
  {
    question: 'How is this different from ChatGPT?',
    answer:
      'Interview Coach is built specifically for interview preparation. It gives structured mock interviews, tracks progress, stores sessions, and provides targeted scoring and coaching rather than general conversation only.',
  },
  {
    question: 'Do I need to install anything?',
    answer:
      'No installation is required. You can use the app directly in your browser on desktop or mobile.',
  },
  {
    question: 'How do I upgrade my plan?',
    answer:
      'Visit the pricing page, choose the plan that fits your needs, and complete checkout. Your account limits will update automatically after payment.',
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <>
      <FAQPageSchema />
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
            <h1 className="text-5xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to know about Interview Coach and how it works
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="glass rounded-xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-lg font-semibold pr-8">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-5 pt-2">
                    <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center glass p-8 rounded-2xl max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
            <p className="text-gray-400 mb-6">
              Can't find the answer you're looking for? Feel free to reach out to our support team.
            </p>
            <Link href="/contact">
              <Button variant="primary" className="px-8 py-3">
                Contact Us
              </Button>
            </Link>
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
    </>
  )
}
