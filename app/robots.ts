import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/interview/'],
      },
    ],
    sitemap: 'https://interview-coach.vercel.app/sitemap.xml',
  }
}
