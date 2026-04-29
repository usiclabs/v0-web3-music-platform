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
  webpack: (config, { isServer }) => {
    // Skip loading coinbaseWallet connector from wagmi which requires @coinbase/wallet-sdk
    if (!isServer) {
      config.externals = {
        ...config.externals,
        '@coinbase/wallet-sdk': 'empty',
      }
    }
    return config
  },
}

export default nextConfig
