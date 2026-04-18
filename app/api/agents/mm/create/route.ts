import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateWalletsForAgent } from "@/lib/agents/wallet-generator"

export async function POST(req: NextRequest) {
  try {
    const { ownerAddress, tokenAddress, tokenSymbol, buyAmountEth, buyInterval, sellInterval } = await req.json()

    if (!ownerAddress) {
      return NextResponse.json({ error: "Owner address required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if user already has an MM agent
    const { data: existing } = await supabase.from("mm_agents").select("id").eq("owner_address", ownerAddress).single()

    if (existing) {
      return NextResponse.json({ error: "You already have an MM agent. Only one agent per user." }, { status: 400 })
    }

    // Create the MM agent
    const { data: agent, error: agentError } = await supabase
      .from("mm_agents")
      .insert({
        owner_address: ownerAddress,
        wallet_address: ownerAddress, // Legacy field
        token_address: tokenAddress || "0xECE5d962d17901ef200Da050C7c74AB45C96Db07",
        token_symbol: tokenSymbol || "USI",
        buy_amount_eth: buyAmountEth || "0.0001",
        buy_interval_minutes: buyInterval || 5,
        sell_interval_minutes: sellInterval || 10,
        is_active: false,
        multi_wallet_mode: true,
        active_wallets: 5,
      })
      .select()
      .single()

    if (agentError || !agent) {
      console.error("[API] Failed to create MM agent:", agentError)
      return NextResponse.json({ error: agentError?.message || "Failed to create agent" }, { status: 500 })
    }

    // Generate 5 fresh wallets for this agent
    const wallets = await generateWalletsForAgent(agent.id, ownerAddress)

    console.log(`[API] Created MM agent ${agent.id} with ${wallets.length} wallets for ${ownerAddress}`)

    return NextResponse.json({
      success: true,
      agent,
      wallets: wallets.map((w) => ({
        address: w.address,
        index: w.index,
        // DO NOT return private keys to the client!
      })),
    })
  } catch (error: any) {
    console.error("[API] Failed to create MM agent:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
