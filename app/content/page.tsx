'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { LoadingSpinner, Badge } from '@/components/ui'
import { Search, BookOpen, FileText, Video, Lock, Eye, Clock, Filter } from 'lucide-react'
import Link from 'next/link'

/* ---------- types ---------- */
type Resource = {
  id: string
  slug: string
  kind: string
  title_fr: string
  excerpt_fr: string | null
  cover_image_url: string | null
  difficulty: string
  is_premium: boolean
  published_at: string | null
  view_count: number
  duration_seconds: number | null
  concours_ids: string[]
}

type Concours = { id: string; intitulé: string }

const KIND_TABS = [
  { value: 'all', label: 'Tout' },
  { value: 'fiche_thématique', label: 'Fiches thématiques' },
  { value: 'article', label: 'Articles' },
  { value: 'video', label: 'Vidéos' },
  { value: 'podcast', label: 'Podcasts' },
  { value: 'masterclass', label: 'Masterclass' },
]

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Débutant',
  medium: 'Intermédiaire',
  hard: 'Avancé',
}

const DIFFICULTY_COLORS: Record<string, 'success' | 'warning' | 'danger'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
}

const KIND_ICONS: Record<string, typeof BookOpen> = {
  article: FileText,
  fiche_thématique: BookOpen,
  video: Video,
  podcast: BookOpen,
  masterclass: Video,
  template: FileText,
}

function estimateReadTime(seconds: number | null, kind: string): string {
  if (seconds && seconds > 0) {
    const mins = Math.ceil(seconds / 60)
    return `${mins} min`
  }
  if (kind === 'video' || kind === 'podcast' || kind === 'masterclass') return '—'
  return '5 min'
}

export default function ContentPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [resources, setResources] = useState<Resource[]>([])
  const [allConcours, setAllConcours] = useState<Concours[]>([])
  const [loading, setLoading] = useState(true)

  // filters
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [selectedConcours, setSelectedConcours] = useState<string>('')
  const [showFreeOnly, setShowFreeOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchData() {
    setLoading(true)
    const [resRes, conRes] = await Promise.all([
      supabase
        .from('resources')
        .select('id, slug, kind, title_fr, excerpt_fr, cover_image_url, difficulty, is_premium, published_at, view_count, duration_seconds, concours_ids')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false }),
      supabase.from('concours').select('id, intitulé').order('intitulé'),
    ])
    setResources((resRes.data ?? []) as unknown as Resource[])
    setAllConcours((conRes.data ?? []) as unknown as Concours[])
    setLoading(false)
  }

  // track view
  async function trackView(resourceId: string) {
    if (!user) return
    await supabase.from('resource_views').insert({
      resource_id: resourceId,
      user_id: user.id,
    })
  }

  // filtered resources
  const filtered = resources.filter(r => {
    if (activeTab !== 'all' && r.kind !== activeTab) return false
    if (selectedDifficulty && r.difficulty !== selectedDifficulty) return false
    if (selectedConcours && !(r.concours_ids ?? []).includes(selectedConcours)) return false
    if (showFreeOnly && r.is_premium) return false
    if (search) {
      const q = search.toLowerCase()
      if (!r.title_fr.toLowerCase().includes(q) && !(r.excerpt_fr ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const isPremiumUser = profile?.subscription_tier !== 'free'

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* ── Hero ── */}
        <section className="glass rounded-2xl p-8 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent text-center">
          <h1 className="text-3xl font-bold mb-2">Bibliothèque de ressources</h1>
          <p className="text-gray-400 mb-6">Fiches, articles, vidéos — tout pour réussir votre concours</p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une ressource…"
              className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </section>

        {/* ── Category Tabs ── */}
        <div className="flex flex-wrap gap-2">
          {KIND_TABS.map(tab => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm border transition ${
                activeTab === tab.value
                  ? 'bg-primary/20 border-primary text-primary-light'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:border-white/30 transition"
          >
            <Filter className="w-4 h-4" /> Filtres
          </button>
        </div>

        <div className="flex gap-6">
          {/* ── Filters Sidebar ── */}
          {showFilters && (
            <aside className="w-64 shrink-0 space-y-6 hidden lg:block">
              <div className="glass rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-300">Concours</h3>
                <select
                  value={selectedConcours}
                  onChange={e => setSelectedConcours(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Tous</option>
                  {allConcours.map(c => (
                    <option key={c.id} value={c.id}>{c.intitulé}</option>
                  ))}
                </select>
              </div>

              <div className="glass rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-300">Difficulté</h3>
                <div className="space-y-2">
                  {['', 'easy', 'medium', 'hard'].map(d => (
                    <label key={d} className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                      <input
                        type="radio"
                        name="difficulty"
                        checked={selectedDifficulty === d}
                        onChange={() => setSelectedDifficulty(d)}
                        className="accent-primary"
                      />
                      {d === '' ? 'Toutes' : DIFFICULTY_LABELS[d]}
                    </label>
                  ))}
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300">Gratuit uniquement</span>
                  <div
                    className={`w-10 h-5 rounded-full transition-colors relative ${showFreeOnly ? 'bg-primary' : 'bg-white/10'}`}
                    onClick={() => setShowFreeOnly(!showFreeOnly)}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showFreeOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              </div>
            </aside>
          )}

          {/* ── Card Grid ── */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune ressource trouvée.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(resource => {
                  const Icon = KIND_ICONS[resource.kind] ?? BookOpen
                  const locked = resource.is_premium && !isPremiumUser
                  return (
                    <div
                      key={resource.id}
                      onClick={() => { if (!locked) trackView(resource.id) }}
                      className={`glass rounded-xl overflow-hidden group transition hover:border-primary/50 ${locked ? 'opacity-75' : 'cursor-pointer'}`}
                    >
                      {/* cover */}
                      {resource.cover_image_url ? (
                        <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${resource.cover_image_url})` }} />
                      ) : (
                        <div className="h-36 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <Icon className="w-10 h-10 text-primary/50" />
                        </div>
                      )}

                      <div className="p-4 space-y-2">
                        {/* badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="default">
                            {resource.kind === 'fiche_thématique' ? 'Fiche' : resource.kind.charAt(0).toUpperCase() + resource.kind.slice(1)}
                          </Badge>
                          <Badge variant={DIFFICULTY_COLORS[resource.difficulty] ?? 'default'}>
                            {DIFFICULTY_LABELS[resource.difficulty] ?? resource.difficulty}
                          </Badge>
                          {resource.is_premium && (
                            <span className="text-xs text-amber-400 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Premium
                            </span>
                          )}
                        </div>

                        {/* title */}
                        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition">
                          {resource.title_fr}
                        </h3>

                        {/* excerpt */}
                        {resource.excerpt_fr && (
                          <p className="text-xs text-gray-400 line-clamp-2">{resource.excerpt_fr}</p>
                        )}

                        {/* meta */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {estimateReadTime(resource.duration_seconds, resource.kind)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {resource.view_count}
                          </span>
                        </div>

                        {/* premium lock */}
                        {locked && (
                          <Link
                            href="/pricing"
                            className="mt-2 block text-center text-xs bg-primary/10 text-primary px-3 py-2 rounded-lg hover:bg-primary/20 transition"
                          >
                            <Lock className="w-3 h-3 inline mr-1" /> Abonnez-vous pour accéder
                          </Link>
                        )}
                      </div>
                    </div>
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
