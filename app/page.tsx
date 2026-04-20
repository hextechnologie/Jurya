'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { motion, useInView } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { ChevronDown, Menu, X, Star } from 'lucide-react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

/* ────────────────────────────────────────── helpers ── */

const ACCENT = '#818CF8'

function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ──────────────────────────────────────── data ── */

const COACHES = [
  {
    initials: 'ML',
    name: 'Marie L.',
    role: "Ancienne présidente de jury — Attaché territorial",
    quote: "Je vous aide à structurer votre discours comme le jury l'attend vraiment.",
    rating: 4.9,
    concours: 'Territorial',
  },
  {
    initials: 'PB',
    name: 'Philippe B.',
    role: 'Ancien jury IRA — Administrateur civil',
    quote: 'Après 20 ans en jury, je sais exactement ce qui fait la différence.',
    rating: 4.8,
    concours: 'IRA',
  },
  {
    initials: 'FE',
    name: 'Fatima E.',
    role: 'Ancienne jurée — Commissaire de police',
    quote: "L'oral se prépare. Je vous montre comment.",
    rating: 5.0,
    concours: 'Police',
  },
]

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    concours: 'Attachée territoriale',
    year: 2025,
    quote: "J'ai passé 6 simulations avant mon oral. Le jour J, rien ne m'a surpris.",
  },
  {
    name: 'Karim B.',
    concours: 'IRA de Lyon',
    year: 2025,
    quote: "Le feedback sur ma structure argumentative m'a fait gagner plusieurs points à l'oral.",
  },
  {
    name: 'Julie M.',
    concours: 'INSP',
    year: 2024,
    quote: "Très exigeant, très proche des conditions réelles. Exactement ce dont j'avais besoin.",
  },
]

const PROGRESS_DATA = [
  { session: '1', score: 11 },
  { session: '2', score: 12 },
  { session: '3', score: 13 },
  { session: '4', score: 14 },
  { session: '5', score: 15 },
]

const PLANS = [
  {
    name: 'Découverte',
    price: 'Gratuit',
    highlight: false,
    perks: ['3 simulations IA offertes', 'Rapport de feedback basique', 'Accès aux fiches thématiques', 'Sans carte bancaire'],
    cta: 'Commencer gratuitement',
    href: '/signup/candidate',
  },
  {
    name: 'Préparation',
    price: '19 ',
    sub: '/ mois',
    highlight: true,
    perks: ['Simulations IA illimitées', 'Feedback détaillé sur chaque réponse', 'Historique & graphiques de progression', 'Accès à toutes les ressources'],
    cta: 'Choisir Préparation',
    href: '/signup/candidate',
  },
  {
    name: 'Premium',
    price: '49 ',
    sub: '/ mois',
    highlight: false,
    perks: ['Tout Préparation inclus', '2 sessions / mois avec un ancien juré', 'Correction du dossier RAEP', 'Priorité de réservation'],
    cta: 'Choisir Premium',
    href: '/signup/candidate',
  },
]

const FAQS = [
  {
    q: 'Comment fonctionne la simulation IA ?',
    a: "Vous choisissez votre concours et lancez une simulation orale. Une IA entraînée sur les grilles de jurys pose des questions réalistes et analyse vos réponses en temps réel. À la fin, vous recevez un rapport détaillé avec vos points forts et axes d'amélioration.",
  },
  {
    q: "Les anciens jurés sont-ils vraiment d'anciens membres de jury ?",
    a: "Oui. Chaque coach est vérifié par notre équipe — nous contrôlons leur parcours professionnel et leur expérience en jury de concours avant validation.",
  },
  {
    q: 'Pour quels concours Jurya est-il disponible ?',
    a: "Attaché territorial, IRA, INSP (ex-ENA), Commissaire de police, Directeur d'hôpital, Agrégation, Magistrature (ENM), CAPES, Administrateur civil, et d'autres en cours d'ajout.",
  },
  {
    q: 'Puis-je utiliser Jurya sur mobile ?',
    a: "Oui. La plateforme est entièrement responsive. Les simulations vocales utilisent le micro de votre téléphone.",
  },
  {
    q: 'Est-ce que mes données sont protégées ?',
    a: "Vos sessions sont chiffrées et stockées de façon sécurisée. Nous ne revendons aucune donnée personnelle. Vous pouvez supprimer votre compte à tout moment.",
  },
  {
    q: "Que se passe-t-il après les 3 simulations gratuites ?",
    a: "Vous pouvez continuer avec un abonnement Préparation ou Premium. Aucun prélèvement automatique à l'issue de la période gratuite.",
  },
]

