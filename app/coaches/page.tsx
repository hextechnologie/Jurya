'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react'

/* ── concours specialties ─────────────────────────────────── */
const CONCOURS_SPECIALTIES = [
  'ENA',
  'ENM',
  'Agrégation',
  'CAPES',
  'IRA',
  'Attaché territorial',
  'Inspecteur des finances',
  'Commissaire de police',
  'Administrateur civil',
  'Douanes',
  'Trésor public',
  'Santé publique',
] as const

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommandé' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'rating', label: 'Mieux noté' },
] as const

/* ── types ────────────────────────────────────────────────── */
type CoachRow = {
  id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar_url: string | null
  city: string | null
  country: string | null
  coach_profiles: {
    title: string | null
    bio: string | null
    years_experience: number | null
    price_per_hour: number | null
    credits_per_hour: number | null
    rating: number | null
    total_sessions: number | null
    is_verified: boolean | null
    accepting_bookings: boolean | null
    response_time_hours: number | null
  } | null
  coach_specializations: { specialization: string }[]
}

/* ── helper: star display ─────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-yellow-400">
      <Star className="h-4 w-4 fill-yellow-400" />
      <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
    </span>
  )
}

/* ================================================================ */
export default function CoachesPage() {
  const [coaches, setCoaches] = useState<CoachRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300])
  const [minRating, setMinRating] = useState(0)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState<string>('recommended')
  const [filtersOpen, setFiltersOpen] = useState(false)

  /* ── fetch coaches ─────────────────────────────────────── */
  useEffect(() => {
    const fetchCoaches = async () => {
      const { data: cpData, error: cpError } = await supabase
        .from('coach_profiles')
        .select(
          'user_id, title, bio, years_experience, price_per_hour, credits_per_hour, rating, total_sessions, is_verified, accepting_bookings, response_time_hours'
        )
        .eq('accepting_bookings', true)

      if (cpError || !cpData || cpData.length === 0) {
        setLoading(false)
        return
      }

      const userIds = cpData.map((c) => c.user_id)

      const [{ data: profileData }, { data: specsData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, first_name, last_name, email, avatar_url, city, country')
          .in('id', userIds),
        supabase
          .from('coach_specializations')
          .select('coach_id, specialization')
          .in('coach_id', userIds),
      ])

      const merged: CoachRow[] = cpData.map((cp) => {
        const profile = profileData?.find((p) => p.id === cp.user_id)
        const specs = specsData?.filter((s) => s.coach_id === cp.user_id) ?? []
        return {
          id: cp.user_id,
          full_name: profile?.full_name ?? null,
          first_name: profile?.first_name ?? null,
          last_name: profile?.last_name ?? null,
          email: profile?.email ?? null,
          avatar_url: profile?.avatar_url ?? null,
          city: profile?.city ?? null,
          country: profile?.country ?? null,
          coach_profiles: {
            title: cp.title,
            bio: cp.bio,
            years_experience: cp.years_experience,
            price_per_hour: cp.price_per_hour,
            credits_per_hour: cp.credits_per_hour,
            rating: cp.rating,
            total_sessions: cp.total_sessions,
            is_verified: cp.is_verified,
            accepting_bookings: cp.accepting_bookings,
            response_time_hours: cp.response_time_hours,
          },
          coach_specializations: specs.map((s) => ({ specialization: s.specialization })),
        }
      })

      setCoaches(merged)
      setLoading(false)
    }
    fetchCoaches()
  }, [])

  /* ── filter + sort ─────────────────────────────────────── */
  const filteredCoaches = useMemo(() => {
    return coaches
      .filter((c) => {
        const name =
          c.full_name ||
          [c.first_name, c.last_name].filter(Boolean).join(' ') ||
          ''
        const title = c.coach_profiles?.title || ''
        const specs = c.coach_specializations.map((s) => s.specialization)
        const price = c.coach_profiles?.price_per_hour ?? c.coach_profiles?.credits_per_hour ?? 0
        const rating = c.coach_profiles?.rating ?? 0

        const matchesSearch =
          !search ||
          [name, title, ...specs]
            .join(' ')
            .toLowerCase()
            .includes(search.toLowerCase())
        const matchesPrice = price >= priceRange[0] && price <= priceRange[1]
        const matchesRating = rating >= minRating
        const matchesSpecs =
          selectedSpecs.length === 0 ||
          selectedSpecs.some((s) => specs.includes(s))
        const matchesAvailability =
          !availableOnly || c.coach_profiles?.accepting_bookings

        return matchesSearch && matchesPrice && matchesRating && matchesSpecs && matchesAvailability
      })
      .sort((a, b) => {
        const pa = a.coach_profiles?.price_per_hour ?? a.coach_profiles?.credits_per_hour ?? 0
        const pb = b.coach_profiles?.price_per_hour ?? b.coach_profiles?.credits_per_hour ?? 0
        const ra = a.coach_profiles?.rating ?? 0
        const rb = b.coach_profiles?.rating ?? 0
        const sa = a.coach_profiles?.total_sessions ?? 0
        const sb = b.coach_profiles?.total_sessions ?? 0

        if (sortBy === 'price_asc') return pa - pb
        if (sortBy === 'price_desc') return pb - pa
        if (sortBy === 'rating') return rb - ra
        // recommended: verified first, then rating, then sessions
        const va = a.coach_profiles?.is_verified ? 1 : 0
        const vb = b.coach_profiles?.is_verified ? 1 : 0
        return vb - va || rb - ra || sb - sa
      })
  }, [coaches, search, priceRange, minRating, selectedSpecs, availableOnly, sortBy])

  const toggleSpec = (spec: string) =>
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    )

  const resetFilters = () => {
    setSearch('')
    setSelectedSpecs([])
    setPriceRange([0, 300])
    setMinRating(0)
    setAvailableOnly(false)
    setSortBy('recommended')
  }

  /* ── helpers ───────────────────────────────────────────── */
  const getName = (c: CoachRow) =>
    c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Coach'
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  /* ── render ────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-blue-600/10" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300">
            <Sparkles className="h-4 w-4" />
            Coachs certifiés
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Trouvez le coach idéal pour votre oral
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Des anciens membres de jury et coachs certifiés vous accompagnent dans la préparation de vos concours oraux.
          </p>
        </div>
      </section>

      {/* Search + Sort bar */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou spécialité…"
              className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 hover:text-white lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <ArrowUpDown className="h-4 w-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-sm text-white outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-[#0a0a12]">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <span className="text-sm text-gray-500">
            {filteredCoaches.length} coach{filteredCoaches.length !== 1 && 's'}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar filters */}
          <aside
            className={`space-y-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur lg:block ${
              filtersOpen ? 'block' : 'hidden'
            } h-fit`}
          >
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <SlidersHorizontal className="h-5 w-5 text-purple-400" />
                Filtres
              </h2>
              <button onClick={resetFilters} className="text-xs text-purple-400 hover:text-purple-300">
                Réinitialiser
              </button>
            </div>

            {/* Concours specialty */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Spécialité concours</label>
              <div className="flex flex-wrap gap-2">
                {CONCOURS_SPECIALTIES.map((spec) => (
                  <button
                    key={spec}
                    onClick={() => toggleSpec(spec)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      selectedSpecs.includes(spec)
                        ? 'bg-purple-600 text-white'
                        : 'border border-white/10 text-gray-400 hover:border-purple-500/40 hover:text-white'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Prix : {priceRange[0]}€ – {priceRange[1]}€
              </label>
              <input
                type="range"
                min={0}
                max={300}
                step={10}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Min rating */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Note minimale</label>
              <div className="flex gap-2">
                {[0, 3, 3.5, 4, 4.5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                      minRating === r
                        ? 'bg-purple-600 text-white'
                        : 'border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {r === 0 ? 'Tous' : `${r}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="h-4 w-4 accent-purple-500"
              />
              <span className="text-sm text-gray-300">Disponible maintenant</span>
            </label>
          </aside>

          {/* Coach grid */}
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                <p className="mt-4">Chargement des coachs…</p>
              </div>
            ) : filteredCoaches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center text-gray-400">
                <p className="text-lg font-semibold">Aucun coach trouvé</p>
                <p className="mt-1 text-sm">Essayez d&apos;ajuster vos filtres.</p>
                <button
                  onClick={resetFilters}
                  className="mt-4 rounded-lg bg-purple-600/20 px-4 py-2 text-sm text-purple-300 hover:bg-purple-600/30"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCoaches.map((coach) => {
                  const name = getName(coach)
                  const initials = getInitials(name)
                  const price =
                    coach.coach_profiles?.price_per_hour ??
                    coach.coach_profiles?.credits_per_hour ??
                    null
                  const rating = coach.coach_profiles?.rating ?? 0
                  const reviewCount = coach.coach_profiles?.total_sessions ?? 0
                  const specs = coach.coach_specializations.map((s) => s.specialization)
                  const verified = coach.coach_profiles?.is_verified
                  const responseTime = coach.coach_profiles?.response_time_hours

                  return (
                    <div
                      key={coach.id}
                      className="group flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-colors hover:border-purple-500/30"
                    >
                      {/* Avatar + verification */}
                      <div className="mb-4 flex items-start gap-4">
                        <div className="relative flex-shrink-0">
                          {coach.avatar_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={coach.avatar_url}
                              alt={name}
                              className="h-16 w-16 rounded-full border-2 border-purple-500/40 object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-xl font-bold">
                              {initials}
                            </div>
                          )}
                          {verified && (
                            <CheckCircle2 className="absolute -bottom-1 -right-1 h-5 w-5 fill-blue-500 text-[#0a0a12]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold">{name}</h3>
                          <p className="truncate text-sm text-gray-400">
                            {coach.coach_profiles?.title ||
                              `Coach spécialisé ${specs[0] || 'concours'}`}
                          </p>
                          {rating > 0 && (
                            <div className="mt-1 flex items-center gap-2">
                              <Stars rating={rating} />
                              <span className="text-xs text-gray-500">
                                ({reviewCount} session{reviewCount !== 1 && 's'})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Specialties */}
                      {specs.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {specs.slice(0, 3).map((spec) => (
                            <span
                              key={spec}
                              className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs text-purple-300"
                            >
                              {spec}
                            </span>
                          ))}
                          {specs.length > 3 && (
                            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-gray-500">
                              +{specs.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bio excerpt */}
                      {coach.coach_profiles?.bio && (
                        <p className="mb-4 line-clamp-2 text-sm text-gray-400">
                          {coach.coach_profiles.bio}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="mt-auto flex items-center gap-4 border-t border-white/5 pt-4 text-xs text-gray-500">
                        {responseTime != null && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Répond en ~{responseTime}h
                          </span>
                        )}
                        {reviewCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {reviewCount} sessions
                          </span>
                        )}
                      </div>

                      {/* Price + CTA */}
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xl font-bold text-white">
                          {price != null ? `${price}€/h` : 'Sur devis'}
                        </p>
                        <Link href={`/book/${coach.id}`}>
                          <Button variant="primary" className="!py-2 !px-5 !text-sm">
                            Prendre RDV
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Devenir coach CTA */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold">Vous êtes ancien membre de jury&nbsp;?</h2>
          <p className="mt-3 text-gray-400">
            Rejoignez Jurya en tant que coach et aidez des candidats à réussir leurs oraux de concours.
          </p>
          <Link href="/coaching/onboarding">
            <Button variant="primary" className="mt-6">
              Devenir coach sur Jurya
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react'

type RealCoach = {
  id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar_url: string | null
  city: string | null
  country: string | null
  coach_profiles: {
    title: string | null
    bio: string | null
    years_experience: number | null
    credits_per_hour: number | null
    is_verified: boolean | null
  } | null
  coach_specializations: { specialization: string }[]
}

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<RealCoach[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [maxPrice, setMaxPrice] = useState(500)
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    const fetchCoaches = async () => {
      // Step 1: get all coach_profiles (public table, no RLS issues)
      const { data: cpData, error: cpError } = await supabase
        .from('coach_profiles')
        .select('user_id, title, bio, years_experience, credits_per_hour, is_verified')

      if (cpError || !cpData || cpData.length === 0) { setLoading(false); return }

      const userIds = cpData.map((c) => c.user_id)

      // Step 2: get profile rows for those user ids
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name, email, avatar_url, city, country')
        .in('id', userIds)

      // Step 3: get specializations for those coaches
      const { data: specsData } = await supabase
        .from('coach_specializations')
        .select('coach_id, specialization')
        .in('coach_id', userIds)

      // Step 4: merge into RealCoach shape
      const merged: RealCoach[] = cpData.map((cp) => {
        const profile = profileData?.find((p) => p.id === cp.user_id)
        const specs = specsData?.filter((s) => s.coach_id === cp.user_id) ?? []
        return {
          id: cp.user_id,
          full_name: profile?.full_name ?? null,
          first_name: profile?.first_name ?? null,
          last_name: profile?.last_name ?? null,
          email: profile?.email ?? null,
          avatar_url: profile?.avatar_url ?? null,
          city: profile?.city ?? null,
          country: profile?.country ?? null,
          coach_profiles: {
            title: cp.title,
            bio: cp.bio,
            years_experience: cp.years_experience,
            credits_per_hour: cp.credits_per_hour,
            is_verified: cp.is_verified,
          },
          coach_specializations: specs.map((s) => ({ specialization: s.specialization })),
        }
      })

      setCoaches(merged)
      setLoading(false)
    }
    fetchCoaches()
  }, [])

  const filteredCoaches = useMemo(() => {
    return coaches
      .filter((coach) => {
        const name = coach.full_name || [coach.first_name, coach.last_name].filter(Boolean).join(' ') || 'Membre de jury'
        const title = coach.coach_profiles?.title || ''
        const specs = coach.coach_specializations.map((s) => s.specialization)
        const credits = coach.coach_profiles?.credits_per_hour ?? 0

        const matchesSearch = [name, title, ...specs].join(' ').toLowerCase().includes(search.toLowerCase())
        const matchesPrice = credits <= maxPrice
        const matchesSpecs = selectedSpecs.length === 0 || selectedSpecs.every((s) => specs.includes(s))

        return matchesSearch && matchesPrice && matchesSpecs
      })
      .sort((a, b) => {
        if (sortBy === 'price') return (a.coach_profiles?.credits_per_hour ?? 0) - (b.coach_profiles?.credits_per_hour ?? 0)
        if (sortBy === 'experience') return (b.coach_profiles?.years_experience ?? 0) - (a.coach_profiles?.years_experience ?? 0)
        return 0
      })
  }, [coaches, search, maxPrice, selectedSpecs, sortBy])

  const toggleSpec = (spec: string) => {
    setSelectedSpecs((prev) => prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec])
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour au tableau de bord
        </Link>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">Trouvez votre membre de jury</span>
            </div>
            <h1 className="text-4xl font-bold">Trouvez votre membre de jury</h1>
            <p className="mt-2 text-gray-400">Trouvez l'ancien membre de jury idéal pour vous préparer à votre concours</p>
          </div>

          <div className="flex w-full max-w-xl items-center gap-2 rounded-2xl border border-border bg-card/70 px-4 py-3">
            <Search className="h-5 w-5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom, spécialité ou concours" className="w-full bg-transparent text-white outline-none" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Card className="h-fit bg-card/80 backdrop-blur">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Filtres</h2>
            </div>

            <div className="space-y-5 text-sm">
              <div>
                <label className="mb-2 block text-gray-300">Crédits jusqu'à {maxPrice}</label>
                <input type="range" min="50" max="500" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-primary" />
              </div>

              <div>
                <label className="mb-2 block text-gray-300">Spécialisations</label>
                <div className="flex flex-wrap gap-2">
                  {marketplaceSpecializations.map((spec) => (
                    <button key={spec} type="button" onClick={() => toggleSpec(spec)} className={`rounded-full px-3 py-1.5 text-xs ${selectedSpecs.includes(spec) ? 'bg-primary text-white' : 'border border-border text-gray-300'}`}>
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-gray-300">Trier par</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white">
                  <option value="newest">Plus récent</option>
                  <option value="price">Prix (croissant)</option>
                  <option value="experience">Plus d'expérience</option>
                </select>
              </div>
            </div>
          </Card>

          <div>
            {loading ? (
              <div className="py-20 text-center text-gray-400">Chargement des membres de jury...</div>
            ) : filteredCoaches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-20 text-center text-gray-400">
                <p className="text-lg font-semibold mb-2">Aucun membre de jury trouvé</p>
                <p className="text-sm">Essayez d'ajuster vos filtres ou revenez plus tard.</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredCoaches.map((coach) => {
                  const name = coach.full_name || [coach.first_name, coach.last_name].filter(Boolean).join(' ') || 'Membre de jury'
                  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                  const creditsPerHour = coach.coach_profiles?.credits_per_hour
                  const specs = coach.coach_specializations.map((s) => s.specialization)

                  return (
                    <Card key={coach.id} className="h-full bg-card/80 backdrop-blur border-primary/10 flex flex-col">
                      <div className="mb-4 flex flex-col items-center gap-3">
                        {coach.avatar_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={coach.avatar_url} alt={name} className="w-20 h-20 rounded-full object-cover border-2 border-primary/40" />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white border-2 border-primary/40">
                            {initials}
                          </div>
                        )}
                        <h2 className="text-xl font-bold text-center">{name}</h2>
                      </div>
                      <p className="mt-1 text-sm text-gray-400 text-center">{coach.coach_profiles?.title || 'Membre de jury'}</p>

                      {(coach.city || coach.country) && (
                        <p className="mt-1 text-xs text-gray-500">{[coach.city, coach.country].filter(Boolean).join(', ')}</p>
                      )}

                      {specs.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {specs.slice(0, 3).map((spec) => <Badge key={spec}>{spec}</Badge>)}
                        </div>
                      )}

                      {coach.coach_profiles?.bio && (
                        <p className="mt-3 text-sm text-gray-300 line-clamp-2">{coach.coach_profiles.bio}</p>
                      )}

                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Crédits par heure</p>
                          <p className="text-2xl font-bold text-primary">{creditsPerHour ? `⭐${creditsPerHour}` : 'Contacter'}</p>
                        </div>
                        {coach.coach_profiles?.years_experience && (
                          <p className="text-xs text-gray-400">{coach.coach_profiles.years_experience} ans d'exp.</p>
                        )}
                      </div>

                      <div className="mt-4 grid gap-2">
                        <Link href={`/book/${coach.id}`}>
                          <Button variant="primary" fullWidth>Réserver une session</Button>
                        </Link>
                        <Link href={`/coaches/${coach.id}`}>
                          <Button variant="outline" fullWidth>Voir le profil</Button>
                        </Link>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
