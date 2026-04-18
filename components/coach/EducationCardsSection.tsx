'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, GraduationCap, Award, BookOpen, Edit2, Trash2, Plus, ExternalLink } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import type { CoachEducation, EducationFormData, EducationType } from '@/lib/types/profile'
import {
  MONTHS,
  YEARS,
  EDUCATION_TYPES,
  DEGREE_TYPES,
  GRADES,
  BAC_SPECIALIZATIONS,
  COURSE_PLATFORMS,
  CERTIFICATIONS,
} from '@/lib/types/profile'
import { searchUniversities } from '@/lib/data/universities'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface EducationCardsSectionProps {
  coachId: string
  userCountry?: string
}

export default function EducationCardsSection({ coachId, userCountry }: EducationCardsSectionProps) {
  const [educations, setEducations] = useState<CoachEducation[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingEducation, setEditingEducation] = useState<CoachEducation | null>(null)

  useEffect(() => {
    loadEducations()
  }, [coachId])

  const loadEducations = async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await supabase
      .from('coach_education')
      .select('*')
      .eq('coach_id', coachId)
      .order('order_index', { ascending: true })

    if (!error && data) {
      setEducations(data)
    }
  }

  const handleAddClick = () => {
    setEditingEducation(null)
    setShowModal(true)
  }

  const handleEditClick = (education: CoachEducation) => {
    setEditingEducation(education)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this education?')) return

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { error } = await supabase
      .from('coach_education')
      .delete()
      .eq('id', id)

    if (!error) {
      await loadEducations()
    }
  }

  const handleSave = async () => {
    await loadEducations()
    setShowModal(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Education & Certifications</h3>
          <p className="text-sm text-gray-400">{educations.length} {educations.length === 1 ? 'entry' : 'entries'} added</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Add Education
        </button>
      </div>

      <div className="space-y-3">
        {educations.map((edu) => (
          <EducationCard
            key={edu.id}
            education={edu}
            onEdit={() => handleEditClick(edu)}
            onDelete={() => handleDelete(edu.id)}
          />
        ))}
        {educations.length === 0 && (
          <div className="text-center py-8 text-gray-500 border border-gray-700 rounded-lg">
            No education added yet. Click "Add Education" to get started.
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <EducationModal
            coachId={coachId}
            education={editingEducation}
            userCountry={userCountry}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EducationCard({
  education,
  onEdit,
  onDelete,
}: {
  education: CoachEducation
  onEdit: () => void
  onDelete: () => void
}) {
  const getIcon = () => {
    const eduType = EDUCATION_TYPES.find(t => t.value === education.education_type)
    return eduType?.icon || '🎓'
  }

  const formatDate = () => {
    if (education.education_type === 'Certification') {
      if (education.issue_month && education.issue_year) {
        const month = MONTHS.find(m => m.value === education.issue_month)?.label.slice(0, 3)
        return `Issued ${month} ${education.issue_year}`
      }
      return education.issue_year ? `Issued ${education.issue_year}` : ''
    }

    if (education.start_year && education.end_year) {
      return `${education.start_year} → ${education.is_ongoing ? 'Present' : education.end_year}`
    }
    return education.end_year || education.start_year || ''
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
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-2xl">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h4 className="text-white font-semibold">
                {education.education_type === 'University' && education.degree
                  ? `${education.degree}${education.field_of_study ? ` in ${education.field_of_study}` : ''}`
                  : education.education_type === 'Certification'
                    ? education.institution_name
                    : education.education_type === 'Online Course'
                      ? education.institution_name
                      : education.institution_name}
              </h4>
              <p className="text-blue-400">
                {education.education_type === 'University' 
                  ? education.institution_name
                  : education.education_type === 'Certification'
                    ? education.field_of_study
                    : education.education_type === 'Online Course'
                      ? education.platform
                      : education.specialization || education.field_of_study}
              </p>
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                <Calendar className="w-3 h-3" />
                {formatDate()}
                {education.grade && ` · Grade: ${education.grade}`}
              </div>
              {education.credential_id && (
                <div className="mt-2 text-sm text-gray-400">
                  Credential ID: {education.credential_id}
                  {education.credential_url && (
                    <a
                      href={education.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Verify
                    </a>
                  )}
                </div>
              )}
              {education.description && (
                <p className="mt-2 text-sm text-gray-300">{education.description}</p>
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

function EducationModal({
  coachId,
  education,
  userCountry,
  onClose,
  onSave,
}: {
  coachId: string
  education: CoachEducation | null
  userCountry?: string
  onClose: () => void
  onSave: () => void
}) {
  const [educationType, setEducationType] = useState<EducationType>(education?.education_type || 'University')
  const [formData, setFormData] = useState<EducationFormData>({
    education_type: education?.education_type || 'University',
    institution_name: education?.institution_name || '',
    degree: education?.degree || '',
    field_of_study: education?.field_of_study || '',
    start_year: education?.start_year || undefined,
    end_year: education?.end_year || undefined,
    is_ongoing: education?.is_ongoing || false,
    grade: education?.grade || '',
    specialization: education?.specialization || '',
    platform: education?.platform || '',
    credential_id: education?.credential_id || '',
    credential_url: education?.credential_url || '',
    issue_month: education?.issue_month || undefined,
    issue_year: education?.issue_year || undefined,
    expiry_month: education?.expiry_month || undefined,
    expiry_year: education?.expiry_year || undefined,
    no_expiry: education?.no_expiry || false,
    description: education?.description || '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof EducationFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [universitySuggestions, setUniversitySuggestions] = useState<string[]>([])
  const [certificationSuggestions, setCertificationSuggestions] = useState<string[]>([])

  const handleTypeChange = (type: EducationType) => {
    setEducationType(type)
    setFormData({
      ...formData,
      education_type: type,
      // Reset optional fields when changing type
      degree: '',
      field_of_study: '',
      specialization: '',
      platform: '',
      credential_id: '',
      credential_url: '',
      grade: '',
    })
  }

  const handleUniversitySearch = (value: string) => {
    setFormData({ ...formData, institution_name: value })
    if (value.length > 0) {
      const suggestions = searchUniversities(value, userCountry).slice(0, 8)
      setUniversitySuggestions(suggestions)
    } else {
      setUniversitySuggestions([])
    }
  }

  const handleCertificationSearch = (value: string) => {
    setFormData({ ...formData, institution_name: value })
    if (value.length > 0) {
      const suggestions = CERTIFICATIONS.filter(cert =>
        cert.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
      setCertificationSuggestions(suggestions)
    } else {
      setCertificationSuggestions([])
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EducationFormData, string>> = {}

    if (!formData.institution_name.trim()) {
      newErrors.institution_name = 'This field is required'
    }

    if (educationType === 'University') {
      if (!formData.degree) newErrors.degree = 'Degree is required'
      if (!formData.field_of_study) newErrors.field_of_study = 'Field of study is required'
    }

    if (educationType === 'High School') {
      if (!formData.end_year) newErrors.end_year = 'Graduation year is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    try {
      if (education) {
        const { error } = await supabase
          .from('coach_education')
          .update(formData)
          .eq('id', education.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('coach_education')
          .insert([{ ...formData, coach_id: coachId }])

        if (error) throw error
      }

      onSave()
    } catch (error) {
      console.error('Error saving education:', error)
      alert('Failed to save education')
    } finally {
      setLoading(false)
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
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-white">
            {education ? 'Edit Education' : 'Add Education'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Education Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Education Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EDUCATION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeChange(type.value)}
                  className={`p-3 rounded-lg border transition ${
                    educationType === type.value
                      ? 'bg-blue-500/20 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Fields Based on Type */}
          {educationType === 'University' && (
            <>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  University Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.institution_name}
                  onChange={(e) => handleUniversitySearch(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Start typing to search..."
                />
                {errors.institution_name && <p className="text-red-400 text-sm mt-1">{errors.institution_name}</p>}
                {universitySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {universitySuggestions.map((uni) => (
                      <button
                        key={uni}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, institution_name: uni })
                          setUniversitySuggestions([])
                        }}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition text-sm"
                      >
                        {uni}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setUniversitySuggestions([])}
                      className="w-full px-4 py-2 text-left text-gray-400 hover:bg-gray-700 transition text-sm border-t border-gray-700"
                    >
                      Other — use "{formData.institution_name}"
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Degree / Diploma <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select degree</option>
                  {DEGREE_TYPES.map((degree) => (
                    <option key={degree} value={degree}>{degree}</option>
                  ))}
                </select>
                {errors.degree && <p className="text-red-400 text-sm mt-1">{errors.degree}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Field of Study <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.field_of_study}
                  onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Computer Science"
                />
                {errors.field_of_study && <p className="text-red-400 text-sm mt-1">{errors.field_of_study}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Year</label>
                  <select
                    value={formData.start_year || ''}
                    onChange={(e) => setFormData({ ...formData, start_year: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select year</option>
                    {YEARS.reverse().map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Year</label>
                  <select
                    value={formData.end_year || ''}
                    onChange={(e) => setFormData({ ...formData, end_year: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    disabled={formData.is_ongoing}
                  >
                    <option value="">Select year</option>
                    {YEARS.reverse().map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.is_ongoing}
                  onChange={(e) => setFormData({ ...formData, is_ongoing: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                Currently studying here
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Grade / Mention</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select grade</option>
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {educationType === 'Certification' && (
            <>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Certification Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.institution_name}
                  onChange={(e) => handleCertificationSearch(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. AWS Certified Solutions Architect"
                />
                {errors.institution_name && <p className="text-red-400 text-sm mt-1">{errors.institution_name}</p>}
                {certificationSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                    {certificationSuggestions.map((cert) => (
                      <button
                        key={cert}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, institution_name: cert })
                          setCertificationSuggestions([])
                        }}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition"
                      >
                        {cert}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Issuing Organization
                </label>
                <input
                  type="text"
                  value={formData.field_of_study}
                  onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Amazon, Google, PMI"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Issue Date <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={formData.issue_month || ''}
                    onChange={(e) => setFormData({ ...formData, issue_month: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Month</option>
                    {MONTHS.map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                  <select
                    value={formData.issue_year || ''}
                    onChange={(e) => setFormData({ ...formData, issue_year: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Year</option>
                    {YEARS.reverse().map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.no_expiry}
                  onChange={(e) => setFormData({ ...formData, no_expiry: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                This credential does not expire
              </label>

              {!formData.no_expiry && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Expiry Date</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={formData.expiry_month || ''}
                      onChange={(e) => setFormData({ ...formData, expiry_month: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Month</option>
                      {MONTHS.map((month) => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                    <select
                      value={formData.expiry_year || ''}
                      onChange={(e) => setFormData({ ...formData, expiry_year: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Year</option>
                      {YEARS.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Credential ID</label>
                <input
                  type="text"
                  value={formData.credential_id}
                  onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter credential ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Credential URL</label>
                <input
                  type="url"
                  value={formData.credential_url}
                  onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          {educationType === 'Online Course' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Course Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.institution_name}
                  onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Full Stack Web Development"
                />
                {errors.institution_name && <p className="text-red-400 text-sm mt-1">{errors.institution_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Platform <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select platform</option>
                  {COURSE_PLATFORMS.map((platform) => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Completion Date</label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={formData.issue_month || ''}
                    onChange={(e) => setFormData({ ...formData, issue_month: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Month</option>
                    {MONTHS.map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                  <select
                    value={formData.issue_year || ''}
                    onChange={(e) => setFormData({ ...formData, issue_year: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Year</option>
                    {YEARS.reverse().map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Certificate URL</label>
                <input
                  type="url"
                  value={formData.credential_url}
                  onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          {educationType === 'High School' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  School Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.institution_name}
                  onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter school name"
                />
                {errors.institution_name && <p className="text-red-400 text-sm mt-1">{errors.institution_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Specialization</label>
                <select
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select specialization</option>
                  {BAC_SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Year of Graduation <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.end_year || ''}
                  onChange={(e) => setFormData({ ...formData, end_year: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select year</option>
                  {YEARS.reverse().map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {errors.end_year && <p className="text-red-400 text-sm mt-1">{errors.end_year}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mention</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select mention</option>
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {(educationType === 'Vocational' || educationType === 'Other') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {educationType === 'Vocational' ? 'Training Name' : 'Title'} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.institution_name}
                  onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Name your education"
                />
                {errors.institution_name && <p className="text-red-400 text-sm mt-1">{errors.institution_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Institution</label>
                <input
                  type="text"
                  value={formData.field_of_study}
                  onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Institution or organization"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Year</label>
                  <select
                    value={formData.start_year || ''}
                    onChange={(e) => setFormData({ ...formData, start_year: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select year</option>
                    {YEARS.reverse().map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Year</label>
                  <select
                    value={formData.end_year || ''}
                    onChange={(e) => setFormData({ ...formData, end_year: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    disabled={formData.is_ongoing}
                  >
                    <option value="">Select year</option>
                    {YEARS.reverse().map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.is_ongoing}
                  onChange={(e) => setFormData({ ...formData, is_ongoing: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                Ongoing
              </label>
            </>
          )}

          {/* Description (all types) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              maxLength={300}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Additional details..."
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
              {loading ? 'Saving...' : education ? 'Update Education' : 'Add Education'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
