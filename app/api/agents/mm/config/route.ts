import { NextResponse } from "next/server"
import { MarketMakerAgentService } from "@/lib/agents/market-maker-agent"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("walletAddress")

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    const config = await MarketMakerAgentService.getOrCreateByWallet(walletAddress)

    return NextResponse.json({ config })
  } catch (error: any) {
    console.error("[API] Failed to get MM agent config:", error)
    return NextResponse.json({ error: error.message || "Failed to get config" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { agentId, ...updates } = body

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    const supabase = await createClient()
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
