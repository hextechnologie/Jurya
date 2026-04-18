'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import CoachNavbar from '@/components/CoachNavbar'
import { Button, LoadingSpinner } from '@/components/ui'
import { Plus, Trash2, GripVertical, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'

type Question = { id: string; question: string; time_limit_seconds: number; order_index: number }
type Template = {
  id: string
  name: string
  job_role: string
  industry: string
  difficulty: 'junior' | 'mid' | 'senior'
  duration_minutes: number
  created_at: string
  questions?: Question[]
}

function DarkCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl p-5 border border-white/10 ${className}`} style={{ background: '#111827' }}>{children}</div>
}

export default function CoachTemplatesPage() {
  const { user, loading: authLoading } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  // New template form
  const [form, setForm] = useState({ name: '', job_role: '', industry: '', difficulty: 'mid' as Template['difficulty'], duration_minutes: 45 })
  const [questions, setQuestions] = useState<{ question: string; time_limit_seconds: number }[]>([{ question: '', time_limit_seconds: 120 }])

  useEffect(() => {
    if (user) fetchTemplates()
  }, [user])

  const fetchTemplates = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('interview_templates')
        .select('*, questions:template_questions(*)')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false })
      setTemplates((data || []) as Template[])
    } finally { setLoading(false) }
  }

  const addQuestion = () => setQuestions((prev) => [...prev, { question: '', time_limit_seconds: 120 }])

  const removeQuestion = (i: number) => setQuestions((prev) => prev.filter((_, idx) => idx !== i))

  const updateQuestion = (i: number, field: 'question' | 'time_limit_seconds', value: string | number) => {
    setQuestions((prev) => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
  }

  const saveTemplate = async () => {
    if (!user || !form.name.trim()) return
    setSaving(true)
    try {
      const { data: tmpl } = await supabase
        .from('interview_templates')
        .insert({ ...form, coach_id: user.id })
        .select()
        .single()
      if (tmpl) {
        const qs = questions
          .filter((q) => q.question.trim())
          .map((q, i) => ({ template_id: tmpl.id, question: q.question, order_index: i, time_limit_seconds: q.time_limit_seconds }))
        if (qs.length > 0) await supabase.from('template_questions').insert(qs)
      }
      setForm({ name: '', job_role: '', industry: '', difficulty: 'mid', duration_minutes: 45 })
      setQuestions([{ question: '', time_limit_seconds: 120 }])
      setCreating(false)
      fetchTemplates()
    } finally { setSaving(false) }
  }

  const deleteTemplate = async (id: string) => {
    if (!window.confirm('Delete this template? This cannot be undone.')) return
    await supabase.from('template_questions').delete().eq('template_id', id)
    await supabase.from('interview_templates').delete().eq('id', id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1e' }}><LoadingSpinner size="lg" /></div>

  return (
    <div className="min-h-screen text-white" style={{ background: '#0a0f1e' }}>
      <CoachNavbar />
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Interview Templates</h1>
            <p className="text-gray-400">Create reusable interview templates to assign to candidates before sessions.</p>
          </div>
          <Button variant="primary" onClick={() => setCreating((v) => !v)} className="gap-2 self-start">
            <Plus className="w-4 h-4" /> {creating ? 'Cancel' : 'New Template'}
          </Button>
        </div>

        {/* Create form */}
        {creating && (
          <DarkCard className="mb-6 space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-400" /> New Template</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Template Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Google SWE Interview" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/40" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Job Role</label>
                <input value={form.job_role} onChange={(e) => setForm((f) => ({ ...f, job_role: e.target.value }))} placeholder="e.g. Software Engineer" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/40" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Industry</label>
                <input value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} placeholder="e.g. Tech, Finance" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/40" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Difficulty</label>
                <select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as Template['difficulty'] }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/40">
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Duration (minutes)</label>
                <input type="number" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/40" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Questions</h3>
                <Button variant="outline" onClick={addQuestion} className="gap-1 text-sm px-3 py-1.5">
                  <Plus className="w-3 h-3" /> Add Question
                </Button>
              </div>
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex items-center gap-1 text-gray-500 mt-3 shrink-0">
                      <GripVertical className="w-4 h-4" />
                      <span className="text-xs">{i + 1}.</span>
                    </div>
                    <div className="flex-1">
                      <input
                        value={q.question}
                        onChange={(e) => updateQuestion(i, 'question', e.target.value)}
                        placeholder={`Question ${i + 1}...`}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/40 mb-2"
                      />
                      <select
                        value={q.time_limit_seconds}
                        onChange={(e) => updateQuestion(i, 'time_limit_seconds', Number(e.target.value))}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 outline-none"
                      >
                        <option value={60}>1 min</option>
                        <option value={120}>2 min</option>
                        <option value={180}>3 min</option>
                        <option value={300}>5 min</option>
                      </select>
                    </div>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(i)} className="mt-3 text-red-400 hover:text-red-300 shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="primary" onClick={saveTemplate} loading={saving} className="gap-2">
                Save Template
              </Button>
              <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            </div>
          </DarkCard>
        )}

        {/* Templates list */}
        {templates.length === 0 && !creating ? (
          <DarkCard className="text-center py-12">
            <BookOpen className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <p className="text-gray-300 font-semibold mb-2">No templates yet</p>
            <p className="text-gray-500 text-sm mb-4">Create your first interview template to streamline coaching sessions.</p>
            <Button variant="primary" onClick={() => setCreating(true)} className="gap-2"><Plus className="w-4 h-4" /> Create Template</Button>
          </DarkCard>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <DarkCard key={t.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-base">{t.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${t.difficulty === 'senior' ? 'border-red-500/30 text-red-400 bg-red-500/10' : t.difficulty === 'mid' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' : 'border-green-500/30 text-green-400 bg-green-500/10'}`}>
                        {t.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{t.job_role}{t.industry ? ` · ${t.industry}` : ''} · {t.duration_minutes} min · {t.questions?.length || 0} questions</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setExpandedId(expandedId === t.id ? null : t.id)} className="p-2 rounded-lg border border-white/10 hover:border-purple-500/40 text-gray-400 hover:text-white transition-colors">
                      {expandedId === t.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteTemplate(t.id)} className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {expandedId === t.id && t.questions && t.questions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                    {t.questions.sort((a, b) => a.order_index - b.order_index).map((q, i) => (
                      <div key={q.id} className="flex gap-3 rounded-lg bg-white/5 px-4 py-2.5">
                        <span className="text-xs text-gray-500 font-mono mt-0.5 shrink-0">{i + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-200">{q.question}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Time limit: {q.time_limit_seconds / 60} min</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DarkCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
