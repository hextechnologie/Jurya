'use client'

import { motion } from 'framer-motion'

type MetricBarProps = {
  label: string
  value: number
  max?: number
  colorClass?: string
  suffix?: string
}

export function MetricBar({
  label,
  value,
  max = 100,
  colorClass = 'from-green-400 to-blue-500',
  suffix = '%',
}: MetricBarProps) {
  const safeValue = Math.max(0, Math.min(max, value))
  const width = (safeValue / max) * 100

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="font-semibold text-primary">{safeValue}{suffix}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full bg-gradient-to-r ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
