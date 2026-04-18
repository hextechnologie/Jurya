'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, DollarSign, TrendingUp, Wallet, Download } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

type EarningsSummary = {
  totalEarned: number
  pendingInEscrow: number
  availableToWithdraw: number
  totalWithdrawn: number
}

type Transaction = {
  id: string
  type: string
  amount: number
  balance_after: number
  description: string
  created_at: string
  booking_id: string | null
}

const MIN_WITHDRAWAL = 50

export default function CoachEarningsPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarned: 0,
    pendingInEscrow: 0,
    availableToWithdraw: 0,
    totalWithdrawn: 0
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'earned' | 'withdrawn'>('all')

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user) return

      // Check if user is a coach
      const { data: coachProfile } = await supabase
        .from('coach_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!coachProfile) {
        setLoading(false)
        return
      }

      // Get user credits data
      const { data: credits } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Get pending in escrow
      const { data: escrowData } = await supabase
        .from('credits_escrow')
        .select('coach_earnings')
        .eq('coach_id', user.id)
        .eq('status', 'held')

      const pendingInEscrow = escrowData?.reduce((sum, e) => sum + e.coach_earnings, 0) || 0

      // Get transactions
      const { data: txs } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .in('type', ['earned', 'withdrawn'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (credits) {
        setSummary({
          totalEarned: credits.total_earned || 0,
          pendingInEscrow,
          availableToWithdraw: credits.balance || 0,
          totalWithdrawn: credits.total_withdrawn || 0
        })
      }

      if (txs) {
        setTransactions(txs)
      }

      setLoading(false)
    }

    fetchEarnings()
  }, [user])

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true
    if (filter === 'earned') return tx.type === 'earned'
    if (filter === 'withdrawn') return tx.type === 'withdrawn'
    return false
  })

  const canWithdraw = summary.availableToWithdraw >= MIN_WITHDRAWAL

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white">
        <p>Please log in to view earnings</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-white px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-6">💰 Earnings</h1>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total Earned</p>
            </div>
            <p className="text-2xl font-bold text-blue-400">⭐ {summary.totalEarned}</p>
            <p className="text-xs text-gray-500 mt-1">All-time earnings</p>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="h-5 w-5 text-yellow-400" />
              <p className="text-xs text-gray-400 uppercase tracking-wide">In Escrow</p>
            </div>
            <p className="text-2xl font-bold text-yellow-400">⭐ {summary.pendingInEscrow}</p>
            <p className="text-xs text-gray-500 mt-1">Held until session complete</p>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <p className="text-xs text-gray-400 uppercase tracking-wide">Available</p>
            </div>
            <p className="text-2xl font-bold text-green-400">⭐ {summary.availableToWithdraw}</p>
            <p className="text-xs text-gray-500 mt-1">Ready to withdraw</p>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Download className="h-5 w-5 text-purple-400" />
              <p className="text-xs text-gray-400 uppercase tracking-wide">Withdrawn</p>
            </div>
            <p className="text-2xl font-bold text-purple-400">⭐ {summary.totalWithdrawn}</p>
            <p className="text-xs text-gray-500 mt-1">Total withdrawals</p>
          </Card>
        </div>

        {/* Withdrawal CTA */}
        <Card className="mb-8 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Withdraw Credits</h3>
              <p className="text-sm text-gray-400">
                {canWithdraw 
                  ? `You have ${summary.availableToWithdraw} credits available to withdraw` 
                  : `Minimum ${MIN_WITHDRAWAL} credits required (you have ${summary.availableToWithdraw})`
                }
              </p>
            </div>
            <Link href="/earnings/withdraw">
              <Button 
                variant="primary" 
                disabled={!canWithdraw}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Withdraw
              </Button>
            </Link>
          </div>
        </Card>

        {/* Transaction History */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Transaction History</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                  filter === 'all' ? 'bg-primary text-white' : 'bg-background/40 text-gray-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('earned')}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                  filter === 'earned' ? 'bg-primary text-white' : 'bg-background/40 text-gray-400'
                }`}
              >
                Earned
              </button>
              <button
                onClick={() => setFilter('withdrawn')}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                  filter === 'withdrawn' ? 'bg-primary text-white' : 'bg-background/40 text-gray-400'
                }`}
              >
                Withdrawn
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-400 text-center py-8">Loading...</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border hover:border-primary/40 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={tx.type === 'earned' ? 'success' : 'default'}>
                        {tx.type}
                      </Badge>
                      <p className="text-sm text-gray-300">{tx.description}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      tx.type === 'earned' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'earned' ? '+' : '-'}⭐ {Math.abs(tx.amount)}
                    </p>
                    <p className="text-xs text-gray-500">Balance: {tx.balance_after}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
