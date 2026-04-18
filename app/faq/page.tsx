'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui'
import { FAQPageSchema } from '@/components/StructuredData'

const faqs = [
  {
    question: 'Comment fonctionne la simulation d\'oral par IA ?',
    answer:
      'La plateforme simule un oral de concours réaliste en fonction de votre concours, votre niveau et le type d\'épreuve. L\'IA pose des questions, analyse vos réponses, évalue votre performance et vous fournit un retour personnalisé pour progresser rapidement.',
  },
  {
    question: 'Combien de simulations gratuites ai-je droit ?',
    answer:
      'Les utilisateurs gratuits bénéficient de 3 simulations d\'oral par mois. Vous pouvez passer à un forfait supérieur à tout moment pour accéder à plus de sessions et à des analyses approfondies.',
  },
  {
    question: 'Puis-je annuler mon abonnement à tout moment ?',
    answer:
      'Oui. Vous pouvez annuler à tout moment depuis vos paramètres de facturation. Votre accès restera actif jusqu\'à la fin de votre cycle de facturation en cours.',
  },
  {
    question: 'Quels concours sont pris en charge ?',
    answer:
      'Vous pouvez vous entraîner pour les concours de la fonction publique, les grandes écoles, les écoles de commerce, les concours d\'ingénieur, les concours de santé, et bien d\'autres filières.',
  },
  {
    question: 'Mes données sont-elles confidentielles ?',
    answer:
      'Oui. Vos données de simulation sont stockées de manière sécurisée et utilisées uniquement pour exécuter vos sessions et générer vos retours. Nous ne vendons pas vos informations personnelles.',
  },
  {
    question: 'Comment mon score est-il calculé ?',
    answer:
      'Votre score repose sur la pertinence de vos réponses, la clarté, la structure, l\'assurance et la profondeur. L\'IA évalue également la qualité de vos exemples et l\'impact mesurable de vos arguments.',
  },
  {
    question: 'Puis-je m\'entraîner en arabe ou dans d\'autres langues ?',
    answer:
      'Oui. L\'application prend en charge l\'arabe et plusieurs autres langues, dont l\'anglais, le français et l\'espagnol. Vous pouvez vous entraîner dans la langue de votre choix.',
  },
  {
    question: 'En quoi Jurya est-il différent de ChatGPT ?',
    answer:
      'Jurya est conçu spécifiquement pour la préparation aux oraux de concours. Il propose des simulations structurées, suit votre progression, conserve l\'historique de vos sessions et fournit une évaluation ciblée avec un accompagnement de jury, bien au-delà d\'une simple conversation.',
  },
  {
    question: 'Dois-je installer quelque chose ?',
    answer:
      'Aucune installation n\'est nécessaire. Vous pouvez utiliser l\'application directement dans votre navigateur, sur ordinateur ou mobile.',
  },
  {
    question: 'Comment changer de forfait ?',
    answer:
      'Rendez-vous sur la page des tarifs, choisissez le forfait qui vous convient et finalisez le paiement. Les limites de votre compte seront mises à jour automatiquement.',
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <>
      <FAQPageSchema />
      <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-background to-background" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-secondary/10 blur-3xl rounded-full" />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">Jurya</span>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Tableau de bord</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-6 py-20">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">Questions fréquentes</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Tout ce que vous devez savoir sur Jurya
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="glass rounded-xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-lg font-semibold pr-8">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-5 pt-2">
                    <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center glass p-8 rounded-2xl max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-3">Vous avez d'autres questions ?</h2>
            <p className="text-gray-400 mb-6">
              Vous ne trouvez pas la réponse que vous cherchez ? N'hésitez pas à contacter notre équipe.
            </p>
            <Link href="/contact">
              <Button variant="primary" className="px-8 py-3">
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border mt-20 py-8">
          <div className="container mx-auto px-6">
            <div className="text-center text-gray-400 text-sm">
              <p>&copy; 2026 Jurya. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
    </>
  )
}
