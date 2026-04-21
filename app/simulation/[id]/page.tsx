'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { useSpeechRecognition, useJuryVoice, useSimulationTimer, useAudioLevel } from '@/lib/hooks/useVoice'
import { SimulationPhase, SimulationTurn, getPhaseLabel, countFillerWords } from '@/lib/types/simulation'
import { DEFAULT_JURY, getJuryMember, getRandomJury, type SpeakerId, type JuryMemberConfig } from '@/lib/juries/voices'
import { LogOut, Clock, Loader2, CheckCircle2, Mic, MicOff, PenLine, PhoneOff, Video, VideoOff } from 'lucide-react'

/* ─── Types ─── */
type ReactionKind = 'nod' | 'note' | 'lookaway' | null

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
  /** Whether to use ElevenLabs TTS (false = Web Speech API fallback only) */
  elevenLabsEnabled?: boolean
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
  reaction,
  concoursSlug,
  dimmed,
}: {
  member: JuryMemberConfig
  isActiveSpeaker: boolean
  isThinking: boolean
  reaction: ReactionKind
  concoursSlug: string
  dimmed: boolean
}) {
  const [imgError, setImgError] = useState(false)
  const photoSrc = `/juries/${concoursSlug}/${member.id}.jpg`

  const opacity = reaction === 'lookaway'
    ? (dimmed ? 0.55 : 0.82)
    : (dimmed ? 0.68 : 1)

  const transform = reaction === 'nod' ? 'translateY(-3px) scale(1)' : undefined
  const transitionStyle = reaction === 'nod'
    ? 'transform 0.25s ease-out, opacity 0.3s, box-shadow 0.3s'
    : 'all 0.3s'

  return (
    <div
      className="relative rounded-xl overflow-hidden select-none jury-card"
      style={{
        aspectRatio: '4/3',
        border: isActiveSpeaker ? '2px solid #818CF8' : '2px solid transparent',
        boxShadow: isActiveSpeaker ? '0 0 24px rgba(129,140,248,0.35)' : 'none',
        opacity,
        transform,
        transition: transitionStyle,
        animationDelay: `${member.breathingDelay}s`,
      }}
    >
      {/* Photo or gradient placeholder */}
      {!imgError ? (
        <img
          src={photoSrc}
          alt={member.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
          <div className="w-full h-full flex items-center justify-center"
          style={{
            background: member.gender === 'female'
              ? 'linear-gradient(135deg,#4c1d95 0%,#312e81 50%,#1e1b4b 100%)'
              : 'linear-gradient(135deg,#1e3a5f 0%,#1e293b 50%,#0f172a 100%)',
          }}
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
                <span className="text-white/80 text-xl font-bold select-none">
                  {member.initials}
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

      {/* Mic icon top-right: active (emerald) when speaking, muted (slate) otherwise */}
      <div className="absolute top-2 right-2">
        <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
          {isActiveSpeaker
            ? <Mic className="w-3 h-3 text-emerald-400" />
            : <MicOff className="w-3 h-3 text-slate-500" />
          }
        </div>
      </div>

      {/* Micro-reaction: note-taking icon */}
      {reaction === 'note' && (
        <div className="absolute top-2 left-2" style={{ animation: 'fadeInOut 1.5s ease-in-out forwards' }}>
          <PenLine className="w-4 h-4 text-white/70 drop-shadow" />
        </div>
      )}

      {/* Name bar — displayName (14px/500) + roleLabel (12px/400) on separate lines */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5" style={{ background: 'rgba(0,0,0,0.68)' }}>
        <p className="text-slate-100" style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.2 }}>
          {member.displayName}
        </p>
        <p className="text-slate-400" style={{ fontSize: '12px', fontWeight: 400, lineHeight: 1.2 }}>
          {member.roleLabel}
        </p>
      </div>
    </div>
  )
}

/* ─── Candidate Tile (fixed bottom-right, optional webcam) ─── */
function CandidateTile({ isListening, isSpeaking, audioLevel, candidateName, avatarUrl, videoRef, webcamActive }: {
  isListening: boolean
  isSpeaking: boolean
  audioLevel: number
  candidateName: string
  avatarUrl?: string | null
  videoRef: React.RefObject<HTMLVideoElement>
  webcamActive: boolean
}) {
  const [imgError, setImgError] = React.useState(false)
  const initials = candidateName
    ? candidateName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'V'

  const borderColor = isListening ? '#ef4444' : isSpeaking ? '#6366f1' : 'rgba(255,255,255,0.12)'
  const glowColor = isListening ? 'rgba(239,68,68,0.35)' : isSpeaking ? 'rgba(99,102,241,0.30)' : 'none'

  return (
    <div
      className="relative rounded-xl overflow-hidden transition-all duration-200"
      style={{
        width: '160px',
        aspectRatio: '4/3',
        border: `2px solid ${borderColor}`,
        boxShadow: glowColor !== 'none' ? `0 0 20px ${glowColor}` : 'none',
      }}
    >
      {/* Webcam feed — always in DOM so videoRef is always valid; hidden when inactive */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: webcamActive ? 'block' : 'none' }}
      />

      {/* Avatar / gradient when webcam off */}
      {!webcamActive && (
        avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={candidateName}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <div className="w-12 h-12 rounded-full bg-indigo-600/40 flex items-center justify-center mb-1">
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
          </div>
        )
      )}

      {/* Speaking waveform overlay */}
      {isListening && (
        <div className="absolute inset-0 flex items-end justify-center pb-6 bg-black/25">
          <div className="flex items-end gap-0.5 h-8">
            {[0, 1, 2, 3, 4].map(i => {
              const h = Math.max(3, (audioLevel / 100) * 28 * (0.5 + 0.5 * Math.sin(i * 1.4 + Date.now() / 180)))
              return (
                <div
                  key={i}
                  className="w-1 bg-red-400 rounded-full transition-all duration-100"
                  style={{ height: `${h}px` }}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Name bar */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1" style={{ background: 'rgba(0,0,0,0.65)' }}>
        <p className="text-white truncate text-center" style={{ fontSize: '11px' }}>
          {candidateName.split(' ')[0] || 'Vous'}
        </p>
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
  const [reactions, setReactions] = useState<Partial<Record<SpeakerId, ReactionKind>>>({})
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.40) {
        const inactive = (['president', 'technique', 'rh'] as SpeakerId[]).filter(id => id !== currentSpeakerId)
        const target = inactive[Math.floor(Math.random() * inactive.length)]
        const kind = (['nod', 'note', 'lookaway'] as const)[Math.floor(Math.random() * 3)]
        setReactions(prev => ({ ...prev, [target]: kind }))
        const dur = kind === 'note' ? 1500 : kind === 'nod' ? 450 : 800
        setTimeout(() => setReactions(prev => ({ ...prev, [target]: null })), dur)
      }
    }, 12000)
    return () => clearInterval(interval)
  }, [currentSpeakerId])
  return reactions
}

/* ─── Main Page ─── */
export default function SimulationSessionPage() {
  const params = useParams()
  const router = useRouter()
  const simulationId = params.id as string

  const { profile } = useAuth()
  const [config, setConfig] = useState<SimConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [phase, setPhase] = useState<SimulationPhase>('exposé_libre')
  const [phaseOverlay, setPhaseOverlay] = useState<string | null>(null)
  const [turns, setTurns] = useState<SimulationTurn[]>([])
  const [currentSpeakerId, setCurrentSpeakerId] = useState<SpeakerId>('president')
  const [juryMessage, setJuryMessage] = useState('')
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [ending, setEnding] = useState(false)
  const endingRef = useRef(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const sessionStartRef = useRef<string>(new Date().toISOString())

  // Webcam (optional — user activates in briefing, stored in sessionStorage)
  const [webcamActive, setWebcamActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

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

    const jury = config.juryMembers ?? DEFAULT_JURY
    const president = jury.find(m => m.id === 'president') ?? jury[0]
    const presidentTitle = president.gender === 'male' ? 'président' : 'présidente'
    const presidentName = president.name
    const epreuveType = config.epreuveType ?? 'exposé_questions'
    const totalMin = config.durationMinutes ?? 30
    if (epreuveType === 'exposé_questions') {
      const exposéMin = Math.round(totalMin * 0.35)
      const questionsMin = totalMin - exposéMin
      speakAsJury(
        `Bonjour. Je suis ${presidentName}, ${presidentTitle} de ce jury. Nous sommes réunis aujourd'hui pour votre oral du concours ${config.concoursIntitulé}. Vous disposez de ${totalMin} minutes au total : environ ${exposéMin} minutes pour votre exposé, puis ${questionsMin} minutes de questions. Quand vous êtes prêt, vous pouvez commencer.`,
        'president'
      )
    } else {
      const candidateFirstName = config.candidateName?.split(' ')[0] ?? ''
      speakAsJury(
        `Bonjour${candidateFirstName ? ` ${candidateFirstName}` : ''}. Je suis ${presidentName}, ${presidentTitle} de ce jury. Nous allons conduire votre oral du concours ${config.concoursIntitulé}, pour une durée de ${totalMin} minutes. Nous allons passer directement aux questions. Êtes-vous prêt à commencer ?`,
        'president'
      ).then(() => fetchJuryQuestion('questions_jury'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, loading])

  /* ── Timer expiry ── */
  useEffect(() => {
    if (timer.isExpired && config && !ending) handleEnd({ timerExpired: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isExpired])

  /* ── Beforeunload warning ── */
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [])

  /* ── Webcam (optional) ── */
  useEffect(() => {
    const want = sessionStorage.getItem('sim_webcam') === 'true'
    if (!want) return
    let stream: MediaStream | null = null
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(s => {
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
        setWebcamActive(true)
      })
      .catch(() => { /* user denied — stay with avatar */ })
    return () => { stream?.getTracks().forEach(t => t.stop()) }
  }, [])

  /* ── Auto-manage mic based on jury speaking state ── */
  useEffect(() => {
    if (juryVoice.isSpeaking || isAiThinking) {
      // Jury is talking → mic off
      if (speech.isListening) speech.stop()
      setListenEnabled(false)
    } else if (config && !ending && !endingRef.current) {
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
      const silenceMs = phaseRef.current === 'exposé_libre' ? 6000 : 2800
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
    const skipElevenlabs = configRef.current?.elevenLabsEnabled === false
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
    await juryVoice.speak(text, member.elevenlabsVoiceId, member.fallbackPitch, member.fallbackRate, member.voiceSettings, skipElevenlabs)
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
      // Jury ends session — set React state immediately so mic useEffect sees ending=true
      // and won't re-enable the mic when jury finishes speaking.
      // Do NOT touch endingRef here — handleEnd() uses it as a run-once guard.
      if (data.end_session) {
        const speakerId: SpeakerId = 'president'
        setEnding(true)          // blocks mic useEffect (checks !ending)
        setIsAiThinking(false)
        await speakAsJury(data.question, speakerId)
        handleEnd()              // endingRef still false → proceeds normally
        return
      }
      if (data.phase && data.phase !== phaseRef.current) {
        setPhase(data.phase as SimulationPhase)
        triggerPhaseOverlay(getPhaseLabel(data.phase as SimulationPhase))
      }
      const speakerId: SpeakerId = (['president', 'technique', 'rh'].includes(data.next_speaker)
        ? data.next_speaker
        : 'technique') as SpeakerId
      // Stop the "thinking" spinner BEFORE speaking so the jury text bubble is visible during speech
      setIsAiThinking(false)
      await speakAsJury(data.question, speakerId)
    } catch (err) {
      console.error('Erreur question jury:', err)
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
    lastTranscriptRef.current = ''
    setTimeout(() => fetchJuryQuestion('questions_jury'), 500)
  }, [ending, speech, fetchJuryQuestion])

  const finishExposé = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    const text = speech.transcript.trim()
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
    lastTranscriptRef.current = ''
    setPhase('questions_jury')
    triggerPhaseOverlay('Questions du jury')
    setTimeout(() => fetchJuryQuestion('questions_jury'), 2700)
  }, [speech, fetchJuryQuestion])

  const handleEnd = useCallback(async (opts?: { timerExpired?: boolean; earlyExit?: boolean }) => {
    if (endingRef.current) return
    endingRef.current = true
    setEnding(true)
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    speech.stop()

    // Jury president announces end of session before navigating
    if (opts?.timerExpired) {
      const firstName = configRef.current?.candidateName?.split(' ')[0] ?? ''
      await speakAsJury(
        `Le temps imparti est écoulé${firstName ? `, ${firstName}` : ''}. Merci pour votre prestation. Nous allons maintenant délibérer. Vous pouvez vous retirer.`,
        'president'
      )
    }

    timer.pause()
    juryVoice.stop()
    stopAudioLevel()

    // Mark simulation as completed — await to ensure DB is updated BEFORE navigating
    // (fixes dashboard still showing 'new' after completing a simulation)
    const elapsedSec = Math.floor((Date.now() - new Date(sessionStartRef.current).getTime()) / 1000)
    try {
      await supabase.from('simulations').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        actual_duration_seconds: elapsedSec,
      }).eq('id', simulationId)
    } catch { /* best-effort — report API will also update via admin */ }

    router.push(`/simulation/rapport/${simulationId}`)

    const snapshot = turnsRef.current
    const cfg = configRef.current

    if (snapshot.length > 0) {
      supabase.from('simulation_turns').insert(
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
      ).then(() => {}, () => {})
    }

    fetch('/api/simulation/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true, // keep request alive after page navigation
      body: JSON.stringify({
        simulationId,
        turns: snapshot.map(t => ({ turnIndex: t.turnIndex, role: t.role, contentText: t.contentText, phase: t.phase })),
        concoursIntitulé: cfg?.concoursIntitulé ?? '',
        rubriqueJury: cfg?.rubriqueJury ?? {},
        difficulty: cfg?.difficulty ?? 'standard',
        sessionStartedAt: sessionStartRef.current,
        durationMinutes: cfg?.durationMinutes ?? 30,
        earlyExit: opts?.earlyExit ?? false,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.report && typeof window !== 'undefined') {
          sessionStorage.setItem(`sim_report_${simulationId}`, JSON.stringify(data.report))
        }
      })
      .catch(() => {})
  }, [speech, speakAsJury, timer, juryVoice, stopAudioLevel, router, simulationId])

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
  const juryConfig = config.juryMembers ?? DEFAULT_JURY

  const handleManualSubmit = () => {
    const text = speech.transcript.trim()
    if (!text || ending) return
    if (phase === 'exposé_libre') finishExposé()
    else submitAnswer(text)
  }

  return (
    <div className="h-screen bg-[#0F1629] flex flex-col overflow-hidden select-none text-white">
      {/* CSS keyframes for jury animations */}
      <style>{`
        @keyframes jury-breathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; } 20% { opacity: 0.7; } 80% { opacity: 0.7; } 100% { opacity: 0; }
        }
        @keyframes micPulseIndigo {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
          50% { box-shadow: 0 0 0 10px rgba(99,102,241,0.15); }
        }
        @keyframes micPulseEmerald {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
          50% { box-shadow: 0 0 0 8px rgba(52,211,153,0.12); }
        }
        .jury-card { animation: jury-breathing 10s ease-in-out infinite; }
      `}</style>

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
            <p className="text-sm text-gray-400">Le rapport sera généré avec les échanges effectués jusqu&apos;ici.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 py-2 rounded-lg border border-white/15 text-sm hover:bg-white/5 transition-colors"
              >
                Continuer
              </button>
              <button
                onClick={() => { setShowQuitConfirm(false); handleEnd({ earlyExit: true }) }}
                className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Header ══ */}
      <header className="shrink-0 h-[60px] border-b border-white/10 bg-[#0d1526]/80 backdrop-blur-sm flex items-center px-4 gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">{config.concoursIntitulé}</p>
          <p className="text-xs font-semibold text-[#818CF8]">{getPhaseLabel(phase)}</p>
        </div>
        <TimerBadge remaining={timer.remaining} total={totalSec} />

        {/* "J'ai terminé l'exposé" — only visible during exposé_libre phase */}
        {phase === 'exposé_libre' && !juryVoice.isSpeaking && !isAiThinking && !ending && (
          <button
            onClick={finishExposé}
            className="shrink-0 text-xs text-[#818CF8] hover:text-violet-300 border border-[#818CF8]/30 rounded-lg px-3 py-1.5 hover:bg-[#818CF8]/10 transition-colors"
          >
            J&apos;ai terminé l&apos;exposé
          </button>
        )}

        <button
          onClick={() => setShowQuitConfirm(true)}
          className="shrink-0 flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors border border-white/10 rounded-lg px-3 py-1.5 hover:border-red-500/30"
        >
          <LogOut className="w-3.5 h-3.5" />
          Quitter
        </button>
      </header>

      {/* ══ Central area ══ */}
      <main className="flex-1 overflow-hidden flex flex-col px-4 py-4 gap-4">

        {/* Jury tiles grid */}
        <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto w-full">
          {juryConfig.map((member) => (
            <JuryTile
              key={member.id}
              member={member}
              isActiveSpeaker={currentSpeakerId === member.id && (juryVoice.isSpeaking || isAiThinking)}
              isThinking={isAiThinking && currentSpeakerId === member.id}
              reaction={(reactions[member.id] ?? null) as ReactionKind}
              concoursSlug={concoursSlug}
              dimmed={
                (juryVoice.isSpeaking || isAiThinking) &&
                currentSpeakerId !== member.id
              }
            />
          ))}
        </div>

        {/* Jury speech bubble + live transcript */}
        <div className="flex-1 max-w-3xl mx-auto w-full flex flex-col gap-3">
          {isAiThinking ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              Le jury réfléchit…
            </div>
          ) : juryMessage ? (
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-xs text-[#818CF8] font-medium mb-1">
                {getJuryMember(currentSpeakerId, juryConfig).displayName} · {getJuryMember(currentSpeakerId, juryConfig).roleLabel}
              </p>
              <p className="text-sm text-gray-200 leading-relaxed">{juryMessage}</p>
            </div>
          ) : null}

          {/* Live transcript — shown only when candidate is speaking (jury silent) */}
          {!juryVoice.isSpeaking && !isAiThinking && (speech.transcript || speech.interimTranscript) && (
            <div className="flex-1 flex items-center justify-center px-8">
              <p className="text-lg text-slate-500 italic leading-relaxed text-center max-w-[720px]">
                {speech.transcript}
                <span className="text-slate-600">{speech.interimTranscript}</span>
              </p>
            </div>
          )}

          {speech.error && <p className="text-xs text-red-400">{speech.error}</p>}
        </div>
      </main>

      {/* ══ Footer — Zoom-style audio toolbar ══ */}
      <footer className="shrink-0 bg-[#0d1526]/80 backdrop-blur-sm px-4 pb-6 pt-2">
        {/* State label */}
        <p className="text-center text-xs font-medium text-slate-400 mb-2">
          {(juryVoice.isSpeaking || isAiThinking || ending)
            ? 'Le jury s’exprime'
            : (speech.transcript || speech.interimTranscript)
              ? 'Micro ouvert'
              : 'C’est à vous'
          }
        </p>
        {/* Toolbar pill */}
        <div
          className="flex items-center gap-3 mx-auto"
          style={{
            background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(12px)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: '100px',
            padding: '8px 16px',
            width: 'fit-content',
          }}
        >
          {/* Mic button — 3 states */}
          {(() => {
            const juryActive = juryVoice.isSpeaking || isAiThinking || ending
            const isTalking = !juryActive && !!(speech.transcript || speech.interimTranscript)
            if (juryActive) {
              return (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: '#1e293b', opacity: 0.5, cursor: 'not-allowed' }}
                >
                  <MicOff className="w-5 h-5 text-slate-500" />
                </div>
              )
            }
            if (isTalking) {
              return (
                <button
                  onClick={handleManualSubmit}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: '#334155',
                    border: '2px solid #34d399',
                    animation: 'micPulseEmerald 2s ease-in-out infinite',
                  }}
                  title="Cliquez pour terminer votre réponse"
                >
                  <Mic className="w-5 h-5 text-white" />
                </button>
              )
            }
            return (
              <button
                onClick={handleManualSubmit}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: '#6366f1',
                  animation: 'micPulseIndigo 2.5s ease-in-out infinite',
                }}
                title="Le micro capte votre voix automatiquement"
              >
                <Mic className="w-5 h-5 text-white" />
              </button>
            )
          })()}

          {/* Camera toggle */}
          <button
            onClick={() => {
              if (webcamActive) {
                if (videoRef.current?.srcObject) {
                  (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
                  videoRef.current.srcObject = null
                }
                setWebcamActive(false)
              } else {
                navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                  .then(s => { if (videoRef.current) { videoRef.current.srcObject = s } setWebcamActive(true) })
                  .catch(() => {})
              }
            }}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{ background: webcamActive ? '#334155' : '#1e293b' }}
            title={webcamActive ? 'Désactiver la caméra' : 'Activer la caméra'}
          >
            {webcamActive
              ? <Video className="w-5 h-5 text-white" />
              : <VideoOff className="w-5 h-5 text-slate-400" />
            }
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-slate-700" />

          {/* Quit button */}
          <button
            onClick={() => setShowQuitConfirm(true)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'rgba(239,68,68,0.10)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.20)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.10)')}
            title="Quitter la simulation"
          >
            <PhoneOff className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </footer>

      {/* ══ Fixed bottom-right: candidate tile ══ */}
      <div className="fixed bottom-4 right-4 z-40">
        <CandidateTile
          isListening={speech.isListening}
          isSpeaking={!juryVoice.isSpeaking && !isAiThinking && listenEnabled}
          audioLevel={audioLevel}
          candidateName={candidateName}
          avatarUrl={profile?.avatar_url}
          videoRef={videoRef}
          webcamActive={webcamActive}
        />
      </div>
    </div>
  )
}
