import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateWalletsForAgent } from "@/lib/agents/wallet-generator"

export async function POST(req: NextRequest) {
  try {
    const { agentId, ownerAddress, enabled } = await req.json()

    console.log("[v0] Max mode toggle API called:", { agentId, ownerAddress, enabled })

    if (!agentId || !ownerAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get current agent config
    const { data: agent, error: fetchError } = await supabase
      .from("mm_agents")
      .select("*")
      .eq("id", agentId)
      .eq("owner_address", ownerAddress)
      .single()

    if (fetchError || !agent) {
      console.log("[v0] Agent not found:", { agentId, ownerAddress, fetchError })
      return NextResponse.json({ error: "Agent not found or unauthorized" }, { status: 404 })
    }

    console.log("[v0] Found agent:", { id: agent.id, pro_mode: agent.pro_mode, max_mode: agent.max_mode })

    if (enabled) {
      const { data: existingWallets } = await supabase
        .from("mm_agent_wallets")
        .select("wallet_index")
        .eq("agent_id", agentId)
        .gte("wallet_index", 11)
        .lte("wallet_index", 20)

      console.log("[v0] Existing wallets 11-20:", existingWallets?.length || 0)

      if (!existingWallets || existingWallets.length === 0) {
        console.log("[v0] Generating wallets 11-20 for agent:", agentId)
        // Generate additional 10 wallets (11-20) for max mode
        await generateWalletsForAgent(agentId, ownerAddress, 10, 11)
        console.log("[v0] Successfully generated wallets 11-20")
      } else {
        console.log("[v0] Wallets 11-20 already exist, skipping generation")
      }

      const { error: updateError } = await supabase
        .from("mm_agents")
        .update({
          max_mode: true,
          pro_mode: true, // Max mode implies pro mode is also enabled
          active_wallets: 20,
        })
        .eq("id", agentId)

      if (updateError) {
        console.error("[v0] Failed to enable max mode:", updateError)
        return NextResponse.json({ error: "Failed to enable max mode" }, { status: 500 })
      }

      console.log("[v0] Max mode enabled successfully with 20 active wallets")

      return NextResponse.json({
        success: true,
        message: "Max mode enabled with 20 wallets",
      })
    } else {
      const { error: updateError } = await supabase
        .from("mm_agents")
        .update({
          max_mode: false,
          active_wallets: 10,
        })
        .eq("id", agentId)

      if (updateError) {
        console.error("[v0] Failed to disable max mode:", updateError)
        return NextResponse.json({ error: "Failed to disable max mode" }, { status: 500 })
      }

      console.log("[v0] Max mode disabled, using 10 wallets")

      return NextResponse.json({
        success: true,
        message: "Max mode disabled, using 10 wallets",
      })
    }
  } catch (error: any) {
    console.error("[v0] Max mode toggle failed:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
