import type { Address } from "viem"
import type { useEIP3009 } from "@/lib/web3/use-eip3009"
import { submitAuthorization } from "@/lib/web3/eip3009-client"

/**
 * Execute a gasless USDC → USI swap using EIP-3009
 * The relayer will handle the swap execution and pay gas
 */
export async function executeGaslessSwap(
  signTransferAuthorization: ReturnType<typeof useEIP3009>["signTransferAuthorization"],
  usdcAmount: bigint,
  minUsiAmount: bigint,
  slippagePercent: number,
  poolFee: number,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log("[Gasless Swap] Creating authorization for", usdcAmount.toString(), "USDC")

    // Sign authorization to transfer USDC to relayer
    const signedAuth = await signTransferAuthorization(
      process.env.NEXT_PUBLIC_RELAYER_ADDRESS as Address, // Relayer will receive USDC
      usdcAmount,
      0n, // validAfter: now
      BigInt(Math.floor(Date.now() / 1000) + 3600), // validBefore: 1 hour
    )

    console.log("[Gasless Swap] Authorization signed, submitting to relayer...")

    // Submit to relayer with swap parameters
    const result = await submitAuthorization(signedAuth, {
      purpose: "gasless_swap",
      swapParams: {
        tokenIn: "USDC",
        tokenOut: "USI",
        amountIn: usdcAmount.toString(),
        minAmountOut: minUsiAmount.toString(),
        slippage: slippagePercent,
        poolFee,
      },
    })

    if (!result.success) {
      throw new Error(result.error || "Failed to execute gasless swap")
    }

    console.log("[Gasless Swap] Swap executed successfully:", result.txHash)
    return result
  } catch (error) {
    console.error("[Gasless Swap] Failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to execute gasless swap",
    }
  }
}

/**
 * Check if gasless swaps are available for the user
 */
export async function checkGaslessSwapEligibility(userAddress: Address): Promise<{
  eligible: boolean
  remainingSwaps: number
  error?: string
}> {
  try {
    const response = await fetch(`/api/eip3009/subsidy?address=${userAddress}`)
    const data = await response.json()

    if (!response.ok) {
      return { eligible: false, remainingSwaps: 0, error: data.error }
    }

    return {
      eligible: data.available && data.remainingSubsidies > 0,
      remainingSwaps: data.remainingSubsidies || 0,
    }
  } catch (error) {
    console.error("[Gasless Swap] Failed to check eligibility:", error)
    return {
      eligible: false,
      remainingSwaps: 0,
      error: error instanceof Error ? error.message : "Failed to check eligibility",
    }
  }
}
