import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateWalletsForAgent } from "@/lib/agents/wallet-generator"
import { createPublicClient, http, formatEther } from "viem"
import { base } from "viem/chains"
import { ERC20_ABI } from "@/lib/web3/contracts"

const publicClient = createPublicClient({
  chain: base,
  transport: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`),
})

const USI_TOKEN = "0x987603A52d8B966E10FBD29DcB1A574049E25B07"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get("agentId")

    console.log("[v0] Wallets API called with agentId:", agentId)

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    let { data: wallets, error } = await supabase
      .from("mm_agent_wallets")
      .select("wallet_index, wallet_address, is_active, last_used_at")
      .eq("agent_id", agentId)
      .eq("is_active", true)
      .order("wallet_index")

    console.log("[v0] Wallets query result:", { count: wallets?.length, error })

    if (!error && (!wallets || wallets.length === 0)) {
      console.log("[v0] No wallets found, generating new wallets for agent:", agentId)

      const { data: agent } = await supabase.from("mm_agents").select("owner_address").eq("id", agentId).single()

      if (agent?.owner_address) {
        try {
          await generateWalletsForAgent(agentId, agent.owner_address)
          console.log("[v0] Successfully generated wallets, fetching them now")

          const { data: newWallets, error: fetchError } = await supabase
            .from("mm_agent_wallets")
            .select("wallet_index, wallet_address, is_active, last_used_at")
            .eq("agent_id", agentId)
            .eq("is_active", true)
            .order("wallet_index")

          if (!fetchError && newWallets) {
            wallets = newWallets
          }
        } catch (genError: any) {
          console.error("[v0] Error generating wallets:", genError)
          if (genError.message?.includes("duplicate key")) {
            console.log("[v0] Wallets already exist, fetching them again")
            const { data: existingWallets } = await supabase
              .from("mm_agent_wallets")
              .select("wallet_index, wallet_address, is_active, last_used_at")
              .eq("agent_id", agentId)
              .eq("is_active", true)
              .order("wallet_index")

            if (existingWallets) {
              wallets = existingWallets
            }
          }
        }
      }
    }

    if (error) {
      console.error("[API] Error fetching wallets:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const walletsWithLiveData = await Promise.all(
      (wallets || []).map(async (wallet) => {
        try {
          // Fetch ETH balance
          const ethBalance = await publicClient.getBalance({
            address: wallet.wallet_address as `0x${string}`,
          })

          // Fetch $USI token balance
          const tokenBalance = await publicClient.readContract({
            address: USI_TOKEN as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [wallet.wallet_address],
          })

          // Query trade counts from mm_agent_activity
          const { data: buyActivities } = await supabase
            .from("mm_agent_activity")
            .select("id", { count: "exact", head: true })
            .eq("agent_id", agentId)
            .eq("wallet_address", wallet.wallet_address)
            .eq("activity_type", "buy")

          const { data: sellActivities } = await supabase
            .from("mm_agent_activity")
            .select("id", { count: "exact", head: true })
            .eq("agent_id", agentId)
            .eq("wallet_address", wallet.wallet_address)
            .eq("activity_type", "sell")

          return {
            ...wallet,
            eth_balance: Number.parseFloat(formatEther(ethBalance)),
            token_balance: Number.parseFloat(formatEther(tokenBalance as bigint)),
            total_buys: buyActivities || 0,
            total_sells: sellActivities || 0,
          }
        } catch (balanceError) {
          console.error(`[API] Error fetching balance for wallet ${wallet.wallet_address}:`, balanceError)
          return {
            ...wallet,
            eth_balance: 0,
            token_balance: 0,
            total_buys: 0,
            total_sells: 0,
          }
        }
      }),
    )

    console.log("[v0] Returning wallets with live data")
    return NextResponse.json({ wallets: walletsWithLiveData })
  } catch (error: any) {
    console.error("[API] Failed to get wallets:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
