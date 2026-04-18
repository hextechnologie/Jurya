'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-background to-background" />

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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-4">Politique de confidentialité</h1>
            <p className="text-gray-400 mb-8">Dernière mise à jour : 17 avril 2026</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                <p className="text-gray-300 leading-relaxed">
                  Bienvenue sur Jurya (« nous », « notre » ou « nos »), édité par HEX Technologies. Nous nous engageons à protéger vos données personnelles et votre vie privée, conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés. La présente Politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre plateforme de préparation aux oraux de concours assistée par IA.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">2. Données collectées</h2>
                <h3 className="text-xl font-semibold mb-3 text-primary">2.1 Données personnelles</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Lors de la création de votre compte, nous collectons :
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Nom complet et adresse e-mail</li>
                  <li>Mot de passe (chiffré et stocké de manière sécurisée)</li>
                  <li>Informations de profil que vous choisissez de fournir</li>
                  <li>Informations de paiement (traitées de manière sécurisée via Stripe)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6 text-primary">2.2 Données de simulation d&#39;oral</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Lors de votre utilisation de notre service, nous collectons :
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Détails des sessions de simulation (concours visé, filière, niveau de difficulté)</li>
                  <li>Vos réponses aux questions d&#39;oral</li>
                  <li>Retours et évaluations générés par l&#39;IA</li>
                  <li>Historique des sessions et analyses de performance</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6 text-primary">2.3 Données d&#39;utilisation</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Nous collectons automatiquement :
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Adresse IP et type de navigateur</li>
                  <li>Informations sur l&#39;appareil et le système d&#39;exploitation</li>
                  <li>Pages visitées et fonctionnalités utilisées</li>
                  <li>Temps passé sur la plateforme</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">3. Utilisation de vos données</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Nous utilisons vos données pour :
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Fournir et améliorer notre service de préparation aux oraux de concours par IA</li>
                  <li>Générer des questions personnalisées et des retours de membres de jury</li>
                  <li>Traiter les paiements et gérer les abonnements</li>
                  <li>Envoyer des e-mails et notifications liés au service</li>
                  <li>Analyser les usages pour améliorer l&#39;expérience utilisateur</li>
                  <li>Détecter et prévenir la fraude ou les abus</li>
                  <li>Respecter nos obligations légales</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">4. IA et traitement des données</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Nous utilisons l&#39;IA Claude d&#39;Anthropic pour générer des questions d&#39;oral et fournir des retours. Vos réponses de simulation sont traitées par :
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Nos serveurs sécurisés</li>
                  <li>L&#39;API d&#39;Anthropic (soumise à leur politique de confidentialité)</li>
                  <li>Les données sont chiffrées en transit et au repos</li>
                  <li>Nous n&#39;utilisons pas vos données personnelles pour entraîner des modèles d&#39;IA</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">5. Partage et divulgation des données</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Nous ne vendons pas vos données personnelles. Nous pouvons partager des données avec :
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li><strong>Sous-traitants :</strong> Stripe (paiements), Supabase (base de données), Anthropic (traitement IA)</li>
                  <li><strong>Obligations légales :</strong> Lorsque la loi l&#39;exige ou pour protéger nos droits</li>
                  <li><strong>Transferts d&#39;activité :</strong> En cas de fusion, acquisition ou cession d&#39;actifs</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">6. Sécurité des données</h2>
                <p className="text-gray-300 leading-relaxed">
                  Nous mettons en œuvre des mesures de sécurité conformes aux standards de l&#39;industrie, notamment :
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-4">
                  <li>Chiffrement SSL/TLS pour la transmission des données</li>
                  <li>Stockage chiffré en base de données</li>
                  <li>Audits de sécurité et mises à jour régulières</li>
                  <li>Contrôles d&#39;accès et authentification</li>
                  <li>Conformité SOC 2 (en cours)</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">7. Vos droits (RGPD)</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Droit d&#39;accès à vos données personnelles</li>
                  <li>Droit de rectification des informations inexactes</li>
                  <li>Droit à l&#39;effacement de votre compte et de vos données</li>
                  <li>Droit à la portabilité de votre historique de simulations</li>
                  <li>Droit d&#39;opposition aux communications marketing</li>
                  <li>Droit de retirer votre consentement à tout moment</li>
                  <li>Droit d&#39;introduire une réclamation auprès de la CNIL</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mt-4">
                  Pour exercer ces droits, contactez-nous à <a href="mailto:privacy@jurya.fr" className="text-primary hover:underline">privacy@jurya.fr</a>
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">8. Conservation des données</h2>
                <p className="text-gray-300 leading-relaxed">
                  Nous conservons vos données tant que votre compte est actif ou selon les besoins du service. Après la suppression de votre compte, nous conservons certaines données pendant 90 jours à des fins de sauvegarde, puis les supprimons définitivement. Certaines données peuvent être conservées plus longtemps pour respecter nos obligations légales.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">9. Cookies et suivi</h2>
                <p className="text-gray-300 leading-relaxed">
                  Nous utilisons des cookies essentiels pour l&#39;authentification et les préférences. Nous n&#39;utilisons pas de cookies publicitaires tiers. Vous pouvez désactiver les cookies dans les paramètres de votre navigateur, bien que cela puisse affecter certaines fonctionnalités.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">10. Protection des mineurs</h2>
                <p className="text-gray-300 leading-relaxed">
                  Notre service ne s&#39;adresse pas aux personnes de moins de 16 ans. Nous ne collectons pas sciemment de données personnelles de mineurs. Si nous découvrons une telle collecte, nous supprimerons ces données immédiatement.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">11. Transferts internationaux de données</h2>
                <p className="text-gray-300 leading-relaxed">
                  Vos données peuvent être transférées et traitées dans des pays situés en dehors de l&#39;Espace Économique Européen. Nous veillons à ce que des garanties adéquates soient mises en place pour ces transferts, conformément au RGPD.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">12. Modifications de cette politique</h2>
                <p className="text-gray-300 leading-relaxed">
                  Nous pouvons mettre à jour cette Politique de confidentialité périodiquement. Nous vous informerons de tout changement significatif par e-mail ou notification sur la plateforme. La poursuite de l&#39;utilisation du service après modification vaut acceptation.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">13. Nous contacter</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Pour toute question relative à cette Politique de confidentialité ou à nos pratiques en matière de données :
                </p>
                <p className="text-gray-300">
                  E-mail : <a href="mailto:privacy@jurya.fr" className="text-primary hover:underline">privacy@jurya.fr</a><br />
                  Éditeur : HEX Technologies<br />
                  Ou consultez notre <Link href="/contact" className="text-primary hover:underline">page de contact</Link>
                </p>
              </section>
            </div>

            <div className="mt-12 text-center">
              <Link href="/">
                <Button variant="outline">Retour à l&#39;accueil</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border mt-20 py-8">
          <div className="container mx-auto px-6">
            <div className="text-center text-gray-400 text-sm">
              <p>&copy; 2026 Jurya par HEX Technologies. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
