'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Button, Card, LoadingSpinner } from '@/components/ui'
import { Sparkles, ChevronRight, ChevronLeft, Upload, Briefcase, FileText, ShieldCheck, X } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const ROLES = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'Frontend Engineer',
  'Backend Engineer',
  'DevOps Engineer',
  'Marketing Manager',
  'Sales Manager',
  'Customer Success Manager',
  'Other',
]

const EXPERIENCE_LEVELS = ['junior', 'mid', 'senior']
const INTERVIEW_TYPES = ['Technical', 'Behavioral', 'Mixed']
const LANGUAGES = ['English', 'French', 'Spanish', 'Arabic']

export default function InterviewSetupPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resumeStatus, setResumeStatus] = useState('')
  const [showResumeEditor, setShowResumeEditor] = useState(false)

  const [resumeText, setResumeText] = useState('')
  const [resumeFileName, setResumeFileName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [language, setLanguage] = useState('English')
  const [interviewType, setInterviewType] = useState('Mixed')
  const [yearsOfExperience, setYearsOfExperience] = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [realCompanyMode, setRealCompanyMode] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [mainSkills, setMainSkills] = useState<string[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const limitReached = !!profile && profile.interviews_used_this_month >= profile.interviews_limit

  // Check if profile is complete
  const isProfileComplete = () => {
    if (!profile) return false
    const p = profile as any
    
    const hasHeadline = !!p.professional_headline?.trim()
    const hasAbout = !!p.about_me?.trim()
    const hasExperience = p.experience_details === 'No experience' || !!p.experience_details?.trim()
    const hasEducation = !!p.education_details?.trim()
    const hasSkills = Array.isArray(p.skills) && p.skills.length > 0

    return hasHeadline && hasAbout && hasExperience && hasEducation && hasSkills
  }

  const profileIncomplete = !isProfileComplete()

  const validateStep = (currentStep: number) => {
    const nextErrors: Record<string, string> = {}

    if (currentStep === 1 && resumeText.trim().length < 30) {
      nextErrors.resumeText = 'Paste or upload enough resume content to personalize your interview.'
    }


    if (currentStep === 3 && !jobTitle) {
      nextErrors.jobTitle = 'Select the role you are interviewing for.'
    }

    if (currentStep === 4 && !experienceLevel) {
      nextErrors.experienceLevel = 'Choose your experience level.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setErrors({})
    setStep((prev) => prev - 1)
  }

  const extractPdfText = async (file: File) => {
    // Use PDF.js so uploaded PDF resumes are converted into readable text instead of raw binary data.
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const pages: string[] = []

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
      pages.push(pageText)
    }

    return pages.join('\n').replace(/\s+/g, ' ').trim()
  }

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingResume(true)
    setResumeStatus('')
    setResumeFileName(file.name)
    setShowResumeEditor(false)

    try {
      const extension = file.name.split('.').pop()?.toLowerCase()
      let text = ''

      if (file.type === 'application/pdf' || extension === 'pdf') {
        text = await extractPdfText(file)
      } else if (file.type.startsWith('text/') || extension === 'txt' || extension === 'md') {
        text = await file.text()
      } else {
        setResumeText('')
        setResumeStatus('This file type is not supported for automatic parsing yet. Please upload a PDF or paste your resume text.')
        return
      }

      if (!text || text.trim().length < 30) {
        setResumeText('')
        setResumeStatus('I could not extract enough readable text from that file. Please paste your resume text or upload a text-based PDF.')
        return
      }

      setResumeText(text)
      setResumeStatus('Resume imported successfully. No extra text entry is needed unless you want to edit it.')
      setErrors((prev) => ({ ...prev, resumeText: '' }))
    } catch (error) {
      console.error('Resume upload error:', error)
      setResumeText('')
      setResumeStatus('That resume could not be parsed. Please paste your resume text or use a text-based PDF.')
    } finally {
      setUploadingResume(false)
    }
  }

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault()
      if (!mainSkills.includes(skillInput.trim())) {
        setMainSkills((prev) => [...prev, skillInput.trim()])
      }
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setMainSkills((prev) => prev.filter((item) => item !== skill))
  }

  const handleStartInterview = async () => {
    if (!validateStep(4) || limitReached) return

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/interview/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          resumeText,
          resumeFileName,
          jobTitle,
          industry: 'Tech',
          experienceLevel,
          jobDescription,
          language: language === 'French' ? 'fr' : language === 'Spanish' ? 'es' : language === 'Arabic' ? 'ar' : 'en',
          interviewerType: realCompanyMode ? 'Real Company Panel' : 'Hiring Manager',
          interviewType,
          interviewRound: realCompanyMode ? 'Final Round' : 'First Round',
          yearsOfExperience: parseInt(yearsOfExperience || '0', 10),
          mainSkills,
          weakAreas: [],
          targetCompany,
          realCompanyMode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to create interview')
        return
      }

      if (data.sessionId) {
        router.push(`/interview/${data.sessionId}`)
      }
    } catch (error) {
      console.error('Error creating interview:', error)
      alert('Failed to create interview. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (profileIncomplete) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-20 max-w-3xl">
          <Card className="text-center border-red-500/30 bg-red-500/5">
            <FileText className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-3">Complete Your Profile First</h1>
            <p className="text-gray-400 mb-6">
              Before starting an interview, you need to complete your profile with your professional headline, about section, experience, education, and skills.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/profile">
                <Button variant="primary">Complete Profile</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (limitReached) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-20 max-w-3xl">
          <Card className="text-center border-primary/30 bg-primary/5">
            <ShieldCheck className="w-14 h-14 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-3">You’ve used your free interview sessions</h1>
            <p className="text-gray-400 mb-6">
              Upgrade your plan to unlock more tailored mock interviews, deeper analytics, and continuous coaching.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/pricing">
                <Button variant="primary">See Pricing</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">Interview Coach</span>
            </Link>
          </div>
          <p className="text-sm text-gray-400">Free plan: {profile?.interviews_used_this_month || 0} / {profile?.interviews_limit || 3} sessions used</p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-6xl">
        <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-6 items-start">
          <Card className="p-6 md:p-8 transition-all duration-300">
            <div className="mb-8">
              <p className="text-primary text-sm font-semibold mb-2">PERSONALIZED ONBOARDING</p>
              <h1 className="text-4xl font-bold mb-2">Build your AI interview coach</h1>
              <p className="text-gray-400">Upload your background, target the role, and get questions tailored to your next job.</p>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3 text-sm">
                <span className="text-primary font-semibold">Step {step} of 4</span>
                <span className="text-gray-400">{['Resume', 'Job Description', 'Role', 'Experience'][step - 1]}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Step 1 — Upload or paste your resume</h2>
                  <p className="text-gray-400">This helps the AI target your strongest skills, projects, and experience.</p>
                </div>

                <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-4 text-sm cursor-pointer hover:bg-primary/10 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploadingResume ? 'Reading resume...' : resumeFileName ? `Uploaded: ${resumeFileName}` : 'Upload a resume file'}
                  <input type="file" accept=".pdf,.txt,.md" className="hidden" onChange={handleResumeUpload} />
                </label>

                {resumeFileName && !showResumeEditor ? (
                  <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
                    <p className="text-sm text-green-400 font-medium mb-2">{resumeStatus || 'Resume imported successfully.'}</p>
                    <p className="text-sm text-gray-300 mb-3">Your CV is already loaded and will be used to personalize the interview.</p>
                    <Button variant="outline" className="text-sm px-4 py-2" onClick={() => setShowResumeEditor(true)}>
                      Review or edit extracted text
                    </Button>
                  </div>
                ) : (
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={10}
                    className={`w-full bg-background border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${errors.resumeText ? 'border-red-500' : 'border-border'}`}
                    placeholder="Paste your resume here only if you want to type it manually or edit the imported text."
                  />
                )}
                {resumeStatus && !resumeFileName && (
                  <p className={`text-sm ${resumeText ? 'text-green-400' : 'text-yellow-300'}`}>
                    {resumeStatus}
                  </p>
                )}
                {resumeFileName && showResumeEditor && (
                  <button
                    type="button"
                    onClick={() => setShowResumeEditor(false)}
                    className="text-sm text-primary hover:underline"
                  >
                    Hide extracted text
                  </button>
                )}
                {errors.resumeText && <p className="text-sm text-red-400">{errors.resumeText}</p>}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Step 2 — Add the job description (optional)</h2>
                  <p className="text-gray-400">If you have the job post, paste it here. If not, you can leave this blank and continue.</p>
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={12}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Optional: paste the full job description or just a few keywords from the role."
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Step 3 — Select your role</h2>
                  <p className="text-gray-400">Choose the role so the questions match the expectations of the hiring team.</p>
                </div>
                <select
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className={`w-full bg-background border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${errors.jobTitle ? 'border-red-500' : 'border-border'}`}
                >
                  <option value="">Select your role...</option>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {errors.jobTitle && <p className="text-sm text-red-400">{errors.jobTitle}</p>}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Step 4 — Set your experience and interview mode</h2>
                  <p className="text-gray-400">We’ll adjust the difficulty, tone, and evaluation style to fit your goals.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Experience level</label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className={`w-full bg-background border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${errors.experienceLevel ? 'border-red-500' : 'border-border'}`}
                    >
                      <option value="">Select level...</option>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Interview type</label>
                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {INTERVIEW_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Interview language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {LANGUAGES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Years of experience</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Example: 4"
                  />
                </div>

                <div className="rounded-xl border border-border bg-card/40 p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={realCompanyMode}
                      onChange={(e) => setRealCompanyMode(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">Enable real company interview mode</span>
                  </label>
                  <p className="text-sm text-gray-400 mt-2">Adds more realistic pressure and higher-signal questions based on your target company.</p>
                </div>

                {realCompanyMode && (
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Target company, e.g. Google, Stripe, Amazon"
                  />
                )}

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Optional focus skills</label>
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={addSkill}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Type a skill and press Enter, e.g. React, SQL, roadmap planning"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {mainSkills.map((skill) => (
                      <span key={skill} className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)}>
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              {step > 1 ? (
                <Button variant="outline" onClick={handleBack} disabled={loading}>
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              ) : (
                <Link href="/dashboard">
                  <Button variant="outline">Cancel</Button>
                </Link>
              )}

              {step < 4 ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleStartInterview} loading={loading}>
                  Start personalized interview
                  {!loading && <Sparkles className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </Card>

          <div className="space-y-6 lg:sticky lg:top-6">
            <Card>
              <h3 className="text-xl font-bold mb-4">Your interview preview</h3>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <FileText className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Resume context</p>
                    <p className="text-gray-400">{resumeText ? 'Loaded and ready for personalization' : 'Add your resume to unlock tailored questions'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Briefcase className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Target role</p>
                    <p className="text-gray-400">{jobTitle || 'Not selected yet'}</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-1">Coach will tailor for:</p>
                  <ul className="text-gray-400 space-y-1 list-disc pl-5">
                    <li>{experienceLevel ? `${experienceLevel} level difficulty` : 'Your experience level'}</li>
                    <li>{interviewType} interview questions</li>
                    <li>{realCompanyMode && targetCompany ? `${targetCompany} style pressure` : 'General hiring manager style'}</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="bg-primary/5 border-primary/30">
              <h3 className="text-lg font-bold mb-2">What you’ll get</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Questions tailored to your resume and target job</li>
                <li>• Ideal answers and STAR-style rewrites</li>
                <li>• Confidence, clarity, and filler-word coaching</li>
                <li>• A progress dashboard to track improvement over time</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
