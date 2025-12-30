import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAgentWalletKeys } from "@/lib/agents/wallet-generator"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentId, walletIndex, ownerAddress } = body

    console.log("[v0] Export key request:", { agentId, walletIndex, ownerAddress })

    const walletIndexNum = typeof walletIndex === "string" ? Number.parseInt(walletIndex, 10) : walletIndex

    if (!agentId || walletIndexNum === undefined || !ownerAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

    let agent: any = null
    let agentError: any = null
    const maxRetries = 3

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await supabase.from("mm_agents").select("owner_address, id").eq("id", agentId).single()

        agent = result.data
        agentError = result.error
        if (!agentError) break
      } catch (err) {
        agentError = err
        if (attempt < maxRetries - 1) {
          const delayMs = 500 * (attempt + 1)
          console.warn(`[v0] Supabase query failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delayMs}ms`)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }
    }

    if (agentError || !agent) {
      console.error("[v0] Agent not found:", agentError?.message || agentError)
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    if (agent.owner_address.toLowerCase() !== ownerAddress.toLowerCase()) {
      console.error("[v0] Unauthorized - address mismatch", {
        agentOwner: agent.owner_address,
        requestOwner: ownerAddress,
      })
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
      const walletResult = await supabase
        .from("mm_agent_wallets")
        .select("wallet_address")
        .eq("agent_id", agentId)
        .eq("wallet_index", walletIndexNum)
        .single()

      if (walletResult.error) {
        console.error("[v0] Wallet not found for index:", walletIndexNum, walletResult.error)
        return NextResponse.json({ error: `Wallet index ${walletIndexNum} not found` }, { status: 404 })
      }

      console.log("[v0] Wallet found for index:", walletIndexNum, "address:", walletResult.data?.wallet_address)
    } catch (err: any) {
      console.error("[v0] Error verifying wallet:", err.message)
      return NextResponse.json({ error: "Failed to verify wallet" }, { status: 500 })
    }

    try {
      const keyMap = await getAgentWalletKeys(agentId, ownerAddress)

      console.log("[v0] Retrieved keyMap for agent:", agentId)
      console.log("[v0] KeyMap size:", keyMap.size)
      console.log("[v0] Available wallet indices:", Array.from(keyMap.keys()))
      console.log("[v0] Looking for wallet index:", walletIndexNum)

      if (keyMap.size === 0) {
        console.warn("[v0] KeyMap is empty, attempting direct database query for diagnostics")
        const supabase = createAdminClient()
        const { data: directWallets, error: directError } = await supabase
          .from("mm_agent_wallets")
          .select("wallet_index, is_active, wallet_address")
          .eq("agent_id", agentId)
          .order("wallet_index")

        console.log("[v0] Direct wallet query result:", { count: directWallets?.length, directError })
        if (directWallets && directWallets.length > 0) {
          console.log("[v0] Sample wallets found:", directWallets.slice(0, 3))
        }
      }

      const privateKey = keyMap.get(walletIndexNum)

      if (!privateKey) {
        console.error("[v0] Private key not found for index:", walletIndexNum)
        console.error("[v0] Available wallet indices:", Array.from(keyMap.keys()))
        return NextResponse.json(
          {
            error: `Wallet private key for index ${walletIndexNum} not found. Available: ${Array.from(keyMap.keys()).join(", ") || "none"}`,
          },
          { status: 404 },
        )
      }

      const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`

      console.log("[v0] Successfully exported key for wallet index:", walletIndexNum)
      return NextResponse.json({ privateKey: formattedKey })
    } catch (walletError: any) {
      console.error("[v0] Error retrieving wallet keys:", walletError.message || walletError)
      return NextResponse.json({ error: `Failed to retrieve wallet keys: ${walletError.message}` }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[v0] Export key endpoint error:", error.message || error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
