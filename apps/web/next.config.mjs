import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['*.ngrok-free.dev', '*.ngrok.io'],
  // Keep Payload server code out of the client/static bundles — otherwise its
  // transitive deps pull `next/document` into shared chunks and break the
  // auto-generated /404 and /500 static error pages during `next build`.
  serverExternalPackages: ['payload', 'mongoose', 'mongodb', 'bcryptjs'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.akamai.steamstatic.com' },
      { protocol: 'https', hostname: 'shared.akamai.steamstatic.com' },
      { protocol: 'https', hostname: 'steamcdn-a.akamaihd.net' },
    ],
  },
}

export default withPayload(withNextIntl(nextConfig))
