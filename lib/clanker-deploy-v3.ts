/**
 * Clanker SDK v3.1 Integration
 * Deploy tokens with Uniswap v3 pools
 */

import { Clanker } from "clanker-sdk"
import { createWalletClient, createPublicClient, http, type Address } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import type { ClankerDeployParams, ClankerDeployResult } from "./clanker-deploy"

const CLANKER_V3_FACTORY_ADDRESS = "0x4200000000000000000000000000000000000006" as Address

export async function deployClankerTokenV3(params: ClankerDeployParams): Promise<ClankerDeployResult> {
  try {
    console.log("[Clanker Deploy v3] Starting deployment:", params)

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
      wallet: walletClient,
      publicClient,
      factoryAddress: CLANKER_V3_FACTORY_ADDRESS,
    })

    console.log("[Clanker Deploy v3] Initialized Clanker SDK v3.1")

    const deployConfig: any = {
      name: params.name,
      symbol: params.symbol,
    }

    const PLATFORM_ADMIN_ADDRESS = "0x7D1a4B4941200FB2907638202782E9248b9b9887"

    // Set v3.1 defaults
    if (!deployConfig.rewardsConfig) {
      deployConfig.rewardsConfig = {
        creatorReward: 80,
        creatorAdmin: PLATFORM_ADMIN_ADDRESS as Address,
        creatorRewardRecipient: params.deployerAddress as Address,
      }
    }

    if (!deployConfig.pool) {
      deployConfig.pool = {
        quoteToken: "0x4200000000000000000000000000000000000006", // WETH on Base
        initialMarketCap: "1",
      }
    }

    // Apply advanced config if provided
    if (params.advancedConfig) {
      const advConfig = params.advancedConfig
      if (advConfig.tokenAdmin) deployConfig.tokenAdmin = advConfig.tokenAdmin
      if (advConfig.vault) deployConfig.vault = advConfig.vault
      if (advConfig.metadata) deployConfig.metadata = advConfig.metadata
      if (advConfig.context) deployConfig.context = advConfig.context
      if (advConfig.rewardsConfig) deployConfig.rewardsConfig = advConfig.rewardsConfig
      if (advConfig.devBuy) deployConfig.devBuy = advConfig.devBuy
      if (advConfig.pool) deployConfig.pool = advConfig.pool
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

    console.log("[Clanker Deploy v3] Deploy config:", JSON.stringify(deployConfig, null, 2))

    const tokenAddress = await clanker.deployToken(deployConfig)

    console.log("[Clanker Deploy v3] Token deployed successfully:", tokenAddress)

    return {
      success: true,
      tokenAddress,
      txHash: "",
    }
  } catch (error) {
    console.error("[Clanker Deploy v3] Deployment failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during Clanker v3 deployment",
    }
  }
}
