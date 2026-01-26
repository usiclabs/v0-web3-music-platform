import { type Address } from "viem"
import { createPublicClient, http } from "viem"
import { base } from "viem/chains"
import { detectV4Pool, type V4PoolKey } from "@/lib/web3/uniswap-v4-swap"

export interface PoolDetectionResult {
  hasV4Pool: boolean
  hasV3Pool: boolean
  v4PoolKey?: V4PoolKey
  v3PoolFee?: number
  v4Liquidity?: bigint
  v3Liquidity?: bigint
  detectionTime?: number
  error?: string
}

/**
 * Service for detecting and comparing liquidity pools across Uniswap versions
 */
export class PoolDetectionService {
  private publicClient = createPublicClient({
    chain: base,
    transport: http("https://base-rpc.publicnode.com"),
  })

  /**
   * Comprehensively detect pools for a token across all Uniswap versions
   */
  async detectAllPools(tokenAddress: Address, chainId: number = base.id): Promise<PoolDetectionResult> {
    const startTime = Date.now()

    try {
      console.log(`[Pool Detection] Scanning token: ${tokenAddress}`)

      // Detect V4 pool
      let hasV4Pool = false
      let v4PoolKey: V4PoolKey | undefined
      let v4Liquidity: bigint | undefined

      try {
        const v4PoolResult = await detectV4Pool(tokenAddress, chainId, this.publicClient)
        if (v4PoolResult) {
          hasV4Pool = true
          v4PoolKey = v4PoolResult

          // Get liquidity
          const { UNISWAP_V4_STATE_VIEW, UNISWAP_V4_STATE_VIEW_ABI } = await import("@/lib/web3/contracts")
          const stateViewAddress = UNISWAP_V4_STATE_VIEW[chainId as keyof typeof UNISWAP_V4_STATE_VIEW] as Address

          v4Liquidity = (await this.publicClient.readContract({
            address: stateViewAddress,
            abi: UNISWAP_V4_STATE_VIEW_ABI,
            functionName: "getLiquidity",
            args: [v4PoolKey],
          })) as bigint
        }
      } catch (error: any) {
        console.log(`[Pool Detection] V4 detection skipped: ${error.message}`)
      }

      // Detect V3 pool (simplified check)
      let hasV3Pool = false
      let v3PoolFee: number | undefined
      let v3Liquidity: bigint | undefined

      try {
        const { UNISWAP_V3_FACTORY, UNISWAP_V3_FACTORY_ABI, WETH_ADDRESS, UNISWAP_V3_POOL_ABI } =
          await import("@/lib/web3/contracts")
        const factoryAddress = UNISWAP_V3_FACTORY[chainId as keyof typeof UNISWAP_V3_FACTORY] as Address
        const wethAddress = WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS] as Address

        // Check common fee tiers
        for (const fee of [3000, 10000, 500]) {
          try {
            const poolAddress = (await this.publicClient.readContract({
              address: factoryAddress,
              abi: UNISWAP_V3_FACTORY_ABI,
              functionName: "getPool",
              args: [tokenAddress, wethAddress, fee],
            })) as Address

            if (poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000") {
              hasV3Pool = true
              v3PoolFee = fee

              const liquidity = (await this.publicClient.readContract({
                address: poolAddress,
                abi: UNISWAP_V3_POOL_ABI,
                functionName: "liquidity",
              })) as bigint

              v3Liquidity = liquidity
              console.log(`[Pool Detection] V3 pool found with fee: ${fee}`)
              break
            }
          } catch (error) {
            // Continue to next fee tier
          }
        }
      } catch (error: any) {
        console.log(`[Pool Detection] V3 detection error: ${error.message}`)
      }

      const detectionTime = Date.now() - startTime

      const result: PoolDetectionResult = {
        hasV4Pool,
        hasV3Pool,
        v4PoolKey,
        v3PoolFee,
        v4Liquidity,
        v3Liquidity,
        detectionTime,
      }

      console.log(`[Pool Detection] Results:`, {
        hasV4Pool,
        hasV3Pool,
        v4Fee: v4PoolKey?.fee,
        v3Fee: v3PoolFee,
        detectionTime: `${detectionTime}ms`,
      })

      return result
    } catch (error: any) {
      console.error("[Pool Detection] Error:", error)
      return {
        hasV4Pool: false,
        hasV3Pool: false,
        error: error.message,
      }
    }
  }

  /**
   * Recommend best pool version for MM operations
   */
  recommendPoolVersion(detection: PoolDetectionResult): "v4" | "v3" | "none" {
    // Prefer V4 if available with good liquidity
    if (detection.hasV4Pool && detection.v4Liquidity && detection.v4Liquidity > 0n) {
      return "v4"
    }

    // Fall back to V3
    if (detection.hasV3Pool && detection.v3Liquidity && detection.v3Liquidity > 0n) {
      return "v3"
    }

    return "none"
  }
}
