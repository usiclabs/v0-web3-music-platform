/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  turbopack: {
    root: '.',
  },
  serverExternalPackages: [
    'pino',
    'thread-stream',
    'pino-pretty',
    '@coinbase/wallet-sdk',
    '@walletconnect/universal-provider',
    '@walletconnect/ethereum-provider',
    '@walletconnect/logger',
  ],
}

export default nextConfig
