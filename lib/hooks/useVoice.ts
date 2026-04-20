// Voice hooks for simulation — Web Speech API + audio recording

import { useRef, useState, useCallback, useEffect } from 'react'
import { countFillerWords, calculateSpeakingPace } from '@/lib/types/simulation'

interface VoiceRecognitionResult {
  transcript: string
  isFinal: boolean
}

// Hook: Speech-to-Text (candidate voice → text)
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const start = useCallback(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('La reconnaissance vocale n\'est pas supportée par votre navigateur. Utilisez Chrome ou Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript + ' '
        } else {
          interim += result[0].transcript
        }
      }
      if (final) setTranscript(prev => prev + final)
      setInterimTranscript(interim)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') return // Normal, don't error
      setError(`Erreur micro : ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (recognitionRef.current && isListening) {
        try { recognition.start() } catch { /* already started */ }
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setError(null)
  }, [isListening])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimTranscript('')
  }, [])

  const reset = useCallback(() => {
    stop()
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => { recognitionRef.current?.stop() }
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    fullText: transcript + interimTranscript,
    error,
    start,
    stop,
    reset,
    isSupported: typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  }
}

// Hook: Audio recording (MediaRecorder → blob)
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })

      chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
        if (timerRef.current) clearInterval(timerRef.current)
      }

      mediaRecorderRef.current = mediaRecorder
      startTimeRef.current = Date.now()
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setDuration(0)
      setError(null)

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (err) {
      setError('Impossible d\'accéder au microphone. Vérifiez les permissions.')
    }
  }, [])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  const reset = useCallback(() => {
    stop()
    setAudioBlob(null)
    setDuration(0)
    setError(null)
  }, [stop])

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return { isRecording, audioBlob, duration, error, start, stop, reset }
}

/** Strip markdown so TTS never reads asterisks / hashes aloud */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/gs, '$1')
    .replace(/\*(.+?)\*/gs, '$1')
    .replace(/__(.+?)__/gs, '$1')
    .replace(/_(.+?)_/gs, '$1')
    .replace(/#{1,6}\s+/gm, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .trim()
}

// Hook: Text-to-Speech — tries ElevenLabs first, falls back to Web Speech API
// speak(text, voiceId?, fallbackPitch?, fallbackRate?) where voiceId is ElevenLabs voice ID
export function useJuryVoice() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  const speakFallback = useCallback((clean: string, pitch = 0.9, rate = 0.92) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = 'fr-FR'
    utterance.rate = rate
    utterance.pitch = pitch
    // Pick best available French voice
    const voices = window.speechSynthesis.getVoices()
    const frVoice = voices.find(v => v.lang.startsWith('fr') && v.name.includes('Google'))
      ?? voices.find(v => v.lang.startsWith('fr'))
    if (frVoice) utterance.voice = frVoice
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [])

  const speak = useCallback(async (
    text: string,
    voiceId?: string,
    fallbackPitch = 0.9,
    fallbackRate = 0.92,
  ) => {
    // Stop any currently playing audio
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
    window.speechSynthesis?.cancel()

    const clean = stripMarkdown(text)
    if (!clean) return

    // Try ElevenLabs if voiceId provided
    if (voiceId) {
      try {
        const res = await fetch('/api/simulation/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean, voiceId }),
        })
        if (res.ok) {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          blobUrlRef.current = url
          const audio = new Audio(url)
          audioRef.current = audio
          setIsSpeaking(true)
          audio.play().catch(() => speakFallback(clean, fallbackPitch, fallbackRate))
          audio.onended = () => {
            setIsSpeaking(false)
            if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
          }
          audio.onerror = () => {
            setIsSpeaking(false)
            speakFallback(clean, fallbackPitch, fallbackRate)
          }
          return
        }
      } catch { /* fall through to Web Speech API */ }
    }

    speakFallback(clean, fallbackPitch, fallbackRate)
  }, [speakFallback])

  const stop = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  useEffect(() => () => stop(), [stop])

  return { isSpeaking, speak, stop }
}

// Hook: Real-time microphone audio level (for candidate tile waveform)
export function useAudioLevel() {
  const [level, setLevel] = useState(0)
  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number>(0)

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      const ctx = new AudioContext()
      ctxRef.current = ctx
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      src.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((s, v) => s + v, 0) / data.length
        setLevel(Math.min(100, Math.round((avg / 80) * 100)))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch { /* no mic */ }
  }, [])

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    ctxRef.current?.close().catch(() => {})
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    ctxRef.current = null
    setLevel(0)
  }, [])

  useEffect(() => () => stop(), [stop])

  return { level, start, stop }
}

// Hook: Simulation timer (countdown)
export function useSimulationTimer(totalSeconds: number) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const start = useCallback(() => {
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
      setElapsed(prev => prev + 1)
    }, 1000)
  }, [])

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false)
  }, [])

  const reset = useCallback((newTotal?: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRemaining(newTotal ?? totalSeconds)
    setElapsed(0)
    setIsRunning(false)
  }, [totalSeconds])

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return {
    remaining,
    elapsed,
    isRunning,
    isExpired: remaining <= 0,
    formattedRemaining: formatTime(remaining),
    formattedElapsed: formatTime(elapsed),
    percentRemaining: (remaining / totalSeconds) * 100,
    start,
    pause,
    reset,
  }
}

// Prosody analysis from transcript
export function analyzeProsody(transcript: string, durationMs: number) {
  const fillerCount = countFillerWords(transcript)
  const pace = calculateSpeakingPace(transcript, durationMs)
  const wordCount = transcript.split(/\s+/).filter(Boolean).length

  return {
    wordCount,
    fillerWordsCount: fillerCount,
    fillerWordRatio: wordCount > 0 ? fillerCount / wordCount : 0,
    speakingPaceWpm: pace,
    paceVerdict: pace < 100 ? 'trop_lent' : pace > 170 ? 'trop_rapide' : 'bon',
    fillerVerdict: fillerCount > 10 ? 'trop_élevé' : fillerCount > 5 ? 'modéré' : 'bon',
  }
}
