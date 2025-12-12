// X402 V2 Types - CAIP Standards Compliant

export interface X402Session {
  walletAddress: string
  tracksPurchased: string[] // Track IDs user has paid for and owns
  expiresAt: number // Unix timestamp
  signature: string // CAIP-122 Sign-In-With-X signature
  chainId: number
  createdAt: number
}

export interface X402PaymentInstructions {
  scheme: string
  network: string
  token: string
  amount: string
  recipient: string // For V1 compatibility - single recipient
  chainId: number
  metadata: {
    trackId: string
    trackTitle: string
    artistName: string
    chunkIndex: number
    totalChunks: number
    chunkDuration: number
    builderCode?: string
  }
  payTo?: {
    // Dynamic routing - can be array of recipients or callback URL
    recipients?: Array<{
      address: string
      amount: string
      role?: "artist" | "platform" | "staker" | "builder" | "collaborator"
    }>
    callback?: string // URL to calculate splits dynamically
    metadata?: Record<string, any>
  }
  session?: {
    // Session info for repeat access
    enabled: boolean
    duration?: number // Seconds
  }
}

export interface X402PaymentPayload {
  scheme: string
  network: string
  chainId: number
  authorization: {
    from: string
    to: string
    value: string
    validAfter: number
    validBefore: number
    nonce: string
    v: number
    r: string
    s: string
  }
  builderCode?: string
  sessionToken?: string
}

export interface X402FacilitatorConfig {
  url: string
  name: string
  priority: number // Lower = higher priority
  networks: string[] // Supported networks (base, solana, etc)
  enabled: boolean
}

export interface X402PaymentPreferences {
  preferredNetworks?: string[]
  requiredTokens?: string[]
  maxFee?: number // USD
  preferredFacilitator?: string
}

export interface X402DiscoveryMetadata {
  platform: string
  version: string
  networks: string[]
  endpoints: {
    stream: {
      url: string
      pricing: "per-chunk" | "subscription" | "one-time"
      chunkDuration?: number
      acceptedTokens: string[]
    }
    catalog: {
      url: string
      filters: string[]
    }
  }
  capabilities: string[] // 'sessions', 'dynamic-routing', 'multi-facilitator', etc
}
