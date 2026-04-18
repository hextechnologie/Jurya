'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Briefcase, ExternalLink, Globe, Loader2, MapPin, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'

export interface RemotiveJob {
  id: number
  url: string
  title: string
  company_name: string
  company_logo?: string
  category: string
  salary?: string
  job_type: string
  publication_date: string
  candidate_required_location: string
  description: string
}

interface Props {
  targetRole?: string
  limit?: number
  /** if true, renders as a full-page layout with pagination */
  fullPage?: boolean
}

function typeColor(type: string) {
  if (type.includes('full')) return 'bg-green-500/20 text-green-300 border-green-500/30'
  if (type.includes('part')) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
  if (type.includes('contract')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default function JobOffers({ targetRole = '', limit = 6, fullPage = false }: Props) {
  const [jobs, setJobs] = useState<RemotiveJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(targetRole || 'software engineer')
  const [input, setInput] = useState(targetRole || 'software engineer')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const fetchJobs = async (query: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=${fullPage ? 20 : limit}`
      )
      if (!res.ok) throw new Error('Failed to fetch jobs')
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch {
      setError('Could not load job listings. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs(search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const filtered = typeFilter === 'all' ? jobs : jobs.filter((j) => j.job_type.toLowerCase().includes(typeFilter))

  if (!fullPage) {
    // Dashboard widget — compact view
    return (
      <div>
        {/* Search + refresh */}
        <div className="flex gap-2 mb-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setSearch(input) }}
            placeholder="Search remote jobs..."
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button
            onClick={() => setSearch(input)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-gray-300 hover:border-purple-500/40 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading jobs...
          </div>
        ) : error ? (
          <p className="text-sm text-red-400 py-4 text-center">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No remote jobs found for "{search}". Try a different search.</p>
        ) : (
          <div className="space-y-3">
            {filtered.slice(0, limit).map((job) => (
              <JobCard key={job.id} job={job} compact />
            ))}
          </div>
        )}

        <div className="mt-4 text-center">
          <Link href="/jobs">
            <Button variant="outline" className="text-sm gap-2">
              <Briefcase className="w-4 h-4" /> Browse All Remote Jobs
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Full-page view
  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setSearch(input) }}
          placeholder="Job title, technology, or keyword..."
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <Button variant="primary" onClick={() => setSearch(input)} className="gap-2 shrink-0">
          <RefreshCw className="w-4 h-4" /> Search
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'full', 'part', 'contract'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${typeFilter === t ? 'bg-purple-600 border-purple-500 text-white' : 'border-white/10 text-gray-400 hover:border-purple-500/40'}`}
          >
            {t === 'all' ? 'All Types' : t === 'full' ? 'Full-time' : t === 'part' ? 'Part-time' : 'Contract'}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500 self-center">{filtered.length} jobs</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Searching remote jobs...
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-400 mb-4">{error}</p>
          <Button variant="outline" onClick={() => fetchJobs(search)}>Try Again</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No results for "{search}". Try a broader search.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}

function JobCard({ job, compact = false }: { job: RemotiveJob; compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-white/10 hover:border-purple-500/30 transition-all ${compact ? 'p-4' : 'p-5'}`} style={{ background: '#0a0f1e' }}>
      <div className="flex items-start gap-3">
        {/* Company logo / fallback */}
        <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600/30 to-blue-600/30 border border-white/10 overflow-hidden flex items-center justify-center">
          {job.company_logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.company_logo} alt={job.company_name} className="w-full h-full object-cover" />
          ) : (
            <Briefcase className="w-4 h-4 text-purple-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-white leading-tight line-clamp-1 ${compact ? 'text-sm' : 'text-base'}`}>{job.title}</h3>
          <p className="text-gray-400 text-xs mt-0.5">{job.company_name}</p>
        </div>
        <span className="text-xs text-gray-500 shrink-0">{timeAgo(job.publication_date)}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${typeColor(job.job_type.toLowerCase())}`}>
          {job.job_type}
        </span>
        {job.candidate_required_location && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="w-3 h-3" /> {job.candidate_required_location.length > 30 ? job.candidate_required_location.slice(0, 30) + '…' : job.candidate_required_location}
          </span>
        )}
        {job.salary && (
          <span className="text-xs text-green-400">{job.salary}</span>
        )}
      </div>

      {!compact && job.category && (
        <p className="mt-2 text-xs text-purple-400">{job.category}</p>
      )}

      <div className="mt-3 flex gap-2">
        <a href={job.url} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button variant="primary" fullWidth className={`gap-1 ${compact ? 'text-xs py-1.5' : 'text-sm'}`}>
            <ExternalLink className="w-3 h-3" /> View Job
          </Button>
        </a>
        {!compact && (
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-1 text-sm">
              <Globe className="w-3 h-3" />
            </Button>
          </a>
        )}
      </div>
    </div>
  )
}
