import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createOrGetInvestmentWallet } from "@/lib/agents/investment-wallet-service"

let supabase: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  }
  return supabase
}

export async function GET(request: NextRequest) {
  try {
    const sb = getSupabaseClient()
    if (!sb) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")
    const ownerAddress = searchParams.get("ownerAddress")

    if (!agentId || !ownerAddress) {
      return NextResponse.json({ error: "Missing agentId or ownerAddress" }, { status: 400 })
    }

    // Verify ownership
    const { data: agent } = await sb
      .from("investment_agents")
      .select("*")
      .eq("id", agentId)
      .eq("owner_address", ownerAddress.toLowerCase())
      .single()

    if (!agent) {
      return NextResponse.json({ error: "Agent not found or unauthorized" }, { status: 404 })
    }

    // Get or create wallet
    const wallet = await createOrGetInvestmentWallet(agentId)
    console.log("[v0] Fetched wallet for agent:", agentId, "balance:", wallet.ethBalance)

    return NextResponse.json(wallet)
  } catch (error: any) {
    console.error("[v0] Error fetching wallet:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
