'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import {
  ArrowRight,
  CheckCircle2,
  Quote,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

/* ── hardcoded data ───────────────────────────────────────── */
const STATS = [
  { label: 'Taux de réussite', value: 87, suffix: '%' },
  { label: 'Candidats préparés', value: 2400, suffix: '+' },
  { label: 'Satisfaction', value: 4.8, suffix: '/5' },
]

const TESTIMONIALS = [
  {
    name: 'Marie L.',
    concours: 'INSP',
    year: 2025,
    quote:
      "Grâce à Jurya, j'ai pu m'entraîner dans des conditions proches du réel. Les retours de l'IA sont pertinents et m'ont permis de corriger mes tics de langage.",
    rating: 5,
    verified: true,
    avatar: 'ML',
  },
  {
    name: 'Karim B.',
    concours: 'Agrégation de droit',
    year: 2025,
    quote:
      "Le simulateur d'oral est bluffant. J'ai passé mon agreg avec une note de 16/20 à l'oral après 3 semaines de préparation intensive sur Jurya.",
    rating: 5,
    verified: true,
    avatar: 'KB',
  },
  {
    name: 'Sophie M.',
    concours: 'IRA de Bastia',
    year: 2024,
    quote:
      "Mon coach m'a aidée à structurer mes réponses et à gérer le stress. Je recommande à 100% pour tout candidat aux concours administratifs.",
    rating: 5,
    verified: true,
    avatar: 'SM',
  },
  {
    name: 'Thomas D.',
    concours: 'Commissaire de police',
    year: 2025,
    quote:
      "Les mises en situation sont très réalistes. L'IA pose des questions de relance comme un vrai jury, ce qui m'a préparé aux imprévus.",
    rating: 4,
    verified: true,
    avatar: 'TD',
  },
  {
    name: 'Fatima E.',
    concours: 'Attaché territorial',
    year: 2024,
    quote:
      "Jurya m'a permis de m'exercer à tout moment, même tard le soir. Le rapport de performance après chaque session est très complet.",
    rating: 5,
    verified: false,
    avatar: 'FE',
  },
  {
    name: 'Lucas M.',
    concours: 'ENM',
    year: 2025,
    quote:
      "Excellent outil de préparation. Le feedback sur la structure argumentative m'a fait gagner plusieurs points à l'oral.",
    rating: 5,
    verified: true,
    avatar: 'LM',
  },
]

const BEFORE_AFTER = [
  { name: 'Marie L.', before: '9/20', after: '16/20', concours: 'ENA' },
  { name: 'Karim B.', before: '11/20', after: '17/20', concours: 'Agrégation' },
  { name: 'Sophie M.', before: '10/20', after: '15/20', concours: 'IRA' },
]

const PASS_RATES = [
  { concours: 'ENA', rate: 89 },
  { concours: 'ENM', rate: 85 },
  { concours: 'Agrégation', rate: 82 },
  { concours: 'CAPES', rate: 91 },
  { concours: 'IRA', rate: 88 },
  { concours: 'Attaché', rate: 86 },
  { concours: 'Police', rate: 84 },
]

const BAR_COLORS = ['#8b5cf6', '#7c3aed', '#6d28d9', '#3b82f6', '#2563eb', '#8b5cf6', '#7c3aed']

/* ── animated counter ─────────────────────────────────────── */
function AnimatedCounter({
  target,
  suffix,
  duration = 2000,
}: {
  target: number
  suffix: string
  duration?: number
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = Date.now()
          const tick = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(target * eased * 10) / 10)
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  const display = Number.isInteger(target) ? Math.round(count).toLocaleString('fr-FR') : count.toFixed(1)

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  )
}

/* ── stars ─────────────────────────────────────────────────── */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
          }`}
        />
      ))}
    </div>
  )
}

/* ================================================================ */
export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* ── Hero stats ────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-blue-600/10" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Nos candidats réussissent
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Des milliers de candidats ont amélioré leurs performances orales grâce à Jurya.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
              >
                <p className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-sm text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex items-center gap-3">
          <Quote className="h-6 w-6 text-purple-400" />
          <h2 className="text-3xl font-bold">Témoignages</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              {/* Header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-sm font-bold">
                  {t.avatar}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{t.name}</p>
                  <p className="truncate text-xs text-gray-400">
                    {t.concours} — {t.year}
                  </p>
                </div>
                {t.verified && (
                  <CheckCircle2 className="ml-auto h-5 w-5 flex-shrink-0 text-green-400" />
                )}
              </div>

              {/* Quote */}
              <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-300">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Rating + badge */}
              <div className="flex items-center justify-between">
                <StarRating rating={t.rating} />
                {t.verified && (
                  <span className="text-xs text-green-400">Vérifié ✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Before / After ────────────────────────────────── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-10 flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-blue-400" />
            <h2 className="text-3xl font-bold">Avant Jurya → Après Jurya</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {BEFORE_AFTER.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur"
              >
                <p className="mb-1 font-semibold">{item.name}</p>
                <p className="text-xs text-gray-500">{item.concours}</p>
                <div className="mt-4 flex items-center justify-center gap-4">
                  <div>
                    <p className="text-2xl font-bold text-red-400">{item.before}</p>
                    <p className="text-xs text-gray-500">Avant</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-400">{item.after}</p>
                    <p className="text-xs text-gray-500">Après</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pass rate chart ───────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10 flex items-center gap-3">
          <Users className="h-6 w-6 text-purple-400" />
          <h2 className="text-3xl font-bold">Taux de réussite par concours</h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={PASS_RATES} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <XAxis dataKey="concours" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{
                  background: '#1e1e2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#fff',
                }}
                formatter={(value: number) => [`${value}%`, 'Taux de réussite']}
              />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                {PASS_RATES.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold">Prêt à réussir votre concours&nbsp;?</h2>
          <p className="mt-3 text-gray-400">
            Rejoignez les milliers de candidats qui ont amélioré leurs résultats avec Jurya.
          </p>
          <Link href="/pricing">
            <Button variant="primary" className="mt-6">
              Commencez votre préparation <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
