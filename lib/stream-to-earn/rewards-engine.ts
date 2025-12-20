import { createClient } from "@/lib/supabase/server"

export interface RewardPayload {
  trackId: string
  artistAddress: string
  listenerAddress: string
  chunkIndex: number
  amount: number // USDC amount paid
  txHash: string
  chainId: number
  timestamp: string
}

export async function createStreamToEarnReward(payload: RewardPayload): Promise<{
  success: boolean
  rewardId?: string
  error?: string
}> {
  try {
    const supabase = await createClient()

    console.log("[v0] Creating stream-to-earn reward for listener:", payload.listenerAddress)

    // Get the stream-to-earn configuration
    const { data: config, error: configError } = await supabase
      .from("stream_to_earn_config")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single()

    if (configError || !config) {
      console.log("[v0] Stream-to-earn config not found or inactive - skipping reward creation")
      return { success: false, error: "Stream-to-earn not configured" }
    }

    // Determine unlock type
    const unlockType = "x402_chunk_unlock"

    // Create reward record (initially in pending state)
    const { data: reward, error: rewardError } = await supabase
      .from("stream_to_earn_rewards")
      .insert({
        user_address: payload.listenerAddress,
        track_id: payload.trackId,
        unlock_type: unlockType,
        chunk_index: payload.chunkIndex,
        reward_amount_usi: config.reward_amount_per_unlock,
        settlement_tx_hash: payload.txHash,
        status: "pending",
        created_at: payload.timestamp,
      })
      .select()
      .single()

    if (rewardError) {
      console.error("[v0] Failed to create reward record:", rewardError.message)
      return { success: false, error: rewardError.message }
    }

    console.log("[v0] Reward created successfully:", {
      rewardId: reward.id,
      amount: config.reward_amount_per_unlock,
      listener: payload.listenerAddress,
      txHash: payload.txHash,
    })

    return { success: true, rewardId: reward.id }
  } catch (error) {
    console.error("[v0] Error creating stream-to-earn reward:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function updateRewardStatus(
  rewardId: string,
  status: "pending" | "distributing" | "completed" | "failed",
  txHash?: string,
  errorMessage?: string,
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (txHash) updateData.reward_tx_hash = txHash
    if (errorMessage) updateData.error_message = errorMessage
    if (status === "completed" || status === "failed") {
      updateData.completed_at = new Date().toISOString()
    }
    if (status === "distributing") {
      updateData.attempted_at = new Date().toISOString()
    }

    const { error } = await supabase.from("stream_to_earn_rewards").update(updateData).eq("id", rewardId)

    if (error) {
      console.error("[v0] Failed to update reward status:", error.message)
      return false
    }

    console.log("[v0] Reward status updated:", { rewardId, status })
    return true
  } catch (error) {
    console.error("[v0] Error updating reward status:", error)
    return false
  }
}

export async function getPendingRewards(limit = 100): Promise<any[]> {
  try {
    const supabase = await createClient()

    const { data: rewards, error } = await supabase
      .from("stream_to_earn_rewards")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("[v0] Failed to fetch pending rewards:", error.message)
      return []
    }

    return rewards || []
  } catch (error) {
    console.error("[v0] Error fetching pending rewards:", error)
    return []
  }
}
