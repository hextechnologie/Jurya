'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, CreditCard, DollarSign, Loader2, TrendingUp, Sparkles } from 'lucide-react'
import { Button, Card, LoadingSpinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { getCreditPackages, getUserCredits, getCreditTransactions, getCreditBalanceColor } from '@/lib/credits'
import type { CreditPackage, CreditTransaction, UserCredits } from '@/lib/types/credits'

export default function CreditsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'purchase' | 'spent' | 'refund'>('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadData()
    }
  }, [user, authLoading, router])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    const [packagesData, creditsData, transactionsData] = await Promise.all([
      getCreditPackages(),
      getUserCredits(user.id),
      getCreditTransactions(user.id),
    ])

    setPackages(packagesData)
    setUserCredits(creditsData)
    setTransactions(transactionsData)
    setLoading(false)
  }

  const handlePurchasePackage = async (pkg: CreditPackage) => {
    if (!user || processingPayment) return

    setProcessingPayment(true)
    setSelectedPackage(pkg.id)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Please log in again')
        return
      }

      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          package_id: pkg.id,
          amount: pkg.price_usd,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payment')
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Purchase error:', error)
      alert(error.message || 'Failed to process purchase. Please try again.')
    } finally {
      setProcessingPayment(false)
      setSelectedPackage(null)
    }
  }

  const handleCustomPurchase = async () => {
    const amount = parseInt(customAmount)
    if (!user || !amount || amount < 10 || processingPayment) {
      alert('Please enter an amount of at least $10')
      return
    }

    setProcessingPayment(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Please log in again')
        return
      }

      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          custom_amount: amount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payment')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Purchase error:', error)
      alert(error.message || 'Failed to process purchase. Please try again.')
    } finally {
      setProcessingPayment(false)
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all') return true
    return t.type === filter
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !profile) return null

  const balanceColors = getCreditBalanceColor(userCredits?.balance || 0)

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-3xl">⭐</span>
              <h1 className="text-2xl font-bold">Top Up Your Credits</h1>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg border ${balanceColors.borderColor} ${balanceColors.bgColor}`}>
            <span className={`text-lg font-bold ${balanceColors.textColor}`}>
              ⭐ {userCredits?.balance || 0} credits
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-7xl">
        {/* Balance Warning */}
        {(userCredits?.balance || 0) < 20 && (
          <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10">
            <p className="text-red-400 font-medium">⚠️ Low balance warning: You have {userCredits?.balance || 0} credits left. Top up now to book more sessions!</p>
          </div>
        )}

        {/* Credit Packages */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Choose a Package</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative transition-all hover:scale-105 ${
                  pkg.is_popular ? 'border-purple-500 bg-purple-500/5' : ''
                }`}
              >
                {pkg.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-purple-600 text-xs font-bold text-white">
                      🔥 MOST POPULAR
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                  <div className="text-4xl font-bold text-purple-400 mb-1">
                    ${pkg.price_usd}
                  </div>
                  <div className="text-gray-400 text-sm mb-4">
                    {pkg.base_credits} credits
                    {pkg.bonus_credits > 0 && (
                      <span className="text-yellow-400"> + {pkg.bonus_credits} bonus</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>${(pkg.price_usd / pkg.total_credits).toFixed(2)} per credit</span>
                  </div>
                  <Button
                    variant={pkg.is_popular ? 'primary' : 'outline'}
                    fullWidth
                    onClick={() => handlePurchasePackage(pkg)}
                    loading={processingPayment && selectedPackage === pkg.id}
                    disabled={processingPayment}
                  >
                    {processingPayment && selectedPackage === pkg.id ? (
                      'Processing...'
                    ) : (
                      `Get ${pkg.total_credits} Credits`
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <Card className="mb-12">
          <h3 className="text-xl font-bold mb-4">Custom Amount</h3>
          <p className="text-gray-400 text-sm mb-4">
            Purchase any amount of credits. Minimum $10.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount (min $10)"
                  className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {customAmount && parseInt(customAmount) >= 10 && (
                <p className="mt-2 text-sm text-gray-400">
                  You'll receive {parseInt(customAmount)} credits
                </p>
              )}
            </div>
            <Button
              variant="primary"
              onClick={handleCustomPurchase}
              loading={processingPayment && !selectedPackage}
              disabled={!customAmount || parseInt(customAmount) < 10 || processingPayment}
              className="sm:w-auto px-8"
            >
              {processingPayment && !selectedPackage ? 'Processing...' : 'Purchase'}
            </Button>
          </div>
        </Card>

        {/* Transaction History */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Transaction History</h2>
            <div className="flex gap-2">
              {(['all', 'purchase', 'spent', 'refund'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <Card className="text-center py-12">
              <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No transactions yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((txn) => (
                <Card key={txn.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === 'purchase'
                          ? 'bg-blue-500/20 text-blue-400'
                          : txn.type === 'spent'
                          ? 'bg-red-500/20 text-red-400'
                          : txn.type === 'refund'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : txn.type === 'earned'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {txn.type === 'purchase' ? '💳' : txn.type === 'spent' ? '📤' : txn.type === 'refund' ? '↩️' : txn.type === 'earned' ? '💰' : '•'}
                    </div>
                    <div>
                      <p className="font-medium">
                        {txn.description || txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(txn.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        txn.type === 'purchase' || txn.type === 'refund' || txn.type === 'earned'
                          ? 'text-blue-400'
                          : 'text-red-400'
                      }`}
                    >
                      {txn.type === 'purchase' || txn.type === 'refund' || txn.type === 'earned' ? '+' : '-'}
                      {Math.abs(txn.amount)}
                    </p>
                    <p className="text-sm text-gray-400">Balance: {txn.balance_after}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
