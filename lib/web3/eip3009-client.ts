import type { Address, Hex } from "viem"
import type { SignedAuthorization } from "./use-eip3009"

/**
 * Submit a signed authorization to the relayer service
 * The relayer will execute the transaction and pay the gas
 */
export async function submitAuthorization(
  signedAuth: SignedAuthorization,
  metadata?: Record<string, any>,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
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
      return { success: false, error: result.error || "Failed to submit authorization" }
    }

    console.log("[v0] Authorization submitted successfully:", result.txHash)
    return { success: true, txHash: result.txHash }
  } catch (error) {
    console.error("[v0] Failed to submit authorization:", error)
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
