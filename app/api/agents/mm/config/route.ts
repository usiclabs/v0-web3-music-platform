import { NextResponse } from "next/server"
import { MarketMakerAgentService } from "@/lib/agents/market-maker-agent"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerAddress = searchParams.get("ownerAddress") || searchParams.get("walletAddress")

    if (!ownerAddress) {
      return NextResponse.json({ error: "Owner address required" }, { status: 400 })
    }

    const config = await MarketMakerAgentService.getOrCreateByWallet(ownerAddress)

    return NextResponse.json({ config })
  } catch (error: any) {
    console.error("[API] Failed to get MM agent config:", error)
    return NextResponse.json({ error: error.message || "Failed to get config" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { agentId, ...updates } = body

    console.log("[API] Updating MM agent config:", { agentId, updates })

    if (updates.token_address) {
      const SUPPORTED_TOKENS = [
        { address: "0x987603A52d8B966E10FBD29DcB1A574049E25B07", symbol: "USI", name: "Universal Sound Index" },
        { address: "0x73582df1cad3187cD0746b7A473d65c06386837e", symbol: "DEUS", name: "Deus" },
      ]

      const matchedToken = SUPPORTED_TOKENS.find((t) => t.address.toLowerCase() === updates.token_address.toLowerCase())

      if (matchedToken) {
        updates.token_symbol = matchedToken.symbol
        console.log(`[API] Auto-synced token_symbol to ${matchedToken.symbol} for address ${updates.token_address}`)
      }
    }

    const { data, error } = await supabase
      .from("mm_agents")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ config: data })
  } catch (error: any) {
    console.error("[API] Failed to update MM agent config:", error)
    return NextResponse.json({ error: error.message || "Failed to update config" }, { status: 500 })
  }
}
