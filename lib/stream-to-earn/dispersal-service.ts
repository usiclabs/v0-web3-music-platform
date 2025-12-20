import { createClient } from "@/lib/supabase/server"
import { createWalletClient, http, publicActions, erc20Abi } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

export interface DispersalResult {
  success: boolean
  batchId?: string
  rewardsProcessed: number
  totalAmount: number
  txHash?: string
  error?: string
}

export async function dispersPendingRewards(): Promise<DispersalResult> {
  try {
    console.log("[v0] Starting reward dispersal process...")

    const supabase = await createClient()

    // Get config
    const { data: config } = await supabase
      .from("stream_to_earn_config")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single()

    if (!config || !config.auto_distribute_enabled) {
      console.log("[v0] Auto-distribution disabled or config not found")
      return { success: false, rewardsProcessed: 0, totalAmount: 0, error: "Auto-distribution disabled" }
    }

    // Fetch pending rewards (batch them)
    const { data: pendingRewards } = await supabase
      .from("stream_to_earn_rewards")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(100) // Process in batches of 100

    if (!pendingRewards || pendingRewards.length === 0) {
      console.log("[v0] No pending rewards to distribute")
      return { success: true, rewardsProcessed: 0, totalAmount: 0 }
    }

    console.log("[v0] Found", pendingRewards.length, "pending rewards to distribute")

    // Check admin wallet balance
    const totalAmount = pendingRewards.reduce((sum, r) => sum + Number(r.reward_amount_usi), 0)
    if (config.usi_balance < totalAmount) {
      console.warn("[v0] Insufficient USI balance:", config.usi_balance, "< needed:", totalAmount)
      return {
        success: false,
        rewardsProcessed: 0,
        totalAmount,
        error: "Insufficient USI balance in admin wallet",
      }
    }

    // Create batch record
    const { data: batch, error: batchError } = await supabase
      .from("stream_to_earn_batch_queue")
      .insert({
        batch_number: Math.floor(Date.now() / 1000),
        total_rewards_count: pendingRewards.length,
        total_amount_usi: totalAmount,
        status: "processing",
      })
      .select()
      .single()

    if (batchError || !batch) {
      console.error("[v0] Failed to create batch record:", batchError?.message)
      return {
        success: false,
        rewardsProcessed: 0,
        totalAmount,
        error: "Failed to create batch record",
      }
    }

    console.log("[v0] Batch created:", batch.id)

    // Update pending rewards to "distributing"
    for (const reward of pendingRewards) {
      await supabase.from("stream_to_earn_rewards").update({ status: "distributing" }).eq("id", reward.id)
    }

    let successfullyProcessed = 0
    let txHash: string | undefined

    try {
      const serverPrivateKey = process.env.SERVER_WALLET_PRIVATE_KEY
      if (!serverPrivateKey) {
        throw new Error("SERVER_WALLET_PRIVATE_KEY not configured")
      }

      const formattedPrivateKey = serverPrivateKey.startsWith("0x") ? serverPrivateKey : `0x${serverPrivateKey}`
      const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`)

      // Use Base mainnet for dispersal
      const walletClient = createWalletClient({
        account,
        chain: base,
        transport: http(),
      }).extend(publicActions)

      // Group rewards by user for efficient batching
      const rewardsByUser = pendingRewards.reduce(
        (acc, reward) => {
          if (!acc[reward.user_address]) {
            acc[reward.user_address] = { totalAmount: 0, rewards: [] }
          }
          acc[reward.user_address].totalAmount += Number(reward.reward_amount_usi)
          acc[reward.user_address].rewards.push(reward)
          return acc
        },
        {} as Record<string, { totalAmount: number; rewards: any[] }>,
      )

      console.log("[v0] Dispersing to", Object.keys(rewardsByUser).length, "unique users")

      // Send rewards to each user
      for (const [userAddress, { totalAmount: userTotalAmount, rewards: userRewards }] of Object.entries(
        rewardsByUser,
      )) {
        try {
          console.log("[v0] Transferring", userTotalAmount, "USI to", userAddress)

          const hash = await walletClient.writeContract({
            address: config.usi_token_address as `0x${string}`,
            abi: erc20Abi,
            functionName: "transfer",
            args: [userAddress as `0x${string}`, BigInt(Math.floor(userTotalAmount * 1e18))], // Assuming 18 decimals
          })

          txHash = hash

          console.log("[v0] Transfer submitted:", hash)

          const receipt = await walletClient.waitForTransactionReceipt({ hash, confirmations: 2 })

          if (receipt.status === "success") {
            console.log("[v0] Transfer confirmed for user:", userAddress)

            // Mark user's rewards as completed
            for (const reward of userRewards) {
              await supabase
                .from("stream_to_earn_rewards")
                .update({
                  status: "completed",
                  reward_tx_hash: hash,
                  completed_at: new Date().toISOString(),
                })
                .eq("id", reward.id)
            }

            successfullyProcessed += userRewards.length
          } else {
            console.error("[v0] Transfer failed for user:", userAddress)

            // Mark as failed
            for (const reward of userRewards) {
              await supabase
                .from("stream_to_earn_rewards")
                .update({
                  status: "failed",
                  error_message: "On-chain transfer failed",
                })
                .eq("id", reward.id)
            }
          }
        } catch (userError) {
          console.error("[v0] Error dispersing to", userAddress, ":", userError)

          // Mark rewards as failed
          for (const reward of userRewards) {
            await supabase
              .from("stream_to_earn_rewards")
              .update({
                status: "failed",
                error_message: userError instanceof Error ? userError.message : "Unknown error",
              })
              .eq("id", reward.id)
          }
        }
      }

      // Update admin wallet balance
      await supabase
        .from("stream_to_earn_config")
        .update({
          usi_balance: config.usi_balance - totalAmount,
        })
        .eq("id", config.id)

      // Log activity
      await supabase.from("stream_to_earn_activity").insert({
        admin_address: config.admin_address,
        activity_type: "reward_distributed",
        description: `Dispersed ${totalAmount} USI to ${Object.keys(rewardsByUser).length} users`,
        metadata: {
          batch_id: batch.id,
          rewards_count: successfullyProcessed,
          total_amount: totalAmount,
        },
        tx_hash: txHash,
      })

      // Mark batch as completed
      await supabase
        .from("stream_to_earn_batch_queue")
        .update({
          status: "completed",
          tx_hash: txHash,
          completed_at: new Date().toISOString(),
        })
        .eq("id", batch.id)

      console.log("[v0] Batch dispersal completed. Processed:", successfullyProcessed, "rewards")

      return {
        success: true,
        batchId: batch.id,
        rewardsProcessed: successfullyProcessed,
        totalAmount,
        txHash,
      }
    } catch (error) {
      console.error("[v0] Batch dispersal failed:", error)

      // Mark batch as failed
      await supabase
        .from("stream_to_earn_batch_queue")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", batch.id)

      return {
        success: false,
        batchId: batch.id,
        rewardsProcessed: successfullyProcessed,
        totalAmount,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  } catch (error) {
    console.error("[v0] Reward dispersal error:", error)
    return {
      success: false,
      rewardsProcessed: 0,
      totalAmount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
