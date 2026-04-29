/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  serverExternalPackages: [
    'pino',
    'thread-stream', 
    'pino-pretty',
    '@walletconnect/universal-provider',
    '@walletconnect/ethereum-provider',
    '@walletconnect/logger',
  ],
  output: 'standalone',
  turbopack: {
    resolveAlias: {
      '@coinbase/wallet-sdk': false,
    },
  },
}

export default nextConfig
