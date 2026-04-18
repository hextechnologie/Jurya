'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, CheckCircle2, Sparkles } from 'lucide-react'
import { Button } from './ui'
import Link from 'next/link'

interface Message {
  type: 'ai' | 'user' | 'feedback'
  text: string
  subtext?: string
}

const demoMessages: Message[] = [
  { type: 'ai', text: 'Bonjour ! Je suis votre jury IA. Entraînons-nous sur une question classique d\'oral de concours. Présentez-vous.' },
  { type: 'user', text: 'Je suis attaché territorial avec 5 ans d\'expérience dans la gestion des politiques publiques. J\'ai piloté des équipes de 3 à 5 agents et mis en œuvre des projets impactant plus de 100 000 usagers. Je suis passionné par la modernisation du service public et l\'accompagnement des agents.' },
  { type: 'feedback', text: '✅ Excellente réponse ! Vous avez couvert expérience, réalisations et motivation.', subtext: 'Score : 9/10 • Structure claire • Résultats quantifiables' },
  { type: 'ai', text: 'Très bien ! Pourquoi souhaitez-vous réussir ce concours ?' },
  { type: 'user', text: 'Ce concours correspond à mon expertise en gestion territoriale. La mission de service public me motive profondément, et je vois des opportunités de contribuer significativement à la transformation des collectivités.' },
  { type: 'feedback', text: '✅ Réponse solide avec une motivation claire et une connaissance du contexte.', subtext: 'Score : 8/10 • Montre la préparation • Lie compétences et poste' },
  { type: 'ai', text: 'Excellent ! Décrivez un problème complexe que vous avez résolu récemment.' },
]

export function TryDemo() {
  const [visibleMessages, setVisibleMessages] = useState<number>(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (visibleMessages < demoMessages.length && isAnimating) {
      const timer = setTimeout(() => {
        setVisibleMessages(prev => prev + 1)
      }, 1500) // Delay between messages

      return () => clearTimeout(timer)
    } else if (visibleMessages === demoMessages.length && isAnimating) {
      // Reset after completion
      setTimeout(() => {
        setVisibleMessages(0)
        setIsAnimating(false)
      }, 3000)
    }
  }, [visibleMessages, isAnimating])

  const startDemo = () => {
    setVisibleMessages(0)
    setIsAnimating(true)
  }

  const resetDemo = () => {
    setVisibleMessages(0)
    setIsAnimating(false)
  }

  return (
    <section className="container mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">
          Voyez comment ça marche — <span className="gradient-text">Sans inscription</span>
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Regardez une simulation réaliste d'oral de concours avec un retour par IA en temps réel
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Demo Chat Interface */}
        <div className="glass rounded-2xl p-8 min-h-[500px] relative">
          {visibleMessages === 0 && !isAnimating ? (
            // Start state
            <div className="flex flex-col items-center justify-center h-[450px] text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Essayez une simulation d'oral</h3>
              <p className="text-gray-400 mb-8 max-w-md">
                Découvrez comment notre IA pose des questions, évalue vos réponses et fournit un retour instantané.
              </p>
              <Button variant="primary" onClick={startDemo} className="text-lg px-8 py-4">
                Lancer la démo
              </Button>
            </div>
          ) : (
            // Messages state
            <div className="space-y-4 mb-4">
              {demoMessages.slice(0, visibleMessages).map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 animate-slide-up ${
                    msg.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {msg.type === 'ai' && (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[75%] rounded-xl p-4 ${
                      msg.type === 'user'
                        ? 'bg-primary text-white'
                        : msg.type === 'feedback'
                        ? 'bg-green-500/20 border border-green-500/30'
                        : 'bg-white/10'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    {msg.subtext && (
                      <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-white/10">{msg.subtext}</p>
                    )}
                  </div>

                  {msg.type === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold">Vous</span>
                    </div>
                  )}

                  {msg.type === 'feedback' && (
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isAnimating && visibleMessages < demoMessages.length && (
                <div className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="bg-white/10 rounded-xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress bar */}
          {isAnimating && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Progression de la simulation</span>
                <span>{Math.round((visibleMessages / demoMessages.length) * 100)}% terminé</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-primary transition-all duration-500"
                  style={{ width: `${(visibleMessages / demoMessages.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          {isAnimating && (
            <div className="mt-6 flex justify-center gap-4">
              <Button variant="outline" onClick={resetDemo}>
                Réinitialiser la démo
              </Button>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <div className="glass rounded-xl p-8 inline-block">
            <h3 className="text-2xl font-bold mb-3">Prêt à vous entraîner pour de vrai ?</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Inscrivez-vous maintenant et obtenez <strong className="text-primary">3 simulations gratuites</strong> avec retour personnalisé, suivi de progression et plus encore.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button variant="primary" className="text-lg px-8 py-4">
                  Commencer vos simulations gratuites
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="text-lg px-8 py-4">
                  Voir les tarifs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }
      `}</style>
    </section>
  )
}
