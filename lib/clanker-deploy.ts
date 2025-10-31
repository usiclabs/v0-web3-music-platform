/**
 * Clanker SDK Integration
 * Deploy tokens with automatic Uniswap v4 pool creation
 */

import { Clanker } from "clanker-sdk/v4"
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

    // Initialize Clanker SDK
    const clanker = new Clanker({
      publicClient,
      wallet: walletClient,
    })

    const deployConfig: any = {
      name: params.name,
      symbol: params.symbol,
      tokenAdmin: params.deployerAddress as Address,
      rewards: {
        recipients: [
          {
            recipient: params.deployerAddress as Address,
            admin: params.deployerAddress as Address,
            bps: 10_000, // 100%
            token: "Both",
          },
        ],
      },
    }

    if (params.imageUrl) {
      deployConfig.image = params.imageUrl
      console.log("[Clanker Deploy] Including track artwork:", params.imageUrl)
    }

    if (params.description || params.imageUrl) {
      deployConfig.metadata = {
        description: params.description || `Token for ${params.name}`,
        socialMediaUrls: [],
        auditUrls: [],
      }
      console.log("[Clanker Deploy] Including metadata:", deployConfig.metadata)
    }

    deployConfig.context = {
      interface: "Anti-Platform Music",
      platform: "web3-music",
      messageId: "",
      id: params.deployerAddress,
    }

    console.log("[Clanker Deploy] Using Clanker defaults: 10 ETH market cap, WETH pairing, standard positions")

    const { txHash, waitForTransaction, error } = await clanker.deploy(deployConfig)

    if (error) {
      throw error
    }

    console.log("[Clanker Deploy] Transaction submitted:", txHash)

    const { address } = await waitForTransaction()

    console.log("[Clanker Deploy] Token deployed successfully:", {
      address,
      txHash,
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
