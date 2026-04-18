import Link from 'next/link'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-xl">
        <div className="text-7xl mb-4">🎯</div>
        <h1 className="text-5xl font-bold mb-4">Cette page semble introuvable !</h1>
        <p className="text-gray-400 mb-8">
          La page que vous recherchez n'existe pas, mais votre prochain oral vous attend.
        </p>
        <Link href="/">
          <Button variant="primary">Retour à l'accueil</Button>
        </Link>
      </div>
    </div>
  )
}
