'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

const MIN_WITHDRAWAL = 50

export default function WithdrawPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [balance, setBalance] = useState(0)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return

      const { data } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setBalance(data.balance)
        setAmount(String(data.balance))
      }
      setLoading(false)
    }

    fetchBalance()
  }, [user])

  const handleWithdraw = async () => {
    const withdrawAmount = parseInt(amount)

    if (isNaN(withdrawAmount) || withdrawAmount < MIN_WITHDRAWAL) {
      setError(`Le retrait minimum est de ${MIN_WITHDRAWAL} crédits`)
      return
    }

    if (withdrawAmount > balance) {
      setError('Solde insuffisant')
      return
    }

    setError('')
    setProcessing(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const response = await fetch('/api/earnings/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amount: withdrawAmount }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Échec du traitement du retrait')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/earnings')
      }, 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white">
        <p>Veuillez vous connecter pour retirer des crédits</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white px-6">
        <Card className="max-w-md w-full text-center">
          <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Retrait initié</h2>
          <p className="text-gray-400 mb-4">
            Votre retrait de {amount} crédits ({amount} €) a été traité.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Les fonds arriveront sur votre compte dans 2 à 5 jours ouvrables.
          </p>
          <Link href="/earnings">
            <Button variant="primary" fullWidth>
              Retour aux revenus
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-white px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/earnings" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour aux revenus
        </Link>

        <h1 className="text-3xl font-bold mb-6">Retirer des crédits</h1>

        <Card>
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-blue-400" />
              <p className="text-sm font-semibold text-blue-400">Solde disponible</p>
            </div>
            <p className="text-3xl font-bold text-blue-400">⭐ {balance}</p>
            <p className="text-sm text-gray-400 mt-1">{balance} €</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-2">Montant du retrait (crédits)</label>
            <input
              type="number"
              min={MIN_WITHDRAWAL}
              max={balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Minimum ${MIN_WITHDRAWAL} crédits`}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">= {amount || 0} €</p>
              <button
                onClick={() => setAmount(String(balance))}
                className="text-xs text-primary hover:underline"
              >
                Retirer le maximum
              </button>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <p className="text-sm font-semibold text-yellow-400">Information importante</p>
            </div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Retrait minimum : {MIN_WITHDRAWAL} € ({MIN_WITHDRAWAL} crédits)</li>
              <li>• 1 crédit = 1 €</li>
              <li>• Les fonds arriveront dans 2 à 5 jours ouvrables</li>
              <li>• Des frais de virement bancaire peuvent s'appliquer</li>
              <li>• Vous recevrez un e-mail de confirmation une fois traité</li>
            </ul>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleWithdraw}
            loading={processing}
            disabled={!amount || parseInt(amount) < MIN_WITHDRAWAL || parseInt(amount) > balance}
            fullWidth
            className="gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Retirer {amount || 0} crédits ({amount || 0} €)
          </Button>
        </Card>

        <div className="mt-6 p-4 rounded-lg bg-background/40 border border-border">
          <p className="text-xs text-gray-500 mb-2">💡 Conseil</p>
          <p className="text-sm text-gray-400">
            Gardez quelques crédits sur votre solde pour d'éventuels remboursements de sessions annulées. Nous recommandons de maintenir au moins 50 crédits.
          </p>
        </div>
      </div>
    </div>
  )
}
