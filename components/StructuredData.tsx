export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Interview Coach',
    description: 'AI-powered interview preparation platform helping job seekers practice and improve their interview skills.',
    url: 'https://interview-coach.vercel.app',
    logo: 'https://interview-coach.vercel.app/logo.png',
    foundingDate: '2026',
    sameAs: [
      'https://twitter.com/interviewcoach',
      'https://github.com/interviewcoach',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@interviewcoach.com',
      contactType: 'Customer Support',
      availableLanguage: ['English', 'Arabic', 'Spanish', 'French', 'German'],
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
    name: 'Interview Coach',
    url: 'https://interview-coach.vercel.app',
    description: 'Master your next job interview with AI-powered coaching',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://interview-coach.vercel.app/search?q={search_term_string}',
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
    name: 'Interview Coach',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '49',
      priceCurrency: 'USD',
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
      'AI-Powered Interview Practice',
      'Instant Feedback',
      'Multi-Language Support',
      'Progress Tracking',
      'Custom Interview Scenarios',
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
        name: 'How does the AI interview work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The platform simulates a realistic interview based on your role, level, and interview type, then scores your answers and provides detailed feedback.',
        },
      },
      {
        '@type': 'Question',
        name: 'How many free interviews do I get?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Free users receive 3 mock interviews each month before needing to upgrade.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I cancel my subscription anytime?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, you can cancel your subscription at any time from your billing settings.',
        },
      },
      {
        '@type': 'Question',
        name: 'What job roles are supported?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The app supports many roles including engineering, product, design, marketing, sales, finance, and more.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is my data private?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, your interview data is stored securely and used only to power your interview practice experience.',
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
