import { useState, useRef, useCallback, useEffect } from 'react'

export type MicTestStatus = 'idle' | 'testing' | 'success' | 'low_volume' | 'saturated' | 'no_sound'

const ANALYSIS_SECONDS = 3
const RMS_SILENCE_THRESHOLD = 0.003
const RMS_LOW_THRESHOLD = 0.015
const SATURATION_THRESHOLD = 0.92

export function useMicTest() {
  const [status, setStatus] = useState<MicTestStatus>('idle')
  const [rmsLevel, setRmsLevel] = useState(0)         // current frame RMS (0–1)
  const [waveData, setWaveData] = useState<number[]>(new Array(48).fill(0))

  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)
  const rmsHistoryRef = useRef<number[]>([])
  const frameCountRef = useRef(0)
  const targetFramesRef = useRef(0)

  const stopStream = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => null)
    }
    audioCtxRef.current = null
    analyserRef.current = null
  }, [])

  const start = useCallback(async () => {
    stopStream()
    setStatus('testing')
    setRmsLevel(0)
    setWaveData(new Array(48).fill(0))
    rmsHistoryRef.current = []
    frameCountRef.current = 0

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream

      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx

      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.2
      source.connect(analyser)
      analyserRef.current = analyser

      // Determine how many animation frames = ANALYSIS_SECONDS
      // We measure real elapsed time instead of frame count for accuracy
      const startTime = audioCtx.currentTime

      const timeDomainBuf = new Float32Array(analyser.fftSize)

      const tick = () => {
        const analyserNode = analyserRef.current
        if (!analyserNode) return

        analyserNode.getFloatTimeDomainData(timeDomainBuf)

        // RMS from time domain
        let sumSq = 0
        for (let i = 0; i < timeDomainBuf.length; i++) {
          sumSq += timeDomainBuf[i] * timeDomainBuf[i]
        }
        const rms = Math.sqrt(sumSq / timeDomainBuf.length)
        rmsHistoryRef.current.push(rms)
        setRmsLevel(rms)

        // Wave visualisation (48 samples evenly spaced)
        const step = Math.floor(timeDomainBuf.length / 48)
        const wave: number[] = []
        for (let i = 0; i < 48; i++) {
          wave.push(timeDomainBuf[i * step] ?? 0)
        }
        setWaveData(wave)

        const elapsed = audioCtxRef.current ? audioCtxRef.current.currentTime - startTime : 0
        if (elapsed >= ANALYSIS_SECONDS) {
          // Analyse collected history
          const history = rmsHistoryRef.current
          if (history.length === 0) {
            setStatus('no_sound')
          } else {
            const avg = history.reduce((a, b) => a + b, 0) / history.length
            const peak = Math.max(...history)
            if (avg < RMS_SILENCE_THRESHOLD) {
              setStatus('no_sound')
            } else if (avg < RMS_LOW_THRESHOLD) {
              setStatus('low_volume')
            } else if (peak > SATURATION_THRESHOLD) {
              setStatus('saturated')
            } else {
              setStatus('success')
            }
          }
          stopStream()
          return
        }

        rafRef.current = requestAnimationFrame(tick)
      }

      rafRef.current = requestAnimationFrame(tick)
    } catch {
      setStatus('no_sound')
    }
  }, [stopStream])

  const reset = useCallback(() => {
    stopStream()
    setStatus('idle')
    setRmsLevel(0)
    setWaveData(new Array(48).fill(0))
  }, [stopStream])

  // Cleanup on unmount
  useEffect(() => () => stopStream(), [stopStream])

  return { status, rmsLevel, waveData, start, reset }
}
