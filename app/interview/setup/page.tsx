'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Button, Card, LoadingSpinner } from '@/components/ui'
import { Sparkles, ChevronRight, ChevronLeft, Upload, Briefcase, FileText, ShieldCheck, X } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const ROLES = [
  'Administrateur territorial',
  'Attaché territorial',
  'Rédacteur territorial',
  'Ingénieur territorial',
  'Technicien territorial',
  'Inspecteur des finances publiques',
  'Inspecteur des douanes',
  'Commissaire de police',
  'Magistrat',
  'Autre',
]

const EXPERIENCE_LEVELS = ['junior', 'mid', 'senior']
const INTERVIEW_TYPES = ['Technique', 'Culture générale', 'Mixte']
const LANGUAGES = ['Français', 'English', 'Español', 'العربية']

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
      nextErrors.resumeText = 'Collez ou importez suffisamment de contenu de CV pour personnaliser votre simulation.'
    }


    if (currentStep === 3 && !jobTitle) {
      nextErrors.jobTitle = 'Sélectionnez le concours que vous préparez.'
    }

    if (currentStep === 4 && !experienceLevel) {
      nextErrors.experienceLevel = 'Choisissez votre niveau d\'expérience.'
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
        setResumeStatus('Ce type de fichier n\'est pas encore pris en charge. Veuillez importer un PDF ou coller votre texte de CV.')
        return
      }

      if (!text || text.trim().length < 30) {
        setResumeText('')
        setResumeStatus('Impossible d\'extraire suffisamment de texte lisible de ce fichier. Veuillez coller votre CV ou utiliser un PDF textuel.')
        return
      }

      setResumeText(text)
      setResumeStatus('CV importé avec succès. Aucune saisie supplémentaire n\'est nécessaire sauf si vous souhaitez le modifier.')
      setErrors((prev) => ({ ...prev, resumeText: '' }))
    } catch (error) {
      console.error('Resume upload error:', error)
      setResumeText('')
      setResumeStatus('Ce CV n\'a pas pu être analysé. Veuillez coller votre texte de CV ou utiliser un PDF textuel.')
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
          language: language === 'Français' ? 'fr' : language === 'English' ? 'en' : language === 'Español' ? 'es' : language === 'العربية' ? 'ar' : 'fr',
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
        alert(data.error || 'Échec de la création de la simulation')
        return
      }

      if (data.sessionId) {
        router.push(`/interview/${data.sessionId}`)
      }
    } catch (error) {
      console.error('Error creating interview:', error)
      alert('Échec de la création de la simulation. Veuillez réessayer.')
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
            <h1 className="text-3xl font-bold mb-3">Complétez votre profil d'abord</h1>
            <p className="text-gray-400 mb-6">
              Avant de commencer une simulation, vous devez compléter votre profil avec votre titre professionnel, votre présentation, votre expérience, votre formation et vos compétences.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/profile">
                <Button variant="primary">Compléter le profil</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Retour au tableau de bord</Button>
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
            <h1 className="text-3xl font-bold mb-3">Vous avez utilisé toutes vos sessions gratuites</h1>
            <p className="text-gray-400 mb-6">
              Passez à un plan supérieur pour débloquer plus de simulations personnalisées, des analyses approfondies et un coaching continu.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/pricing">
                <Button variant="primary">Voir les tarifs</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Retour au tableau de bord</Button>
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
              <ChevronLeft className="w-4 h-4" /> Retour au tableau de bord
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">Jurya</span>
            </Link>
          </div>
          <p className="text-sm text-gray-400">Forfait gratuit : {profile?.interviews_used_this_month || 0} / {profile?.interviews_limit || 3} sessions utilisées</p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-6xl">
        <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-6 items-start">
          <Card className="p-6 md:p-8 transition-all duration-300">
            <div className="mb-8">
              <p className="text-primary text-sm font-semibold mb-2">CONFIGURATION PERSONNALISÉE</p>
              <h1 className="text-4xl font-bold mb-2">Configurez votre simulation d'oral</h1>
              <p className="text-gray-400">Importez votre parcours, ciblez le concours, et obtenez des questions adaptées à votre préparation.</p>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3 text-sm">
                <span className="text-primary font-semibold">Étape {step} sur 4</span>
                <span className="text-gray-400">{['CV', 'Description du concours', 'Concours', 'Expérience'][step - 1]}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Étape 1 — Importez ou collez votre CV</h2>
                  <p className="text-gray-400">Cela aide l'IA à cibler vos compétences, projets et expériences les plus pertinents.</p>
                </div>

                <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-4 text-sm cursor-pointer hover:bg-primary/10 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploadingResume ? 'Lecture du CV...' : resumeFileName ? `Importé : ${resumeFileName}` : 'Importer un fichier CV'}
                  <input type="file" accept=".pdf,.txt,.md" className="hidden" onChange={handleResumeUpload} />
                </label>

                {resumeFileName && !showResumeEditor ? (
                  <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
                    <p className="text-sm text-green-400 font-medium mb-2">{resumeStatus || 'CV importé avec succès.'}</p>
                    <p className="text-sm text-gray-300 mb-3">Votre CV est déjà chargé et sera utilisé pour personnaliser la simulation.</p>
                    <Button variant="outline" className="text-sm px-4 py-2" onClick={() => setShowResumeEditor(true)}>
                      Vérifier ou modifier le texte extrait
                    </Button>
                  </div>
                ) : (
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={10}
                    className={`w-full bg-background border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${errors.resumeText ? 'border-red-500' : 'border-border'}`}
                    placeholder="Collez votre CV ici uniquement si vous souhaitez le saisir manuellement ou modifier le texte importé."
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
                    Masquer le texte extrait
                  </button>
                )}
                {errors.resumeText && <p className="text-sm text-red-400">{errors.resumeText}</p>}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Étape 2 — Ajoutez la description du concours (optionnel)</h2>
                  <p className="text-gray-400">Si vous avez la fiche du concours, collez-la ici. Sinon, laissez ce champ vide et continuez.</p>
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={12}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Optionnel : collez la description complète du concours ou quelques mots-clés."
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Étape 3 — Sélectionnez votre concours</h2>
                  <p className="text-gray-400">Choisissez le concours pour que les questions correspondent aux attentes du jury.</p>
                </div>
                <select
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className={`w-full bg-background border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${errors.jobTitle ? 'border-red-500' : 'border-border'}`}
                >
                  <option value="">Sélectionnez votre concours...</option>
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
                  <h2 className="text-2xl font-bold mb-2">Étape 4 — Définissez votre expérience et le mode de simulation</h2>
                  <p className="text-gray-400">Nous ajusterons la difficulté, le ton et le style d'évaluation selon vos objectifs.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Niveau d'expérience</label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className={`w-full bg-background border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${errors.experienceLevel ? 'border-red-500' : 'border-border'}`}
                    >
                      <option value="">Sélectionnez un niveau...</option>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Type d'épreuve</label>
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
                    <label className="block text-sm text-gray-300 mb-2">Langue de la simulation</label>
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
                  <label className="block text-sm text-gray-300 mb-2">Années d'expérience</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Exemple : 4"
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
                    <span className="font-medium">Activer le mode entretien réel</span>
                  </label>
                  <p className="text-sm text-gray-400 mt-2">Ajoute plus de pression réaliste et des questions ciblées basées sur votre objectif.</p>
                </div>

                {realCompanyMode && (
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Organisme cible, ex. ÉNA, INET, CNFPT"
                  />
                )}

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Compétences à cibler (optionnel)</label>
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={addSkill}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tapez une compétence et appuyez sur Entrée, ex. Droit public, Management, Finances"
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
                  <Button variant="outline">Annuler</Button>
                </Link>
              )}

              {step < 4 ? (
                <Button onClick={handleNext}>
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleStartInterview} loading={loading}>
                  Lancer la simulation personnalisée
                  {!loading && <Sparkles className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </Card>

          <div className="space-y-6 lg:sticky lg:top-6">
            <Card>
              <h3 className="text-xl font-bold mb-4">Aperçu de votre simulation</h3>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <FileText className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Contexte CV</p>
                    <p className="text-gray-400">{resumeText ? 'Chargé et prêt pour la personnalisation' : 'Ajoutez votre CV pour débloquer des questions personnalisées'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Briefcase className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Concours visé</p>
                    <p className="text-gray-400">{jobTitle || 'Pas encore sélectionné'}</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-1">Le jury adaptera pour :</p>
                  <ul className="text-gray-400 space-y-1 list-disc pl-5">
                    <li>{experienceLevel ? `Difficulté niveau ${experienceLevel}` : 'Votre niveau d\'expérience'}</li>
                    <li>Questions de type {interviewType}</li>
                    <li>{realCompanyMode && targetCompany ? `Style pression ${targetCompany}` : 'Style jury général'}</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="bg-primary/5 border-primary/30">
              <h3 className="text-lg font-bold mb-2">Ce que vous obtiendrez</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Questions adaptées à votre CV et au concours visé</li>
                <li>• Réponses idéales et reformulations structurées</li>
                <li>• Coaching sur la confiance, la clarté et les mots de remplissage</li>
                <li>• Un tableau de bord pour suivre votre progression</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
