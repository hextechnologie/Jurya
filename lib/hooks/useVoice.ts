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

// Hook: Text-to-Speech for jury voice
export function useJuryVoice() {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'fr-FR'
    utterance.rate = 0.95  // Slightly slower for authority
    utterance.pitch = 0.9  // Slightly lower for gravitas

    // Try to use a French voice
    const voices = window.speechSynthesis.getVoices()
    const frenchVoice = voices.find(v => v.lang.startsWith('fr') && v.name.includes('Google'))
      || voices.find(v => v.lang.startsWith('fr'))
    if (frenchVoice) utterance.voice = frenchVoice

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  return { isSpeaking, speak, stop }
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
