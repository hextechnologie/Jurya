'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui'
import CandidateNavbar from '@/components/CandidateNavbar'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Mic, CheckCircle2, XCircle, Play, ChevronDown, Clock,
  Shield, Volume2, AlertTriangle, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { getRandomJury } from '@/lib/juries/voices'

interface Concours {
  id: string
  type: string
  grade: string
  intitulé: string
  durée_épreuve_minutes: number
  rubrique_jury: Record<string, unknown>
  organisme_organisateur: string
}

type Difficulty = 'bienveillant' | 'standard' | 'exigeant'
type EpreuveType = 'exposé_questions' | 'questions_uniquement' | 'mise_en_situation'

const DURATION_OPTIONS = [15, 30, 45, 60]

const FALLBACK_CONCOURS: Concours[] = [
  { id: 'attache-territorial', type: 'externe', grade: 'A', intitulé: 'Attaché territorial', durée_épreuve_minutes: 30, rubrique_jury: {}, organisme_organisateur: 'CNFPT' },
  { id: 'ira', type: 'externe', grade: 'A', intitulé: "IRA — Institut Régional d'Administration", durée_épreuve_minutes: 30, rubrique_jury: {}, organisme_organisateur: 'DGAFP' },
  { id: 'insp', type: 'externe', grade: 'A+', intitulé: 'INSP (ex-ENA)', durée_épreuve_minutes: 45, rubrique_jury: {}, organisme_organisateur: 'INSP' },
  { id: 'commissaire-police', type: 'externe', grade: 'A', intitulé: 'Commissaire de police', durée_épreuve_minutes: 30, rubrique_jury: {}, organisme_organisateur: "Ministère de l'Intérieur" },
  { id: 'directeur-hopital', type: 'externe', grade: 'A', intitulé: "Directeur d'hôpital (DH)", durée_épreuve_minutes: 45, rubrique_jury: {}, organisme_organisateur: 'EHESP' },
  { id: 'agregation', type: 'externe', grade: 'A', intitulé: 'Agrégation (toutes disciplines)', durée_épreuve_minutes: 30, rubrique_jury: {}, organisme_organisateur: "Ministère de l'Éducation" },
  { id: 'administrateur-civil', type: 'interne', grade: 'A+', intitulé: 'Administrateur civil', durée_épreuve_minutes: 45, rubrique_jury: {}, organisme_organisateur: 'DGAFP' },
  { id: 'capes', type: 'externe', grade: 'A', intitulé: 'CAPES', durée_épreuve_minutes: 30, rubrique_jury: {}, organisme_organisateur: "Ministère de l'Éducation" },
  { id: 'magistrat', type: 'externe', grade: 'A+', intitulé: 'Magistrat (ENM)', durée_épreuve_minutes: 30, rubrique_jury: {}, organisme_organisateur: 'ENM' },
  { id: 'inspection-travail', type: 'externe', grade: 'A', intitulé: 'Inspecteur du travail', durée_épreuve_minutes: 20, rubrique_jury: {}, organisme_organisateur: 'Ministère du Travail' },
  { id: 'ingenieur-territorial', type: 'externe', grade: 'A', intitulé: 'Ingénieur territorial', durée_épreuve_minutes: 30, rubrique_jury: {}, organisme_organisateur: 'CNFPT' },
  { id: 'greffier-en-chef', type: 'externe', grade: 'B', intitulé: 'Greffier en chef', durée_épreuve_minutes: 20, rubrique_jury: {}, organisme_organisateur: 'Ministère de la Justice' },
]

const EPREUVE_TYPES: { value: EpreuveType; label: string; desc: string }[] = [
  { value: 'exposé_questions', label: 'Exposé + questions', desc: 'Exposé libre de 5 min puis questions du jury' },
  { value: 'questions_uniquement', label: 'Questions uniquement', desc: 'Le jury pose directement ses questions' },
  { value: 'mise_en_situation', label: 'Mise en situation', desc: 'Scénario professionnel à analyser et gérer' },
]

