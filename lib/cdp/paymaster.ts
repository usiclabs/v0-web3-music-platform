import { getCDPClient } from "./client"
import { createClient } from "@/lib/supabase/client"

/**
 * Sponsor a transaction using CDP Paymaster
 * This allows users to perform transactions without paying gas fees
 */
export async function sponsorTransaction(
  userAddress: string,
  transactionData: {
    to: string
    data: string
    value?: string
  },
): Promise<string> {
  const client = getCDPClient()

  console.log(`[CDP Paymaster] Sponsoring transaction for ${userAddress}`)

  try {
    // Create a sponsored transaction
    const sponsoredTx = await client.createSponsoredSend({
      networkId: "base-mainnet",
      ...transactionData,
    })

    console.log(`[CDP Paymaster] Transaction sponsored: ${sponsoredTx.getTransactionHash()}`)
    return sponsoredTx.getTransactionHash() || ""
  } catch (error) {
    console.error("[CDP Paymaster] Failed to sponsor transaction:", error)
    throw error
  }
}

/**
 * Check if a user is eligible for gasless transactions
 * Eligibility criteria:
 * - New users get first 5 transactions free
 * - $USI token holders (>100 tokens) get unlimited gasless transactions
 * - Premium subscribers get unlimited gasless transactions
 */
export async function isEligibleForGasless(userAddress: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // Check transaction count
    const { data: txHistory, error: txError } = await supabase
      .from("gasless_transactions")
      .select("id")
      .eq("user_address", userAddress.toLowerCase())
      .order("created_at", { ascending: false })

    if (txError) {
      console.error("[CDP Paymaster] Error checking transaction history:", txError)
      // Default to allowing gasless for new users
      return true
    }

    const txCount = txHistory?.length || 0

    // New users get first 5 transactions free
    if (txCount < 5) {
      console.log(`[CDP Paymaster] User ${userAddress} eligible: ${txCount}/5 free transactions used`)
      return true
    }

    // Check if user holds $USI tokens (would need to query on-chain)
    // For now, we'll check if they have any staking history as a proxy
    const { data: stakingData, error: stakingError } = await supabase
      .from("staking_history")
      .select("id")
      .eq("user_address", userAddress.toLowerCase())
      .limit(1)

    if (!stakingError && stakingData && stakingData.length > 0) {
      console.log(`[CDP Paymaster] User ${userAddress} eligible: $USI token holder`)
      return true
    }

    console.log(`[CDP Paymaster] User ${userAddress} not eligible: exceeded free transactions`)
    return false
  } catch (error) {
    console.error("[CDP Paymaster] Error checking eligibility:", error)
    // Default to not eligible on error
    return false
  }
}

/**
 * Get estimated gas cost for a transaction
 */
export async function estimateGasCost(transactionData: {
  to: string
  data: string
  value?: string
}): Promise<string> {
  try {
    const client = getCDPClient()

    // Estimate gas for the transaction
    const gasEstimate = await client.estimateGas({
      to: transactionData.to,
      data: transactionData.data,
      value: transactionData.value || "0",
    })

    console.log(`[CDP Paymaster] Estimated gas: ${gasEstimate}`)
    return gasEstimate.toString()
  } catch (error) {
    console.error("[CDP Paymaster] Error estimating gas:", error)
    // Return a conservative estimate
    return "100000"
  }
}

/**
 * Record a gasless transaction in the database
 */
export async function recordGaslessTransaction(userAddress: string, txHash: string, gasAmount: string): Promise<void> {
  try {
    const supabase = createClient()

    await supabase.from("gasless_transactions").insert({
      user_address: userAddress.toLowerCase(),
      tx_hash: txHash,
      gas_amount: gasAmount,
      created_at: new Date().toISOString(),
    })

    console.log(`[CDP Paymaster] Recorded gasless transaction: ${txHash}`)
  } catch (error) {
    console.error("[CDP Paymaster] Error recording transaction:", error)
  }
}
