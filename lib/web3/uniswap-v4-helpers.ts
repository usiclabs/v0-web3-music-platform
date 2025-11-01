/**
 * Uniswap v4 Helper Functions
 * Utilities for interacting with Uniswap v4 pools
 */

import type { PublicClient } from "viem"
import {
  UNISWAP_V4_STATE_VIEW,
  UNISWAP_V4_STATE_VIEW_ABI,
  CLANKER_HOOK_STATIC_FEE_V2,
  ZERO_HOOK_ADDRESS,
  createPoolKey,
} from "./uniswap-v4-contracts"

/**
 * Check if Uniswap v4 is deployed on the given chain
 */
export function isV4DeployedOnChain(chainId: number): boolean {
  const stateViewAddress = UNISWAP_V4_STATE_VIEW[chainId as keyof typeof UNISWAP_V4_STATE_VIEW]
  return !!stateViewAddress
}

/**
 * Get Uniswap v4 pool information using StateView
 */
export async function getV4PoolInfo(
  publicClient: PublicClient,
  chainId: number,
  token0: `0x${string}`,
  token1: `0x${string}`,
  fee = 10000, // Default to 10000 (1%) for Clanker v4 pools
  tickSpacing = 200, // Default to 200 for 1% fee tier
  hooks?: `0x${string}`, // Optional hook address
) {
  try {
    if (!isV4DeployedOnChain(chainId)) {
      return null
    }

    const stateViewAddress = UNISWAP_V4_STATE_VIEW[chainId as keyof typeof UNISWAP_V4_STATE_VIEW]

    // Try with Clanker hook first, then zero hook
    const hookAddresses = hooks
      ? [hooks]
      : ([CLANKER_HOOK_STATIC_FEE_V2[chainId as keyof typeof CLANKER_HOOK_STATIC_FEE_V2], ZERO_HOOK_ADDRESS].filter(
          Boolean,
        ) as `0x${string}`[])

    for (const hookAddress of hookAddresses) {
      try {
        const poolKey = createPoolKey(token0, token1, fee, tickSpacing, hookAddress)

        console.log("[v0] Querying V4 StateView:", {
          stateViewAddress,
          poolKey,
        })

        // Get pool state from StateView
        const [sqrtPriceX96, tick, protocolFee, lpFee] = await publicClient.readContract({
          address: stateViewAddress as `0x${string}`,
          abi: UNISWAP_V4_STATE_VIEW_ABI,
          functionName: "getSlot0",
          args: [poolKey],
        })

        // Get liquidity from StateView
        const liquidity = await publicClient.readContract({
          address: stateViewAddress as `0x${string}`,
          abi: UNISWAP_V4_STATE_VIEW_ABI,
          functionName: "getLiquidity",
          args: [poolKey],
        })

        // Check if pool exists (liquidity > 0 or sqrtPriceX96 > 0)
        if (sqrtPriceX96 > 0n || liquidity > 0n) {
          console.log("[v0] ✅ V4 pool found:", {
            fee,
            tickSpacing,
            hook: hookAddress,
            liquidity: liquidity.toString(),
            sqrtPriceX96: sqrtPriceX96.toString(),
          })

          return {
            sqrtPriceX96,
            tick,
            protocolFee,
            lpFee,
            liquidity,
            poolKey,
            fee,
            tickSpacing,
          }
        }
      } catch (error) {
        // Try next hook address
        continue
      }
    }

    return null
  } catch (error) {
    console.error("[v0] Error fetching v4 pool info:", error)
    return null
  }
}

/**
 * Calculate price from sqrtPriceX96
 */
export function sqrtPriceX96ToPrice(sqrtPriceX96: bigint, decimals0 = 18, decimals1 = 18): number {
  const Q96 = 2n ** 96n
  const price = (sqrtPriceX96 * sqrtPriceX96 * BigInt(10 ** decimals0)) / (Q96 * Q96 * BigInt(10 ** decimals1))
  return Number(price) / 10 ** decimals0
}

/**
 * Check if a v4 pool exists with multiple fee tier and hook attempts
 */
export async function v4PoolExists(
  publicClient: PublicClient,
  chainId: number,
  token0: `0x${string}`,
  token1: `0x${string}`,
): Promise<boolean> {
  try {
    if (!isV4DeployedOnChain(chainId)) {
      return false
    }

    // Try multiple fee/tickSpacing configurations
    const feeConfigs = [
      { fee: 10000, tickSpacing: 200 }, // 1% - Clanker v4 default
      { fee: 3000, tickSpacing: 60 }, // 0.3% - Standard Uniswap
      { fee: 500, tickSpacing: 10 }, // 0.05% - Low fee
    ]

    console.log("[v0] Checking V4 pool existence...")

    for (const config of feeConfigs) {
      const poolInfo = await getV4PoolInfo(publicClient, chainId, token0, token1, config.fee, config.tickSpacing)

      if (poolInfo && poolInfo.liquidity > 0n) {
        console.log("[v0] ✅ V4 pool exists with fee:", config.fee)
        return true
      }
    }

    return false
  } catch (error) {
    console.error("[v0] Error checking V4 pool:", error)
    return false
  }
}