const DIFFICULTIES: { value: Difficulty; label: string; color: string; desc: string }[] = [
  { value: 'bienveillant', label: 'Bienveillant', color: 'text-green-400', desc: 'Jury encourageant, relances douces' },
  { value: 'standard', label: 'Standard', color: 'text-yellow-400', desc: 'Jury neutre, questions classiques' },
  { value: 'exigeant', label: 'Exigeant', color: 'text-red-400', desc: 'Jury rigoureux, relances fréquentes' },
]

function generateSessionId(): string {
  return 'local_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2)
}

export default function SimulationSetupPage() {
  const { user, loading: authLoading, profile } = useAuth()
  const router = useRouter()

  const [concoursList, setConcoursList] = useState<Concours[]>([])
  const [loadingConcours, setLoadingConcours] = useState(true)

  const [selectedConcoursId, setSelectedConcoursId] = useState('')
  const [epreuveType, setEpreuveType] = useState<EpreuveType>('exposé_questions')
  const [difficulty, setDifficulty] = useState<Difficulty>('standard')
  const [duration, setDuration] = useState<number>(30)
  const [sujet, setSujet] = useState('')

  const [micStatus, setMicStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')
  const [micLevel, setMicLevel] = useState(0)
  const micStreamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const selectedConcours = concoursList.find(c => c.id === selectedConcoursId) ?? null

  useEffect(() => {
    async function fetchConcours() {
      try {
        const { data, error } = await supabase
          .from('concours')
          .select('id, type, grade, intitulé, durée_épreuve_minutes, rubrique_jury, organisme_organisateur')
          .order('intitulé')
        if (!error && data && data.length > 0) {
          setConcoursList(data as unknown as Concours[])
        } else {
          setConcoursList(FALLBACK_CONCOURS)
        }
      } catch {
        setConcoursList(FALLBACK_CONCOURS)
      } finally {
        setLoadingConcours(false)
      }
    }
    fetchConcours()
  }, [])

  useEffect(() => {
    if (selectedConcours && DURATION_OPTIONS.includes(selectedConcours.durée_épreuve_minutes)) {
      setDuration(selectedConcours.durée_épreuve_minutes)
    }
  }, [selectedConcours])

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

  useEffect(() => () => stopMicCheck(), [stopMicCheck])

  const handleStart = async () => {
    if (!selectedConcoursId) return
    setCreating(true)
    setCreateError(null)
    stopMicCheck()

    // Credits check
    if (profile && profile.interviews_used_this_month >= profile.interviews_limit) {
      setCreateError('Vous n\'avez plus de crédits disponibles. Rechargez votre compte sur la page Crédits.')
      setCreating(false)
      return
    }

    const config = {
      concoursId: selectedConcoursId,
      concoursIntitulé: selectedConcours?.intitulé ?? '',
      rubriqueJury: selectedConcours?.rubrique_jury ?? {},
      epreuveType,
      difficulty,
      durationMinutes: duration,
      sujet: sujet.trim() || null,
      userId: user?.id ?? null,
      candidateName: (
        user?.user_metadata?.full_name
        ?? user?.user_metadata?.name
        ?? user?.email?.split('@')[0]
        ?? ''
      ) as string,
      juryMembers: getRandomJury(),
    }

    // Try to persist in DB; fall back to sessionStorage
    let sessionId: string | null = null
    if (user) {
      try {
        const { data, error } = await supabase
          .from('simulations')
          .insert({
            user_id: user.id,
            concours_id: selectedConcoursId,
            type: epreuveType,
            status: 'in_progress',
            planned_duration_seconds: duration * 60,
            sujet_tirage: sujet.trim() || null,
            simulation_config: config,
          })
          .select('id')
          .single()
        if (!error && data) sessionId = data.id
      } catch { /* fall through to sessionStorage */ }
    }

    if (!sessionId) {
      sessionId = generateSessionId()
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`sim_config_${sessionId}`, JSON.stringify(config))
    }

    router.push(`/simulation/${sessionId}`)
  }

  const canStart = !!selectedConcoursId && duration > 0

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
          <p className="text-gray-400">Connectez-vous pour lancer une simulation.</p>
          <Link href="/login"><Button variant="primary">Se connecter</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CandidateNavbar />
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-background to-background pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-secondary/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2 gradient-text">Configurer votre simulation</h1>
          <p className="text-gray-400">Choisissez vos options et préparez-vous à passer face au jury IA.</p>
        </div>

        <div className="glass rounded-2xl p-6 lg:p-8 space-y-8">

          {/* 1. Concours */}
          <section className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Concours visé</label>
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
                    <option key={c.id} value={c.id}>{c.intitulé} ({c.grade})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              </div>
            )}
            {selectedConcours && (
              <p className="text-xs text-gray-500">{selectedConcours.organisme_organisateur} · {selectedConcours.type} · Catégorie {selectedConcours.grade}</p>
            )}
          </section>

          {/* 2. Type d'épreuve */}
          <section className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Type d'épreuve</label>
            <div className="grid grid-cols-1 gap-2">
              {EPREUVE_TYPES.map(et => (
                <button
                  key={et.value}
                  type="button"
                  onClick={() => setEpreuveType(et.value)}
                  className={`text-left px-4 py-3 rounded-lg border transition-all ${
                    epreuveType === et.value
                      ? 'border-primary bg-primary/15 text-foreground'
                      : 'border-border bg-card text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <span className="font-medium text-sm block">{et.label}</span>
                  <span className="text-xs text-gray-500">{et.desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 3. Durée */}
          <section className="space-y-2">
            <label className="block text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Durée
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={`py-3 rounded-lg text-sm font-medium border transition-all ${
                    duration === mins
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-border bg-card text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </section>

          {/* 4. Difficulté */}
          <section className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Niveau du jury</label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={`py-3 rounded-lg text-sm font-medium border transition-all ${
                    difficulty === d.value
                      ? 'border-primary bg-primary/20 text-foreground'
                      : 'border-border bg-card text-gray-400 hover:border-gray-500'
                  }`}
                  title={d.desc}
                >
                  <span className={difficulty === d.value ? d.color : ''}>{d.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">{DIFFICULTIES.find(d => d.value === difficulty)?.desc}</p>
          </section>

          {/* 5. Sujet */}
          <section className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Sujet (optionnel)</label>
            <textarea
              value={sujet}
              onChange={e => setSujet(e.target.value)}
              placeholder="Laissez vide pour que l'IA choisisse un sujet adapté à votre concours…"
              rows={2}
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </section>

          {/* 6. Test micro */}
          <section className="space-y-3">
            <label className="block text-sm font-medium text-foreground">Test du microphone</label>
            <p className="text-xs text-gray-500">Le test est recommandé. Vous pouvez aussi utiliser le mode texte si vous n'avez pas de micro.</p>
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
                {micStatus === 'ok' && 'Micro actif ✓'}
                {micStatus === 'error' && 'Réessayer'}
              </Button>
              {micStatus === 'error' && (
                <span className="text-red-400 flex items-center gap-1 text-xs">
                  <XCircle className="w-4 h-4" /> Micro non détecté — vous utiliserez le mode texte
                </span>
              )}
            </div>
            {(micStatus === 'ok' || micStatus === 'testing') && (
              <div className="h-3 bg-card rounded-full overflow-hidden border border-border">
                <div
                  className="h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${micLevel}%`,
                    background: micLevel > 70 ? 'linear-gradient(90deg,#22c55e,#ef4444)' : 'linear-gradient(90deg,#22c55e,#22c55e)',
                  }}
                />
              </div>
            )}
          </section>

          {/* Error */}
          {createError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {createError}
                {createError.includes('crédits') && (
                  <Link href="/credits" className="ml-1 underline text-indigo-400 hover:text-indigo-300">
                    Recharger maintenant →
                  </Link>
                )}
              </span>
            </div>
          )}

          {/* Start */}
          {!canStart && (
            <p className="text-xs text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Sélectionnez un concours pour commencer.
            </p>
          )}

          <Button
            variant="primary"
            fullWidth
            onClick={handleStart}
            disabled={!canStart || creating}
            loading={creating}
            className="text-lg py-4 gap-2"
          >
            <Play className="w-5 h-5" />
            Commencer la simulation
            <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-xs text-center text-gray-600">
            {micStatus === 'ok'
              ? '🎙 Mode vocal activé'
              : micStatus === 'error'
              ? '⌨️ Mode texte (micro non disponible)'
              : '⌨️ Mode texte par défaut — testez votre micro pour passer en vocal'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
