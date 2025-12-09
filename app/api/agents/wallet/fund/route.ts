import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { updateInvestmentWalletBalance } from "@/lib/agents/investment-wallet-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { agentId, ownerAddress, amount, txHash } = await request.json()

    if (!agentId || !ownerAddress || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify ownership
    const { data: agent } = await supabase
      .from("investment_agents")
      .select("*")
      .eq("id", agentId)
      .eq("owner_address", ownerAddress.toLowerCase())
      .single()

    if (!agent) {
      return NextResponse.json({ error: "Agent not found or unauthorized" }, { status: 404 })
    }

    // Get current wallet
    const { data: wallet } = await supabase
      .from("investment_agent_wallets")
      .select("*")
      .eq("agent_id", agentId)
      .single()

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    // Update balance
    const newBalance = Number(wallet.usdc_balance) + Number(amount)
    await updateInvestmentWalletBalance(agentId, newBalance)

    // Update agent's total_invested
    await supabase
      .from("investment_agents")
      .update({
        total_invested: Number(agent.total_invested || 0) + Number(amount),
      })
      .eq("id", agentId)

    return NextResponse.json({
      success: true,
      newBalance,
      txHash,
    })
  } catch (error: any) {
    console.error("Error funding wallet:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
