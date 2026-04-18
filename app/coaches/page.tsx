'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge, Button, Card } from '@/components/ui'
import { marketplaceSpecializations } from '@/lib/coach-marketplace'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Search, SlidersHorizontal, Sparkles } from 'lucide-react'

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
        const name = coach.full_name || [coach.first_name, coach.last_name].filter(Boolean).join(' ') || 'Coach'
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
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">Find a coach</span>
            </div>
            <h1 className="text-4xl font-bold">Browse expert interview coaches</h1>
            <p className="mt-2 text-gray-400">Real coaches registered on the platform.</p>
          </div>

          <div className="flex w-full max-w-xl items-center gap-2 rounded-2xl border border-border bg-card/70 px-4 py-3">
            <Search className="h-5 w-5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search coach, title, or specialization" className="w-full bg-transparent text-white outline-none" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Card className="h-fit bg-card/80 backdrop-blur">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Filters</h2>
            </div>

            <div className="space-y-5 text-sm">
              <div>
                <label className="mb-2 block text-gray-300">Credits up to {maxPrice}</label>
                <input type="range" min="50" max="500" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-primary" />
              </div>

              <div>
                <label className="mb-2 block text-gray-300">Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {marketplaceSpecializations.map((spec) => (
                    <button key={spec} type="button" onClick={() => toggleSpec(spec)} className={`rounded-full px-3 py-1.5 text-xs ${selectedSpecs.includes(spec) ? 'bg-primary text-white' : 'border border-border text-gray-300'}`}>
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-gray-300">Sort by</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white">
                  <option value="newest">Newest</option>
                  <option value="price">Price (low to high)</option>
                  <option value="experience">Most experience</option>
                </select>
              </div>
            </div>
          </Card>

          <div>
            {loading ? (
              <div className="py-20 text-center text-gray-400">Loading coaches...</div>
            ) : filteredCoaches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-20 text-center text-gray-400">
                <p className="text-lg font-semibold mb-2">No coaches found</p>
                <p className="text-sm">Try adjusting your filters or check back later as more coaches join.</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredCoaches.map((coach) => {
                  const name = coach.full_name || [coach.first_name, coach.last_name].filter(Boolean).join(' ') || 'Coach'
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
                      <p className="mt-1 text-sm text-gray-400 text-center">{coach.coach_profiles?.title || 'Interview Coach'}</p>

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
                          <p className="text-xs text-gray-500">Credits per hour</p>
                          <p className="text-2xl font-bold text-primary">{creditsPerHour ? `⭐${creditsPerHour}` : 'Contact'}</p>
                        </div>
                        {coach.coach_profiles?.years_experience && (
                          <p className="text-xs text-gray-400">{coach.coach_profiles.years_experience} yrs exp</p>
                        )}
                      </div>

                      <div className="mt-4 grid gap-2">
                        <Link href={`/book/${coach.id}`}>
                          <Button variant="primary" fullWidth>Book Session</Button>
                        </Link>
                        <Link href={`/coaches/${coach.id}`}>
                          <Button variant="outline" fullWidth>View Profile</Button>
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
