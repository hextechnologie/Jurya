'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui'
import { Sparkles, TrendingUp, Play, Menu, X, Twitter, Linkedin, Instagram, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { VideoModal } from '@/components/VideoModal'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const demoMessages = [
  { role: 'ai',    label: 'Jury 🎓',     text: 'Présentez votre parcours et vos motivations.' },
  { role: 'user',  label: 'Vous',        text: 'Après 5 ans en collectivité, j\'ai souhaité évoluer vers...' },
  { role: 'ai',    label: 'Jury 🎓',     text: 'Note : 4/5 — Exposé structuré, motivation claire.' },
  { role: 'coach', label: 'Coach 👨‍💼', text: 'Bon début ! Pensez à citer le cadre réglementaire.' },
]

const STATS = [
  { icon: '🎓', value: 'IA Jury',     label: 'Simulation 24/7' },
  { icon: '👨‍💼', value: '50+',        label: 'Membres de jury' },
  { icon: '📋', value: '5+',          label: 'Concours couverts' },
  { icon: '⭐', value: '4.9/5',       label: 'Note moyenne' },
  { icon: '🏆', value: '500+',        label: 'Candidats préparés' },
]

const MOCK_COACHES = [
  {
    name: 'Marie Dupont',
    title: 'Ancienne présidente de jury — Attaché territorial',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MarieDupont&backgroundColor=b6e3f4',
    tags: ['Territorial', 'Catégorie A', 'Grand oral'],
    rating: 4.9,
    sessions: 142,
    price: 80,
  },
  {
    name: 'Philippe Martin',
    title: 'Ancien jury IRA — Administrateur civil',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PhilippeMartin&backgroundColor=c0aede',
    tags: ['État', 'IRA', 'Mise en situation'],
    rating: 4.8,
    sessions: 98,
    price: 100,
  },
  {
    name: 'Fatima Benali',
    title: 'Avocate — Préparatrice CRFPA',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FatimaBenali&backgroundColor=d1d4f9',
    tags: ['CRFPA', 'Grand oral', 'Droit public'],
    rating: 5.0,
    sessions: 201,
    price: 90,
  },
]

const AI_STEPS = [
  { step: '1', title: 'Choisissez votre concours', desc: 'Sélectionnez le concours, la catégorie et le type d\'épreuve. L\'IA s\'adapte à la rubrique du jury.' },
  { step: '2', title: 'Simulez l\'oral',           desc: 'Répondez en temps réel à un jury IA qui pose des questions réalistes et structurées.' },
  { step: '3', title: 'Recevez votre rapport',     desc: 'Consultez votre note /5 sur 4 axes, avec des citations de votre transcription.' },
  { step: '4', title: 'Progressez et recommencez', desc: 'Suivez vos scores, identifiez vos points faibles et entraînez-vous jusqu\'à être prêt.' },
]

const COACH_STEPS = [
  { step: '1', title: 'Parcourez les membres de jury', desc: 'Filtrez par concours, spécialité, tarif et avis. Lisez les retours d\'anciens candidats.' },
  { step: '2', title: 'Réservez une session',          desc: 'Choisissez une date, un créneau et une durée. Paiement sécurisé en ligne.' },
  { step: '3', title: 'Session 1-à-1 en direct',       desc: 'Passez votre oral en visio avec un ancien membre de jury. Simulation en conditions réelles.' },
  { step: '4', title: 'Recevez un feedback expert',     desc: 'Rapport personnalisé avec axes d\'amélioration concrets et prochaines étapes.' },
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
              <span className="text-2xl font-bold gradient-text">Jurya</span>
            </div>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/pricing"  className="text-sm text-gray-300 hover:text-primary transition-colors">Tarifs</Link>
              <Link href="/coaches"  className="text-sm text-gray-300 hover:text-primary transition-colors">Membres de jury</Link>
              <Link href="/fr/calendrier" className="text-sm text-gray-300 hover:text-primary transition-colors">Calendrier</Link>
              <Link href="/content"  className="text-sm text-gray-300 hover:text-primary transition-colors">Ressources</Link>
              <Link href="/testimonials" className="text-sm text-gray-300 hover:text-primary transition-colors">Témoignages</Link>
              <Link href="/faq"      className="text-sm text-gray-300 hover:text-primary transition-colors">FAQ</Link>
              <LanguageSwitcher />
              {user ? (
                <Link href="/dashboard">
                  <Button variant="primary">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline">Connexion</Button>
                  </Link>
                  {/* Get Started dropdown */}
                  <div className="relative" ref={getStartedRef}>
                    <button
                      onClick={() => setGetStartedOpen((v) => !v)}
                      className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                    >
                      Commencer
                      <ChevronDown className={`w-4 h-4 transition-transform ${getStartedOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {getStartedOpen && (
                      <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50" style={{ background: '#111827' }}>
                        <Link href="/signup/candidate" onClick={() => setGetStartedOpen(false)}>
                          <div className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer">
                            <p className="text-sm font-semibold text-white">🎓 Simuler un oral</p>
                            <p className="text-xs text-gray-400 mt-0.5">Entraînez-vous gratuitement</p>
                          </div>
                        </Link>
                        <div className="border-t border-white/10" />
                        <Link href="/signup/coach" onClick={() => setGetStartedOpen(false)}>
                          <div className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer">
                            <p className="text-sm font-semibold text-white">👨‍💼 Devenir membre de jury</p>
                            <p className="text-xs text-gray-400 mt-0.5">Monétisez votre expertise</p>
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
              <Link href="/pricing"  className="block text-gray-300 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Tarifs</Link>
              <Link href="/coaches"  className="block text-gray-300 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Membres de jury</Link>
              <Link href="/fr/calendrier" className="block text-gray-300 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Calendrier</Link>
              <Link href="/content"  className="block text-gray-300 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Ressources</Link>
              <Link href="/testimonials" className="block text-gray-300 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Témoignages</Link>
              <Link href="/faq"      className="block text-gray-300 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/signup/candidate" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" fullWidth>🎓 Simuler un oral</Button>
                </Link>
                <Link href="/signup/coach" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" fullWidth>👨‍💼 Devenir membre de jury</Button>
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
                Préparez vos concours oraux avec{' '}
                <span className="gradient-text">un jury IA + des membres de jury experts</span>
              </h1>
              <p className="text-xl text-gray-400 mb-8 animate-fadeIn leading-relaxed">
                Simulez vos oraux de concours avec une IA qui joue le rôle du jury, puis réservez une session avec un ancien membre de jury. Feedback structuré, progression mesurée, préparation ciblée.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fadeIn mb-5">
                {user ? (
                  <Link href="/dashboard">
                    <Button variant="primary" className="text-lg px-8 py-4 w-full sm:w-auto">Tableau de bord</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/signup/candidate">
                      <Button variant="primary" className="text-lg px-8 py-4 w-full sm:w-auto">Commencer gratuitement</Button>
                    </Link>
                    <Link href="/coaches">
                      <Button variant="outline" className="text-lg px-8 py-4 w-full sm:w-auto">Trouver un membre de jury</Button>
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
                <span className="text-sm font-medium">Voir la démo</span>
              </button>

              {/* Trust badges */}
              <div className="flex flex-col items-center lg:items-start gap-1">
                <p className="text-sm text-gray-500">✨ 3 simulations gratuites · Sans carte bancaire</p>
                <p className="text-sm text-gray-500">👨‍💼 50+ membres de jury disponibles</p>
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
                        <p className="text-sm font-semibold text-white">Simulation jury IA + Feedback expert</p>
                        <p className="text-xs text-gray-400">Aperçu de l’oral simulé</p>
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
          <h2 className="text-4xl font-bold text-center mb-4">Pourquoi choisir Jurya</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            La seule plateforme qui combine simulation IA illimitée avec du coaching par d’anciens membres de jury — pour arriver prêt le jour J.
          </p>
          <div className="grid md:grid-cols-3 gap-8">

            {/* AI Practice */}
            <div className="glass p-8 rounded-2xl animate-fadeIn">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 text-3xl">🎓</div>
              <h3 className="text-xl font-bold mb-3">Simulation IA du jury 🎓</h3>
              <p className="text-gray-400 mb-4">
                Entraînez-vous 24/7 avec une IA qui adapte ses questions à votre concours, votre catégorie et la rubrique du jury. Feedback immédiat et structuré après chaque réponse.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✓ Analyse de la structure de l’exposé</p>
                <p>✓ Évaluation motivation &amp; cohérence</p>
                <p>✓ Détection des tics de langage</p>
                <p>✓ Simulations illimitées</p>
              </div>
            </div>

            {/* Human Coaches */}
            <div className="glass p-8 rounded-2xl animate-fadeIn border border-primary/30 relative" style={{ animationDelay: '0.1s' }}>
              <span className="absolute top-4 right-4 text-xs font-bold rounded-full bg-primary/20 border border-primary/30 px-2.5 py-0.5 text-primary">NOUVEAU</span>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))', border: '1px solid rgba(16,185,129,0.3)' }}>👨‍💼</div>
              <h3 className="text-xl font-bold mb-3">Membres de jury experts 👨‍💼</h3>
              <p className="text-gray-400 mb-4">
                Réservez des sessions 1-à-1 avec d’anciens membres de jury. Conseils personnalisés, feedback en direct et préparation ciblée impossible à obtenir avec l’IA seule.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✓ Anciens membres de jury de concours</p>
                <p>✓ Sessions vidéo en direct</p>
                <p>✓ Correction du dossier RAEP</p>
                <p>✓ Coaching sur la posture et la voix</p>
              </div>
            </div>

            {/* Track & Improve */}
            <div className="glass p-8 rounded-2xl animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Suivez votre progression 📈</h3>
              <p className="text-gray-400 mb-4">
                Consultez vos progrès sur l’ensemble de vos simulations IA et sessions avec un membre de jury. Visualisez l’évolution de vos notes et identifiez vos axes d’amélioration.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✓ Analytique IA + jury combinée</p>
                <p>✓ Graphiques de progression</p>
                <p>✓ Plan de préparation personnalisé</p>
                <p>✓ Historique des sessions</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ══ */}
        <section className="container mx-auto px-6 py-20 bg-card/30 rounded-3xl">
          <div className="text-center mb-10">
            <p className="text-primary text-sm font-semibold mb-2">COMMENT ÇA MARCHE</p>
            <h2 className="text-4xl font-bold mb-4">Deux façons de se préparer</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Utilisez la simulation IA, réservez une session avec un membre de jury, ou combinez les deux pour des résultats optimaux.
            </p>
            {/* Tab bar */}
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-1">
              <button
                onClick={() => setHowItWorksTab('ai')}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${howItWorksTab === 'ai' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                🎓 Simulation IA
              </button>
              <button
                onClick={() => setHowItWorksTab('coach')}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${howItWorksTab === 'coach' ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                style={howItWorksTab === 'coach' ? { background: '#059669' } : {}}
              >
                👨‍💼 Session avec un jury
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
            <p className="text-primary text-sm font-semibold mb-2">MEMBRES DE JURY</p>
            <h2 className="text-4xl font-bold mb-4">Préparez-vous avec les meilleurs 👨‍💼</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Nos membres de jury ont accompagné des centaines de candidats vers la réussite.
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
                  <span className="text-purple-400 font-semibold">à partir de {coach.price}€/sess</span>
                </div>
                <Link href="/coaches">
                  <Button variant="outline" fullWidth className="text-sm">Voir le profil</Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/coaches">
              <Button variant="primary" className="gap-2 px-8 py-3">Voir tous les membres de jury →</Button>
            </Link>
          </div>
        </section>

        {/* ══ TESTIMONIALS ══ */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold mb-2">TÉMOIGNAGES</p>
            <h2 className="text-4xl font-bold mb-4">Des candidats. Des résultats.</h2>
            <p className="text-gray-400">Rejoignez les candidats qui ont réussi leur concours grâce à la simulation IA + le coaching expert.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* T1 */}
            <div className="glass p-6 rounded-xl">
              <div className="flex mb-3">{[...Array(5)].map((_, i) => <span key={i} className="text-yellow-500">★</span>)}</div>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                "La simulation IA m’a permis de travailler les bases, puis ma session avec un ancien jury m’a donné l’avantage. Admise rédactrice territoriale ! 🎉"
              </p>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Sarah" className="w-10 h-10 rounded-full bg-white" />
                <div>
                  <p className="font-semibold text-sm">Amina K.</p>
                  <p className="text-xs text-gray-400">Rédactrice territoriale</p>
                </div>
              </div>
            </div>

            {/* T2 */}
            <div className="glass p-6 rounded-xl">
              <div className="flex mb-3">{[...Array(5)].map((_, i) => <span key={i} className="text-yellow-500">★</span>)}</div>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                "Mon coach avait siégé dans un jury d’attaché et savait exactement ce qu’ils attendent. 3 sessions plus tard, j’avais mon concours."
              </p>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica" alt="Jessica" className="w-10 h-10 rounded-full bg-white" />
                <div>
                  <p className="font-semibold text-sm">Youssef M.</p>
                  <p className="text-xs text-gray-400">Attaché territorial</p>
                </div>
              </div>
            </div>

            {/* T3 */}
            <div className="glass p-6 rounded-xl">
              <div className="flex mb-3">{[...Array(5)].map((_, i) => <span key={i} className="text-yellow-500">★</span>)}</div>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                "J’ai utilisé l’IA tous les jours pendant 2 semaines, puis j’ai réservé une session la veille de mon oral. Combo parfait !"
              </p>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Raj" alt="Raj" className="w-10 h-10 rounded-full bg-white" />
                <div>
                  <p className="font-semibold text-sm">Claire D.</p>
                  <p className="text-xs text-gray-400">Admise IRA Nantes</p>
                </div>
              </div>
            </div>

            {/* T4 — Coach perspective */}
            <div className="glass p-6 rounded-xl border border-green-500/20">
              <div className="flex mb-3">{[...Array(5)].map((_, i) => <span key={i} className="text-yellow-500">★</span>)}</div>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                "J’ai coaché 50+ candidats sur cette plateforme. L’IA les prépare en amont, donc en session on va droit à l’essentiel."
              </p>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Michael" alt="Michael" className="w-10 h-10 rounded-full bg-white" />
                <div>
                  <p className="font-semibold text-sm">Marc L.</p>
                  <p className="text-xs text-gray-400">Ancien président de jury · Catégorie A</p>
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
              <h2 className="text-4xl font-bold mb-4">Prêt(e) à réussir votre concours ?</h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Commencez par la simulation IA gratuite, puis boostez votre préparation avec un ancien membre de jury.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link href="/interview/setup">
                    <Button variant="primary" className="text-lg px-10 py-4">Commencer la simulation</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/signup/candidate">
                      <Button variant="primary" className="text-lg px-10 py-4">Commencer gratuitement</Button>
                    </Link>
                    <Link href="/coaches">
                      <Button variant="outline" className="text-lg px-10 py-4">Trouver un membre de jury</Button>
                    </Link>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-6">✨ 3 simulations gratuites · Sans carte bancaire</p>
            </div>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer className="container mx-auto px-6 py-12 border-t border-border mt-20">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold gradient-text">Jurya</span>
              </div>
              <p className="text-gray-400 text-sm">
                Simulation d’oraux de concours par IA + coaching par d’anciens membres de jury.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/pricing"       className="hover:text-primary transition-colors">Tarifs</Link></li>
                <li><Link href="/coaches"        className="hover:text-primary transition-colors">Membres de jury</Link></li>
                <li><Link href="/fr/calendrier"  className="hover:text-primary transition-colors">Calendrier des concours</Link></li>
                <li><Link href="/dashboard"      className="hover:text-primary transition-colors">Tableau de bord</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Pour les jurys</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/signup/coach"    className="hover:text-primary transition-colors">Devenir membre de jury</Link></li>
                <li><Link href="/coach/dashboard" className="hover:text-primary transition-colors">Tableau de bord jury</Link></li>
                <li><Link href="/coach/earnings"  className="hover:text-primary transition-colors">Revenus &amp; paiements</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Assistance</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/contact" className="hover:text-primary transition-colors">Nous contacter</Link></li>
                <li><Link href="/faq"     className="hover:text-primary transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Politique de confidentialité</Link></li>
                <li><Link href="/terms"   className="hover:text-primary transition-colors">Conditions d’utilisation</Link></li>
                <li><Link href="/about"   className="hover:text-primary transition-colors">À propos</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 pb-6">
            <a href="#" className="text-gray-400 hover:text-primary"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="text-gray-400 hover:text-primary"><Linkedin className="w-5 h-5" /></a>
            <a href="#" className="text-gray-400 hover:text-primary"><Instagram className="w-5 h-5" /></a>
          </div>
          <div className="text-center text-gray-400 text-sm pt-8 border-t border-border">
            <p>&copy; 2026 Jurya. Tous droits réservés. Propulsé par Claude AI.</p>
          </div>
        </footer>
      </div>

      <VideoModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} />
    </div>
  )
}
