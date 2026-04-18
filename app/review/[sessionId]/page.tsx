'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Card } from '@/components/ui'
import { Star } from 'lucide-react'

export default function ReviewPage() {
  const params = useParams<{ sessionId: string }>()
  const router = useRouter()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [recommend, setRecommend] = useState<'yes' | 'no'>('yes')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: params.sessionId,
          rating,
          comment,
          recommendCoach: recommend === 'yes',
        }),
      })
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Card>
          <h1 className="mb-2 text-3xl font-bold">Rate your coaching session</h1>
          <p className="mb-6 text-gray-400">Your review helps improve coach quality and updates their public rating.</p>

          {done ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-4 text-green-300">Thank you. Your review has been submitted.</div>
              <Button variant="primary" onClick={() => router.push('/dashboard')}>Return to dashboard</Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm text-gray-300">Star rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" onClick={() => setRating(value)}>
                      <Star className={`h-8 w-8 ${value <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-gray-300">Written review</p>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={5} placeholder="What stood out in the session?" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <p className="mb-2 text-sm text-gray-300">Would you recommend this coach?</p>
                <div className="flex gap-2">
                  {['yes', 'no'].map((value) => (
                    <button key={value} type="button" onClick={() => setRecommend(value as 'yes' | 'no')} className={`rounded-full px-4 py-2 ${recommend === value ? 'bg-primary text-white' : 'border border-border text-gray-300'}`}>
                      {value === 'yes' ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="primary" onClick={handleSubmit} loading={loading}>Submit review</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}