'use client'

import { useState, useEffect } from 'react'
import { X, Play, MessageSquare, CheckCircle2 } from 'lucide-react'
import { Button } from './ui'

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function VideoModal({ isOpen, onClose }: VideoModalProps) {
  const [videoExists, setVideoExists] = useState(false)
  const [animationStep, setAnimationStep] = useState(0)

  useEffect(() => {
    // Check if video file exists
    const checkVideo = async () => {
      try {
        const response = await fetch('/demo.mp4', { method: 'HEAD' })
        setVideoExists(response.ok)
      } catch {
        setVideoExists(false)
      }
    }
    checkVideo()
  }, [])

  // Animated fallback demo
  useEffect(() => {
    if (!isOpen || videoExists) return
    
    const steps = [0, 1, 2, 3, 4, 5, 6]
    let currentStep = 0
    
    const interval = setInterval(() => {
      currentStep = (currentStep + 1) % steps.length
      setAnimationStep(currentStep)
    }, 2000)
    
    return () => clearInterval(interval)
  }, [isOpen, videoExists])

  if (!isOpen) return null

  const demoMessages = [
    { type: 'ai', text: 'Présentez-vous et décrivez votre parcours.' },
    { type: 'user', text: 'J\'ai 5 ans d\'expérience dans la fonction publique territoriale, spécialisé dans la gestion des politiques publiques...' },
    { type: 'ai', text: 'Qu\'est-ce qui vous motive à passer ce concours ?' },
    { type: 'user', text: 'Je suis passionné par le service public et les enjeux de transformation des collectivités correspondent à mes valeurs...' },
    { type: 'feedback', text: '✓ Excellente réponse ! Structure claire et exemples concrets.', subtext: 'Score : 9/10' },
    { type: 'ai', text: 'Décrivez un problème complexe que vous avez résolu dans votre poste.' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative z-10 w-full max-w-5xl bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
          <h3 className="text-xl font-semibold">Démo Jurya</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {videoExists ? (
            // Real video
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <video
                src="/demo.mp4"
                controls
                autoPlay
                className="w-full h-full"
                poster="/demo-poster.jpg"
              >
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            </div>
          ) : (
            // Animated fallback
            <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden p-8 relative">
              {/* Animated chat interface */}
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden space-y-4">
                  {demoMessages.slice(0, Math.min(animationStep + 1, demoMessages.length)).map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 animate-slide-up ${
                        msg.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                      style={{ animationDelay: `${index * 200}ms` }}
                    >
                      {msg.type === 'ai' && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[70%] rounded-xl p-4 ${
                          msg.type === 'user'
                            ? 'bg-primary text-white'
                            : msg.type === 'feedback'
                            ? 'bg-green-500/20 border border-green-500/30'
                            : 'bg-white/10'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        {msg.subtext && (
                          <p className="text-xs text-gray-400 mt-2">{msg.subtext}</p>
                        )}
                      </div>

                      {msg.type === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold">Vous</span>
                        </div>
                      )}

                      {msg.type === 'feedback' && (
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {animationStep < demoMessages.length && (
                    <div className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-primary" />
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

                {/* Progress bar */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>Démo interactive</span>
                    <span>{Math.round((animationStep / demoMessages.length) * 100)}% terminé</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-primary transition-all duration-500"
                      style={{ width: `${(animationStep / demoMessages.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Play button overlay (decorative) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                  <Play className="w-10 h-10 text-black ml-1" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur text-center">
          <p className="text-sm text-gray-400 mb-3">
            {videoExists 
              ? 'Découvrez comment Jurya vous aide à préparer vos oraux de concours' 
              : 'Ceci est un aperçu de l\'expérience de simulation. Inscrivez-vous pour essayer !'}
          </p>
          <Button onClick={onClose}>Lancer votre simulation</Button>
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
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
