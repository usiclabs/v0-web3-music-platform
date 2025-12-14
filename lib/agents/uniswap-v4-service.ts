import { type Address, type PublicClient, type WalletClient, formatUnits } from "viem"
import { detectV4Pool, getV4Quote, executeV4Swap, type V4PoolKey } from "@/lib/web3/uniswap-v4-swap"

/**
 * Uniswap V4 Service - Handles V4 pool detection, quotes, and swaps
 * Provides a unified interface for V4 swaps with fallback to V3
 */
export class UniswapV4Service {
  async getQuoteV4(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint,
    chainId: number,
    publicClient: PublicClient,
  ): Promise<{ amountOut: bigint; poolKey?: V4PoolKey; isV4: boolean }> {
    try {
      console.log("[V4 Service] Attempting V4 quote for tokens:", { tokenIn, tokenOut, amountIn })

      // Detect V4 pool
      const poolKey = await detectV4Pool(tokenIn, chainId, publicClient)

      if (poolKey) {
        console.log("[V4 Service] Found V4 pool, getting quote...")
        const zeroForOne = tokenIn.toLowerCase() < tokenOut.toLowerCase()
        const amountOut = await getV4Quote(poolKey, amountIn, zeroForOne, publicClient, chainId)
        return { amountOut, poolKey, isV4: true }
      }

      console.log("[V4 Service] No V4 pool found, falling back to V3")
      return { amountOut: 0n, isV4: false }
    } catch (error) {
      console.error("[V4 Service] Error getting V4 quote:", error)
      return { amountOut: 0n, isV4: false }
    }
  }

  async executeSwapV4(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint,
    amountOutMinimum: bigint,
    recipient: Address,
    poolKey: V4PoolKey,
    chainId: number,
    walletClient: WalletClient,
    publicClient: PublicClient,
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log("[V4 Service] Executing V4 swap:", {
        tokenIn,
        tokenOut,
        amountIn: formatUnits(amountIn, 18),
        amountOutMinimum: formatUnits(amountOutMinimum, 18),
      })

      const result = await executeV4Swap(
        {
          tokenIn,
          tokenOut,
          amountIn,
          amountOutMinimum,
          recipient,
          chainId,
        },
        poolKey,
        walletClient,
        publicClient,
      )

      if (result.success) {
        console.log("[V4 Service] V4 swap successful:", result.txHash)
        return result
      } else {
        console.error("[V4 Service] V4 swap failed:", result.error)
        return result
      }
    } catch (error: any) {
      console.error("[V4 Service] Error executing V4 swap:", error)
      return {
        success: false,
        error: error.message || "Failed to execute V4 swap",
      }
    }
  }
}

export const uniswapV4Service = new UniswapV4Service()
