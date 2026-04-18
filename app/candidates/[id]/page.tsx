'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Badge, Button, Card, LoadingSpinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'

type CandidateProfile = {
  id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  city: string | null
  country: string | null
  linkedin_url: string | null
  professional_headline: string | null
  about_me: string | null
  experience_details: string | null
  education_details: string | null
  projects_details: string | null
  skills: string[] | null
  current_status: string | null
  status_detail: string | null
  target_job_role: string | null
  experience_level: string | null
}

export default function CandidatePublicProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, last_name, avatar_url, city, country, linkedin_url, professional_headline, about_me, experience_details, education_details, projects_details, skills, current_status, status_detail, target_job_role, experience_level')
        .eq('id', id)
        .maybeSingle()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setProfile(data as CandidateProfile)
      setLoading(false)
    }

    if (id) fetchProfile()
  }, [id])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-white">
        <p className="text-xl font-semibold">Candidate profile not found</p>
        <Link href="/coach/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
      </div>
    )
  }

  const name = profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Candidate'
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-background px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/coach/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <Card className="border-primary/20 bg-card/80">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={profile.avatar_url} alt={name} className="w-20 h-20 rounded-full object-cover border-2 border-primary/40" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-2xl font-bold border-2 border-primary/40">
                  {initials}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">{name}</h1>
                {profile.professional_headline && <p className="mt-1 text-gray-300">{profile.professional_headline}</p>}
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-400">
                  {(profile.city || profile.country) && <span>{[profile.city, profile.country].filter(Boolean).join(', ')}</span>}
                  {profile.target_job_role && <span>{profile.target_job_role}</span>}
                  {profile.experience_level && <span className="capitalize">{profile.experience_level}</span>}
                </div>
              </div>
            </div>

            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer">
                <Button variant="outline">Open LinkedIn</Button>
              </a>
            )}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {profile.about_me && (
              <Card>
                <h2 className="mb-3 text-2xl font-bold">About</h2>
                <p className="text-gray-300 whitespace-pre-line">{profile.about_me}</p>
              </Card>
            )}

            {profile.experience_details && profile.experience_details !== 'No experience' && (
              <Card>
                <h2 className="mb-3 text-2xl font-bold">Experience</h2>
                <ul className="space-y-2">
                  {profile.experience_details.split('\n').filter(e => e.trim()).map((exp, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>{exp}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {profile.education_details && (
              <Card>
                <h2 className="mb-3 text-2xl font-bold">Education / Formation</h2>
                <ul className="space-y-2">
                  {profile.education_details.split('\n').filter(e => e.trim()).map((edu, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{edu}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {profile.projects_details && (
              <Card>
                <h2 className="mb-3 text-2xl font-bold">Projects</h2>
                <p className="text-gray-300 whitespace-pre-line">{profile.projects_details}</p>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="mb-4 text-xl font-bold">Career Snapshot</h2>
              <div className="space-y-2 text-sm text-gray-300">
                {profile.current_status && <p>Status: <span className="text-white">{profile.current_status}</span></p>}
                {profile.status_detail && <p>Details: <span className="text-white">{profile.status_detail}</span></p>}
                {profile.target_job_role && <p>Target role: <span className="text-white">{profile.target_job_role}</span></p>}
                {profile.experience_level && <p>Level: <span className="text-white capitalize">{profile.experience_level}</span></p>}
              </div>
            </Card>

            {profile.skills && profile.skills.length > 0 && (
              <Card>
                <h2 className="mb-4 text-xl font-bold">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
