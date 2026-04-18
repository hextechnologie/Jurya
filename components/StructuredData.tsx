export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Jurya',
    description: 'Plateforme de préparation aux oraux de concours de la fonction publique, propulsée par l\'IA, pour s\'entraîner et améliorer ses compétences à l\'oral.',
    url: 'https://jurya.fr',
    logo: 'https://jurya.fr/logo.png',
    foundingDate: '2026',
    sameAs: [
      'https://twitter.com/jurya',
      'https://github.com/jurya',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@jurya.fr',
      contactType: 'Support client',
      availableLanguage: ['Français', 'English', 'Arabic', 'Spanish'],
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Jurya',
    url: 'https://jurya.fr',
    description: 'Préparez vos oraux de concours avec un coaching par IA',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://jurya.fr/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function SoftwareApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Jurya',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '49',
      priceCurrency: 'EUR',
      offerCount: '4',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1000',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'Simulation d\'oral de concours par IA',
      'Retour instantané',
      'Support multilingue',
      'Suivi de progression',
      'Scénarios de simulation personnalisés',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FAQPageSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Comment fonctionne la simulation d\'oral par IA ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La plateforme simule un oral de concours réaliste en fonction de votre concours, niveau et type d\'oral, puis note vos réponses et fournit un retour détaillé.',
        },
      },
      {
        '@type': 'Question',
        name: 'Combien de simulations gratuites ai-je droit ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Les utilisateurs gratuits bénéficient de 3 simulations d\'oral par mois avant de devoir passer à un forfait supérieur.',
        },
      },
      {
        '@type': 'Question',
        name: 'Puis-je annuler mon abonnement à tout moment ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Oui, vous pouvez annuler votre abonnement à tout moment depuis vos paramètres de facturation.',
        },
      },
      {
        '@type': 'Question',
        name: 'Quels concours sont pris en charge ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'L\'application prend en charge de nombreux concours de la fonction publique : administrateur territorial, attaché territorial, rédacteur, technicien, ingénieur, et bien d\'autres.',
        },
      },
      {
        '@type': 'Question',
        name: 'Mes données sont-elles protégées ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Oui, vos données de simulation sont stockées de manière sécurisée et utilisées uniquement pour améliorer votre expérience d\'entraînement.',
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
