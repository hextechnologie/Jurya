'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, CheckCircle2, Sparkles } from 'lucide-react'
import { Button } from './ui'
import Link from 'next/link'

interface Message {
  type: 'ai' | 'user' | 'feedback'
  text: string
  subtext?: string
}

const demoMessages: Message[] = [
  { type: 'ai', text: 'Hello! I\'m your AI interview coach. Let\'s practice a common interview question. Tell me about yourself.' },
  { type: 'user', text: 'I\'m a software engineer with 5 years of experience in full-stack development. I\'ve led teams of 3-5 developers and shipped products used by over 100,000 users. I\'m passionate about building scalable systems and mentoring junior developers.' },
  { type: 'feedback', text: '✅ Excellent answer! You covered experience, achievements, and passion.', subtext: 'Score: 9/10 • Clear structure • Quantifiable results' },
  { type: 'ai', text: 'Great! Now, why do you want this role?' },
  { type: 'user', text: 'I\'m excited about this position because it aligns with my expertise in distributed systems. Your company\'s mission to democratize education resonates with my values, and I see opportunities to make a significant impact on your platform architecture.' },
  { type: 'feedback', text: '✅ Strong answer with clear motivation and company research.', subtext: 'Score: 8/10 • Shows research • Connects skills to role' },
  { type: 'ai', text: 'Excellent! Describe a challenging technical problem you solved recently.' },
]

export function TryDemo() {
  const [visibleMessages, setVisibleMessages] = useState<number>(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (visibleMessages < demoMessages.length && isAnimating) {
      const timer = setTimeout(() => {
        setVisibleMessages(prev => prev + 1)
      }, 1500) // Delay between messages

      return () => clearTimeout(timer)
    } else if (visibleMessages === demoMessages.length && isAnimating) {
      // Reset after completion
      setTimeout(() => {
        setVisibleMessages(0)
        setIsAnimating(false)
      }, 3000)
    }
  }, [visibleMessages, isAnimating])

  const startDemo = () => {
    setVisibleMessages(0)
    setIsAnimating(true)
  }

  const resetDemo = () => {
    setVisibleMessages(0)
    setIsAnimating(false)
  }

  return (
    <section className="container mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">
          See How It Works — <span className="gradient-text">No Signup Required</span>
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Watch a realistic interview simulation with AI-powered feedback in real-time
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Demo Chat Interface */}
        <div className="glass rounded-2xl p-8 min-h-[500px] relative">
          {visibleMessages === 0 && !isAnimating ? (
            // Start state
            <div className="flex flex-col items-center justify-center h-[450px] text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Try a Sample Interview</h3>
              <p className="text-gray-400 mb-8 max-w-md">
                Experience how our AI coach asks questions, evaluates your answers, and provides instant feedback.
              </p>
              <Button variant="primary" onClick={startDemo} className="text-lg px-8 py-4">
                Start Demo
              </Button>
            </div>
          ) : (
            // Messages state
            <div className="space-y-4 mb-4">
              {demoMessages.slice(0, visibleMessages).map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 animate-slide-up ${
                    msg.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {msg.type === 'ai' && (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[75%] rounded-xl p-4 ${
                      msg.type === 'user'
                        ? 'bg-primary text-white'
                        : msg.type === 'feedback'
                        ? 'bg-green-500/20 border border-green-500/30'
                        : 'bg-white/10'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    {msg.subtext && (
                      <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-white/10">{msg.subtext}</p>
                    )}
                  </div>

                  {msg.type === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold">You</span>
                    </div>
                  )}

                  {msg.type === 'feedback' && (
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isAnimating && visibleMessages < demoMessages.length && (
                <div className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="bg-white/10 rounded-xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress bar */}
          {isAnimating && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Sample Interview Progress</span>
                <span>{Math.round((visibleMessages / demoMessages.length) * 100)}% Complete</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-primary transition-all duration-500"
                  style={{ width: `${(visibleMessages / demoMessages.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          {isAnimating && (
            <div className="mt-6 flex justify-center gap-4">
              <Button variant="outline" onClick={resetDemo}>
                Reset Demo
              </Button>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <div className="glass rounded-xl p-8 inline-block">
            <h3 className="text-2xl font-bold mb-3">Ready to Practice for Real?</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Sign up now and get <strong className="text-primary">3 free interviews</strong> with personalized feedback, progress tracking, and more.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button variant="primary" className="text-lg px-8 py-4">
                  Start Your Free Interviews
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="text-lg px-8 py-4">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }
      `}</style>
    </section>
  )
}
