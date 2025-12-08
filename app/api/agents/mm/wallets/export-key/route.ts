import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAgentWalletKeys } from "@/lib/agents/wallet-generator"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentId, walletIndex, ownerAddress } = body

    if (!agentId || !walletIndex || !ownerAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify ownership
    const { data: agent } = await supabase.from("mm_agents").select("owner_address").eq("id", agentId).single()

    if (!agent || agent.owner_address.toLowerCase() !== ownerAddress.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get the wallet's private key
    const keyMap = await getAgentWalletKeys(agentId, ownerAddress)
    const privateKey = keyMap.get(walletIndex)

    if (!privateKey) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    return NextResponse.json({ privateKey })
  } catch (error: any) {
    console.error("[API] Export key failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
