import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAgentWalletKeys } from "@/lib/agents/wallet-generator"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentId, walletIndex, ownerAddress } = body

    console.log("[v0] Export key request:", { agentId, walletIndex, ownerAddress })

    if (!agentId || walletIndex === undefined || !ownerAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify ownership
    const { data: agent, error: agentError } = await supabase
      .from("mm_agents")
      .select("owner_address")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      console.error("[v0] Agent not found:", agentError)
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    if (agent.owner_address.toLowerCase() !== ownerAddress.toLowerCase()) {
      console.error("[v0] Unauthorized - address mismatch", {
        agentOwner: agent.owner_address,
        requestOwner: ownerAddress,
      })
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get the wallet's private key
    try {
      const keyMap = await getAgentWalletKeys(agentId, ownerAddress)

      console.log("[v0] Retrieved keyMap for agent:", agentId)
      console.log("[v0] KeyMap size:", keyMap.size)
      console.log("[v0] Available wallet indices:", Array.from(keyMap.keys()))
      console.log("[v0] Looking for wallet index:", walletIndex)

      const privateKey = keyMap.get(walletIndex)

      if (!privateKey) {
        console.error("[v0] Wallet not found for index:", walletIndex)
        console.error("[v0] Available wallet indices:", Array.from(keyMap.keys()))
        return NextResponse.json(
          { error: `Wallet index ${walletIndex} not found. Available: ${Array.from(keyMap.keys()).join(", ")}` },
          { status: 404 },
        )
      }

      console.log("[v0] Successfully exported key for wallet index:", walletIndex)
      return NextResponse.json({ privateKey })
    } catch (walletError: any) {
      console.error("[v0] Error retrieving wallet keys:", walletError.message)
      return NextResponse.json({ error: `Failed to retrieve wallet keys: ${walletError.message}` }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[v0] Export key failed:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
