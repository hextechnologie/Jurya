'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui'
import { Sparkles, TrendingUp, Play, Menu, X, Twitter, Linkedin, Instagram, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { VideoModal } from '@/components/VideoModal'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const demoMessages = [
  { role: 'ai',    label: 'AI 🤖',      text: 'Tell me about a challenging project you led.' },
  { role: 'user',  label: 'You',         text: 'I led a team of 5 to rebuild our payment system...' },
  { role: 'ai',    label: 'AI 🤖',      text: 'Score: 7/10 — Good structure! Add more metrics.' },
  { role: 'coach', label: 'Coach 👨‍💼', text: 'Great start! In real interviews, pause here and make eye contact.' },
]

const STATS = [
  { icon: '🤖', value: 'AI-Powered', label: 'Practice 24/7' },
  { icon: '👨‍💼', value: '50+',        label: 'Expert Coaches' },
  { icon: '🌍', value: '10+',         label: 'Languages' },
  { icon: '⭐', value: '4.9/5',       label: 'Average Rating' },
  { icon: '💼', value: '500+',        label: 'Jobs Landed' },
]

const MOCK_COACHES = [
  {
    name: 'Sarah Chen',
    title: 'Ex-Google Tech Lead',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahChen&backgroundColor=b6e3f4',
    tags: ['Tech', 'System Design', 'Behavioral'],
    rating: 4.9,
    sessions: 142,
    price: 80,
  },
  {
    name: 'Marcus Williams',
    title: 'Ex-McKinsey Consultant',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MarcusWilliams&backgroundColor=c0aede',
    tags: ['Consulting', 'Finance', 'Case Interviews'],
    rating: 4.8,
    sessions: 98,
    price: 100,
  },
  {
    name: 'Priya Sharma',
    title: 'Ex-Amazon PM',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaSharma&backgroundColor=d1d4f9',
    tags: ['Product', 'Behavioral', 'Leadership'],
    rating: 5.0,
    sessions: 201,
    price: 90,
  },
]

const AI_STEPS = [
  { step: '1', title: 'Choose Your Role',      desc: 'Select your target job, industry, and level. The AI adapts everything to you.' },
  { step: '2', title: 'Practice with AI',       desc: 'Answer realistic questions in real-time. The AI responds like a real interviewer.' },
  { step: '3', title: 'Get Instant Feedback',   desc: 'See your score, confidence level, ideal answer, and what to improve after each question.' },
  { step: '4', title: 'Improve & Repeat',       desc: 'Track scores over time and keep practising until you feel completely ready.' },
]

const COACH_STEPS = [
  { step: '1', title: 'Browse Coaches',       desc: 'Filter by industry, experience level, price, and rating. Read reviews from past candidates.' },
  { step: '2', title: 'Book a Session',       desc: 'Choose a date, time, and session length that works for you. Pay securely online.' },
  { step: '3', title: 'Live 1-on-1 Session', desc: 'Join a video call with your expert coach. Practice interview scenarios in real time.' },
  { step: '4', title: 'Get Expert Feedback', desc: 'Receive a personalised report with actionable next steps and improvement areas.' },
]

export default function HomePage() {
  const { user } = useAuth()
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [getStartedOpen, setGetStartedOpen] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [howItWorksTab, setHowItWorksTab] = useState<'ai' | 'coach'>('ai')
  const getStartedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % demoMessages.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (getStartedRef.current && !getStartedRef.current.contains(e.target as Node)) {
        setGetStartedOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Backgrounds */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-background to-background" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-secondary/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/10 blur-3xl rounded-full" />

      <div className="relative z-10">

        {/* ══ NAVBAR ══ */}
        <header className="container mx-auto px-6 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">Interview Coach</span>
            </div>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/pricing"  className="text-sm text-gray-300 hover:text-primary transition-colors">Pricing</Link>
              <Link href="/coaches"  className="text-sm text-gray-300 hover:text-primary transition-colors">Coaches</Link>
              <Link href="/faq"      className="text-sm text-gray-300 hover:text-primary transition-colors">FAQ</Link>
              <Link href="/contact"  className="text-sm text-gray-300 hover:text-primary transition-colors">Contact</Link>
              <LanguageSwitcher />
              {user ? (
                <Link href="/dashboard">
                  <Button variant="primary">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline">Login</Button>
                  </Link>
                  {/* Get Started dropdown */}
                  <div className="relative" ref={getStartedRef}>
                    <button
                      onClick={() => setGetStartedOpen((v) => !v)}
                      className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                    >
                      Get Started
                      <ChevronDown className={`w-4 h-4 transition-transform ${getStartedOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {getStartedOpen && (
                      <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50" style={{ background: '#111827' }}>
                        <Link href="/signup/candidate" onClick={() => setGetStartedOpen(false)}>
                          <div className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer">
                            <p className="text-sm font-semibold text-white">🤖 Practice with AI</p>
                            <p className="text-xs text-gray-400 mt-0.5">Start mock interviews free</p>
                          </div>
                        </Link>
                        <div className="border-t border-white/10" />
                        <Link href="/signup/coach" onClick={() => setGetStartedOpen(false)}>
                          <div className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer">
                            <p className="text-sm font-semibold text-white">👨‍💼 Become a Coach</p>
                            <p className="text-xs text-gray-400 mt-0.5">Earn from your expertise</p>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-border"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </nav>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 glass rounded-xl p-4 space-y-3">
              <Link href="/pricing"  className="block text-gray-300 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="/coaches"  className="block text-gray-300 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Coaches</Link>
              <Link href="/faq"      className="block text-gray-300 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
              <Link href="/contact"  className="block text-gray-300 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/signup/candidate" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" fullWidth>🤖 Practice with AI</Button>
                </Link>
                <Link href="/signup/coach" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" fullWidth>👨‍💼 Become a Coach</Button>
                </Link>
              </div>
              <div className="pt-2"><LanguageSwitcher /></div>
            </div>
          )}
        </header>

        {/* ══ HERO ══ */}
        <section className="container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 animate-fadeIn leading-tight">
                Land your dream job with{' '}
                <span className="gradient-text">AI Coaching + Real Expert Coaches</span>
              </h1>
              <p className="text-xl text-gray-400 mb-8 animate-fadeIn leading-relaxed">
                Practice unlimited mock interviews with AI, then book a 1-on-1 session with a real interview coach. Get personalised feedback, improve faster, and walk into every interview with real confidence.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fadeIn mb-5">
                {user ? (
                  <Link href="/dashboard">
                    <Button variant="primary" className="text-lg px-8 py-4 w-full sm:w-auto">Go to Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/signup/candidate">
                      <Button variant="primary" className="text-lg px-8 py-4 w-full sm:w-auto">Start Practicing Free</Button>
                    </Link>
                    <Link href="/coaches">
                      <Button variant="outline" className="text-lg px-8 py-4 w-full sm:w-auto">Find a Coach</Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Watch demo */}
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors group mx-auto lg:mx-0 mb-5"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <Play className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Watch Demo</span>
              </button>

              {/* Trust badges */}
              <div className="flex flex-col items-center lg:items-start gap-1">
                <p className="text-sm text-gray-500">✨ Get 3 Free Mock Interviews · No Card Needed</p>
                <p className="text-sm text-gray-500">👨‍💼 50+ Expert Coaches Available</p>
              </div>
            </div>

            {/* Right: chat demo */}
            <div className="animate-fadeIn">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-slate-950">
                <div className="relative p-4 md:p-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
                  <div className="relative rounded-xl border border-border bg-black/40 p-4 flex flex-col">

                    {/* Demo header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-semibold text-white">AI Practice + Coach Feedback</p>
                        <p className="text-xs text-gray-400">Live mock interview preview</p>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                        <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="space-y-3 flex-1 min-h-[200px]">
                      {demoMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-2 transition-all duration-500 ${
                            index <= demoStep ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-2'
                          }`}
                        >
                          <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                            msg.role === 'ai'    ? 'bg-purple-600/30 border border-purple-500/40' :
                            msg.role === 'coach' ? 'bg-green-600/30 border border-green-500/40' :
                                                   'bg-blue-600/30 border border-blue-500/40'
                          }`}>
                            {msg.role === 'ai' ? '🤖' : msg.role === 'coach' ? '👨‍💼' : '👤'}
                          </div>
                          <div className={`flex-1 rounded-xl px-3 py-2 text-xs ${
                            msg.role === 'ai'    ? 'bg-purple-500/15 text-purple-200 border border-purple-500/20' :
                            msg.role === 'coach' ? 'bg-green-500/15 text-green-200 border border-green-500/20' :
                                                   'bg-blue-500/15 text-blue-200 border border-blue-500/20 ml-4'
                          }`}>
                            <span className="font-semibold block mb-0.5 opacity-60">{msg.label}</span>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary transition-all duration-700"
                        style={{ width: `${((demoStep + 1) / demoMessages.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ STATS ══ */}
        <section className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {STATS.map((stat) => (
              <div key={stat.label} className="glass p-5 rounded-xl">
                <div className="text-3xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold gradient-text mb-1">{stat.value}</div>
                <p className="text-gray-400 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ WHY CHOOSE US ══ */}
        <section className="container mx-auto px-6 py-20">
          <h2 className="text-4xl font-bold text-center mb-4">Why Choose Interview Coach</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            The only platform that combines unlimited AI practice with real human coaching — so you're always one step ahead.
          </p>
          <div className="grid md:grid-cols-3 gap-8">

            {/* AI Practice */}
            <div className="glass p-8 rounded-2xl animate-fadeIn">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 text-3xl">🤖</div>
              <h3 className="text-xl font-bold mb-3">AI Mock Interviews 🤖</h3>
              <p className="text-gray-400 mb-4">
                Practice 24/7 with our AI that adapts to your role, experience level, and target company. Get instant scoring and detailed feedback on every answer.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✓ STAR method structure analysis</p>
                <p>✓ Confidence &amp; clarity scoring</p>
                <p>✓ Filler word detection</p>
                <p>✓ Unlimited practice sessions</p>
              </div>
            </div>

            {/* Human Coaches */}
            <div className="glass p-8 rounded-2xl animate-fadeIn border border-primary/30 relative" style={{ animationDelay: '0.1s' }}>
              <span className="absolute top-4 right-4 text-xs font-bold rounded-full bg-primary/20 border border-primary/30 px-2.5 py-0.5 text-primary">NEW</span>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))', border: '1px solid rgba(16,185,129,0.3)' }}>👨‍💼</div>
              <h3 className="text-xl font-bold mb-3">Real Expert Coaches 👨‍💼</h3>
              <p className="text-gray-400 mb-4">
                Book 1-on-1 sessions with experienced coaches from top companies. Get personalised advice, live feedback, and insider tips you can't get from AI.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✓ Coaches from Google, Amazon, McKinsey</p>
                <p>✓ Video &amp; audio sessions</p>
                <p>✓ CV &amp; cover letter review</p>
                <p>✓ Salary negotiation coaching</p>
              </div>
            </div>

            {/* Track & Improve */}
            <div className="glass p-8 rounded-2xl animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Track &amp; Improve 📈</h3>
              <p className="text-gray-400 mb-4">
                Monitor your progress across both AI sessions and coach feedback. See your scores improve over time with detailed analytics and personalised coaching plans.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✓ AI + Coach combined analytics</p>
                <p>✓ Score trend charts</p>
                <p>✓ Personalised improvement plan</p>
                <p>✓ Session history</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ══ */}
        <section className="container mx-auto px-6 py-20 bg-card/30 rounded-3xl">
          <div className="text-center mb-10">
            <p className="text-primary text-sm font-semibold mb-2">HOW IT WORKS</p>
            <h2 className="text-4xl font-bold mb-4">Two ways to get interview-ready</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Use AI practice, book a coach session, or combine both for the best results.
            </p>
            {/* Tab bar */}
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-1">
              <button
                onClick={() => setHowItWorksTab('ai')}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${howItWorksTab === 'ai' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                🤖 AI Practice
              </button>
              <button
                onClick={() => setHowItWorksTab('coach')}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${howItWorksTab === 'coach' ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                style={howItWorksTab === 'coach' ? { background: '#059669' } : {}}
              >
                👨‍💼 Coach Session
              </button>
            </div>
          </div>

          {/* AI path */}
          {howItWorksTab === 'ai' && (
            <div className="grid md:grid-cols-4 gap-6">
              {AI_STEPS.map((item) => (
                <div key={item.step} className="text-center p-6 glass rounded-xl">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-full text-2xl font-bold mb-4">{item.step}</div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Coach path */}
          {howItWorksTab === 'coach' && (
            <div className="grid md:grid-cols-4 gap-6">
              {COACH_STEPS.map((item) => (
                <div key={item.step} className="text-center p-6 glass rounded-xl border border-green-500/20">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full text-2xl font-bold mb-4 text-green-300" style={{ background: 'rgba(5,150,105,0.2)', border: '1px solid rgba(16,185,129,0.4)' }}>
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ══ MEET OUR COACHES ══ */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold mb-2">EXPERT COACHES</p>
            <h2 className="text-4xl font-bold mb-4">Learn From the Best 👨‍💼</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our coaches have helped candidates land roles at top companies worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {MOCK_COACHES.map((coach) => (
              <div key={coach.name} className="glass p-6 rounded-2xl flex flex-col gap-4 hover:border-primary/30 transition-colors border border-white/10">
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coach.avatar} alt={coach.name} className="w-16 h-16 rounded-full bg-white/10" />
                  <div>
                    <p className="font-bold text-white">{coach.name}</p>
                    <p className="text-sm text-gray-400">{coach.title}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {coach.tags.map((tag) => (
                    <span key={tag} className="text-xs rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-primary">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-yellow-400">⭐ {coach.rating} <span className="text-gray-500">({coach.sessions} sessions)</span></span>
                  <span className="text-purple-400 font-semibold">from ${coach.price}/sess</span>
                </div>
                <Link href="/coaches">
                  <Button variant="outline" fullWidth className="text-sm">View Profile</Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/coaches">
              <Button variant="primary" className="gap-2 px-8 py-3">Browse All Coaches →</Button>
            </Link>
          </div>
        </section>

        {/* ══ TESTIMONIALS ══ */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold mb-2">TESTIMONIALS</p>
            <h2 className="text-4xl font-bold mb-4">Real People. Real Results.</h2>
            <p className="text-gray-400">Join professionals who landed their dream roles with AI practice + expert coaching.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* T1 */}
            <div className="glass p-6 rounded-xl">
              <div className="flex mb-3">{[...Array(5)].map((_, i) => <span key={i} className="text-yellow-500">★</span>)}</div>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                "The AI practice helped me nail the basics, then my coach session gave me the edge I needed. Got the Google offer! 🎉"
              </p>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Sarah" className="w-10 h-10 rounded-full bg-white" />
                <div>
                  <p className="font-semibold text-sm">Sarah Chen</p>
                  <p className="text-xs text-gray-400">Software Engineer · Google</p>
                </div>
              </div>
            </div>

            {/* T2 */}
            <div className="glass p-6 rounded-xl">
              <div className="flex mb-3">{[...Array(5)].map((_, i) => <span key={i} className="text-yellow-500">★</span>)}</div>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                "My coach had worked at Amazon and knew exactly what they look for. 3 sessions later, I had the offer."
              </p>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica" alt="Jessica" className="w-10 h-10 rounded-full bg-white" />
                <div>
                  <p className="font-semibold text-sm">Jessica Williams</p>
                  <p className="text-xs text-gray-400">Product Manager · Amazon</p>
                </div>
              </div>
            </div>

            {/* T3 */}
            <div className="glass p-6 rounded-xl">
              <div className="flex mb-3">{[...Array(5)].map((_, i) => <span key={i} className="text-yellow-500">★</span>)}</div>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                "I used the AI every day for 2 weeks, then booked one coach session the day before my interview. Perfect combo!"
              </p>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Raj" alt="Raj" className="w-10 h-10 rounded-full bg-white" />
                <div>
                  <p className="font-semibold text-sm">Raj Patel</p>
                  <p className="text-xs text-gray-400">Senior Engineer · Stripe</p>
                </div>
              </div>
            </div>

            {/* T4 — Coach perspective */}
            <div className="glass p-6 rounded-xl border border-green-500/20">
              <div className="flex mb-3">{[...Array(5)].map((_, i) => <span key={i} className="text-yellow-500">★</span>)}</div>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                "I've coached 50+ candidates through this platform. The AI pre-screens them so when they arrive, we can focus on the hard stuff."
              </p>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Michael" alt="Michael" className="w-10 h-10 rounded-full bg-white" />
                <div>
                  <p className="font-semibold text-sm">Michael Torres</p>
                  <p className="text-xs text-gray-400">Career Coach · Ex-McKinsey</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ FINAL CTA ══ */}
        <section className="container mx-auto px-6 py-20">
          <div className="glass p-12 rounded-3xl text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-10" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Ready to Land Your Dream Job?</h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Start with free AI practice, then supercharge your prep with a real expert coach.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link href="/interview/setup">
                    <Button variant="primary" className="text-lg px-10 py-4">Start Practicing Now</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/signup/candidate">
                      <Button variant="primary" className="text-lg px-10 py-4">Start Practicing Free</Button>
                    </Link>
                    <Link href="/coaches">
                      <Button variant="outline" className="text-lg px-10 py-4">Find a Coach</Button>
                    </Link>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-6">✨ Get 3 Free Mock Interviews · No Card Needed</p>
            </div>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer className="container mx-auto px-6 py-12 border-t border-border mt-20">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold gradient-text">Interview Coach</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI mock interviews + real expert coaches. Land your dream job faster.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/pricing"   className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/coaches"   className="hover:text-primary transition-colors">Find a Coach</Link></li>
                <li><Link href="/jobs"      className="hover:text-primary transition-colors">Browse Jobs</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Coaches</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/signup/coach"    className="hover:text-primary transition-colors">Become a Coach</Link></li>
                <li><Link href="/coach/dashboard" className="hover:text-primary transition-colors">Coach Dashboard</Link></li>
                <li><Link href="/coach/earnings"  className="hover:text-primary transition-colors">Earnings &amp; Payouts</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                <li><Link href="/faq"     className="hover:text-primary transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms"   className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="/about"   className="hover:text-primary transition-colors">About</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 pb-6">
            <a href="#" className="text-gray-400 hover:text-primary"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="text-gray-400 hover:text-primary"><Linkedin className="w-5 h-5" /></a>
            <a href="#" className="text-gray-400 hover:text-primary"><Instagram className="w-5 h-5" /></a>
          </div>
          <div className="text-center text-gray-400 text-sm pt-8 border-t border-border">
            <p>&copy; 2026 Interview Coach. All rights reserved. Powered by Claude AI.</p>
          </div>
        </footer>
      </div>

      <VideoModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} />
    </div>
  )
}
