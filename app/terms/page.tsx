'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'

export default function TermsPage() {
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
            <h1 className="text-5xl font-bold mb-4">Conditions générales d&apos;utilisation</h1>
            <p className="text-gray-400 mb-8">Dernière mise à jour : 17 avril 2026</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">1. Acceptation des conditions</h2>
                <p className="text-gray-300 leading-relaxed">
                  En accédant ou en utilisant Jurya (« le Service »), vous acceptez d&apos;être lié par les présentes Conditions générales d&apos;utilisation (« Conditions »). Si vous n&apos;acceptez pas ces Conditions, veuillez ne pas utiliser le Service. Nous nous réservons le droit de modifier ces Conditions à tout moment, et votre utilisation continue du Service vaut acceptation de ces modifications.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">2. Description du Service</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Jurya est une plateforme de préparation aux oraux de concours assistée par IA qui :
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Simule des scénarios réalistes d&apos;oral de concours</li>
                  <li>Génère des questions personnalisées pour vos simulations d&apos;oral</li>
                  <li>Fournit un retour et une analyse de performance pilotés par IA</li>
                  <li>Suit votre progression sur plusieurs sessions</li>
                  <li>Prend en charge plusieurs langues et domaines de concours</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">3. Comptes utilisateurs</h2>
                <h3 className="text-xl font-semibold mb-3 text-primary">3.1 Création de compte</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Pour utiliser notre Service, vous devez :
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Être âgé d&apos;au moins 16 ans</li>
                  <li>Fournir des informations exactes et complètes</li>
                  <li>Assurer la sécurité de votre mot de passe</li>
                  <li>Nous informer immédiatement de tout accès non autorisé</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6 text-primary">3.2 Responsabilité du compte</h3>
                <p className="text-gray-300 leading-relaxed">
                  Vous êtes responsable de toutes les activités effectuées sous votre compte. Nous ne saurions être tenus responsables de toute perte ou dommage résultant d&apos;un défaut de sécurisation de votre compte.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">4. Formules d&apos;abonnement et facturation</h2>
                <h3 className="text-xl font-semibold mb-3 text-primary">4.1 Types de formules</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Nous proposons des formules d&apos;abonnement Gratuit, Essentiel et Pro avec des limites de simulations d&apos;oral et des fonctionnalités différentes.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">4.2 Facturation</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Les abonnements sont facturés mensuellement ou annuellement à l&apos;avance</li>
                  <li>Tous les frais sont non remboursables, sauf disposition légale contraire</li>
                  <li>Nous offrons une garantie de remboursement de 7 jours pour les nouveaux abonnés</li>
                  <li>Les tarifs peuvent être modifiés avec un préavis de 30 jours</li>
                  <li>Les paiements en défaut peuvent entraîner la suspension du Service</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6 text-primary">4.3 Résiliation</h3>
                <p className="text-gray-300 leading-relaxed">
                  Vous pouvez résilier votre abonnement à tout moment. L&apos;accès reste actif jusqu&apos;à la fin de la période de facturation en cours. Aucun remboursement n&apos;est accordé pour les mois entamés.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">5. Politique d&apos;utilisation acceptable</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Vous vous engagez à NE PAS :
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Utiliser le Service à des fins illégales</li>
                  <li>Tenter de contourner les limites d&apos;utilisation ou les obligations de paiement</li>
                  <li>Partager vos identifiants de connexion avec des tiers</li>
                  <li>Effectuer de la rétro-ingénierie, décompiler ou pirater le Service</li>
                  <li>Utiliser des scripts automatisés ou des robots (sauf les fonctionnalités d&apos;automatisation que nous fournissons)</li>
                  <li>Télécharger du contenu ou du code malveillant</li>
                  <li>Harceler, abuser ou nuire à d&apos;autres utilisateurs</li>
                  <li>Extraire ou collecter des données sans autorisation</li>
                  <li>Revendre ou redistribuer le Service</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">6. Propriété intellectuelle</h2>
                <h3 className="text-xl font-semibold mb-3 text-primary">6.1 Notre contenu</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  L&apos;ensemble du contenu, des fonctionnalités et des fonctions du Service est la propriété de HEX Technologies et est protégé par le droit d&apos;auteur, le droit des marques et les autres lois relatives à la propriété intellectuelle.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">6.2 Votre contenu</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Vous conservez la propriété de vos réponses lors des simulations d&apos;oral. En utilisant le Service, vous nous accordez une licence pour :
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Traiter et analyser vos réponses afin de fournir un retour</li>
                  <li>Stocker vos données aux fins de la fourniture du Service</li>
                  <li>Utiliser des données anonymisées et agrégées pour améliorer notre IA</li>
                </ul>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">7. Contenu généré par IA</h2>
                <p className="text-gray-300 leading-relaxed">
                  Notre Service utilise l&apos;IA pour générer des questions de simulation d&apos;oral et des retours. Bien que nous nous efforcions d&apos;assurer l&apos;exactitude, le contenu généré par IA peut contenir des erreurs ou des biais. Les retours sont fournis à titre pédagogique uniquement et ne sauraient constituer un conseil professionnel d&apos;orientation. Nous ne saurions être tenus responsables des décisions prises sur la base des retours de l&apos;IA.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">8. Exclusions de garantie et limitations de responsabilité</h2>
                <h3 className="text-xl font-semibold mb-3 text-primary">8.1 Service « en l&apos;état »</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Le Service est fourni « en l&apos;état » et « selon disponibilité », sans garantie d&apos;aucune sorte, expresse ou implicite.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">8.2 Absence de garantie de résultats</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Nous ne garantissons pas que l&apos;utilisation de notre Service entraînera l&apos;admission à un concours, une amélioration des performances à l&apos;oral ou tout résultat spécifique.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">8.3 Limitation de responsabilité</h3>
                <p className="text-gray-300 leading-relaxed">
                  Dans les limites autorisées par la loi applicable, HEX Technologies ne saurait être tenue responsable de tout dommage indirect, accessoire, spécial, consécutif ou punitif découlant de votre utilisation du Service. Notre responsabilité totale ne saurait excéder le montant que vous avez payé au cours des 12 mois précédant la réclamation.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">9. Indemnisation</h2>
                <p className="text-gray-300 leading-relaxed">
                  Vous acceptez d&apos;indemniser et de dégager de toute responsabilité HEX Technologies contre toute réclamation, tout dommage ou toute dépense découlant de votre utilisation du Service, de la violation des présentes Conditions ou de l&apos;atteinte aux droits de tiers.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">10. Résiliation</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Nous pouvons suspendre ou résilier votre compte si vous :
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Enfreignez les présentes Conditions</li>
                  <li>Vous livrez à des activités frauduleuses</li>
                  <li>Ne réglez pas les frais d&apos;abonnement</li>
                  <li>Abusez du Service ou nuisez à d&apos;autres utilisateurs</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mt-4">
                  En cas de résiliation, votre droit d&apos;utiliser le Service cesse immédiatement. Vous pouvez demander l&apos;exportation de vos données dans un délai de 30 jours.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">11. Protection des données personnelles</h2>
                <p className="text-gray-300 leading-relaxed">
                  Votre utilisation du Service est également régie par notre <Link href="/privacy" className="text-primary hover:underline">Politique de confidentialité</Link>, qui est incorporée aux présentes Conditions par référence.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">12. Règlement des litiges</h2>
                <h3 className="text-xl font-semibold mb-3 text-primary">12.1 Résolution amiable</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Avant de déposer une réclamation, vous acceptez de nous contacter à l&apos;adresse <a href="mailto:legal@jurya.fr" className="text-primary hover:underline">legal@jurya.fr</a> afin de tenter de résoudre le litige à l&apos;amiable.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-primary">12.2 Médiation et juridiction compétente</h3>
                <p className="text-gray-300 leading-relaxed">
                  En cas d&apos;échec de la résolution amiable, tout litige sera soumis à une procédure de médiation conformément au droit français. À défaut d&apos;accord, les tribunaux compétents de Paris seront seuls compétents.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">13. Droit applicable</h2>
                <p className="text-gray-300 leading-relaxed">
                  Les présentes Conditions sont régies par le droit français, sans égard aux principes de conflit de lois.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">14. Divisibilité</h2>
                <p className="text-gray-300 leading-relaxed">
                  Si une disposition des présentes Conditions est jugée inapplicable, les dispositions restantes demeureront pleinement en vigueur.
                </p>
              </section>

              <section className="glass p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">15. Coordonnées</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Pour toute question relative aux présentes Conditions :
                </p>
                <p className="text-gray-300">
                  Email : <a href="mailto:legal@jurya.fr" className="text-primary hover:underline">legal@jurya.fr</a><br />
                  Société : HEX Technologies<br />
                  Ou consultez notre <Link href="/contact" className="text-primary hover:underline">page de contact</Link>
                </p>
              </section>

              <section className="glass p-8 rounded-xl bg-gradient-primary/10 border-primary/20">
                <h2 className="text-2xl font-bold mb-4">Acceptation</h2>
                <p className="text-gray-300 leading-relaxed">
                  En cliquant sur « J&apos;accepte » lors de l&apos;inscription ou en utilisant le Service, vous reconnaissez avoir lu, compris et accepté d&apos;être lié par les présentes Conditions générales d&apos;utilisation.
                </p>
              </section>
            </div>

            <div className="mt-12 text-center">
              <Link href="/">
                <Button variant="outline">Retour à l&apos;accueil</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border mt-20 py-8">
          <div className="container mx-auto px-6">
            <div className="text-center text-gray-400 text-sm">
              <p>&copy; 2026 HEX Technologies. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
