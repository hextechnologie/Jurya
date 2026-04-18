import Link from 'next/link'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-xl">
        <div className="text-7xl mb-4">🎯</div>
        <h1 className="text-5xl font-bold mb-4">Looks like this interview got cancelled!</h1>
        <p className="text-gray-400 mb-8">
          The page you are looking for could not be found, but your next great answer is still waiting.
        </p>
        <Link href="/">
          <Button variant="primary">Back to Home</Button>
        </Link>
      </div>
    </div>
  )
}
