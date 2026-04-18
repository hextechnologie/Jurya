'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter, useParams } from 'next/navigation'
import { Badge, Button, Card, LoadingSpinner } from '@/components/ui'
import { Sparkles, Send, CheckCircle, Mic, MicOff, RotateCcw, VolumeX, SkipForward, Copy, Share2, Languages } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { AnimatedScoreRing } from '@/components/feedback/AnimatedScoreRing'
import { MetricBar } from '@/components/feedback/MetricBar'
import { AchievementBadge } from '@/components/feedback/AchievementBadge'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

type FeedbackData = {
  score: number
  strengths: string[]
  weaknesses: string[]
  ideal_answer?: string
  improved_answer: string
  quick_fix?: string
  difference_points?: string[]
  language?: string
  metrics?: {
    confidence: number
    clarity: number
    filler_words: number
    star_method_score?: number
    keywords_used?: number
    answer_length?: 'Too Short' | 'Perfect' | 'Too Long'
    tone?: 'Professional 🎯' | 'Casual 😊' | 'Nervous 😰'
  }
}

type Message = {
  role: 'user' | 'assistant' | 'feedback'
  content: string
  feedback?: FeedbackData
}

const UI_TEXT = {
  en: {
    strengths: 'Strengths',
    areas: 'Areas to Improve',
    quickFix: 'Quick Fix',
    showIdeal: 'Show Ideal Answer',
    improve: 'Improve My Answer',
    improvedAnswer: 'Improved Answer',
    tryAgain: 'Try Again',
    next: 'Next Question',
    copy: 'Copy Feedback',
    share: 'Share on LinkedIn',
    yourAnswer: 'Your Answer',
    idealAnswer: 'Ideal Answer',
    whatsDifferent: "What's Different?",
    confidence: 'Confidence',
    clarity: 'Clarity',
    fillerWords: 'Filler Words',
    keywordsUsed: 'Keywords Used',
    starMethod: 'STAR Method Score',
    tone: 'Tone',
    scoreLabel: 'Score',
    needsWork: 'Needs Work',
    gettingThere: 'Getting There',
    excellent: 'Excellent!',
    achievements: 'Achievements',
    firstInterview: 'First Interview',
    passingScore: 'Passing Score',
    excellenceBadge: 'Excellence',
    onFire: 'On Fire',
    viewSummary: 'View Summary',
    copied: 'Copied! ✅',
    motivationLow: (points: number) => `You are ${points} points away from a passing score! 💪`,
    motivationHigh: 'Great job! Can you beat your score next time? 🏆',
  },
  fr: {
    strengths: 'Points forts',
    areas: 'Axes d’amélioration',
    quickFix: 'Correction rapide',
    showIdeal: 'Voir la réponse idéale',
    improve: 'Améliorer ma réponse',
    improvedAnswer: 'Réponse améliorée',
    tryAgain: 'Réessayer',
    next: 'Question suivante',
    copy: 'Copier le feedback',
    share: 'Partager sur LinkedIn',
    yourAnswer: 'Votre réponse',
    idealAnswer: 'Réponse idéale',
    whatsDifferent: 'Quelle est la différence ?',
    confidence: 'Confiance',
    clarity: 'Clarté',
    fillerWords: 'Mots de remplissage',
    keywordsUsed: 'Mots-clés utilisés',
    starMethod: 'Score méthode STAR',
    tone: 'Ton',
    scoreLabel: 'Score',
    needsWork: 'À améliorer',
    gettingThere: 'Bon progrès',
    excellent: 'Excellent !',
    achievements: 'Succès',
    firstInterview: 'Premier entretien',
    passingScore: 'Score validé',
    excellenceBadge: 'Excellence',
    onFire: 'En pleine forme',
    viewSummary: 'Voir le résumé',
    copied: 'Copié ! ✅',
    motivationLow: (points: number) => `Il vous manque ${points} points pour atteindre un score satisfaisant ! 💪`,
    motivationHigh: 'Très bon travail ! Pouvez-vous faire encore mieux la prochaine fois ? 🏆',
  },
  ar: {
    strengths: 'نقاط القوة',
    areas: 'نقاط التحسين',
    quickFix: 'إصلاح سريع',
    showIdeal: 'عرض الإجابة المثالية',
    improve: 'حسّن إجابتي',
    improvedAnswer: 'الإجابة المحسّنة',
    tryAgain: 'حاول مرة أخرى',
    next: 'السؤال التالي',
    copy: 'نسخ الملاحظات',
    share: 'مشاركة على لينكدإن',
    yourAnswer: 'إجابتك',
    idealAnswer: 'الإجابة المثالية',
    whatsDifferent: 'ما الفرق؟',
    confidence: 'الثقة',
    clarity: 'الوضوح',
    fillerWords: 'الكلمات الحشوية',
    keywordsUsed: 'الكلمات المفتاحية المستخدمة',
    starMethod: 'درجة STAR',
    tone: 'النبرة',
    scoreLabel: 'النتيجة',
    needsWork: 'بحاجة لتحسين',
    gettingThere: 'تقدّم جيد',
    excellent: 'ممتاز!',
    achievements: 'الإنجازات',
    firstInterview: 'أول مقابلة',
    passingScore: 'درجة نجاح',
    excellenceBadge: 'تميّز',
    onFire: 'أداء رائع',
    viewSummary: 'عرض الملخص',
    copied: 'تم النسخ ✅',
    motivationLow: (points: number) => `أنت بحاجة إلى ${points} نقاط للوصول إلى درجة النجاح! 💪`,
    motivationHigh: 'أحسنت! هل يمكنك تحقيق نتيجة أفضل في المرة القادمة؟ 🏆',
  },
} as const

