'use client'

import { useRouter } from 'next/navigation'
import { Zap, Plus } from 'lucide-react'
import { useAuth } from './AuthProvider'

export default function CreditBalanceButton() {
  const { user, profile } = useAuth()
  const router = useRouter()

  if (!user) return null

  const balance = profile ? Math.max(0, profile.interviews_limit - profile.interviews_used_this_month) : 0
  const hasCredits = balance > 0

  return (
    <button
      onClick={() => router.push('/credits')}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
        hasCredits
          ? 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20'
          : 'text-slate-300 bg-slate-800 border-slate-700 hover:bg-slate-700'
      }`}
    >
      {hasCredits ? (
        <>
          <Zap className="w-4 h-4" />
          {balance} Crédits
        </>
      ) : (
        <>
          <Plus className="w-4 h-4" />
          Acheter des crédits
        </>
      )}
    </button>
  )
}
