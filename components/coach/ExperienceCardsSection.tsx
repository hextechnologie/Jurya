'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, MapPin, Building2, Edit2, Trash2, Plus } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import type { CoachExperience, ExperienceFormData, EmploymentType } from '@/lib/types/profile'
import { MONTHS, YEARS, EMPLOYMENT_TYPES, JOB_TITLES, COMPANIES } from '@/lib/types/profile'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface ExperienceCardsSectionProps {
  coachId: string
}

export default function ExperienceCardsSection({ coachId }: ExperienceCardsSectionProps) {
  const [experiences, setExperiences] = useState<CoachExperience[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingExperience, setEditingExperience] = useState<CoachExperience | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadExperiences()
  }, [coachId])

  const loadExperiences = async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await supabase
      .from('coach_experience')
      .select('*')
      .eq('coach_id', coachId)
      .order('order_index', { ascending: true })

    if (!error && data) {
      setExperiences(data)
    }
  }

  const handleAddClick = () => {
    setEditingExperience(null)
    setShowModal(true)
  }

  const handleEditClick = (experience: CoachExperience) => {
    setEditingExperience(experience)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this experience?')) return

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { error } = await supabase
      .from('coach_experience')
      .delete()
      .eq('id', id)

    if (!error) {
      await loadExperiences()
    }
  }

  const handleSave = async () => {
    await loadExperiences()
    setShowModal(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Work Experience</h3>
          <p className="text-sm text-gray-400">{experiences.length} experience{experiences.length !== 1 ? 's' : ''} added</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Add Experience
        </button>
      </div>

      <div className="space-y-3">
        {experiences.map((exp) => (
          <ExperienceCard
            key={exp.id}
            experience={exp}
            onEdit={() => handleEditClick(exp)}
            onDelete={() => handleDelete(exp.id)}
          />
        ))}
        {experiences.length === 0 && (
          <div className="text-center py-8 text-gray-500 border border-gray-700 rounded-lg">
            No experience added yet. Click "Add Experience" to get started.
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <ExperienceModal
            coachId={coachId}
            experience={editingExperience}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ExperienceCard({
  experience,
  onEdit,
  onDelete,
}: {
  experience: CoachExperience
  onEdit: () => void
  onDelete: () => void
}) {
  const formatDate = () => {
    const startMonth = experience.start_month ? MONTHS.find(m => m.value === experience.start_month)?.label.slice(0, 3) : ''
    const start = `${startMonth} ${experience.start_year}`
    const end = experience.is_current
      ? 'Present'
      : experience.end_month && experience.end_year
        ? `${MONTHS.find(m => m.value === experience.end_month)?.label.slice(0, 3)} ${experience.end_year}`
        : experience.end_year || 'Present'

    return `${start} → ${end}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold">
              💼
            </div>
            <div className="flex-1">
              <h4 className="text-white font-semibold">{experience.job_title}</h4>
              <p className="text-blue-400">{experience.company_name}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                {experience.employment_type && (
                  <span>{experience.employment_type}</span>
                )}
                {experience.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {experience.location}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                <Calendar className="w-3 h-3" />
                {formatDate()}
              </div>
              {experience.description && (
                <p className="mt-2 text-sm text-gray-300">{experience.description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
            title="Edit"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-500/20 rounded-lg transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function ExperienceModal({
  coachId,
  experience,
  onClose,
  onSave,
}: {
  coachId: string
  experience: CoachExperience | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState<ExperienceFormData>({
    job_title: experience?.job_title || '',
    company_name: experience?.company_name || '',
    employment_type: experience?.employment_type || undefined,
    location: experience?.location || '',
    start_month: experience?.start_month || undefined,
    start_year: experience?.start_year || new Date().getFullYear(),
    end_month: experience?.end_month || undefined,
    end_year: experience?.end_year || undefined,
    is_current: experience?.is_current || false,
    description: experience?.description || '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ExperienceFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [jobTitleSuggestions, setJobTitleSuggestions] = useState<string[]>([])
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([])

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ExperienceFormData, string>> = {}

    if (!formData.job_title.trim()) newErrors.job_title = 'Job title is required'
    if (!formData.company_name.trim()) newErrors.company_name = 'Company name is required'
    if (!formData.start_year) newErrors.start_year = 'Start year is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    try {
      if (experience) {
        // Update existing
        const { error } = await supabase
          .from('coach_experience')
          .update(formData)
          .eq('id', experience.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('coach_experience')
          .insert([{ ...formData, coach_id: coachId }])

        if (error) throw error
      }

      onSave()
    } catch (error) {
      console.error('Error saving experience:', error)
      alert('Failed to save experience')
    } finally {
      setLoading(false)
    }
  }

  const handleJobTitleChange = (value: string) => {
    setFormData({ ...formData, job_title: value })
    if (value.length > 0) {
      const suggestions = JOB_TITLES.filter(title =>
        title.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
      setJobTitleSuggestions(suggestions)
    } else {
      setJobTitleSuggestions([])
    }
  }

  const handleCompanyChange = (value: string) => {
    setFormData({ ...formData, company_name: value })
    if (value.length > 0) {
      const suggestions = COMPANIES.filter(company =>
        company.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
      setCompanySuggestions(suggestions)
    } else {
      setCompanySuggestions([])
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {experience ? 'Edit Experience' : 'Add Experience'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Job Title */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.job_title}
              onChange={(e) => handleJobTitleChange(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              placeholder="e.g. Senior Software Engineer"
            />
            {errors.job_title && <p className="text-red-400 text-sm mt-1">{errors.job_title}</p>}
            {jobTitleSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                {jobTitleSuggestions.map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, job_title: title })
                      setJobTitleSuggestions([])
                    }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition"
                  >
                    {title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Company Name */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              placeholder="e.g. Google"
            />
            {errors.company_name && <p className="text-red-400 text-sm mt-1">{errors.company_name}</p>}
            {companySuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                {companySuggestions.map((company) => (
                  <button
                    key={company}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, company_name: company })
                      setCompanySuggestions([])
                    }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition"
                  >
                    {company}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Employment Type
            </label>
            <select
              value={formData.employment_type || ''}
              onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as EmploymentType || undefined })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select type</option>
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              placeholder="e.g. San Francisco, CA or Remote"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Date <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.start_month || ''}
                onChange={(e) => setFormData({ ...formData, start_month: e.target.value ? parseInt(e.target.value) : undefined })}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Month</option>
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
              <select
                value={formData.start_year}
                onChange={(e) => setFormData({ ...formData, start_year: parseInt(e.target.value) })}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                {YEARS.reverse().map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            {errors.start_year && <p className="text-red-400 text-sm mt-1">{errors.start_year}</p>}
          </div>

          {/* Current Work Checkbox */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={formData.is_current}
                onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              I currently work here
            </label>
          </div>

          {/* End Date (hidden if current) */}
          {!formData.is_current && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={formData.end_month || ''}
                  onChange={(e) => setFormData({ ...formData, end_month: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Month</option>
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
                <select
                  value={formData.end_year || ''}
                  onChange={(e) => setFormData({ ...formData, end_year: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Year</option>
                  {YEARS.reverse().map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              maxLength={300}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Describe your role, achievements, responsibilities..."
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description?.length || 0}/300 characters</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-700 rounded-lg text-white hover:bg-gray-800 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : experience ? 'Update Experience' : 'Add Experience'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
