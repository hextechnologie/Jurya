'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card, LoadingSpinner, Badge } from '@/components/ui'
import { supabase, InterviewSession, InterviewAnswer } from '@/lib/supabase'
import { Sparkles, TrendingUp, Award, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react'
import Link from 'next/link'

export default function SummaryPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [session, setSession] = useState<InterviewSession | null>(null)
  const [answers, setAnswers] = useState<InterviewAnswer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && sessionId) {
      fetchSummary()
    }
  }, [user, sessionId])

  const fetchSummary = async () => {
    try {
      // Fetch session
      const { data: sessionData, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError) throw sessionError

      // Fetch answers
      const { data: answersData, error: answersError } = await supabase
        .from('interview_answers')
        .select('*')
        .eq('session_id', sessionId)
        .order('question_number', { ascending: true })

      if (answersError) throw answersError

      // Calculate overall score
      const scores = answersData?.map((a) => a.score || 0) || []
      const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0

      // Update session with overall score if not already set
      if (!sessionData.overall_score && sessionData.status !== 'completed') {
        await supabase
          .from('interview_sessions')
          .update({
            overall_score: Math.round(avgScore * 10) / 10,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', sessionId)

        sessionData.overall_score = Math.round(avgScore * 10) / 10
      }

      setSession(sessionData)
      setAnswers(answersData || [])
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <p className="text-gray-400">Session introuvable</p>
        </Card>
      </div>
    )
  }

  const allScores = answers.map((a) => a.score || 0)
  const avgScore = allScores.length > 0 ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length : 0
  const highestScore = Math.max(...allScores, 0)
  const lowestScore = Math.min(...allScores.filter((s) => s > 0), 10)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" /> Retour au tableau de bord
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">Jurya</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <Award className="w-20 h-20 text-primary mx-auto mb-4" />
          </div>
          <h1 className="text-5xl font-bold mb-4">Simulation terminée ! 🎉</h1>
          <p className="text-xl text-gray-400">
            {session.job_role} - Niveau {session.difficulty_level}
          </p>
        </div>

        {/* Overall Score Card */}
        <Card className="bg-gradient-primary p-8 text-center mb-12">
          <p className="text-white/80 text-lg mb-2">Score global</p>
          <p className="text-7xl font-bold text-white mb-2">{session.overall_score || avgScore.toFixed(1)}/10</p>
          <div className="flex items-center justify-center gap-2">
            {(session.overall_score || avgScore) >= 7 && (
              <Badge variant="success">Excellente performance</Badge>
            )}
            {(session.overall_score || avgScore) >= 5 && (session.overall_score || avgScore) < 7 && (
              <Badge variant="warning">Bon effort</Badge>
            )}
            {(session.overall_score || avgScore) < 5 && (
              <Badge variant="default">Continuez à vous entraîner</Badge>
            )}
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-1">Meilleur score</p>
              <p className="text-3xl font-bold">{highestScore}/10</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-1">Score le plus bas</p>
              <p className="text-3xl font-bold">{lowestScore}/10</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-1">Questions répondues</p>
              <p className="text-3xl font-bold">{answers.length}</p>
            </div>
          </Card>
        </div>

        {/* Detailed Answers Review */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Revue des réponses</h2>
          <div className="space-y-6">
            {answers.map((answer, index) => (
              <Card key={answer.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="default">Question {answer.question_number}</Badge>
                      <span className="text-2xl font-bold text-primary">
                        {answer.score}/10
                      </span>
                    </div>
                    <p className="text-gray-300 mb-3">{answer.question_text || 'Question de simulation'}</p>
                    <p className="text-sm text-gray-400 italic mb-4">
                      Votre réponse : "{answer.user_answer.substring(0, 150)}..."
                    </p>
                  </div>
                </div>

                {answer.ai_feedback && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div>
                      <h4 className="font-semibold text-green-400 flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        Points forts
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {(answer.ai_feedback as any).strengths?.map((s: string, i: number) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-yellow-400 flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4" />
                        Axes d'amélioration
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {(answer.ai_feedback as any).weaknesses?.map((w: string, i: number) => (
                          <li key={i}>• {w}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-blue-400 flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4" />
                        Réponse améliorée
                      </h4>
                      <p className="text-sm text-gray-300 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                        {(answer.ai_feedback as any).improved_answer}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Key Takeaways */}
        <Card className="bg-primary/5 border-primary/30 p-8 mb-12">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-primary" />
            Conseils clés pour progresser
          </h3>
          <ul className="space-y-3 text-gray-300">
            <li>• Examinez les exemples de réponses améliorées pour comprendre les meilleures structures de réponse</li>
            <li>• Concentrez-vous sur des exemples concrets tirés de votre expérience</li>
            <li>• Travaillez les domaines où vous avez obtenu les scores les plus bas</li>
            <li>• Utilisez la méthode STAR (Situation, Tâche, Action, Résultat) pour les questions comportementales</li>
            <li>• Planifiez des sessions d'entraînement régulières pour renforcer votre confiance</li>
          </ul>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Link href="/simulation/setup">
            <Button variant="primary" className="text-lg">
              Lancer une nouvelle simulation
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="text-lg">
              Retour au tableau de bord
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
