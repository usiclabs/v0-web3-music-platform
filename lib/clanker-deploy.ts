export interface ClankerDeployParams {
  name: string
  symbol: string
  totalSupply: number
  decimals: number
  deployerAddress: string
  targetMarketCapEth?: number
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
 * Routes to the appropriate version-specific implementation
 */
export async function deployClankerToken(params: ClankerDeployParams): Promise<ClankerDeployResult> {
  const version = params.version || "v4.0"
  console.log("[Clanker Deploy] Routing to version:", version)

  try {
    if (version === "v3.1") {
      const { deployClankerTokenV3 } = await import("./clanker-deploy-v3")
      return await deployClankerTokenV3(params)
    } else {
      const { deployClankerTokenV4 } = await import("./clanker-deploy-v4")
      return await deployClankerTokenV4(params)
    }
  } catch (error) {
    console.error("[Clanker Deploy] Deployment failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during Clanker deployment",
    }
  }
}
