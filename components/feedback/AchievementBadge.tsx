'use client'

import { motion } from 'framer-motion'

type AchievementBadgeProps = {
  icon: string
  label: string
  unlocked: boolean
  highlight?: boolean
}

export function AchievementBadge({ icon, label, unlocked, highlight = false }: AchievementBadgeProps) {
  return (
    <motion.div
      initial={highlight ? { scale: 0.9, opacity: 0.6 } : false}
      animate={highlight ? { scale: [1, 1.08, 1], opacity: 1 } : { scale: 1, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`rounded-xl border px-3 py-3 text-center text-sm ${
        unlocked
          ? 'border-primary/40 bg-primary/10 text-white'
          : 'border-gray-700 bg-gray-900/40 text-gray-500'
      }`}
    >
      <div className="mb-1 text-xl">{icon}</div>
      <div className="font-medium">{label}</div>
    </motion.div>
  )
}
