'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Mic, MicOff, CheckCircle2, XCircle, Shuffle,
  Play, Keyboard, ChevronDown, Sparkles, Clock,
  Shield, Volume2, AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

interface Concours {
  id: string
  type: string
  grade: string
  intitulé: string
  durée_épreuve_minutes: number
  rubrique_jury: Record<string, unknown>
  organisme_organisateur: string
}

type Difficulty = 'easy' | 'medium' | 'hard'

export default function SimulationSetupPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  // --- Data ---
  const [concoursList, setConcoursList] = useState<Concours[]>([])
  const [loadingConcours, setLoadingConcours] = useState(true)

  // --- Form state ---
  const [selectedConcoursId, setSelectedConcoursId] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [duration, setDuration] = useState<number>(30)
  const [useVoice, setUseVoice] = useState(true)

  // --- Mic check ---
  const [micStatus, setMicStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')
  const [micLevel, setMicLevel] = useState(0)
  const micStreamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)

  // --- Sujet tirage ---
  const [randomQuestion, setRandomQuestion] = useState<string | null>(null)
  const [loadingQuestion, setLoadingQuestion] = useState(false)

  // --- Submit ---
  const [creating, setCreating] = useState(false)

  const selectedConcours = concoursList.find(c => c.id === selectedConcoursId)

  // Fetch concours on mount
  useEffect(() => {
    async function fetchConcours() {
      const { data, error } = await supabase
        .from('concours')
        .select('id, type, grade, intitulé, durée_épreuve_minutes, rubrique_jury, organisme_organisateur')
        .order('intitulé')
      if (!error && data) setConcoursList(data as unknown as Concours[])
      setLoadingConcours(false)
    }
    fetchConcours()
  }, [])

  // Auto-fill duration when concours changes
  useEffect(() => {
    if (selectedConcours) {
      setDuration(selectedConcours.durée_épreuve_minutes)
    }
  }, [selectedConcours])

  // --- Mic check ---
  const stopMicCheck = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    micStreamRef.current?.getTracks().forEach(t => t.stop())
    micStreamRef.current = null
    analyserRef.current = null
  }, [])

  const testMic = async () => {
    setMicStatus('testing')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream

      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const tick = () => {
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)))
        animFrameRef.current = requestAnimationFrame(tick)
      }
      tick()

      setMicStatus('ok')
    } catch {
      setMicStatus('error')
    }
  }

  useEffect(() => {
    return () => stopMicCheck()
  }, [stopMicCheck])

  // --- Tirage au sujet ---
  const drawRandomQuestion = async () => {
    if (!selectedConcoursId) return
    setLoadingQuestion(true)
    setRandomQuestion(null)
    const { data, error } = await supabase
      .from('questions_bank')
      .select('question_text_fr')
      .eq('concours_id', selectedConcoursId)
      .eq('is_active', true)
    if (!error && data && data.length > 0) {
      const random = data[Math.floor(Math.random() * data.length)]
      setRandomQuestion(random.question_text_fr)
    } else {
      setRandomQuestion(null)
    }
    setLoadingQuestion(false)
  }

  // --- Start simulation ---
  const handleStart = async () => {
    if (!user || !selectedConcoursId) return
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('simulations')
        .insert({
          user_id: user.id,
          concours_id: selectedConcoursId,
          type: 'grand_oral',
          status: 'in_progress',
          planned_duration_seconds: duration * 60,
          sujet_tirage: randomQuestion ?? null,
          simulation_config: {
            difficulty,
            useVoice,
            concoursIntitulé: selectedConcours?.intitulé,
            rubriqueJury: selectedConcours?.rubrique_jury,
          },
        })
        .select('id')
        .single()

      if (error) throw error
      stopMicCheck()
      router.push(`/simulation/${data.id}`)
    } catch (err) {
      console.error('Erreur création simulation:', err)
      setCreating(false)
    }
  }

  // --- Pre-flight checklist ---
  const checks = [
    { label: 'Concours sélectionné', ok: !!selectedConcoursId },
    { label: 'Durée définie', ok: duration > 0 },
    ...(useVoice ? [{ label: 'Microphone détecté', ok: micStatus === 'ok' }] : []),
    { label: 'Connecté', ok: !!user },
  ]
  const allChecksOk = checks.every(c => c.ok)

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-8 max-w-md text-center space-y-4">
          <Shield className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Connexion requise</h1>
          <p className="text-gray-400">Connectez-vous pour lancer une simulation d'oral.</p>
          <Link href="/login"><Button variant="primary">Se connecter</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-background to-background" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-secondary/10 blur-3xl rounded-full" />

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            <span className="gradient-text">Préparer une simulation</span>
          </h1>
          <p className="text-gray-400">Configurez votre épreuve orale et lancez-vous.</p>
        </div>

        <div className="glass rounded-2xl p-6 lg:p-8 space-y-8">
          {/* 1. Concours */}
          <section className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Concours</label>
            {loadingConcours ? (
              <div className="h-12 bg-card rounded-lg animate-pulse" />
            ) : (
              <div className="relative">
                <select
                  value={selectedConcoursId}
                  onChange={e => setSelectedConcoursId(e.target.value)}
                  className="w-full appearance-none bg-card border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">— Sélectionnez un concours —</option>
                  {concoursList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.intitulé} ({c.grade})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              </div>
            )}
            {selectedConcours && (
              <p className="text-xs text-gray-500">
                {selectedConcours.organisme_organisateur} · {selectedConcours.type} · {selectedConcours.grade}
              </p>
            )}
          </section>

          {/* 2. Difficulty */}
          <section className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Difficulté</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'easy' as Difficulty, label: 'Facile', color: 'text-green-400' },
                { value: 'medium' as Difficulty, label: 'Normal', color: 'text-yellow-400' },
                { value: 'hard' as Difficulty, label: 'Difficile', color: 'text-red-400' },
              ]).map(d => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`py-3 rounded-lg font-medium border transition-all ${
                    difficulty === d.value
                      ? 'border-primary bg-primary/20 text-foreground'
                      : 'border-border bg-card text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <span className={difficulty === d.value ? d.color : ''}>{d.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 3. Duration */}
          <section className="space-y-2">
            <label className="block text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Durée (minutes)
            </label>
            <input
              type="number"
              min={5}
              max={120}
              value={duration}
              onChange={e => setDuration(Math.max(5, Math.min(120, Number(e.target.value))))}
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {selectedConcours && duration !== selectedConcours.durée_épreuve_minutes && (
              <p className="text-xs text-yellow-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Durée réglementaire : {selectedConcours.durée_épreuve_minutes} min
              </p>
            )}
          </section>

          {/* 4. Mode toggle */}
          <section className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Mode de réponse</label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setUseVoice(true)}
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                  useVoice
                    ? 'bg-primary/20 text-primary border-r border-primary/30'
                    : 'bg-card text-gray-400 border-r border-border hover:bg-card/80'
                }`}
              >
                🎙 Mode vocal (recommandé)
              </button>
              <button
                onClick={() => setUseVoice(false)}
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                  !useVoice
                    ? 'bg-primary/20 text-primary'
                    : 'bg-card text-gray-400 hover:bg-card/80'
                }`}
              >
                ⌨️ Mode texte
              </button>
            </div>
          </section>

          {/* 5. Mic check */}
          {useVoice && (
            <section className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Test du microphone</label>
              <div className="flex items-center gap-4">
                <Button
                  variant={micStatus === 'ok' ? 'secondary' : 'outline'}
                  onClick={testMic}
                  disabled={micStatus === 'testing'}
                  loading={micStatus === 'testing'}
                >
                  {micStatus === 'ok' ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {micStatus === 'idle' && 'Tester le micro'}
                  {micStatus === 'testing' && 'Écoute en cours…'}
                  {micStatus === 'ok' && 'Micro actif'}
                  {micStatus === 'error' && 'Réessayer'}
                </Button>
                {micStatus === 'ok' && (
                  <span className="text-green-400 flex items-center gap-1 text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Micro détecté
                  </span>
                )}
                {micStatus === 'error' && (
                  <span className="text-red-400 flex items-center gap-1 text-sm">
                    <XCircle className="w-4 h-4" /> Micro non détecté
                  </span>
                )}
              </div>
              {/* VU meter */}
              {(micStatus === 'ok' || micStatus === 'testing') && (
                <div className="h-3 bg-card rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      width: `${micLevel}%`,
                      background: micLevel > 70
                        ? 'linear-gradient(90deg, #22c55e, #ef4444)'
                        : micLevel > 30
                        ? 'linear-gradient(90deg, #22c55e, #eab308)'
                        : 'linear-gradient(90deg, #22c55e, #22c55e)',
                    }}
                  />
                </div>
              )}
            </section>
          )}

          {/* 6. Tirage au sujet */}
          {selectedConcoursId && (
            <section className="space-y-3">
              <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                <Shuffle className="w-4 h-4" /> Tirage au sujet (optionnel)
              </label>
              <Button
                variant="outline"
                onClick={drawRandomQuestion}
                loading={loadingQuestion}
                disabled={loadingQuestion}
              >
                <Shuffle className="w-4 h-4" />
                Tirer un sujet au sort
              </Button>
              {randomQuestion && (
                <div className="bg-card border border-primary/30 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-1 font-medium">Sujet tiré :</p>
                  <p className="text-foreground">{randomQuestion}</p>
                </div>
              )}
            </section>
          )}

          {/* 8. Pre-flight checklist */}
          <section className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Checklist</label>
            <div className="grid grid-cols-2 gap-2">
              {checks.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {c.ok
                    ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    : <XCircle className="w-4 h-4 text-gray-600 shrink-0" />
                  }
                  <span className={c.ok ? 'text-gray-300' : 'text-gray-600'}>{c.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 7. Start button */}
          <Button
            variant="primary"
            fullWidth
            onClick={handleStart}
            disabled={!allChecksOk || creating}
            loading={creating}
            className="text-lg py-4"
          >
            <Play className="w-5 h-5" />
            Commencer la simulation
          </Button>
        </div>
      </div>
    </div>
  )
}
