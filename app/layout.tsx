import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'
import { LanguageProvider } from '@/components/LanguageProvider'
import { CookieConsent } from '@/components/CookieConsent'
import { ScrollToTopButton } from '@/components/ScrollToTopButton'
import { OrganizationSchema, WebsiteSchema, SoftwareApplicationSchema } from '@/components/StructuredData'
import { createMetadata } from '@/lib/metadata'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = createMetadata({})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <OrganizationSchema />
        <WebsiteSchema />
        <SoftwareApplicationSchema />
        <LanguageProvider>
          <AuthProvider>
            {children}
            <ScrollToTopButton />
            <CookieConsent />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#111827',
                  color: '#fff',
                  border: '1px solid rgba(139,92,246,0.35)',
                },
              }}
            />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
