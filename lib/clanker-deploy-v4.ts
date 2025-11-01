/**
 * Clanker SDK v4.0 Integration
 * Deploy tokens with Uniswap v4 pools
 */

import { Clanker } from "clanker-sdk/v4"
import { createWalletClient, createPublicClient, http, type Address } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import type { ClankerDeployParams, ClankerDeployResult } from "./clanker-deploy"

export async function deployClankerTokenV4(params: ClankerDeployParams): Promise<ClankerDeployResult> {
  try {
    console.log("[Clanker Deploy v4] Starting deployment:", params)

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

    const clanker = new Clanker({
      publicClient,
      wallet: walletClient,
    })

    console.log("[Clanker Deploy v4] Initialized Clanker SDK v4.0")

    const deployConfig: any = {
      name: params.name,
      symbol: params.symbol,
    }

    const PLATFORM_ADMIN_ADDRESS = "0x7D1a4B4941200FB2907638202782E9248b9b9887"

    // Process advanced config
    if (params.advancedConfig) {
      const advConfig = params.advancedConfig

      // Handle rewards configuration
      if (advConfig.rewards) {
        deployConfig.rewards = {
          recipients: Array.isArray(advConfig.rewards) ? advConfig.rewards : advConfig.rewards.recipients || [],
        }
      }

      // Handle pool configuration
      if (advConfig.pool) {
        deployConfig.pool = advConfig.pool
      } else if (advConfig.poolPosition) {
        if (advConfig.poolPosition === "standard") {
          deployConfig.pool = {
            pairedToken: "0x4200000000000000000000000000000000000006", // WETH on Base
            tickIfToken0IsClanker: -276200,
            positions: [
              {
                tickLower: -276200,
                tickUpper: -276000,
                positionBps: 10_000,
              },
            ],
          }
        } else if (advConfig.poolPosition === "project") {
          deployConfig.pool = {
            pairedToken: "0x4200000000000000000000000000000000000006",
            tickIfToken0IsClanker: -276200,
            positions: [
              {
                tickLower: -276200,
                tickUpper: -275800,
                positionBps: 10_000,
              },
            ],
          }
        }
      }

      // Handle fee configuration
      if (advConfig.feeConfig === "static") {
        deployConfig.fees = {
          type: "static",
          clankerFee: advConfig.clankerFee || 100,
          pairedFee: advConfig.pairedFee || 100,
        }
      } else if (advConfig.feeConfig === "dynamic" && advConfig.fees) {
        deployConfig.fees = advConfig.fees
      } else if (advConfig.fees) {
        deployConfig.fees = advConfig.fees
      }
    }

    // Set v4.0 defaults
    if (!deployConfig.tokenAdmin) {
      deployConfig.tokenAdmin = params.deployerAddress as Address
    }

    if (!deployConfig.rewards) {
      deployConfig.rewards = {
        recipients: [
          {
            recipient: params.deployerAddress as Address,
            admin: PLATFORM_ADMIN_ADDRESS as Address,
            bps: 10_000,
            token: "Both",
          },
        ],
      }
    }

    if (!deployConfig.pool) {
      deployConfig.pool = {
        pairedToken: "0x4200000000000000000000000000000000000006",
        tickIfToken0IsClanker: -276200,
        positions: [
          {
            tickLower: -276200,
            tickUpper: -276000,
            positionBps: 10_000,
          },
        ],
      }
      console.log("[Clanker Deploy v4] Using default standard pool configuration")
    }

    if (!deployConfig.fees) {
      deployConfig.fees = {
        type: "static",
        clankerFee: 100,
        pairedFee: 100,
      }
      console.log("[Clanker Deploy v4] Using static 1% fee configuration")
    }

    // Add image and metadata
    if (params.imageUrl && !deployConfig.image) {
      deployConfig.image = params.imageUrl
    }

    if (!deployConfig.metadata && (params.description || params.imageUrl)) {
      deployConfig.metadata = {
        description: params.description || `Token for ${params.name}`,
        socialMediaUrls: [],
        auditUrls: [],
      }
    }

    if (!deployConfig.context) {
      deployConfig.context = {
        interface: "MyUSIC",
        platform: "https://myusic.xyz",
        messageId: "",
        id: params.deployerAddress,
      }
    }

    console.log("[Clanker Deploy v4] Deploy config:", JSON.stringify(deployConfig, null, 2))

    const { txHash, waitForTransaction, error } = await clanker.deploy(deployConfig)

    if (error) {
      throw error
    }

    console.log("[Clanker Deploy v4] Transaction submitted:", txHash)

    const result = await waitForTransaction()
    const address = result.address

    console.log("[Clanker Deploy v4] Token deployed successfully:", address)

    return {
      success: true,
      tokenAddress: address,
      txHash,
    }
  } catch (error) {
    console.error("[Clanker Deploy v4] Deployment failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during Clanker v4 deployment",
    }
  }
}