export default function InterviewPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [messages, setMessages] = useState<Message[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [waitingForFeedback, setWaitingForFeedback] = useState(false)
  const [hasLoadedFirstQuestion, setHasLoadedFirstQuestion] = useState(false)
  const [revealedFeedback, setRevealedFeedback] = useState<Record<number, { ideal: boolean; improved: boolean }>>({})
  const [isListening, setIsListening] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(true)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [feedbackLanguage, setFeedbackLanguage] = useState<'en' | 'fr' | 'ar'>('en')
  const [translating, setTranslating] = useState(false)
  const [previousSessionScore, setPreviousSessionScore] = useState<number | null>(null)
  const [recentScores, setRecentScores] = useState<number[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isLoadingQuestionRef = useRef(false)
  const recognitionRef = useRef<any>(null)

  const t = UI_TEXT[feedbackLanguage]
  const awaitingChoice = messages[messages.length - 1]?.role === 'feedback'

  const stopAudioPlayback = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    } catch {}

    setIsListening(false)

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && sessionId) {
      fetchSession()
    }
  }, [user, sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
      } catch {}

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    const latestAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant')

    if (speechEnabled && latestAssistantMessage && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(latestAssistantMessage.content)
      utterance.rate = 0.95
      utterance.pitch = 1
      utterance.lang = session?.interview_config?.language === 'fr' ? 'fr-FR' : session?.interview_config?.language === 'ar' ? 'ar-SA' : session?.interview_config?.language === 'es' ? 'es-ES' : 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }, [messages, speechEnabled, session])

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/interview/${sessionId}`)
      const data = await response.json()

      if (data.session) {
        setSession(data.session)
        setQuestionCount(data.session.questions_answered)
        setFeedbackLanguage((data.session.interview_config?.language || 'en').startsWith('fr') ? 'fr' : (data.session.interview_config?.language || 'en').startsWith('ar') ? 'ar' : 'en')

        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages)
          setHasLoadedFirstQuestion(true)
        } else if (!hasLoadedFirstQuestion) {
          setHasLoadedFirstQuestion(true)
          getNextQuestion()
        }
      }

      if (user) {
        const { data: previousSessions } = await supabase
          .from('interview_sessions')
          .select('overall_score')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .neq('id', sessionId)
          .order('completed_at', { ascending: false })
          .limit(5)

        const scores = (previousSessions || [])
          .map((item) => Number(item.overall_score || 0))
          .filter((score) => !Number.isNaN(score) && score > 0)

        setPreviousSessionScore(scores[0] ?? null)
        setRecentScores(scores)
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    }
  }

  const getNextQuestion = async () => {
    if (isLoadingQuestionRef.current || loading) return

    isLoadingQuestionRef.current = true
    setLoading(true)

    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/interview/question', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to get question')
        return
      }

      if (data.question) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.question }])
        setQuestionCount(data.questionNumber)
        setSessionComplete(false)
      }

      if (data.completed) {
        setSessionComplete(true)
      }
    } catch (error) {
      console.error('Error getting question:', error)
      toast.error('Failed to get next question')
    } finally {
      setLoading(false)
      isLoadingQuestionRef.current = false
    }
  }

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || waitingForFeedback || awaitingChoice) return

    const answer = currentAnswer.trim()
    const lastQuestion = messages.slice().reverse().find((m) => m.role === 'assistant')
    const questionText = lastQuestion?.content || ''

    setCurrentAnswer('')
    setMessages((prev) => [...prev, { role: 'user', content: answer }])
    setWaitingForFeedback(true)
    setLoading(true)

    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sessionId,
          answer,
          questionNumber: questionCount,
          questionText,
        }),
      })

      const data = await response.json()

      if (data.feedback) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'feedback',
            content: 'Feedback received',
            feedback: data.feedback,
          },
        ])

        setSessionComplete(Boolean(data.completed))
        if (data.completed) {
          toast.success('Interview complete! Your summary email is on the way.')
        }
      } else {
        toast.error('No feedback was returned for this answer.')
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      toast.error('Failed to submit answer')
    } finally {
      setWaitingForFeedback(false)
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitAnswer()
    }
  }

  const toggleFeedbackPanel = (messageIndex: number, panel: 'ideal' | 'improved') => {
    setRevealedFeedback((prev) => ({
      ...prev,
      [messageIndex]: {
        ideal: panel === 'ideal' ? !prev[messageIndex]?.ideal : !!prev[messageIndex]?.ideal,
        improved: panel === 'improved' ? !prev[messageIndex]?.improved : !!prev[messageIndex]?.improved,
      },
    }))
  }

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.')
      return
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    const languageMap: Record<string, string> = {
      en: 'en-US',
      fr: 'fr-FR',
      es: 'es-ES',
      ar: 'ar-SA',
    }

    const recognition = new SpeechRecognition()
    recognition.lang = languageMap[session?.interview_config?.language || 'en'] || 'en-US'
    recognition.interimResults = true
    recognition.continuous = true

    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setCurrentAnswer(transcript.trim())
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const replayLastQuestion = () => {
    const lastQuestion = [...messages].reverse().find((message) => message.role === 'assistant')
    if (!lastQuestion || typeof window === 'undefined' || !('speechSynthesis' in window) || !speechEnabled) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(lastQuestion.content)
    utterance.rate = 0.95
    utterance.lang = session?.interview_config?.language === 'fr' ? 'fr-FR' : session?.interview_config?.language === 'ar' ? 'ar-SA' : session?.interview_config?.language === 'es' ? 'es-ES' : 'en-US'
    window.speechSynthesis.speak(utterance)
  }

  const toggleSpeech = () => {
    stopAudioPlayback()
    setSpeechEnabled((prev) => !prev)
  }

  const handleTryAgain = () => {
    setActionLoading('retry')
    setMessages((prev) => {
      const lastAssistantIndex = prev.map((item, idx) => (item.role === 'assistant' ? idx : -1)).filter((idx) => idx >= 0).pop()
      return typeof lastAssistantIndex === 'number' ? prev.slice(0, lastAssistantIndex + 1) : prev
    })
    setCurrentAnswer('')
    setSessionComplete(false)
    setTimeout(() => setActionLoading(null), 300)
    toast.success('You can try the same question again now.')
  }

  const handleNextQuestion = async () => {
    setActionLoading('next')
    if (sessionComplete) {
      stopAudioPlayback()
      router.push(`/interview/summary/${sessionId}`)
      return
    }

    stopAudioPlayback()
    await getNextQuestion()
    setActionLoading(null)
  }

  const copyFeedback = async (feedback: FeedbackData) => {
    try {
      await navigator.clipboard.writeText([
        `Score: ${feedback.score}/10`,
        `Strengths: ${feedback.strengths.join('; ')}`,
        `Areas to improve: ${feedback.weaknesses.join('; ')}`,
        `Quick fix: ${feedback.quick_fix || ''}`,
        `Improved answer: ${feedback.improved_answer}`,
      ].join('\n'))
      toast.success(t.copied)
    } catch {
      toast.error('Copy failed')
    }
  }

  const shareOnLinkedIn = (feedback: FeedbackData) => {
    const shareText = encodeURIComponent(`I just scored ${feedback.score}/10 on an AI mock interview for ${session?.job_role || 'my role'}! Practicing with Interview Coach 🎯`)
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${shareText}`, '_blank', 'noopener,noreferrer')
  }

  const translateAllFeedback = async (targetLanguage: 'en' | 'fr' | 'ar') => {
    try {
      setTranslating(true)
      const translatedMessages = await Promise.all(
        messages.map(async (message) => {
          if (message.role !== 'feedback' || !message.feedback) return message

          const response = await fetch('/api/interview/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              feedback: message.feedback,
              targetLanguage,
            }),
          })

          const data = await response.json()
          return {
            ...message,
            feedback: data.feedback || message.feedback,
          }
        })
      )

      setMessages(translatedMessages)
      setFeedbackLanguage(targetLanguage)
      toast.success(`Feedback switched to ${targetLanguage.toUpperCase()}`)
    } catch (error) {
      console.error('Translate feedback error:', error)
      toast.error('Translation failed')
    } finally {
      setTranslating(false)
    }
  }

  const buildAchievements = (score: number) => {
    const onFireUnlocked = [score, ...recentScores].slice(0, 3).length === 3 && [score, ...recentScores].slice(0, 3).every((item) => item >= 7)

    return [
      { icon: '🥉', label: t.firstInterview, unlocked: recentScores.length + 1 >= 1, highlight: recentScores.length === 0 },
      { icon: '🥈', label: t.passingScore, unlocked: score > 5, highlight: score > 5 && !recentScores.some((item) => item > 5) },
      { icon: '🥇', label: t.excellenceBadge, unlocked: score > 8, highlight: score > 8 && !recentScores.some((item) => item > 8) },
      { icon: '🔥', label: t.onFire, unlocked: onFireUnlocked, highlight: onFireUnlocked },
    ]
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">Interview Coach</span>
            </Link>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              {session && (
                <div className="text-right mr-2">
                  <p className="text-sm text-gray-400">Question {questionCount} of ~6</p>
                  <p className="text-sm font-semibold">{session.job_role} • {session.difficulty_level} • {session.interview_config?.interviewType || 'Mixed'}</p>
                </div>
              )}
              <div className="flex items-center gap-1 rounded-xl border border-border bg-card/70 p-1">
                <Languages className="w-4 h-4 text-primary ml-1" />
                {(['en', 'fr', 'ar'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    disabled={translating}
                    onClick={() => translateAllFeedback(lang)}
                    className={`rounded-lg px-2 py-1 text-xs font-semibold transition-all ${feedbackLanguage === lang ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/10'}`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-6 py-8 flex flex-col max-w-5xl">
        <div className="flex-1 overflow-y-auto mb-6 space-y-6">
          {messages.map((message, index) => (
            <div key={index} className="animate-fadeIn">
              {message.role === 'assistant' && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <Card className="flex-1 bg-gradient-to-br from-primary/10 via-card/50 to-card/30 border-primary/20 shadow-lg">
                    <div className="flex justify-end gap-2 mb-3">
                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={toggleSpeech}>
                        <VolumeX className="w-3 h-3" />
                        {speechEnabled ? 'Mute' : 'Unmute'}
                      </Button>
                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={replayLastQuestion} disabled={!speechEnabled}>
                        <RotateCcw className="w-3 h-3" />
                        Replay Question
                      </Button>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      {message.content.split('\n\n').map((paragraph, idx) => (
                        paragraph.trim() ? <p key={idx} className="text-gray-200 leading-relaxed mb-2">{paragraph}</p> : null
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {message.role === 'user' && (
                <div className="flex gap-4 justify-end">
                  <Card className="bg-primary/10 border-primary/30 max-w-2xl">
                    <p className="text-foreground whitespace-pre-wrap">{message.content}</p>
                  </Card>
                </div>
              )}

              {message.role === 'feedback' && message.feedback && (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <Card className="flex-1 bg-green-500/5 border-green-500/30">
                    <div className="space-y-5">
                      <div className="grid gap-6 lg:grid-cols-[220px_1fr] items-start">
                        <AnimatedScoreRing
                          score={message.feedback.score}
                          previousDelta={previousSessionScore !== null ? Number((message.feedback.score - previousSessionScore).toFixed(1)) : null}
                          scoreLabel={t.scoreLabel}
                          needsWorkLabel={t.needsWork}
                          gettingThereLabel={t.gettingThere}
                          excellentLabel={t.excellent}
                          deltaText={(delta) => feedbackLanguage === 'fr'
                            ? `Vous avez progressé de ${delta >= 0 ? '+' : ''}${delta} points par rapport à la dernière session ! 📈`
                            : feedbackLanguage === 'ar'
                              ? `لقد تحسّنت بمقدار ${delta >= 0 ? '+' : ''}${delta} نقطة مقارنة بالجلسة السابقة! 📈`
                              : `You improved ${delta >= 0 ? '+' : ''}${delta} points from last session! 📈`}
                        />

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            <MetricBar label={t.confidence} value={message.feedback.metrics?.confidence || 0} />
                            <MetricBar label={t.clarity} value={message.feedback.metrics?.clarity || 0} colorClass="from-blue-400 to-cyan-500" />
                            <MetricBar label={t.starMethod} value={message.feedback.metrics?.star_method_score || 0} max={10} suffix="/10" colorClass="from-violet-400 to-purple-500" />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="rounded-xl border border-border p-3 bg-background/40">
                              <p className="text-sm text-gray-400 mb-1">{t.fillerWords}</p>
                              <p className="text-2xl font-bold text-yellow-300">{message.feedback.metrics?.filler_words || 0}</p>
                            </div>
                            <div className="rounded-xl border border-border p-3 bg-background/40">
                              <p className="text-sm text-gray-400 mb-1">{t.keywordsUsed}</p>
                              <p className="text-2xl font-bold text-primary">{message.feedback.metrics?.keywords_used || 0}</p>
                            </div>
                            <div className="rounded-xl border border-border p-3 bg-background/40 flex flex-col gap-2">
                              <p className="text-sm text-gray-400">{t.tone}</p>
                              <Badge variant={(message.feedback.metrics?.tone || '').includes('🎯') ? 'success' : (message.feedback.metrics?.tone || '').includes('😰') ? 'warning' : 'default'}>
                                {message.feedback.metrics?.tone || 'Professional 🎯'}
                              </Badge>
                              <Badge variant={message.feedback.metrics?.answer_length === 'Perfect' ? 'success' : 'warning'}>
                                {message.feedback.metrics?.answer_length || 'Perfect'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-green-400 mb-2">{t.strengths}</h4>
                        <ul className="space-y-1 text-sm text-gray-300">
                          {message.feedback.strengths.map((strength, i) => (
                            <li key={i}>• {strength}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-yellow-400 mb-2">{t.areas}</h4>
                        <ul className="space-y-1 text-sm text-gray-300">
                          {message.feedback.weaknesses.map((weakness, i) => (
                            <li key={i}>• {weakness}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-violet-500/15 to-blue-500/15 p-4">
                        <h4 className="mb-1 flex items-center gap-2 font-semibold text-primary">💡 {t.quickFix}</h4>
                        <p className="text-sm text-gray-200">{message.feedback.quick_fix || 'Start your answer with the situation, explain your action, then the result.'}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <Button variant="outline" className="hover:shadow-[0_0_18px_rgba(139,92,246,0.45)]" onClick={() => toggleFeedbackPanel(index, 'ideal')}>
                          {t.showIdeal}
                        </Button>
                        <Button variant="outline" className="hover:shadow-[0_0_18px_rgba(139,92,246,0.45)]" onClick={() => toggleFeedbackPanel(index, 'improved')}>
                          {t.improve}
                        </Button>
                        <Button variant="outline" className="hover:shadow-[0_0_18px_rgba(139,92,246,0.45)]" onClick={handleTryAgain} loading={actionLoading === 'retry'}>
                          <RotateCcw className="w-4 h-4" />
                          {t.tryAgain}
                        </Button>
                        <Button variant="outline" className="hover:shadow-[0_0_18px_rgba(139,92,246,0.45)]" onClick={handleNextQuestion} loading={actionLoading === 'next'}>
                          <SkipForward className="w-4 h-4" />
                          {sessionComplete ? t.viewSummary : t.next}
                        </Button>
                        <Button variant="outline" className="hover:shadow-[0_0_18px_rgba(139,92,246,0.45)]" onClick={() => copyFeedback(message.feedback!)}>
                          <Copy className="w-4 h-4" />
                          {t.copy}
                        </Button>
                        <Button variant="outline" className="hover:shadow-[0_0_18px_rgba(139,92,246,0.45)]" onClick={() => shareOnLinkedIn(message.feedback!)}>
                          <Share2 className="w-4 h-4" />
                          {t.share}
                        </Button>
                      </div>

                      {revealedFeedback[index]?.ideal && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                              <h4 className="font-semibold text-red-300 mb-2">{t.yourAnswer}</h4>
                              <p className="text-sm text-gray-300 whitespace-pre-wrap">{messages[index - 1]?.role === 'user' ? messages[index - 1].content : 'Your latest answer appears here.'}</p>
                            </div>
                            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
                              <h4 className="font-semibold text-green-300 mb-2">{t.idealAnswer}</h4>
                              <p className="text-sm text-gray-200 whitespace-pre-wrap">{message.feedback.ideal_answer || 'No ideal answer available yet.'}</p>
                            </div>
                          </div>

                          <div>
                            <h5 className="font-semibold text-primary mb-2">{t.whatsDifferent}</h5>
                            <ul className="space-y-1 text-sm text-gray-300">
                              {(message.feedback.difference_points || []).map((point, pointIndex) => (
                                <li key={pointIndex}>• {point}</li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}

                      {revealedFeedback[index]?.improved && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                          <h4 className="font-semibold text-primary mb-2">{t.improvedAnswer}</h4>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">{message.feedback.improved_answer}</p>
                        </motion.div>
                      )}

                      <div className="rounded-xl border border-border p-4 bg-background/40">
                        <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className={`h-full ${message.feedback.score >= 7 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (message.feedback.score / 10) * 100)}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                        <p className="text-sm text-gray-200">
                          {message.feedback.score < 7
                            ? t.motivationLow(Math.max(0, 7 - message.feedback.score))
                            : t.motivationHigh}
                        </p>
                      </div>

                      <div>
                        <h4 className="mb-3 font-semibold text-primary">{t.achievements}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {buildAchievements(message.feedback.score).map((badge) => (
                            <AchievementBadge key={badge.label} {...badge} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <Card className="flex-1 bg-card/50">
                <div className="flex items-center gap-3">
                  <LoadingSpinner size="sm" />
                  <span className="text-gray-400">Thinking...</span>
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <Card className="bg-card/80 backdrop-blur">
          <div className="flex gap-3">
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your answer here or use the microphone..."
              disabled={loading || waitingForFeedback || awaitingChoice}
              rows={3}
              className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:opacity-50"
            />
            <div className="flex flex-col gap-2 self-end">
              <Button
                variant={isListening ? 'danger' : 'outline'}
                onClick={toggleVoiceInput}
                disabled={loading || waitingForFeedback || awaitingChoice}
                className="px-4"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitAnswer}
                disabled={!currentAnswer.trim() || loading || waitingForFeedback || awaitingChoice}
                className="px-4"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tip: Use the microphone or type your answer, then choose Try Again or Next Question after feedback appears.
          </p>
        </Card>
      </div>
    </div>
  )
}
