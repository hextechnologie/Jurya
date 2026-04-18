'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { getCreditBalance, getCreditBalanceColor, subscribeToCreditsUpdates } from '@/lib/credits'

export default function CreditBalanceButton() {
  const { user } = useAuth()
  const router = useRouter()
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    // Load initial balance
    loadBalance()

    // Subscribe to real-time updates
    const channel = subscribeToCreditsUpdates(user.id, (credits) => {
      setBalance(credits.balance)
    })

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  const loadBalance = async () => {
    if (!user) return
    setLoading(true)
    const bal = await getCreditBalance(user.id)
    setBalance(bal)
    setLoading(false)
  }

  if (!user) return null

  const colors = getCreditBalanceColor(balance)
  const isLow = balance < 20

  return (
    <button
      onClick={() => router.push('/credits')}
      title={isLow ? 'Low balance! Top up now' : 'Click to manage credits'}
      className={`
        group relative px-4 py-2 rounded-lg font-medium transition-all
        border ${colors.borderColor} ${colors.bgColor}
        hover:scale-105 hover:shadow-lg
        ${isLow ? 'animate-pulse' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        <Wallet className={`w-4 h-4 ${colors.textColor}`} />
        <span className={`${colors.textColor} font-bold`}>
          {loading ? '...' : `${balance} Credits`}
        </span>
      </div>
      
      {/* Tooltip */}
      <div className="absolute hidden group-hover:block top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
        {isLow ? 'Low balance! Top up now' : 'Top Up'}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-4px] border-4 border-transparent border-b-gray-900" />
      </div>
    </button>
  )
}
