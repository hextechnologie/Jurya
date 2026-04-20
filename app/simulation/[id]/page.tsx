'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSpeechRecognition, useJuryVoice, useSimulationTimer, useAudioLevel } from '@/lib/hooks/useVoice'
import { SimulationPhase, SimulationTurn, getPhaseLabel, countFillerWords } from '@/lib/types/simulation'
import { DEFAULT_JURY, getJuryMember, getRandomJury, type SpeakerId, type JuryMemberConfig } from '@/lib/juries/voices'
import { LogOut, Clock, Loader2, CheckCircle2, Send, Mic, MicOff, PenLine } from 'lucide-react'

/* ─── Types ─── */
interface SimConfig {
  concoursId: string
  concoursIntitulé: string
  rubriqueJury: Record<string, unknown>
  epreuveType: string
  difficulty: 'bienveillant' | 'standard' | 'exigeant'
  durationMinutes: number
  sujet: string | null
  userId: string | null
  candidateName?: string
  juryMembers?: JuryMemberConfig[]
}

/* ─── Helpers ─── */
function getConcoursSlug(concoursId: string): string {
  return concoursId.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
}

/* ─── Jury Tile ─── */
function JuryTile({
  member,
  isActiveSpeaker,
  isThinking,
  hasMicReaction,
  concoursSlug,
  dimmed,
}: {
  member: JuryMemberConfig
  isActiveSpeaker: boolean
  isThinking: boolean
  hasMicReaction: boolean
  concoursSlug: string
  dimmed: boolean
}) {
  const [imgError, setImgError] = useState(false)
  const photoSrc = `/juries/${concoursSlug}/${member.id}.jpg`

  return (
    <div
      className="relative rounded-xl overflow-hidden transition-all duration-300 select-none"
      style={{
        aspectRatio: '4/3',
        border: isActiveSpeaker ? '2px solid #818CF8' : '2px solid transparent',
        boxShadow: isActiveSpeaker ? '0 0 24px rgba(129,140,248,0.35)' : 'none',
        opacity: dimmed ? 0.68 : 1,
      }}
    >
      {/* Photo or gradient placeholder */}
      {!imgError ? (
        <img
          src={photoSrc}
          alt={member.name}
          className="w-full h-full object-cover"
          style={{
            animation: `breathe 8s ease-in-out infinite ${member.breathingDelay}s`,
            transformOrigin: 'center',
          }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: member.gender === 'female'
              ? 'linear-gradient(135deg,#4c1d95 0%,#312e81 50%,#1e1b4b 100%)'
              : 'linear-gradient(135deg,#1e3a5f 0%,#1e293b 50%,#0f172a 100%)',
            animation: `breathe 8s ease-in-out infinite ${member.breathingDelay}s`,
            transformOrigin: 'center',
          }}
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
              <span className="text-white/80 text-xl font-bold select-none">
                {member.name.split(' ').map((w: string) => w[0]).join('')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Waveform bars when speaking */}
      {isActiveSpeaker && !isThinking && (
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex items-end gap-0.5">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-1 bg-[#818CF8] rounded-full"
              style={{
                height: '16px',
                transformOrigin: 'bottom',
                animation: `waveBar 0.65s ease-in-out infinite ${i * 0.12}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Thinking dots */}
      {isThinking && isActiveSpeaker && (
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      )}

      {/* Mic icon top-right */}
      <div className="absolute top-2 right-2">
        <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
          <Mic className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Micro-reaction: note-taking icon */}
      {hasMicReaction && (
        <div className="absolute top-2 left-2 animate-bounce">
          <PenLine className="w-4 h-4 text-white/80 drop-shadow" />
        </div>
      )}

      {/* Name bar */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5" style={{ background: 'rgba(0,0,0,0.62)' }}>
        <p className="text-white font-medium" style={{ fontSize: '13px' }}>
          {member.name} · {member.roleLabel}
        </p>
      </div>
    </div>
  )
}

/* ─── Candidate Tile ─── */
function CandidateTile({ isListening, audioLevel, candidateName }: {
  isListening: boolean
  audioLevel: number
  candidateName: string
}) {
  return (
    <div
      className="relative rounded-lg overflow-hidden transition-all duration-200"
      style={{
        width: '140px',
        aspectRatio: '4/3',
        border: isListening ? '2px solid #6366f1' : '2px solid rgba(255,255,255,0.1)',
        boxShadow: isListening ? '0 0 18px rgba(99,102,241,0.4)' : 'none',
      }}
    >
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
        {/* Waveform */}
        <div className="flex items-end gap-0.5 h-8 mb-1">
          {[0, 1, 2, 3, 4].map(i => {
            const h = isListening
              ? Math.max(4, (audioLevel / 100) * 26 * (0.6 + 0.4 * Math.sin(i * 1.3 + Date.now() / 200)))
              : 4
            return (
              <div
                key={i}
                className="w-1 bg-indigo-400 rounded-full transition-all duration-100"
                style={{ height: `${h}px` }}
              />
            )
          })}
        </div>
        <Mic className={`w-3 h-3 mb-0.5 ${isListening ? 'text-indigo-400' : 'text-gray-600'}`} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1" style={{ background: 'rgba(0,0,0,0.62)' }}>
        <p className="text-white truncate" style={{ fontSize: '11px' }}>{candidateName || 'Vous'}</p>
      </div>
    </div>
  )
}

/* ─── Timer ─── */
function TimerBadge({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? remaining / total : 1
  const color = pct < 0.1 ? 'text-red-400 animate-pulse' : pct < 0.25 ? 'text-amber-400' : 'text-gray-200'
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  return (
    <span className={`font-mono text-xl font-bold tabular-nums flex items-center gap-1.5 ${color}`}>
      <Clock className="w-4 h-4" />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  )
}

/* ─── Micro-reactions hook ─── */
function useMicroReactions(currentSpeakerId: SpeakerId) {
  const [reactions, setReactions] = useState<Partial<Record<SpeakerId, boolean>>>({})
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.28) {
        const inactive = (['president', 'technique', 'rh'] as SpeakerId[]).filter(id => id !== currentSpeakerId)
        const target = inactive[Math.floor(Math.random() * inactive.length)]
        setReactions(prev => ({ ...prev, [target]: true }))
        setTimeout(() => setReactions(prev => ({ ...prev, [target]: false })), 500)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [currentSpeakerId])
  return reactions
}

/* ─── Main Page ─── */
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
  const [currentSpeakerId, setCurrentSpeakerId] = useState<SpeakerId>('president')
  const [juryMessage, setJuryMessage] = useState('')
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [ending, setEnding] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const sessionStartRef = useRef<string>(new Date().toISOString())

  // Mic always-on flow
  const [listenEnabled, setListenEnabled] = useState(false)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTranscriptRef = useRef('')
  const turnIndexRef = useRef(0)
  const turnsRef = useRef<SimulationTurn[]>([])
  turnsRef.current = turns
  const configRef = useRef<SimConfig | null>(null)
  configRef.current = config
  const phaseRef = useRef<SimulationPhase>('exposé_libre')
  phaseRef.current = phase

  const speech = useSpeechRecognition()
  const juryVoice = useJuryVoice()
  const timer = useSimulationTimer((config?.durationMinutes ?? 30) * 60)
  const { level: audioLevel, start: startAudioLevel, stop: stopAudioLevel } = useAudioLevel()
  const reactions = useMicroReactions(currentSpeakerId)

  /* ── Load config ── */
  useEffect(() => {
    async function loadConfig() {
      try {
        const { data } = await supabase
          .from('simulations')
          .select('simulation_config,planned_duration_seconds')
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

      const cached = typeof window !== 'undefined' ? sessionStorage.getItem(`sim_config_${simulationId}`) : null
      if (cached) {
        setConfig(JSON.parse(cached))
        setLoading(false)
        return
      }
      setError('Simulation introuvable. Veuillez relancer depuis la configuration.')
      setLoading(false)
    }
    loadConfig()
  }, [simulationId])

  /* ── Start timer + mic level + opening message ── */
  useEffect(() => {
    if (!config || loading) return
    // Reset timer to correct duration (config was null at hook init, defaulted to 30min)
    timer.reset(config.durationMinutes * 60)
    timer.start()
    startAudioLevel()

    const epreuveType = config.epreuveType ?? 'exposé_questions'
    if (epreuveType === 'exposé_questions') {
      const presidentName = (config.juryMembers ?? DEFAULT_JURY).find(m => m.id === 'president')?.name ?? 'Mme Laurent'
      speakAsJury(
        `Bienvenue. Je suis ${presidentName}, présidente de ce jury. Vous présentez votre candidature pour le concours "${config.concoursIntitulé}". Vous avez quelques minutes pour votre exposé libre. Je vous en prie.`,
        'president'
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

  /* ── Beforeunload warning ── */
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [])

  /* ── Auto-manage mic based on jury speaking state ── */
  useEffect(() => {
    if (juryVoice.isSpeaking || isAiThinking) {
      // Jury is talking → mic off
      if (speech.isListening) speech.stop()
      setListenEnabled(false)
    } else if (config && !ending) {
      // Jury finished → mic auto-on after short delay
      setListenEnabled(true)
      const t = setTimeout(() => {
        if (!speech.isListening) speech.start()
      }, 400)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [juryVoice.isSpeaking, isAiThinking, config, ending])

  /* ── VAD: auto-submit after silence ── */
  useEffect(() => {
    if (!listenEnabled) return
    const currentText = speech.transcript + speech.interimTranscript
    if (currentText === lastTranscriptRef.current) return
    lastTranscriptRef.current = currentText

    if (currentText.trim()) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      const silenceMs = phaseRef.current === 'exposé_libre' ? 5000 : 2500
      silenceTimerRef.current = setTimeout(() => {
        if (speech.transcript.trim()) submitAnswer(speech.transcript.trim())
      }, silenceMs)
    }
    return () => { if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.transcript, speech.interimTranscript, listenEnabled])

  /* ── Helpers ── */
  const triggerPhaseOverlay = (label: string) => {
    setPhaseOverlay(label)
    setTimeout(() => setPhaseOverlay(null), 2500)
  }

  const speakAsJury = useCallback(async (text: string, speakerId: SpeakerId) => {
    const jury = configRef.current?.juryMembers ?? DEFAULT_JURY
    const member = getJuryMember(speakerId, jury)
    setCurrentSpeakerId(speakerId)
    setJuryMessage(text)
    const juryTurn: SimulationTurn = {
      turnIndex: turnIndexRef.current,
      role: 'jury',
      contentText: text,
      phase: phaseRef.current,
      startedAt: new Date().toISOString(),
    }
    setTurns(prev => [...prev, juryTurn])
    turnIndexRef.current += 1
    await juryVoice.speak(text, member.elevenlabsVoiceId, member.fallbackPitch, member.fallbackRate, member.voiceSettings)
  }, [juryVoice])

  const fetchJuryQuestion = useCallback(async (targetPhase: SimulationPhase) => {
    if (!configRef.current) return
    setIsAiThinking(true)
    try {
      const cfg = configRef.current
      const conversationHistory = turnsRef.current.map(t => ({
        role: t.role === 'jury' ? 'assistant' : 'user',
        content: t.contentText,
      }))
      const res = await fetch('/api/simulation/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId,
          concoursIntitulé: cfg.concoursIntitulé,
          rubriqueJury: cfg.rubriqueJury,
          conversationHistory,
          phase: targetPhase,
          turnIndex: turnIndexRef.current,
          difficulty: cfg.difficulty,
          candidateName: cfg.candidateName ?? '',
          lastSpeaker: currentSpeakerId,
          sujet: cfg.sujet,
          juryMembers: (cfg.juryMembers ?? DEFAULT_JURY).map(m => ({
            id: m.id, name: m.name, roleLabel: m.roleLabel, gender: m.gender,
          })),
        }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      // Rude detection: jury stops the session — wait for speech to finish, then end
      if (data.end_session) {
        const speakerId: SpeakerId = 'president'
        await speakAsJury(data.question, speakerId)
        handleEnd()
        return
      }
      if (data.phase && data.phase !== phaseRef.current) {
        setPhase(data.phase as SimulationPhase)
        triggerPhaseOverlay(getPhaseLabel(data.phase as SimulationPhase))
      }
      const speakerId: SpeakerId = (['president', 'technique', 'rh'].includes(data.next_speaker)
        ? data.next_speaker
        : 'technique') as SpeakerId
      await speakAsJury(data.question, speakerId)
    } catch (err) {
      console.error('Erreur question jury:', err)
    } finally {
      setIsAiThinking(false)
    }
  }, [simulationId, currentSpeakerId, speakAsJury])

  const submitAnswer = useCallback((text: string) => {
    if (!text.trim() || ending) return
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    speech.stop()
    const t: SimulationTurn = {
      turnIndex: turnIndexRef.current,
      role: 'candidate',
      contentText: text.trim(),
      phase: phaseRef.current,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      wordCount: text.trim().split(/\s+/).length,
      fillerWordsCount: countFillerWords(text),
    }
    setTurns(prev => [...prev, t])
    turnIndexRef.current += 1
    speech.reset()
    setTextInput('')
    lastTranscriptRef.current = ''
    setTimeout(() => fetchJuryQuestion('questions_jury'), 500)
  }, [ending, speech, fetchJuryQuestion])

  const finishExposé = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    const text = speech.transcript.trim() || textInput.trim()
    speech.stop()
    if (text) {
      const t: SimulationTurn = {
        turnIndex: turnIndexRef.current,
        role: 'candidate',
        contentText: text,
        phase: 'exposé_libre',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        wordCount: text.split(/\s+/).length,
        fillerWordsCount: countFillerWords(text),
      }
      setTurns(prev => [...prev, t])
      turnIndexRef.current += 1
    }
    speech.reset()
    setTextInput('')
    lastTranscriptRef.current = ''
    setPhase('questions_jury')
    triggerPhaseOverlay('Questions du jury')
    setTimeout(() => fetchJuryQuestion('questions_jury'), 2700)
  }, [speech, textInput, fetchJuryQuestion])

  const handleEnd = useCallback(async () => {
    if (ending) return
    setEnding(true)
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    speech.stop()
    timer.pause()
    juryVoice.stop()
    stopAudioLevel()

    // Navigate immediately — don't make user wait
    router.push(`/simulation/rapport/${simulationId}`)

    // Do async work after navigation (fire and forget)
    const snapshot = turnsRef.current
    const cfg = configRef.current

    if (snapshot.length > 0) {
      Promise.resolve(supabase.from('simulation_turns').insert(
        snapshot.map(t => ({
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
      )).then(() => {}).catch(() => {})
    }

    fetch('/api/simulation/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        simulationId,
        turns: snapshot.map(t => ({ turnIndex: t.turnIndex, role: t.role, contentText: t.contentText, phase: t.phase })),
        concoursIntitulé: cfg?.concoursIntitulé ?? '',
        rubriqueJury: cfg?.rubriqueJury ?? {},
        difficulty: cfg?.difficulty ?? 'standard',
        sessionStartedAt: sessionStartRef.current,
        durationMinutes: cfg?.durationMinutes ?? 30,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.report && typeof window !== 'undefined') {
          sessionStorage.setItem(`sim_report_${simulationId}`, JSON.stringify(data.report))
        }
      })
      .catch(() => {})
  }, [ending, speech, timer, juryVoice, stopAudioLevel, router, simulationId])

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
  const concoursSlug = getConcoursSlug(config.concoursId)
  const candidateName = config.candidateName ?? 'Candidat(e)'
  const hasInput = !!(speech.transcript.trim() || textInput.trim())
  const juryConfig = config.juryMembers ?? DEFAULT_JURY

  return (
    <div className="h-screen bg-[#0F1629] flex flex-col overflow-hidden select-none text-white">

      {/* ══ Phase overlay ══ */}
      {phaseOverlay && (
        <div className="fixed inset-0 z-50 bg-[#0F1629]/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">{phaseOverlay}</h2>
          </div>
        </div>
      )}

      {/* ══ Quit confirm ══ */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a2240] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold">Quitter la simulation ?</h3>
            <p className="text-sm text-gray-400">Le rapport sera généré avec les échanges effectués jusqu'ici.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 py-2 rounded-lg border border-white/15 text-sm hover:bg-white/5 transition-colors"
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

      {/* ══ Zone haute (60px) ══ */}
      <header className="shrink-0 h-[60px] border-b border-white/10 bg-[#0d1526]/80 backdrop-blur-sm flex items-center px-4 gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">{config.concoursIntitulé}</p>
          <p className="text-xs font-semibold text-[#818CF8]">{getPhaseLabel(phase)}</p>
        </div>
        <TimerBadge remaining={timer.remaining} total={totalSec} />
        <button
          onClick={() => setShowQuitConfirm(true)}
          className="shrink-0 flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors border border-white/10 rounded-lg px-3 py-1.5 hover:border-red-500/30"
        >
          <LogOut className="w-3.5 h-3.5" />
          Quitter
        </button>
      </header>

      {/* ══ Zone centrale ══ */}
      <main className="flex-1 overflow-hidden flex flex-col px-4 py-4 gap-4">

        {/* Jury tiles grid */}
        <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto w-full">
          {juryConfig.map((member) => (
            <JuryTile
              key={member.id}
              member={member}
              isActiveSpeaker={currentSpeakerId === member.id && (juryVoice.isSpeaking || isAiThinking)}
              isThinking={isAiThinking && currentSpeakerId === member.id}
              hasMicReaction={!!reactions[member.id]}
              concoursSlug={concoursSlug}
              dimmed={
                (juryVoice.isSpeaking || isAiThinking) &&
                currentSpeakerId !== member.id
              }
            />
          ))}
        </div>

        {/* Jury message + candidate tile row */}
        <div className="flex-1 max-w-3xl mx-auto w-full flex gap-3 items-start">
          {/* Jury speech area */}
          <div className="flex-1">
            {isAiThinking ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                Le jury réfléchit…
              </div>
            ) : juryMessage ? (
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <p className="text-xs text-[#818CF8] font-medium mb-1">
                  {getJuryMember(currentSpeakerId, juryConfig).name} · {getJuryMember(currentSpeakerId, juryConfig).roleLabel}
                </p>
                <p className="text-sm text-gray-200 leading-relaxed">{juryMessage}</p>
              </div>
            ) : null}

            {/* Live transcript */}
            {(speech.transcript || speech.interimTranscript) && (
              <div className="mt-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
                <p className="text-xs text-indigo-400 font-medium mb-1">Vous parlez…</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {speech.transcript}
                  <span className="text-gray-500 italic">{speech.interimTranscript}</span>
                </p>
              </div>
            )}
          </div>

          {/* Candidate tile — fixed small tile */}
          <div className="shrink-0">
            <CandidateTile
              isListening={speech.isListening}
              audioLevel={audioLevel}
              candidateName={candidateName}
            />
            <div className="mt-1 text-center">
              <span className="text-xs text-gray-600">
                {speech.isListening ? '🔴 Écoute' : juryVoice.isSpeaking ? '🟣 Jury' : '⬜ Attente'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* ══ Zone basse ══ */}
      <footer className="shrink-0 border-t border-white/10 bg-[#0d1526]/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto space-y-2">

          {/* Exposé control */}
          {phase === 'exposé_libre' && (
            <div className="text-center">
              <button
                onClick={finishExposé}
                disabled={isAiThinking || juryVoice.isSpeaking}
                className="text-sm text-[#818CF8] hover:text-violet-300 underline underline-offset-4 transition-colors disabled:opacity-40"
              >
                Terminer l'exposé → passer aux questions du jury
              </button>
            </div>
          )}

          {/* Mic status indicator */}
          <div className="flex items-center justify-center gap-2 text-xs min-h-[18px]">
            {juryVoice.isSpeaking ? (
              <span className="flex items-center gap-1.5 text-violet-400">
                <span className="flex gap-0.5 items-end h-4">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1 bg-violet-400 rounded-full animate-bounce"
                      style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 100}ms` }} />
                  ))}
                </span>
                Le jury parle…
              </span>
            ) : speech.isListening ? (
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                Le jury vous écoute
              </span>
            ) : isAiThinking ? (
              <span className="text-gray-600">Le jury réfléchit…</span>
            ) : (
              <span className="text-gray-600">À vous de parler</span>
            )}
          </div>

          {/* Input + submit */}
          <div className="flex items-center gap-2">
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && hasInput) {
                  e.preventDefault()
                  const text = speech.transcript.trim() || textInput.trim()
                  if (phase === 'exposé_libre') finishExposé()
                  else submitAnswer(text)
                }
              }}
              placeholder={speech.isListening ? 'Micro actif — parlez librement…' : 'Rédigez ou parlez…'}
              rows={1}
              disabled={isAiThinking || juryVoice.isSpeaking || ending}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#818CF8] disabled:opacity-40 placeholder-gray-600"
            />

            {/* Manual mic toggle */}
            {speech.isSupported && (
              <button
                onClick={() => {
                  if (speech.isListening) speech.stop()
                  else { speech.reset(); speech.start() }
                }}
                disabled={isAiThinking || juryVoice.isSpeaking || ending}
                className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-40 ${
                  speech.isListening
                    ? 'bg-red-500 shadow-lg shadow-red-500/40'
                    : 'bg-white/10 border border-white/15 text-gray-400 hover:border-[#818CF8] hover:text-[#818CF8]'
                }`}
              >
                {speech.isListening && (
                  <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-30" />
                )}
                {speech.isListening
                  ? <MicOff className="w-4 h-4 text-white relative z-10" />
                  : <Mic className="w-4 h-4 relative z-10" />
                }
              </button>
            )}

            <button
              onClick={() => {
                const text = speech.transcript.trim() || textInput.trim()
                if (!text) return
                if (phase === 'exposé_libre') finishExposé()
                else submitAnswer(text)
              }}
              disabled={isAiThinking || juryVoice.isSpeaking || !hasInput || ending}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-[#818CF8] text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Valider</span>
            </button>
          </div>

          {speech.error && <p className="text-xs text-red-400 text-center">{speech.error}</p>}
        </div>
      </footer>
    </div>
  )
}
