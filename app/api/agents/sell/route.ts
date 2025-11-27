import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAgentWalletService } from "@/lib/agents/wallet-service"
import { parseUnits, type Address } from "viem"

/**
 * POST /api/agents/sell
 * Execute an autonomous sell trade
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, tokenAddress, tokenSymbol, amount, triggerReason, strategyScore } = body

    if (!agentId || !tokenAddress || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get agent configuration
    const { data: agent, error: agentError } = await supabase
      .from("investment_agents")
      .select("*")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Validate agent is active
    if (!agent.is_active) {
      return NextResponse.json({ error: "Agent is not active" }, { status: 400 })
    }

    // Get portfolio position
    const { data: position } = await supabase
      .from("agent_portfolio")
      .select("*")
      .eq("agent_id", agentId)
      .eq("token_address", tokenAddress.toLowerCase())
      .single()

    if (!position || Number.parseFloat(position.amount) < amount) {
      return NextResponse.json({ error: "Insufficient token balance" }, { status: 400 })
    }

    // Initialize wallet service
    const walletService = getAgentWalletService()

    // Log the sell attempt
    await walletService.logActivity(agentId, "trade", `Attempting to sell ${amount} ${tokenSymbol}`, {
      tokenAddress,
      amount,
      triggerReason,
    })

    // Get swap quote for selling
    const amountIn = parseUnits(amount.toString(), 18)
    const quote = await walletService.getSwapQuote(tokenAddress as Address, amountIn, false)

    if (!quote) {
      await walletService.logActivity(agentId, "error", `Failed to get sell quote for ${tokenSymbol}`, {
        tokenAddress,
        amount,
      })
      return NextResponse.json({ error: "Could not get swap quote" }, { status: 400 })
    }

    // Apply slippage tolerance
    const slippageBps = Math.floor(agent.max_slippage * 100)
    const minAmountOut = (quote.amountOut * BigInt(10000 - slippageBps)) / 10000n

    // Execute the swap
    const result = await walletService.executeSwap(
      tokenAddress as Address,
      amountIn,
      minAmountOut,
      false, // isBuy = false for selling
    )

    if (!result.success) {
      await walletService.logActivity(agentId, "error", `Sell failed for ${tokenSymbol}: ${result.error}`, {
        tokenAddress,
        amount,
        error: result.error,
      })
      return NextResponse.json({ error: result.error || "Swap failed" }, { status: 500 })
    }

    // Record the trade
    const tradeId = await walletService.recordTrade(
      agentId,
      "sell",
      tokenAddress as Address,
      tokenSymbol || "UNKNOWN",
      result.amountIn,
      result.amountOut,
      result.txHash!,
      triggerReason || "Manual sell",
      strategyScore || 0,
    )

    // Update portfolio
    await walletService.updatePortfolio(
      agentId,
      tokenAddress as Address,
      tokenSymbol || "UNKNOWN",
      position.token_name || "Unknown Token",
      "sell",
      result.amountIn,
      result.amountOut,
    )

    // Log success
    await walletService.logActivity(agentId, "trade", `Successfully sold ${amount} ${tokenSymbol}`, {
      tokenAddress,
      amount,
      txHash: result.txHash,
      tradeId,
    })

    return NextResponse.json({
      success: true,
      tradeId,
      txHash: result.txHash,
      amountIn: result.amountIn.toString(),
      amountOut: result.amountOut.toString(),
    })
  } catch (error: any) {
    console.error("[Agent Sell API] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
