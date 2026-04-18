/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  compiler: {
    removeConsole: false,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  async redirects() {
    return [
      {
        source: '/concours',
        destination: '/fr/concours',
        permanent: true,
      },
      {
        source: '/concours/:path*',
        destination: '/fr/concours/:path*',
        permanent: true,
      },
      {
        source: '/calendrier',
        destination: '/fr/calendrier',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
