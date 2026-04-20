'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  useSpeechRecognition,
  useAudioRecorder,
  useJuryVoice,
  useSimulationTimer,
} from '@/lib/hooks/useVoice'
import {
  SimulationPhase,
  SimulationTurn,
  getPhaseLabel,
  countFillerWords,
} from '@/lib/types/simulation'
import {
  Mic, MicOff, LogOut, Clock, Loader2, CheckCircle2, Send,
} from 'lucide-react'

/* ────────────── Types ────────────── */
interface SimConfig {
  concoursId: string
  concoursIntitulé: string
  rubriqueJury: Record<string, unknown>
  epreuveType: string
  difficulty: 'bienveillant' | 'standard' | 'exigeant'
  durationMinutes: number
  sujet: string | null
  userId: string | null
}

interface JuryMember { initials: string; role: string; full: string }
const JURY: JuryMember[] = [
  { initials: 'Mme P', role: 'Présidente', full: 'Présidente du jury' },
  { initials: 'M. T', role: 'Technique', full: 'Membre technique' },
  { initials: 'Mme R', role: 'RH', full: 'Chargée des ressources humaines' },
]

/* ────────────── Jury circle ────────────── */
function JuryCircle({ member, active, thinking }: { member: JuryMember; active: boolean; thinking: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
        active
          ? 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/40'
          : 'bg-card border-2 border-border'
      }`}>
        {active && !thinking && (
          <>
            <span className="absolute inset-0 rounded-full border-2 border-violet-400 animate-ping opacity-30" />
            <span className="absolute -inset-2 rounded-full border border-violet-400/20 animate-pulse" />
          </>
        )}
        {thinking && active && (
          <div className="absolute -bottom-1 flex gap-0.5">
            <span className="w-1.5 h-1.5 bg-violet-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-violet-300 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
            <span className="w-1.5 h-1.5 bg-violet-300 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
          </div>
        )}
        <span className={`text-sm font-bold ${active ? 'text-white' : 'text-gray-400'}`}>{member.initials}</span>
      </div>
      <div className="text-center">
        <p className={`text-xs font-semibold ${active ? 'text-violet-300' : 'text-gray-500'}`}>{member.role}</p>
      </div>
    </div>
  )
}

/* ────────────── Timer ────────────── */
function TimerBadge({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? remaining / total : 1
  const color = pct < 0.1 ? 'text-red-400 animate-pulse' : pct < 0.25 ? 'text-amber-400' : 'text-foreground'
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  return (
    <div className={`font-mono text-2xl font-bold tabular-nums flex items-center gap-2 ${color}`}>
      <Clock className="w-5 h-5" />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  )
}

/* ────────────── Main page ────────────── */
export default function SimulationSessionPage() {
  const params = useParams()
  const router = useRouter()
  const simulationId = params.id as string

  const [config, setConfig] = useState<SimConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [phase, setPhase] = useState<SimulationPhase>('exposé_libre')
  const [phaseOverlay, setPhaseOverlay] = useState<string | null>(null)
  const [turns, setTurns] = useState<SimulationTurn[]>([])
  const [juryMessage, setJuryMessage] = useState<string>('')
  const [juryMessageVisible, setJuryMessageVisible] = useState(false)
  const [activeJuryIdx, setActiveJuryIdx] = useState(0)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [ending, setEnding] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)

  const speech = useSpeechRecognition()
  const recorder = useAudioRecorder()
  const juryVoice = useJuryVoice()
  const timer = useSimulationTimer((config?.durationMinutes ?? 30) * 60)

  const turnIndexRef = useRef(0)
  const turnsRef = useRef<SimulationTurn[]>([])
  turnsRef.current = turns

  /* ── Load config ── */
  useEffect(() => {
    async function loadConfig() {
      try {
        const { data } = await supabase
          .from('simulations')
          .select('simulation_config, planned_duration_seconds')
          .eq('id', simulationId)
          .single()
        if (data?.simulation_config) {
          const cfg = data.simulation_config as SimConfig
          if (!cfg.durationMinutes) cfg.durationMinutes = Math.round((data.planned_duration_seconds ?? 1800) / 60)
          setConfig(cfg)
          setLoading(false)
          return
        }
      } catch { /* fall through */ }

      const cached = typeof window !== 'undefined'
        ? sessionStorage.getItem(`sim_config_${simulationId}`)
        : null
      if (cached) {
        setConfig(JSON.parse(cached))
        setLoading(false)
        return
      }

      setError('Simulation introuvable. Vérifiez le lien ou recommencez.')
      setLoading(false)
    }
    loadConfig()
  }, [simulationId])

  /* ── Start after config loaded ── */
  useEffect(() => {
    if (!config || loading) return
    timer.start()
    const epreuveType = config.epreuveType ?? 'exposé_questions'
    if (epreuveType === 'exposé_questions') {
      addJuryMessage(
        `Bienvenue. Je suis Mme P, présidente de ce jury. Vous avez préparé le concours ${config.concoursIntitulé}. Vous disposez maintenant de quelques minutes pour votre exposé libre. À vous.`,
        0
      )
    } else {
      fetchJuryQuestion('questions_jury')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, loading])

  /* ── Timer expiry ── */
  useEffect(() => {
    if (timer.isExpired && config && !ending) handleEnd()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isExpired])

  /* ── Beforeunload ── */
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [])

  /* ── Helpers ── */
  const triggerPhaseOverlay = (label: string) => {
    setPhaseOverlay(label)
    setTimeout(() => setPhaseOverlay(null), 2500)
  }

  const addJuryMessage = (text: string, juryIdx: number) => {
    setActiveJuryIdx(juryIdx)
    setJuryMessage(text)
    setJuryMessageVisible(true)
    juryVoice.speak(text)
    const t: SimulationTurn = {
      turnIndex: turnIndexRef.current,
      role: 'jury',
      contentText: text,
      phase: 'questions_jury',
      startedAt: new Date().toISOString(),
    }
    setTurns(prev => [...prev, t])
    turnIndexRef.current += 1
  }

  const fetchJuryQuestion = useCallback(async (targetPhase: SimulationPhase) => {
    if (!config) return
    setIsAiThinking(true)
    try {
      const conversationHistory = turnsRef.current.map(t => ({
        role: t.role === 'jury' ? 'assistant' : 'user',
        content: t.contentText,
      }))
      const res = await fetch('/api/simulation/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId,
          concoursIntitulé: config.concoursIntitulé,
          rubriqueJury: config.rubriqueJury,
          conversationHistory,
          phase: targetPhase,
          turnIndex: turnIndexRef.current,
          difficulty: config.difficulty,
          sujet: config.sujet,
        }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (data.phase && data.phase !== phase) {
        setPhase(data.phase as SimulationPhase)
        triggerPhaseOverlay(getPhaseLabel(data.phase as SimulationPhase))
      }
      const nextJury = Math.floor(Math.random() * JURY.length)
      addJuryMessage(data.question, nextJury)
    } catch (err) {
      console.error('Erreur question jury:', err)
    } finally {
      setIsAiThinking(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, simulationId])

  const submitAnswer = useCallback((text: string) => {
    if (!text.trim()) return
    const t: SimulationTurn = {
      turnIndex: turnIndexRef.current,
      role: 'candidate',
      contentText: text.trim(),
      phase,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      wordCount: text.trim().split(/\s+/).length,
      fillerWordsCount: countFillerWords(text),
    }
    setTurns(prev => [...prev, t])
    turnIndexRef.current += 1
    speech.reset()
    setTextInput('')
    setTimeout(() => fetchJuryQuestion('questions_jury'), 600)
  }, [phase, speech, fetchJuryQuestion])

  const finishExposé = () => {
    if (speech.isListening) { speech.stop(); recorder.stop() }
    const text = speech.transcript.trim() || textInput.trim()
    if (text) submitAnswer(text)
    setPhase('questions_jury')
    triggerPhaseOverlay('Questions du jury')
    setTimeout(() => fetchJuryQuestion('questions_jury'), 2600)
  }

  const toggleMic = () => {
    if (speech.isListening) { speech.stop(); recorder.stop() }
    else { speech.start(); recorder.start() }
  }

  const finishAnswer = () => {
    const text = speech.transcript.trim() || textInput.trim()
    if (!text) return
    if (speech.isListening) { speech.stop(); recorder.stop() }
    submitAnswer(text)
  }

  const handleEnd = useCallback(async () => {
    if (ending) return
    setEnding(true)
    speech.stop(); recorder.stop(); timer.pause(); juryVoice.stop()

    if (turnsRef.current.length > 0) {
      const rows = turnsRef.current.map(t => ({
        simulation_id: simulationId,
        turn_index: t.turnIndex,
        role: t.role,
        content_text: t.contentText,
        phase: t.phase,
        started_at: t.startedAt ?? new Date().toISOString(),
        ended_at: t.endedAt ?? new Date().toISOString(),
        word_count: t.wordCount ?? null,
        filler_words_count: t.fillerWordsCount ?? null,
        speaking_pace_wpm: t.speakingPaceWpm ?? null,
      }))
      try { await supabase.from('simulation_turns').insert(rows) } catch { /* ignore */ }
    }

    try {
      const reportRes = await fetch('/api/simulation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId,
          turns: turnsRef.current.map(t => ({ turnIndex: t.turnIndex, role: t.role, contentText: t.contentText, phase: t.phase })),
          concoursIntitulé: config?.concoursIntitulé ?? '',
          rubriqueJury: config?.rubriqueJury ?? {},
          difficulty: config?.difficulty ?? 'standard',
        }),
      })
      if (reportRes.ok) {
        const reportData = await reportRes.json()
        if (reportData.report && typeof window !== 'undefined') {
          sessionStorage.setItem(`sim_report_${simulationId}`, JSON.stringify(reportData.report))
        }
      }
    } catch { /* ignore */ }

    router.push(`/simulation/rapport/${simulationId}`)
  }, [ending, speech, recorder, timer, juryVoice, simulationId, config, router])

  /* ── Loading / error ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }
  if (error || !config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-red-400 mb-4">{error ?? 'Simulation introuvable'}</p>
          <button onClick={() => router.push('/simulation/setup')} className="text-primary underline">
            Retour à la configuration
          </button>
        </div>
      </div>
    )
  }

  const totalSec = (config.durationMinutes ?? 30) * 60
  const hasMic = speech.isSupported
  const hasInput = !!(speech.transcript.trim() || textInput.trim())

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden select-none">

      {/* ══ Phase overlay ══ */}
      {phaseOverlay && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">{phaseOverlay}</h2>
          </div>
        </div>
      )}

      {/* ══ Quit confirm ══ */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold">Quitter la simulation ?</h3>
            <p className="text-sm text-gray-400">La simulation sera terminée et un rapport sera généré.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 py-2 rounded-lg border border-border text-sm hover:bg-card transition-colors"
              >
                Continuer
              </button>
              <button
                onClick={() => { setShowQuitConfirm(false); handleEnd() }}
                className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Zone haute ══ */}
      <header className="shrink-0 h-[60px] border-b border-border bg-card/60 backdrop-blur-sm flex items-center px-4 gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">{config.concoursIntitulé}</p>
          <p className="text-xs font-medium text-primary">{getPhaseLabel(phase)}</p>
        </div>
        <TimerBadge remaining={timer.remaining} total={totalSec} />
        <button
          onClick={() => setShowQuitConfirm(true)}
          className="shrink-0 flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors border border-border rounded-lg px-3 py-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Quitter
        </button>
      </header>

      {/* ══ Zone centrale ══ */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-hidden">
        {/* Jury circles */}
        <div className="flex items-end justify-center gap-8 lg:gap-16 mb-8">
          {JURY.map((member, i) => (
            <JuryCircle
              key={i}
              member={member}
              active={activeJuryIdx === i && (juryMessageVisible || isAiThinking)}
              thinking={isAiThinking && activeJuryIdx === i}
            />
          ))}
        </div>

        {/* Jury speech bubble */}
        <div className="w-full max-w-2xl">
          {isAiThinking ? (
            <div className="text-center space-y-2">
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin mx-auto" />
              <p className="text-sm text-gray-500">Le jury réfléchit…</p>
            </div>
          ) : juryMessageVisible && juryMessage ? (
            <div className="glass rounded-2xl px-6 py-4 border border-violet-500/20 text-center">
              <p className="text-sm text-gray-400 mb-1 font-medium">{JURY[activeJuryIdx]?.full} :</p>
              <p className="text-foreground leading-relaxed">{juryMessage}</p>
            </div>
          ) : null}
        </div>

        {/* Live transcript */}
        {(speech.transcript || speech.interimTranscript) && speech.isListening && (
          <div className="w-full max-w-2xl mt-4 px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <p className="text-xs text-indigo-400 mb-1 font-medium">Vous parlez…</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              {speech.transcript}
              <span className="text-gray-500 italic">{speech.interimTranscript}</span>
            </p>
          </div>
        )}
      </main>

      {/* ══ Zone basse ══ */}
      <footer className="shrink-0 border-t border-border bg-card/60 backdrop-blur-sm px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-3">

          {phase === 'exposé_libre' && (
            <div className="text-center">
              <button
                onClick={finishExposé}
                disabled={isAiThinking}
                className="text-sm text-primary hover:text-violet-300 underline underline-offset-4 transition-colors disabled:opacity-40"
              >
                Terminer l'exposé → passer aux questions du jury
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs min-h-[20px]">
            {juryVoice.isSpeaking ? (
              <span className="flex items-center gap-1.5 text-violet-400">
                <span className="flex gap-0.5 items-end h-4">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1 bg-violet-400 rounded-full animate-bounce" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 100}ms` }} />
                  ))}
                </span>
                Le jury parle…
              </span>
            ) : speech.isListening ? (
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                Le jury vous écoute
              </span>
            ) : (
              <span className="text-gray-600">À vous de parler</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && hasInput) { e.preventDefault(); finishAnswer() } }}
              placeholder={speech.isListening ? 'Reconnaissance vocale active…' : 'Tapez votre réponse…'}
              rows={2}
              disabled={isAiThinking || juryVoice.isSpeaking}
              className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40 placeholder-gray-600"
            />

            {hasMic && (
              <button
                onClick={toggleMic}
                disabled={isAiThinking || juryVoice.isSpeaking}
                className={`relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-40 ${
                  speech.isListening
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                    : 'bg-card border border-border text-gray-400 hover:border-primary hover:text-primary'
                }`}
              >
                {speech.isListening && <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-30" />}
                {speech.isListening ? <MicOff className="w-5 h-5 relative z-10" /> : <Mic className="w-5 h-5 relative z-10" />}
              </button>
            )}

            <button
              onClick={finishAnswer}
              disabled={isAiThinking || juryVoice.isSpeaking || !hasInput}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">J'ai terminé</span>
            </button>
          </div>

          {speech.error && <p className="text-xs text-red-400 text-center">{speech.error}</p>}
        </div>
      </footer>
    </div>
  )
}
