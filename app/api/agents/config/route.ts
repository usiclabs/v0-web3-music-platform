import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/agents/config
 * Get agent configuration for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerAddress = searchParams.get("address")

    if (!ownerAddress) {
      return NextResponse.json({ error: "Address required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: agent, error: agentError } = await supabase
      .from("investment_agents")
      .select("*")
      .eq("owner_address", ownerAddress.toLowerCase())
      .maybeSingle()

    if (agentError) throw agentError

    // If no agent exists, return null
    if (!agent) {
      return NextResponse.json({ agent: null })
    }

    const { data: portfolio, error: portfolioError } = await supabase
      .from("agent_portfolio")
      .select("*")
      .eq("agent_id", agent.id)

    if (portfolioError) {
      console.error("[Agent Config API] Portfolio error:", portfolioError)
    }

    const { data: recentTrades, error: tradesError } = await supabase
      .from("agent_trades")
      .select("*")
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (tradesError) {
      console.error("[Agent Config API] Trades error:", tradesError)
    }

    return NextResponse.json({
      agent: {
        ...agent,
        portfolio: portfolio || [],
        recent_trades: recentTrades || [],
      },
    })
  } catch (error: any) {
    console.error("[Agent Config API] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/agents/config
 * Create or update agent configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ownerAddress, ...config } = body

    if (!ownerAddress) {
      return NextResponse.json({ error: "Owner address required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if agent exists
    const { data: existing } = await supabase
      .from("investment_agents")
      .select("id")
      .eq("owner_address", ownerAddress.toLowerCase())
      .maybeSingle()

    let agent

    if (existing) {
      // Update existing agent
      const { data, error } = await supabase
        .from("investment_agents")
        .update({
          ...config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      agent = data
    } else {
      // Create new agent
      const { data, error } = await supabase
        .from("investment_agents")
        .insert({
          owner_address: ownerAddress.toLowerCase(),
          ...config,
        })
        .select()
        .single()

      if (error) throw error
      agent = data
    }

    return NextResponse.json({ agent })
  } catch (error: any) {
    console.error("[Agent Config API] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/agents/config
 * Delete agent configuration
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerAddress = searchParams.get("address")

    if (!ownerAddress) {
      return NextResponse.json({ error: "Address required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from("investment_agents").delete().eq("owner_address", ownerAddress.toLowerCase())

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Agent Config API] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
