import type { Address, Hex } from "viem"
import type { SignedAuthorization } from "./use-eip3009"
import { writeContract, waitForTransactionReceipt } from "@wagmi/core"
import { config } from "./config"
import { USDC_ADDRESS, USDC_ABI } from "./contracts"
import { base } from "wagmi/chains"

/**
 * Execute a direct transferWithAuthorization transaction
 * Used as fallback when relayer subsidy is exhausted
 */
export async function executeDirectTransfer(
  signedAuth: SignedAuthorization,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log("[v0] Executing direct transfer (user pays gas)...")

    const hash = await writeContract(config, {
      address: USDC_ADDRESS[base.id],
      abi: USDC_ABI,
      functionName: "transferWithAuthorization",
      args: [
        signedAuth.authorization.from,
        signedAuth.authorization.to,
        signedAuth.authorization.value,
        signedAuth.authorization.validAfter,
        signedAuth.authorization.validBefore,
        signedAuth.authorization.nonce,
        signedAuth.v,
        signedAuth.r as Hex,
        signedAuth.s as Hex,
      ],
      chainId: base.id,
    })

    console.log("[v0] Direct transfer submitted:", hash)

    // Wait for confirmation
    const receipt = await waitForTransactionReceipt(config, {
      hash,
      chainId: base.id,
    })

    if (receipt.status === "success") {
      console.log("[v0] Direct transfer confirmed:", hash)
      return { success: true, txHash: hash }
    } else {
      console.error("[v0] Direct transfer failed:", receipt)
      return { success: false, error: "Transaction reverted" }
    }
  } catch (error) {
    console.error("[v0] Direct transfer error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to execute direct transfer",
    }
  }
}

/**
 * Submit a signed authorization to the relayer service
 * The relayer will execute the transaction and pay the gas
 * Falls back to direct transfer if relayer subsidy is exhausted
 */
export async function submitAuthorization(
  signedAuth: SignedAuthorization,
  metadata?: Record<string, any>,
): Promise<{ success: boolean; txHash?: string; error?: string; usedFallback?: boolean }> {
  try {
    console.log("[v0] Submitting authorization to relayer...")

    const response = await fetch("/api/eip3009/relay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorization: {
          from: signedAuth.authorization.from,
          to: signedAuth.authorization.to,
          value: signedAuth.authorization.value.toString(),
          validAfter: signedAuth.authorization.validAfter.toString(),
          validBefore: signedAuth.authorization.validBefore.toString(),
          nonce: signedAuth.authorization.nonce,
        },
        signature: {
          v: signedAuth.v,
          r: signedAuth.r,
          s: signedAuth.s,
        },
        metadata,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("[v0] Relayer error:", result.error)

      if (result.error?.includes("Gas subsidy limit") || result.error?.includes("subsidy")) {
        console.log("[v0] Gas subsidy exhausted, falling back to direct transfer...")

        // Fall back to direct transfer where user pays gas
        const directResult = await executeDirectTransfer(signedAuth)

        if (directResult.success) {
          return { ...directResult, usedFallback: true }
        } else {
          return {
            success: false,
            error: `Relayer unavailable and direct transfer failed: ${directResult.error}`,
          }
        }
      }

      return { success: false, error: result.error || "Failed to submit authorization" }
    }

    console.log("[v0] Authorization submitted successfully:", result.txHash)
    return { success: true, txHash: result.txHash, usedFallback: false }
  } catch (error) {
    console.error("[v0] Failed to submit authorization:", error)

    console.log("[v0] Network error, attempting direct transfer fallback...")
    try {
      const directResult = await executeDirectTransfer(signedAuth)
      if (directResult.success) {
        return { ...directResult, usedFallback: true }
      }
    } catch (fallbackError) {
      console.error("[v0] Fallback also failed:", fallbackError)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit authorization",
    }
  }
}

/**
 * Check if an authorization has been used
 */
export async function checkAuthorizationState(
  authorizer: Address,
  nonce: Hex,
): Promise<{ used: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/eip3009/state?authorizer=${authorizer}&nonce=${nonce}`)
    const result = await response.json()

    if (!response.ok) {
      return { used: false, error: result.error || "Failed to check authorization state" }
    }

    return { used: result.used }
  } catch (error) {
    console.error("[v0] Failed to check authorization state:", error)
    return {
      used: false,
      error: error instanceof Error ? error.message : "Failed to check authorization state",
    }
  }
}

/**
 * Get gas subsidy information
 */
export async function getGasSubsidyInfo(): Promise<{
  available: boolean
  remainingSubsidies: number
  maxSubsidyPerUser: number
  error?: string
}> {
  try {
    const response = await fetch("/api/eip3009/subsidy")
    const result = await response.json()

    if (!response.ok) {
      return {
        available: false,
        remainingSubsidies: 0,
        maxSubsidyPerUser: 0,
        error: result.error || "Failed to get subsidy info",
      }
    }

    return result
  } catch (error) {
    console.error("[v0] Failed to get gas subsidy info:", error)
    return {
      available: false,
      remainingSubsidies: 0,
      maxSubsidyPerUser: 0,
      error: error instanceof Error ? error.message : "Failed to get subsidy info",
    }
  }
}
