import { Metadata } from 'next'

const siteConfig = {
  name: 'Jurya — Préparation aux concours oraux avec IA',
  description: 'Simulez vos oraux de concours avec une IA qui joue le rôle du jury. Feedback structuré, calendrier des sessions, préparation ciblée.',
  url: 'https://jurya.fr',
  ogImage: '/og-image.jpg',
  links: {
    twitter: 'https://twitter.com/jurya_fr',
    github: 'https://github.com/hextechnologie/Jurya',
  },
}

export function createMetadata({
  title,
  description,
  image,
  noIndex = false,
}: {
  title?: string
  description?: string
  image?: string
  noIndex?: boolean
}): Metadata {
  const metaTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name
  const metaDescription = description || siteConfig.description
  const metaImage = image || siteConfig.ogImage

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: [
      'concours oral',
      'préparation concours',
      'simulation oral',
      'concours fonction publique',
      'concours territorial',
      'rédacteur territorial',
      'attaché territorial',
      'IRA',
      'CRFPA',
      'grand oral',
      'HEC oral',
      'Sciences Po oral',
      'jury simulation',
      'coaching IA',
      'préparation oral concours',
      'fonction publique territoriale',
      'grande école admission',
      'Claude AI',
    ],
    authors: [{ name: 'Jurya' }],
    creator: 'Jurya',
    publisher: 'Jurya',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      url: siteConfig.url,
      title: metaTitle,
      description: metaDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: metaImage,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [metaImage],
      creator: '@jurya_fr',
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export { siteConfig }
