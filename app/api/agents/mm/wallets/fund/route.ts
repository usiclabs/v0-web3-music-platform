import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentId, walletAddress, txHash } = body

    if (!agentId || !walletAddress || !txHash) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Update last funded timestamp
    const { error } = await supabase
      .from("mm_agent_wallets")
      .update({ last_funded_at: new Date().toISOString() })
      .eq("agent_id", agentId)
      .eq("wallet_address", walletAddress)

    if (error) {
      console.error("[API] Error updating wallet funded timestamp:", error)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[API] Failed to record funding:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
