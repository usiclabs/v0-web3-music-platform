/**
 * Clanker SDK Integration
 * Deploy tokens with automatic Uniswap pool creation
 * Supports both v3.1 (Uniswap v3) and v4.0 (Uniswap v4)
 */

import { createWalletClient, createPublicClient, http, type Address } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

export interface ClankerDeployParams {
  name: string
  symbol: string
  totalSupply: number
  decimals: number
  deployerAddress: string
  targetMarketCapEth?: number // Target market cap in ETH (default: 10 ETH)
  feeTier?: number
  imageUrl?: string
  description?: string
  version?: "v3.1" | "v4.0"
  advancedConfig?: any
}

export interface ClankerDeployResult {
  success: boolean
  tokenAddress?: string
  poolAddress?: string
  txHash?: string
  error?: string
}

/**
 * Deploy a token using Clanker SDK with automatic WETH pairing
 * Uses Clanker's default pool configuration for fair price distribution
 */
export async function deployClankerToken(params: ClankerDeployParams): Promise<ClankerDeployResult> {
  try {
    console.log("[Clanker Deploy] Starting deployment:", params)

    const version = params.version || "v4.0"
    console.log("[Clanker Deploy] Using Clanker SDK version:", version)

    // Get private key from environment
    const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY
    if (!privateKey) {
      throw new Error("SERVER_WALLET_PRIVATE_KEY not configured")
    }

    const formattedPrivateKey = privateKey.trim().startsWith("0x") ? privateKey.trim() : `0x${privateKey.trim()}`

    // Setup viem clients
    const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`)
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    })
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(),
    })

    let clanker: any
    if (version === "v3.1") {
      const { Clanker } = await import("clanker-sdk")
      clanker = new Clanker({
        wallet: walletClient,
        publicClient,
      })
      console.log("[Clanker Deploy] Initialized Clanker SDK v3.1 (Uniswap v3)")
    } else {
      const { Clanker } = await import("clanker-sdk/v4")
      clanker = new Clanker({
        publicClient,
        wallet: walletClient,
      })
      console.log("[Clanker Deploy] Initialized Clanker SDK v4.0 (Uniswap v4)")
    }

    const deployConfig: any = {
      name: params.name,
      symbol: params.symbol,
    }

    // Merge in advanced config if provided
    if (params.advancedConfig) {
      Object.assign(deployConfig, params.advancedConfig)
      console.log("[Clanker Deploy] Using advanced config:", params.advancedConfig)
    }

    const PLATFORM_ADMIN_ADDRESS = "0x7D1a4B4941200FB2907638202782E9248b9b9887"

    // Set defaults based on version if not provided in advancedConfig
    if (version === "v4.0") {
      if (!deployConfig.tokenAdmin) {
        deployConfig.tokenAdmin = params.deployerAddress as Address
      }
      if (!deployConfig.rewards) {
        deployConfig.rewards = [
          {
            recipient: params.deployerAddress as Address,
            admin: PLATFORM_ADMIN_ADDRESS as Address, // Platform controls rewards for LP fees
            bps: 10_000,
            token: "Both",
          },
        ]
      }
      if (!deployConfig.poolPosition) {
        deployConfig.poolPosition = "standard"
      }
      if (!deployConfig.feeConfig) {
        deployConfig.feeConfig = "dynamic"
      }
    } else {
      // v3.1 defaults
      if (!deployConfig.rewardsConfig) {
        deployConfig.rewardsConfig = {
          creatorReward: 80,
          creatorAdmin: PLATFORM_ADMIN_ADDRESS as Address, // Platform controls creator rewards for LP fees
          creatorRewardRecipient: params.deployerAddress as Address, // Artist receives rewards
        }
      }
      if (!deployConfig.pool) {
        deployConfig.pool = {
          quoteToken: "0x4200000000000000000000000000000000000006",
          initialMarketCap: "1",
        }
      }
    }

    // Add image and metadata if provided
    if (params.imageUrl && !deployConfig.image) {
      deployConfig.image = params.imageUrl
      console.log("[Clanker Deploy] Including track artwork:", params.imageUrl)
    }

    if (!deployConfig.metadata && (params.description || params.imageUrl)) {
      deployConfig.metadata = {
        description: params.description || `Token for ${params.name}`,
        socialMediaUrls: [],
        auditUrls: [],
      }
      console.log("[Clanker Deploy] Including metadata:", deployConfig.metadata)
    }

    if (!deployConfig.context) {
      deployConfig.context = {
        interface: "MyUSIC",
        platform: "https://myusic.xyz",
        messageId: "",
        id: params.deployerAddress,
      }
    }

    console.log("[Clanker Deploy] Final deploy config:", JSON.stringify(deployConfig, null, 2))

    let txHash: string
    let address: string

    if (version === "v3.1") {
      const tokenAddress = await clanker.deployToken(deployConfig)
      address = tokenAddress
      txHash = ""
      console.log("[Clanker Deploy] v3.1 Token deployed:", address)
    } else {
      const { txHash: hash, waitForTransaction, error } = await clanker.deploy(deployConfig)

      if (error) {
        throw error
      }

      txHash = hash
      console.log("[Clanker Deploy] v4.0 Transaction submitted:", txHash)

      const result = await waitForTransaction()
      address = result.address
      console.log("[Clanker Deploy] v4.0 Token deployed:", address)
    }

    console.log("[Clanker Deploy] Token deployed successfully:", {
      address,
      txHash,
      version,
    })

    return {
      success: true,
      tokenAddress: address,
      txHash,
    }
  } catch (error) {
    console.error("[Clanker Deploy] Deployment failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during Clanker deployment",
    }
  }
}
