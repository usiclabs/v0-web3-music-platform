import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateWalletsForAgent } from "@/lib/agents/wallet-generator"

export async function POST(req: NextRequest) {
  try {
    const { agentId, ownerAddress, enabled } = await req.json()

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
      return NextResponse.json({ error: "Agent not found or unauthorized" }, { status: 404 })
    }

    if (enabled) {
      // Check if wallets 6-10 already exist
      const { data: existingWallets } = await supabase
        .from("mm_agent_wallets")
        .select("wallet_index")
        .eq("agent_id", agentId)
        .gte("wallet_index", 6)
        .lte("wallet_index", 10)

      if (!existingWallets || existingWallets.length === 0) {
        // Generate additional 5 wallets (6-10)
        await generateWalletsForAgent(agentId, ownerAddress, 5, 6)
      }

      // Update agent to pro mode
      const { error: updateError } = await supabase
        .from("mm_agents")
        .update({
          pro_mode: true,
          active_wallets: 10,
        })
        .eq("id", agentId)

      if (updateError) {
        console.error("[API] Failed to enable pro mode:", updateError)
        return NextResponse.json({ error: "Failed to enable pro mode" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Pro mode enabled with 10 wallets",
      })
    } else {
      // Disable pro mode (keep wallets 6-10 but set active_wallets to 5)
      const { error: updateError } = await supabase
        .from("mm_agents")
        .update({
          pro_mode: false,
          active_wallets: 5,
        })
        .eq("id", agentId)

      if (updateError) {
        console.error("[API] Failed to disable pro mode:", updateError)
        return NextResponse.json({ error: "Failed to disable pro mode" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Pro mode disabled, using 5 wallets",
      })
    }
  } catch (error: any) {
    console.error("[API] Pro mode toggle failed:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