/* ──────────────────────────────────────── accordion ── */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/10 py-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between text-left gap-4"
      >
        <span className="font-medium text-white/90">{q}</span>
        <ChevronDown
          className="mt-0.5 shrink-0 text-white/50 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          size={18}
        />
      </button>
      {open && (
        <p className="mt-3 text-sm text-white/60 leading-relaxed">{a}</p>
      )}
    </div>
  )
}

/* ──────────────────────────────────────── page ── */

export default function HomePage() {
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div style={{ background: '#0F1629', color: '#E2E8F0', fontFamily: 'Inter, Geist, sans-serif' }} className="min-h-screen">

      {/* ══ NAVBAR ══════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-white/5" style={{ background: 'rgba(15,22,41,0.92)', backdropFilter: 'blur(12px)' }}>
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-semibold tracking-tight text-white">
            Jurya
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/pricing"      className="text-sm text-white/60 hover:text-white transition-colors">Tarifs</Link>
            <Link href="/coaches"      className="text-sm text-white/60 hover:text-white transition-colors">Jurés</Link>
            <Link href="/testimonials" className="text-sm text-white/60 hover:text-white transition-colors">Témoignages</Link>
            <Link href="/faq"          className="text-sm text-white/60 hover:text-white transition-colors">FAQ</Link>
            <LanguageSwitcher />
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                style={{ background: ACCENT }}
              >
                Mon espace
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">Connexion</Link>
                <Link
                  href="/signup/candidate"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                  style={{ background: ACCENT }}
                >
                  Commencer gratuitement
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden rounded-lg border border-white/10 p-2 text-white/70"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 px-6 pb-4 pt-2 space-y-3">
            <Link href="/pricing"      onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/60 hover:text-white">Tarifs</Link>
            <Link href="/coaches"      onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/60 hover:text-white">Jurés</Link>
            <Link href="/testimonials" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/60 hover:text-white">Témoignages</Link>
            <Link href="/faq"          onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/60 hover:text-white">FAQ</Link>
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" className="block text-center text-sm text-white/60 border border-white/10 rounded-lg py-2 hover:border-white/30 transition-colors">Connexion</Link>
              <Link href="/signup/candidate" className="block text-center text-sm font-medium text-white rounded-lg py-2" style={{ background: ACCENT }}>Commencer gratuitement</Link>
            </div>
          </div>
        )}
      </header>

      {/* ══ 1. HERO ═════════════════════════════════════ */}
      <section className="mx-auto max-w-4xl px-6 pt-24 pb-20 text-center">
        <FadeIn>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Ne découvrez pas vos faiblesses{' '}
            <span style={{ color: ACCENT }}>le jour J.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-normal leading-relaxed text-white/60">
            Un jury IA exigeant vous challenge en conditions réelles. Puis d'anciens jurés analysent vos réponses. Vous arrivez le jour J en confiance.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href={user ? '/dashboard' : '/signup/candidate'}
              className="rounded-xl px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
              style={{ background: ACCENT }}
            >
              {user ? 'Mon espace' : 'Commencer gratuitement'}
            </Link>
            <Link
              href="/coaches"
              className="rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
            >
              Voir comment ça marche
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/35">
            ✓ 3 simulations offertes &nbsp;·&nbsp; ✓ Sans carte bancaire &nbsp;·&nbsp; ✓ 2 min pour démarrer
          </p>
        </FadeIn>

        {/* Social proof card */}
        <FadeIn delay={0.3} className="mt-14">
          <div
            className="mx-auto max-w-sm rounded-2xl border border-white/10 p-6 text-left"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-white/50">Votre score</span>
              <span className="text-2xl font-semibold" style={{ color: ACCENT }}>14/20</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              "Belle progression depuis la session 1. Continuez à travailler la clarté de l'exposé introductif."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: ACCENT }}>
                ML
              </div>
              <div>
                <p className="text-xs font-medium text-white/80">Marie L.</p>
                <p className="text-xs text-white/40">Ancienne présidente de jury · jeudi 14h</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ══ 2. COMMENT ÇA MARCHE ════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <FadeIn className="text-center mb-14">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest" style={{ color: ACCENT }}>Comment ça marche</p>
          <h2 className="text-3xl font-semibold">Trois étapes, une méthode.</h2>
        </FadeIn>

        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { num: '01', title: 'Vous passez votre oral', desc: "L'IA joue le rôle du jury. Questions réalistes, chronométrées, adaptées à votre concours." },
            { num: '02', title: 'Vous recevez un feedback clair', desc: 'Structure, motivation, cohérence, posture — chaque réponse est analysée en détail.' },
            { num: '03', title: 'Vous travaillez avec un expert', desc: "Réservez une session avec un ancien juré pour affiner ce que l'IA ne peut pas voir." },
          ].map((step, i) => (
            <FadeIn key={step.num} delay={i * 0.1}>
              <div className="rounded-2xl border border-white/8 p-8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="mb-4 text-4xl font-semibold" style={{ color: ACCENT }}>{step.num}</p>
                <h3 className="mb-2 text-base font-medium text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{step.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══ 3. POURQUOI JURYA EST DIFFÉRENT ════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <FadeIn className="text-center mb-14">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest" style={{ color: ACCENT }}>Pourquoi Jurya est différent</p>
          <h2 className="text-3xl font-semibold">Ce que les autres ne font pas.</h2>
        </FadeIn>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { label: 'Le livre', vs: "La théorie, mais pas la situation réelle.", jurya: "Jurya vous plonge dans une simulation avec un jury IA qui relance, interrompt, juge.", icon: '📚' },
            { label: 'Un coach généraliste', vs: "À 80 /h, difficile de s'entraîner souvent.", jurya: "Jurya est disponible 24/7, illimité, au prix d'une séance de coaching.", icon: '🕐' },
            { label: 'Un chatbot généraliste', vs: "Ne connaît pas les grilles de jury, ni les concours français.", jurya: "Jurya est formé sur les concours de la fonction publique française.", icon: '🤖' },
          ].map((card, i) => (
            <FadeIn key={card.label} delay={i * 0.1}>
              <div className="rounded-2xl border border-white/8 p-8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-3xl">{card.icon}</span>
                <p className="mt-4 text-xs text-white/40">{card.label}</p>
                <p className="mt-1 text-sm text-white/55 line-through decoration-white/25">{card.vs}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/80">{card.jurya}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══ 4. DES ANCIENS JURÉS À VOS CÔTÉS ══════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <FadeIn className="text-center mb-14">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest" style={{ color: ACCENT }}>Des anciens jurés à vos côtés</p>
          <h2 className="text-3xl font-semibold">Pas des coachs. Des jurés.</h2>
          <p className="mt-4 text-sm text-white/50 max-w-xl mx-auto">
            Ils ont siégé dans les jurys. Ils savent ce qui fait la différence — et ils vous le disent.
          </p>
        </FadeIn>

        <div className="grid gap-6 sm:grid-cols-3">
          {COACHES.map((coach, i) => (
            <FadeIn key={coach.name} delay={i * 0.1}>
              <div className="rounded-2xl border border-white/8 p-6 flex flex-col gap-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: ACCENT }}>
                    {coach.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{coach.name}</p>
                    <p className="text-xs text-white/45">{coach.role}</p>
                  </div>
                </div>
                <p className="text-sm italic text-white/60 leading-relaxed">&ldquo;{coach.quote}&rdquo;</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={12} className={j < Math.floor(coach.rating) ? 'fill-amber-400 text-amber-400' : 'text-white/20'} />
                  ))}
                  <span className="ml-1 text-xs text-white/40">{coach.rating}</span>
                </div>
                <Link
                  href="/coaches"
                  className="mt-auto block text-center rounded-xl border border-white/10 py-2 text-xs font-medium text-white/70 transition hover:border-white/30 hover:text-white"
                >
                  Réserver avec {coach.name.split(' ')[0]}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══ 5. TÉMOIGNAGES ══════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <FadeIn className="text-center mb-14">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest" style={{ color: ACCENT }}>Ils ont réussi leur concours</p>
          <h2 className="text-3xl font-semibold">Des vrais candidats. Des vrais résultats.</h2>
        </FadeIn>

        <div className="grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <div className="rounded-2xl border border-white/8 p-6 flex flex-col gap-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-sm leading-relaxed text-white/70 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-auto">
                  <p className="text-sm font-medium text-white/85">{t.name}</p>
                  <p className="text-xs text-white/40">{t.concours}, {t.year}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══ 6. VOTRE PROGRESSION ════════════════════════ */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <FadeIn className="text-center mb-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest" style={{ color: ACCENT }}>Votre progression, visible</p>
          <h2 className="text-3xl font-semibold">En moyenne, nos candidats gagnent 3 points en 5 sessions.</h2>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="rounded-2xl border border-white/8 p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="mb-4 text-sm text-white/50">Score moyen sur 5 simulations</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={PROGRESS_DATA}>
                <XAxis dataKey="session" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} tickLine={false} label={{ value: 'Session', position: 'insideBottom', offset: -4, fill: 'rgba(255,255,255,0.25)', fontSize: 12 }} />
                <YAxis domain={[8, 20]} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e2a4a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E2E8F0', fontSize: 13 }} />
                <Line type="monotone" dataKey="score" stroke={ACCENT} strokeWidth={2.5} dot={{ fill: ACCENT, r: 4 }} activeDot={{ r: 6, fill: ACCENT }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </FadeIn>
      </section>

      {/* ══ 7. TARIFS ═══════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <FadeIn className="text-center mb-14">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest" style={{ color: ACCENT }}>Tarifs</p>
          <h2 className="text-3xl font-semibold">Simple, transparent, sans surprise.</h2>
        </FadeIn>

        <div className="grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.1}>
              <div
                className="rounded-2xl p-8 flex flex-col gap-5 h-full"
                style={{
                  background: plan.highlight ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.03)',
                  border: plan.highlight ? `1.5px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {plan.highlight && (
                  <span className="self-start rounded-full px-3 py-0.5 text-xs font-medium text-white" style={{ background: ACCENT }}>
                    Le plus populaire
                  </span>
                )}
                <div>
                  <p className="text-sm font-medium text-white/60">{plan.name}</p>
                  <p className="mt-1 text-3xl font-semibold text-white">
                    {plan.price}
                    {plan.sub && <span className="text-sm font-normal text-white/40">{plan.sub}</span>}
                  </p>
                </div>
                <ul className="flex-1 space-y-2">
                  {plan.perks.map(perk => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-white/65">
                      <span style={{ color: ACCENT }}>✓</span> {perk}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className="block text-center rounded-xl py-2.5 text-sm font-medium transition"
                  style={
                    plan.highlight
                      ? { background: ACCENT, color: '#fff' }
                      : { border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)' }
                  }
                >
                  {plan.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══ 8. FAQ ══════════════════════════════════════ */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <FadeIn className="text-center mb-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest" style={{ color: ACCENT }}>FAQ</p>
          <h2 className="text-3xl font-semibold">Questions fréquentes</h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div>
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ══ 9. CTA FINAL ════════════════════════════════ */}
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <FadeIn>
          <h2 className="text-3xl font-semibold leading-snug">
            Le jour J arrive vite.<br />
            <span style={{ color: ACCENT }}>Préparez-le vraiment.</span>
          </h2>
          <p className="mt-4 text-sm text-white/50">Gratuit, sans carte bancaire, 2 minutes pour démarrer.</p>
          <Link
            href={user ? '/dashboard' : '/signup/candidate'}
            className="mt-8 inline-block rounded-xl px-8 py-3.5 text-sm font-medium text-white transition hover:opacity-90"
            style={{ background: ACCENT }}
          >
            {user ? 'Mon espace' : 'Commencer ma première simulation'}
          </Link>
        </FadeIn>
      </section>

      {/* ══ 10. FOOTER ══════════════════════════════════ */}
      <footer className="border-t border-white/8 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-base font-semibold text-white">Jurya</p>
              <p className="mt-1 text-xs text-white/40 max-w-xs">Préparez vos concours oraux avec un jury IA et des anciens jurés de la fonction publique française.</p>
              <a href="mailto:contact@jurya.fr" className="mt-2 block text-xs text-white/40 hover:text-white transition-colors">contact@jurya.fr</a>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs text-white/40">
              <Link href="/pricing"        className="hover:text-white transition-colors">Tarifs</Link>
              <Link href="/coaches"        className="hover:text-white transition-colors">Jurés</Link>
              <Link href="/testimonials"   className="hover:text-white transition-colors">Témoignages</Link>
              <Link href="/faq"            className="hover:text-white transition-colors">FAQ</Link>
              <Link href="/content"        className="hover:text-white transition-colors">Ressources</Link>
              <Link href="/legal/privacy"  className="hover:text-white transition-colors">Confidentialité</Link>
              <Link href="/legal/terms"    className="hover:text-white transition-colors">CGU</Link>
            </div>
          </div>
          <div className="mt-10 flex items-center justify-between">
            <p className="text-xs text-white/25">© {new Date().getFullYear()} Jurya. Tous droits réservés.</p>
            <LanguageSwitcher />
          </div>
        </div>
      </footer>
    </div>
  )
}
