import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { updateInvestmentWalletBalance } from "@/lib/agents/investment-wallet-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { agentId, ownerAddress, amount } = await request.json()

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

    // Check sufficient balance
    if (Number(wallet.usdc_balance) < Number(amount)) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Update balance
    const newBalance = Number(wallet.usdc_balance) - Number(amount)
    await updateInvestmentWalletBalance(agentId, newBalance)

    // Note: In production, you'd transfer the funds back to the user's wallet here
    // For now, we just update the balance

    return NextResponse.json({
      success: true,
      newBalance,
      amount,
    })
  } catch (error: any) {
    console.error("Error withdrawing from wallet:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
