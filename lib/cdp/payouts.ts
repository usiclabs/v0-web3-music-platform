import { createClient } from "@/lib/supabase/server"
import { sendTokens, batchSendTokens } from "./client"

/**
 * Process pending artist payouts
 * This should be run periodically (e.g., daily or weekly)
 */
export async function processArtistPayouts(): Promise<{
  success: number
  failed: number
  totalAmount: string
}> {
  const supabase = await createClient()

  console.log("[CDP Payouts] Starting artist payout processing...")

  // Get all artists with pending earnings
  const { data: artists, error } = await supabase
    .from("profiles")
    .select("wallet_address, artist_name")
    .eq("is_artist", true)

  if (error || !artists) {
    console.error("[CDP Payouts] Failed to fetch artists:", error)
    return { success: 0, failed: 0, totalAmount: "0" }
  }

  const payouts: Array<{ address: string; amount: string }> = []
  let totalAmount = 0

  // Calculate earnings for each artist
  for (const artist of artists) {
    const { data: streams } = await supabase
      .from("streams")
      .select("amount_paid")
      .eq("artist_id", artist.wallet_address)
      .eq("paid_out", false)

    if (streams && streams.length > 0) {
      const earnings = streams.reduce((sum, stream) => sum + Number.parseFloat(stream.amount_paid || "0"), 0)

      if (earnings > 0) {
        payouts.push({
          address: artist.wallet_address,
          amount: earnings.toString(),
        })
        totalAmount += earnings
      }
    }
  }

  console.log(`[CDP Payouts] Processing ${payouts.length} payouts, total: $${totalAmount}`)

  if (payouts.length === 0) {
    return { success: 0, failed: 0, totalAmount: "0" }
  }

  // Send batch payouts using CDP
  const txHashes = await batchSendTokens(payouts, "usdc")

  // Update database to mark streams as paid out
  let successCount = 0
  let failedCount = 0

  for (let i = 0; i < payouts.length; i++) {
    const payout = payouts[i]
    const txHash = txHashes[i]

    if (txHash) {
      // Mark streams as paid out
      await supabase
        .from("streams")
        .update({ paid_out: true, payout_tx_hash: txHash })
        .eq("artist_id", payout.address)
        .eq("paid_out", false)

      successCount++
      console.log(`[CDP Payouts] Paid ${payout.amount} USDC to ${payout.address}`)
    } else {
      failedCount++
      console.error(`[CDP Payouts] Failed to pay ${payout.address}`)
    }
  }

  console.log(`[CDP Payouts] Completed: ${successCount} success, ${failedCount} failed`)

  return {
    success: successCount,
    failed: failedCount,
    totalAmount: totalAmount.toString(),
  }
}

/**
 * Process a single artist payout immediately
 */
export async function payoutArtist(artistAddress: string): Promise<{
  success: boolean
  amount: string
  txHash?: string
}> {
  const supabase = await createClient()

  console.log(`[CDP Payouts] Processing payout for ${artistAddress}`)

  // Get unpaid streams for this artist
  const { data: streams, error } = await supabase
    .from("streams")
    .select("amount_paid")
    .eq("artist_id", artistAddress)
    .eq("paid_out", false)

  if (error || !streams || streams.length === 0) {
    console.log(`[CDP Payouts] No pending earnings for ${artistAddress}`)
    return { success: false, amount: "0" }
  }

  const earnings = streams.reduce((sum, stream) => sum + Number.parseFloat(stream.amount_paid || "0"), 0)

  if (earnings <= 0) {
    return { success: false, amount: "0" }
  }

  try {
    // Send payout using CDP
    const txHash = await sendTokens(artistAddress, earnings.toString(), "usdc")

    // Mark streams as paid out
    await supabase
      .from("streams")
      .update({ paid_out: true, payout_tx_hash: txHash })
      .eq("artist_id", artistAddress)
      .eq("paid_out", false)

    console.log(`[CDP Payouts] Successfully paid ${earnings} USDC to ${artistAddress}`)

    return {
      success: true,
      amount: earnings.toString(),
      txHash,
    }
  } catch (error) {
    console.error(`[CDP Payouts] Failed to payout ${artistAddress}:`, error)
    return { success: false, amount: earnings.toString() }
  }
}
