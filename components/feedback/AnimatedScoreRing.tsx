'use client'

import { motion } from 'framer-motion'

type AnimatedScoreRingProps = {
  score: number
  previousDelta?: number | null
  scoreLabel?: string
  needsWorkLabel?: string
  gettingThereLabel?: string
  excellentLabel?: string
  deltaText?: (delta: number) => string
}

function getScoreMeta(
  score: number,
  labels: { needsWork: string; gettingThere: string; excellent: string }
) {
  if (score <= 4) {
    return { color: '#ef4444', label: labels.needsWork }
  }

  if (score <= 7) {
    return { color: '#f59e0b', label: labels.gettingThere }
  }

  return { color: '#22c55e', label: labels.excellent }
}

export function AnimatedScoreRing({
  score,
  previousDelta,
  scoreLabel = 'Score',
  needsWorkLabel = 'Needs Work',
  gettingThereLabel = 'Getting There',
  excellentLabel = 'Excellent!',
  deltaText,
}: AnimatedScoreRingProps) {
  const normalizedScore = Math.max(0, Math.min(10, score))
  const progress = normalizedScore / 10
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)
  const meta = getScoreMeta(normalizedScore, {
    needsWork: needsWorkLabel,
    gettingThere: gettingThereLabel,
    excellent: excellentLabel,
  })

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative h-32 w-32">
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth="10" fill="none" />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            stroke={meta.color}
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeDasharray={circumference}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{normalizedScore}/10</span>
          <span className="text-xs text-gray-400">{scoreLabel}</span>
        </div>
      </div>

      <span className="mt-3 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${meta.color}20`, color: meta.color }}>
        {meta.label}
      </span>

      {typeof previousDelta === 'number' && (
        <p className={`mt-2 text-xs ${previousDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {deltaText ? deltaText(previousDelta) : `You improved ${previousDelta >= 0 ? '+' : ''}${previousDelta} points from last session! 📈`}
        </p>
      )}
    </div>
  )
}
