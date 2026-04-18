'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Badge, Button, Card, LoadingSpinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'

type CoachDetail = {
  id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar_url: string | null
  city: string | null
  country: string | null
  linkedin_url: string | null
  professional_headline?: string | null
  about_me?: string | null
  experience_details?: string | null
  education_details?: string | null
  projects_details?: string | null
  skills?: string[] | null
  coach_profiles: {
    title: string | null
    bio: string | null
    years_experience: number | null
    price_per_hour: number | null
    companies: string[] | null
    is_verified: boolean | null
  } | null
  coach_specializations: { specialization: string }[]
  reviews: { id: string; rating: number; comment: string | null; created_at: string; candidate: { full_name: string | null } | null }[]
}

export default function CoachDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [coach, setCoach] = useState<CoachDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchCoach = async () => {
      // Get coach_profile for this user id
      const { data: cp, error: cpError } = await supabase
        .from('coach_profiles')
        .select('user_id, title, bio, years_experience, price_per_hour, companies, is_verified')
        .eq('user_id', id)
        .maybeSingle()

      if (cpError || !cp) { setNotFound(true); setLoading(false); return }

      // Get profile row
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name, email, avatar_url, city, country, linkedin_url, professional_headline, about_me, experience_details, education_details, projects_details, skills')
        .eq('id', id)
        .maybeSingle()

      // Get specializations
      const { data: specs } = await supabase
        .from('coach_specializations')
        .select('specialization')
        .eq('coach_id', id)

      // Get reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at')
        .eq('coach_id', id)

      setCoach({
        id,
        full_name: profile?.full_name ?? null,
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        email: profile?.email ?? null,
        avatar_url: profile?.avatar_url ?? null,
        city: profile?.city ?? null,
        country: profile?.country ?? null,
        linkedin_url: profile?.linkedin_url ?? null,
        professional_headline: (profile as any)?.professional_headline ?? null,
        about_me: (profile as any)?.about_me ?? null,
        experience_details: (profile as any)?.experience_details ?? null,
        education_details: (profile as any)?.education_details ?? null,
        projects_details: (profile as any)?.projects_details ?? null,
        skills: (profile as any)?.skills ?? [],
        coach_profiles: {
          title: cp.title,
          bio: cp.bio,
          years_experience: cp.years_experience,
          price_per_hour: cp.price_per_hour,
          companies: cp.companies,
          is_verified: cp.is_verified,
        },
        coach_specializations: (specs ?? []).map((s) => ({ specialization: s.specialization })),
        reviews: (reviews ?? []).map((r) => ({ ...r, candidate: null })),
      })
      setLoading(false)
    }
    if (id) fetchCoach()
  }, [id])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  if (notFound || !coach) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-xl font-semibold text-gray-300">Coach not found</p>
      <Link href="/coaches"><Button variant="outline">Back to coaches</Button></Link>
    </div>
  )

  const name = coach.full_name || [coach.first_name, coach.last_name].filter(Boolean).join(' ') || 'Coach'
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const specs = coach.coach_specializations.map((s) => s.specialization)
  const avgRating = coach.reviews.length
    ? (coach.reviews.reduce((sum, r) => sum + r.rating, 0) / coach.reviews.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">

        <Link href="/coaches" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to coaches
        </Link>

        <Card className="border-primary/20 bg-card/80">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div>
              <div className="mb-5 h-28 rounded-3xl bg-gradient-to-r from-violet-500 to-blue-500 flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
                {coach.avatar_url ? <img src={coach.avatar_url} alt={name} className="h-full w-full object-cover" /> : initials}
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-4xl font-bold">{name}</h1>
                  <p className="mt-2 text-lg text-gray-300">{coach.coach_profiles?.title || 'Interview Coach'}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                    {avgRating && <span className="text-yellow-300">⭐ {avgRating} ({coach.reviews.length} reviews)</span>}
                    {coach.coach_profiles?.years_experience && <span>{coach.coach_profiles.years_experience} years experience</span>}
                    {(coach.city || coach.country) && <span>{[coach.city, coach.country].filter(Boolean).join(', ')}</span>}
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm text-gray-400">Session price</p>
                  <p className="text-3xl font-bold text-primary">
                    {coach.coach_profiles?.price_per_hour ? `$${coach.coach_profiles.price_per_hour}/hr` : 'Contact'}
                  </p>
                </div>
              </div>
              {specs.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {specs.map((spec) => <Badge key={spec}>{spec}</Badge>)}
                </div>
              )}
            </div>

            <Card className="h-fit border-primary/20 bg-background/50 sticky top-6">
              <p className="mb-3 text-sm text-gray-400">Ready to practice with this coach?</p>
              <Link href={`/book/${coach.id}`}>
                <Button variant="primary" fullWidth>Book a Session</Button>
              </Link>
              {coach.linkedin_url && (
                <a href={coach.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" fullWidth className="mt-3">View LinkedIn</Button>
                </a>
              )}
            </Card>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {(coach.professional_headline || coach.about_me || coach.coach_profiles?.bio) && (
              <Card>
                <h2 className="mb-3 text-2xl font-bold">About</h2>
                {coach.professional_headline && <p className="text-primary font-medium mb-2">{coach.professional_headline}</p>}
                <p className="text-gray-300 whitespace-pre-line">{coach.about_me || coach.coach_profiles?.bio}</p>
              </Card>
            )}

            {coach.experience_details && (
              <Card>
                <h2 className="mb-3 text-2xl font-bold">Experience</h2>
                <p className="text-gray-300 whitespace-pre-line">{coach.experience_details}</p>
              </Card>
            )}

            {coach.education_details && (
              <Card>
                <h2 className="mb-3 text-2xl font-bold">Education</h2>
                <p className="text-gray-300 whitespace-pre-line">{coach.education_details}</p>
              </Card>
            )}

            {coach.projects_details && (
              <Card>
                <h2 className="mb-3 text-2xl font-bold">Projects & Achievements</h2>
                <p className="text-gray-300 whitespace-pre-line">{coach.projects_details}</p>
              </Card>
            )}

            {((coach.skills ?? []).length > 0 || specs.length > 0) && (
              <Card>
                <h2 className="mb-4 text-2xl font-bold">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {([...(coach.skills ?? []), ...specs].filter((v, i, a) => !!v && a.indexOf(v) === i) as string[]).map((skill) => <Badge key={skill}>{skill}</Badge>)}
                </div>
              </Card>
            )}

            {specs.length > 0 && (
              <Card>
                <h2 className="mb-4 text-2xl font-bold">Specializations</h2>
                <div className="flex flex-wrap gap-2">
                  {specs.map((spec) => <Badge key={spec}>{spec}</Badge>)}
                </div>
              </Card>
            )}

            {coach.coach_profiles?.companies && coach.coach_profiles.companies.length > 0 && (
              <Card>
                <h2 className="mb-4 text-2xl font-bold">Companies worked at</h2>
                <div className="flex flex-wrap gap-2">
                  {coach.coach_profiles.companies.map((c) => <Badge key={c} variant="success">{c}</Badge>)}
                </div>
              </Card>
            )}

            <Card>
              <h2 className="mb-4 text-2xl font-bold">Reviews</h2>
              {coach.reviews.length === 0 ? (
                <p className="text-gray-400 text-sm">No reviews yet. Be the first to book a session!</p>
              ) : (
                <div className="space-y-4">
                  {coach.reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-border bg-background/40 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-semibold">{review.candidate?.full_name || 'Candidate'}</p>
                        <span className="text-yellow-300">⭐ {review.rating}</span>
                      </div>
                      {review.comment && <p className="text-gray-300 text-sm">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="mb-4 text-xl font-bold">Quick info</h2>
              <div className="space-y-2 text-sm text-gray-300">
                {coach.coach_profiles?.years_experience && <p>Experience: <span className="text-white font-semibold">{coach.coach_profiles.years_experience} years</span></p>}
                {coach.coach_profiles?.price_per_hour && <p>Rate: <span className="text-primary font-semibold">${coach.coach_profiles.price_per_hour}/hr</span></p>}
                {coach.coach_profiles?.is_verified && <p>✅ Verified coach</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-20 px-4 lg:hidden">
        <Link href={`/book/${coach.id}`}>
          <Button variant="primary" fullWidth className="shadow-lg">Book a Session</Button>
        </Link>
      </div>
    </div>
  )
}
