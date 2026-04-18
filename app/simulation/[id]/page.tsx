'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import {
  useSpeechRecognition, useAudioRecorder, useJuryVoice, useSimulationTimer,
} from '@/lib/hooks/useVoice'
import {
  SimulationPhase, SimulationTurn, getPhaseLabel,
  countFillerWords, calculateSpeakingPace,
} from '@/lib/types/simulation'
import {
  Mic, MicOff, Send, StopCircle, Clock, MessageSquare,
  AlertTriangle, Volume2, Sparkles,
} from 'lucide-react'
import Link from 'next/link'

interface ConcoursData {
  id: string
  intitulé: string
  durée_épreuve_minutes: number
  rubrique_jury: Record<string, unknown>
  type: string
}

interface SimulationData {
  id: string
  concours_id: string
  simulation_config: {
    difficulty: string
    useVoice: boolean
    concoursIntitulé: string
    rubriqueJury: Record<string, unknown>
  }
  planned_duration_seconds: number
  sujet_tirage: string | null
  status: string
}

export default function SimulationSessionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const simulationId = params.id as string

  // --- Data ---
  const [simulation, setSimulation] = useState<SimulationData | null>(null)
  const [concours, setConcours] = useState<ConcoursData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Conversation ---
  const [turns, setTurns] = useState<SimulationTurn[]>([])
  const [phase, setPhase] = useState<SimulationPhase>('exposé_libre')
  const [turnIndex, setTurnIndex] = useState(0)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [textInput, setTextInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // --- Voice hooks ---
  const speech = useSpeechRecognition()
  const recorder = useAudioRecorder()
  const juryVoice = useJuryVoice()
  const timer = useSimulationTimer(30 * 60) // Default, reset on load

  // --- Prosody ---
  const [fillerCount, setFillerCount] = useState(0)
  const [speakingPace, setSpeakingPace] = useState(0)

  // --- Phase transition ---
  const [showPhaseOverlay, setShowPhaseOverlay] = useState(false)
  const [phaseOverlayText, setPhaseOverlayText] = useState('')

  const useVoice = simulation?.simulation_config?.useVoice ?? true

  // Scroll to bottom on new turn
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, speech.interimTranscript])

  // Update filler words / pace from live transcript
  useEffect(() => {
    if (speech.transcript) {
      setFillerCount(countFillerWords(speech.transcript))
      if (timer.elapsed > 0) {
        setSpeakingPace(calculateSpeakingPace(speech.transcript, timer.elapsed * 1000))
      }
    }
  }, [speech.transcript, timer.elapsed])

  // --- Fetch simulation + concours on mount ---
  useEffect(() => {
    async function load() {
      if (!simulationId) return
      const { data: sim, error: simErr } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', simulationId)
        .single()

      if (simErr || !sim) {
        setError('Simulation introuvable.')
        setLoading(false)
        return
      }
      setSimulation(sim)

      const { data: conc } = await supabase
        .from('concours')
        .select('id, intitulé, durée_épreuve_minutes, rubrique_jury, type')
        .eq('id', sim.concours_id)
        .single()

      if (conc) setConcours(conc)

      // Reset timer with planned duration
      const totalSec = sim.planned_duration_seconds || 30 * 60
      timer.reset(totalSec)

      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationId])

  // --- Start session: add initial jury message ---
  useEffect(() => {
    if (!simulation || !concours || loading || turns.length > 0) return

    const opener = simulation.sujet_tirage
      ? `Bienvenue. Le sujet de votre exposé est : « ${simulation.sujet_tirage} ». Vous disposez de ${Math.floor((simulation.planned_duration_seconds || 1800) / 60)} minutes. Vous pouvez commencer votre exposé libre.`
      : `Bienvenue. Vous disposez de ${Math.floor((simulation.planned_duration_seconds || 1800) / 60)} minutes pour cette épreuve. Commencez par votre exposé libre de 5 minutes : présentez votre parcours, vos motivations et votre projet professionnel.`

    const firstTurn: SimulationTurn = {
      turnIndex: 0,
      role: 'jury',
      contentText: opener,
      phase: 'exposé_libre',
      startedAt: new Date().toISOString(),
    }
    setTurns([firstTurn])
    setTurnIndex(1)
    timer.start()

    if (useVoice) {
      juryVoice.speak(opener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulation, concours, loading])

  // --- Phase transition overlay ---
  const triggerPhaseOverlay = (text: string) => {
    setPhaseOverlayText(text)
    setShowPhaseOverlay(true)
    setTimeout(() => setShowPhaseOverlay(false), 2000)
  }

  // --- Submit candidate answer ---
  const submitCandidateAnswer = useCallback(async (text: string) => {
    if (!text.trim() || !simulation || !concours || isAiThinking) return

    // Add candidate turn
    const candidateTurn: SimulationTurn = {
      turnIndex,
      role: 'candidate',
      contentText: text.trim(),
      phase,
      startedAt: new Date().toISOString(),
      wordCount: text.trim().split(/\s+/).length,
      fillerWordsCount: countFillerWords(text),
      speakingPaceWpm: timer.elapsed > 0 ? calculateSpeakingPace(text, timer.elapsed * 1000) : 0,
    }
    const updatedTurns = [...turns, candidateTurn]
    setTurns(updatedTurns)
    setTurnIndex(prev => prev + 1)

    // Reset speech for next answer
    speech.reset()
    setTextInput('')

    // Get AI response
    setIsAiThinking(true)
    try {
      const conversationHistory = updatedTurns.map(t => ({
        role: t.role === 'jury' ? 'assistant' : 'user',
        content: t.contentText,
      }))

      const res = await fetch('/api/simulation/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: simulation.id,
          concoursIntitulé: concours.intitulé,
          rubriqueJury: concours.rubrique_jury,
          conversationHistory,
          phase,
          turnIndex: turnIndex + 1,
        }),
      })

      if (!res.ok) throw new Error('Erreur API')
      const data = await res.json()

      // Phase transition?
      if (data.phase && data.phase !== phase) {
        setPhase(data.phase as SimulationPhase)
        triggerPhaseOverlay(getPhaseLabel(data.phase as SimulationPhase))
      }

      const juryTurn: SimulationTurn = {
        turnIndex: turnIndex + 1,
        role: 'jury',
        contentText: data.question,
        phase: data.phase || phase,
        startedAt: new Date().toISOString(),
      }
      setTurns(prev => [...prev, juryTurn])
      setTurnIndex(prev => prev + 1)

      // Speak jury question
      if (useVoice) {
        juryVoice.speak(data.question)
      }
    } catch (err) {
      console.error('Erreur question jury:', err)
    } finally {
      setIsAiThinking(false)
    }
  }, [turns, turnIndex, phase, simulation, concours, isAiThinking, useVoice, speech, juryVoice, timer.elapsed])

  // --- Mic toggle ---
  const toggleMic = () => {
    if (speech.isListening) {
      speech.stop()
      recorder.stop()
      // Auto-submit accumulated transcript
      if (speech.transcript.trim()) {
        submitCandidateAnswer(speech.transcript)
      }
    } else {
      speech.start()
      recorder.start()
    }
  }

  // --- End exposé ---
  const endExposé = () => {
    if (speech.isListening) {
      speech.stop()
      recorder.stop()
    }
    if (speech.transcript.trim()) {
      // Submit what's been said before transitioning
      const text = speech.transcript.trim()
      speech.reset()

      const candidateTurn: SimulationTurn = {
        turnIndex,
        role: 'candidate',
        contentText: text,
        phase: 'exposé_libre',
        startedAt: new Date().toISOString(),
        wordCount: text.split(/\s+/).length,
        fillerWordsCount: countFillerWords(text),
      }
      setTurns(prev => [...prev, candidateTurn])
      setTurnIndex(prev => prev + 1)
    }
    setPhase('questions_jury')
    triggerPhaseOverlay('Questions du jury')

    // AI sends first question
    fetchFirstJuryQuestion()
  }

  const fetchFirstJuryQuestion = async () => {
    if (!simulation || !concours) return
    setIsAiThinking(true)
    try {
      const conversationHistory = turns.map(t => ({
        role: t.role === 'jury' ? 'assistant' : 'user',
        content: t.contentText,
      }))
      const res = await fetch('/api/simulation/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: simulation.id,
          concoursIntitulé: concours.intitulé,
          rubriqueJury: concours.rubrique_jury,
          conversationHistory,
          phase: 'questions_jury',
          turnIndex: turnIndex + 1,
        }),
      })
      if (!res.ok) throw new Error('Erreur')
      const data = await res.json()

      const juryTurn: SimulationTurn = {
        turnIndex: turnIndex + 1,
        role: 'jury',
        contentText: data.question,
        phase: 'questions_jury',
        startedAt: new Date().toISOString(),
      }
      setTurns(prev => [...prev, juryTurn])
      setTurnIndex(prev => prev + 1)

      if (useVoice) juryVoice.speak(data.question)
    } catch (err) {
      console.error(err)
    } finally {
      setIsAiThinking(false)
    }
  }

  // --- End simulation ---
  const endSimulation = async () => {
    // Stop everything
    speech.stop()
    recorder.stop()
    timer.pause()
    juryVoice.stop()

    // Save turns to Supabase
    if (turns.length > 0) {
      const turnsToSave = turns.map(t => ({
        simulation_id: simulationId,
        turn_index: t.turnIndex,
        role: t.role,
        content_text: t.contentText,
        phase: t.phase,
        started_at: t.startedAt,
        ended_at: t.endedAt || new Date().toISOString(),
        word_count: t.wordCount || null,
        filler_words_count: t.fillerWordsCount || null,
        speaking_pace_wpm: t.speakingPaceWpm || null,
      }))
      await supabase.from('simulation_turns').insert(turnsToSave)
    }

    // Generate report
    try {
      await fetch('/api/simulation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId,
          turns: turns.map(t => ({
            turnIndex: t.turnIndex,
            role: t.role,
            contentText: t.contentText,
            phase: t.phase,
          })),
          concoursIntitulé: concours?.intitulé || '',
          rubriqueJury: concours?.rubrique_jury || {},
        }),
      })
    } catch (err) {
      console.error('Erreur génération rapport:', err)
    }

    router.push(`/simulation/report/${simulationId}`)
  }

  // --- Auto-end when timer expires ---
  useEffect(() => {
    if (timer.isExpired && simulation) {
      endSimulation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isExpired])

  // --- Send text message ---
  const handleTextSend = () => {
    if (textInput.trim()) {
      submitCandidateAnswer(textInput)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextSend()
    }
  }

  // --- Loading / error states ---
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !simulation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-8 max-w-md text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-bold">{error || 'Simulation introuvable'}</h1>
          <Link href="/simulation/setup"><Button variant="outline">Retour</Button></Link>
        </div>
      </div>
    )
  }

  const timerDanger = timer.remaining < 120

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Phase transition overlay */}
      {showPhaseOverlay && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
          <div className="text-center space-y-3">
            <Sparkles className="w-12 h-12 text-primary mx-auto animate-pulse" />
            <h2 className="text-3xl font-bold gradient-text">{phaseOverlayText}</h2>
          </div>
        </div>
      )}

      {/* ═══ TOP BAR ═══ */}
      <header className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Phase */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
              {getPhaseLabel(phase)}
            </span>
            <span className="text-sm text-gray-400 hidden sm:inline">
              {concours?.intitulé}
            </span>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 text-2xl font-mono font-bold ${timerDanger ? 'text-red-400 animate-pulse' : 'text-foreground'}`}>
            <Clock className="w-5 h-5" />
            {timer.formattedRemaining}
          </div>

          {/* End button */}
          <Button variant="danger" onClick={endSimulation} className="text-sm px-4 py-2">
            <StopCircle className="w-4 h-4" />
            Terminer
          </Button>
        </div>
      </header>

      {/* ═══ CHAT AREA ═══ */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {turns.map((turn, i) => (
            <div
              key={i}
              className={`flex ${turn.role === 'candidate' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  turn.role === 'jury'
                    ? 'bg-purple-900/40 border border-purple-500/30 text-gray-100'
                    : 'bg-secondary/30 border border-secondary/30 text-gray-100'
                }`}
              >
                <p className="text-xs font-semibold mb-1 opacity-70">
                  {turn.role === 'jury' ? '🎓 Jury' : '🎤 Vous'}
                  <span className="ml-2 opacity-50">{getPhaseLabel(turn.phase)}</span>
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{turn.contentText}</p>
              </div>
            </div>
          ))}

          {/* AI thinking indicator */}
          {isAiThinking && (
            <div className="flex justify-start">
              <div className="bg-purple-900/40 border border-purple-500/30 rounded-2xl px-4 py-3">
                <p className="text-xs font-semibold mb-1 opacity-70">🎓 Jury</p>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Live transcript */}
          {speech.isListening && (speech.transcript || speech.interimTranscript) && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-secondary/10 border border-secondary/20 border-dashed">
                <p className="text-xs font-semibold mb-1 opacity-50">🎤 Vous (en direct)</p>
                <p className="text-sm text-gray-300">
                  {speech.transcript}
                  <span className="text-gray-500">{speech.interimTranscript}</span>
                </p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </main>

      {/* ═══ BOTTOM CONTROL BAR ═══ */}
      <footer className="shrink-0 border-t border-border bg-card/50 backdrop-blur-sm px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {/* Stats row */}
          <div className="flex items-center justify-center gap-4 mb-3 text-xs text-gray-500">
            {fillerCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300">
                Mots parasites : {fillerCount}
              </span>
            )}
            {speakingPace > 0 && (
              <span className={`px-2 py-0.5 rounded-full ${
                speakingPace > 170 ? 'bg-red-500/20 text-red-300' :
                speakingPace < 100 ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-green-500/20 text-green-300'
              }`}>
                {Math.round(speakingPace)} mots/min
              </span>
            )}
            {juryVoice.isSpeaking && (
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Le jury parle…
              </span>
            )}
          </div>

          {/* Phase control */}
          {phase === 'exposé_libre' && (
            <div className="flex justify-center mb-3">
              <button
                onClick={endExposé}
                className="text-sm text-primary hover:text-primary-light underline underline-offset-4"
              >
                Terminer l'exposé → Questions du jury
              </button>
            </div>
          )}

          {/* Input area */}
          <div className="flex items-center gap-3">
            {/* Text input fallback */}
            {!useVoice || !speech.isSupported ? (
              <div className="flex-1 flex gap-2">
                <textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tapez votre réponse…"
                  rows={1}
                  className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isAiThinking}
                />
                <Button
                  variant="primary"
                  onClick={handleTextSend}
                  disabled={!textInput.trim() || isAiThinking}
                  className="px-4"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <>
                {/* Text input as secondary fallback */}
                <div className="flex-1 flex gap-2">
                  <input
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ou tapez ici…"
                    className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isAiThinking}
                  />
                  {textInput.trim() && (
                    <Button
                      variant="secondary"
                      onClick={handleTextSend}
                      disabled={isAiThinking}
                      className="px-3 py-2"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Big mic button */}
                <button
                  onClick={toggleMic}
                  disabled={isAiThinking || juryVoice.isSpeaking}
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    speech.isListening
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : 'bg-gradient-to-br from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {/* Pulsing ring when recording */}
                  {speech.isListening && (
                    <>
                      <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-30" />
                      <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary to-secondary opacity-20 animate-pulse" />
                    </>
                  )}
                  {speech.isListening ? (
                    <MicOff className="w-7 h-7 relative z-10" />
                  ) : (
                    <Mic className="w-7 h-7 relative z-10" />
                  )}
                </button>
              </>
            )}
          </div>

          {speech.error && (
            <p className="text-xs text-red-400 mt-2 text-center">{speech.error}</p>
          )}
        </div>
      </footer>
    </div>
  )
}
