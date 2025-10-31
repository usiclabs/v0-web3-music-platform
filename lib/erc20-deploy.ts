/**
 * ERC20 Token Deployment Helpers
 * Utilities for deploying new ERC20 tokens
 */

import { getServerWallet } from "@/lib/cdp/client"
import { deployClankerToken } from "./clanker-deploy"

export interface TokenDeploymentParams {
  name: string
  symbol: string
  decimals: number
  totalSupply: number
  deployerAddress: string
  imageUrl?: string
  description?: string
  version?: "v3.1" | "v4.0"
  advancedConfig?: any
}

export interface DeploymentResult {
  success: boolean
  tokenAddress?: string
  txHash?: string
  error?: string
}

/**
 * Deploy a token using CDP SDK
 * Uses the server wallet to deploy an ERC20 token on Base
 */
export async function deployDirectERC20(params: TokenDeploymentParams): Promise<DeploymentResult> {
  try {
    console.log("[ERC20 Deploy] Direct deployment requested:", params)

    const wallet = await getServerWallet()

    // Deploy ERC20 token using CDP SDK
    const deployment = await wallet.deployToken({
      name: params.name,
      symbol: params.symbol,
      totalSupply: params.totalSupply.toString(),
    })

    // Wait for deployment to complete
    await deployment.wait()

    const contractAddress = deployment.getContractAddress()
    const txHash = deployment.getTransactionHash()

    if (!contractAddress) {
      throw new Error("Failed to get contract address from deployment")
    }

    console.log("[ERC20 Deploy] Token deployed successfully:", {
      address: contractAddress,
      txHash,
    })

    return {
      success: true,
      tokenAddress: contractAddress,
      txHash: txHash || undefined,
    }
  } catch (error) {
    console.error("[ERC20 Deploy] Deployment failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during deployment",
    }
  }
}

/**
 * Deploy a token using Clanker SDK with automatic pool creation
 */
export async function deployClankerERC20(
  params: TokenDeploymentParams & {
    targetMarketCapEth?: number
    feeTier?: number
    trackId?: string
    coverImageUrl?: string
  },
): Promise<DeploymentResult> {
  try {
    console.log("[ERC20 Deploy] Clanker deployment requested:", params)

    const result = await deployClankerToken({
      name: params.name,
      symbol: params.symbol,
      totalSupply: params.totalSupply,
      decimals: params.decimals,
      deployerAddress: params.deployerAddress,
      targetMarketCapEth: params.targetMarketCapEth,
      feeTier: params.feeTier,
      imageUrl: params.imageUrl || params.coverImageUrl,
      description: params.description,
      version: params.version || "v4.0",
      advancedConfig: params.advancedConfig,
    })

    if (!result.success) {
      throw new Error(result.error || "Clanker deployment failed")
    }

    return {
      success: true,
      tokenAddress: result.tokenAddress,
      txHash: result.txHash,
    }
  } catch (error) {
    console.error("[ERC20 Deploy] Clanker deployment failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during Clanker deployment",
    }
  }
}

/**
 * Deploy a token using an external deployer service (e.g., Clanker API)
 */
export async function deployExternalERC20(params: TokenDeploymentParams): Promise<DeploymentResult> {
  try {
    console.log("[ERC20 Deploy] External deployment requested:", params)

    return {
      success: false,
      error: "External deployer API not configured - use 'clanker' method for Clanker SDK deployment",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
