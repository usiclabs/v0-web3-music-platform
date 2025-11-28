import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAgentWalletService } from "@/lib/agents/wallet-service"
import { parseUnits, type Address } from "viem"

/**
 * POST /api/agents/invest
 * Execute an autonomous investment trade
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, tokenAddress, tokenSymbol, tokenName, amountUsdc, triggerReason, strategyScore } = body

    if (!agentId || !tokenAddress || !amountUsdc) {
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

    // Validate budget
    const remainingBudget = agent.total_budget - agent.spent_amount
    if (amountUsdc > remainingBudget) {
      return NextResponse.json({ error: "Insufficient budget" }, { status: 400 })
    }

    // Validate per-trade limit
    if (amountUsdc > agent.per_trade_limit) {
      return NextResponse.json({ error: "Exceeds per-trade limit" }, { status: 400 })
    }

    // Check daily limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: todaysTrades } = await supabase
      .from("agent_trades")
      .select("amount_in")
      .eq("agent_id", agentId)
      .eq("trade_type", "buy")
      .gte("created_at", today.toISOString())

    const todaysSpent = todaysTrades?.reduce((sum, t) => sum + Number.parseFloat(t.amount_in), 0) || 0
    if (todaysSpent + amountUsdc > agent.daily_limit) {
      return NextResponse.json({ error: "Daily limit exceeded" }, { status: 400 })
    }

    // Check if token is blacklisted
    if (agent.blacklisted_tokens?.includes(tokenAddress.toLowerCase())) {
      return NextResponse.json({ error: "Token is blacklisted" }, { status: 400 })
    }

    // Initialize wallet service
    const walletService = getAgentWalletService()

    const poolCheck = await walletService.checkPoolExists(tokenAddress as Address)
    if (!poolCheck.exists) {
      await walletService.logActivity(agentId, "error", `No liquidity pool for ${tokenSymbol}`, {
        tokenAddress,
        amountUsdc,
      })
      return NextResponse.json(
        {
          error: "No liquidity pool exists for this token. Cannot execute swap.",
          details: "This token does not have a USDC trading pair on Uniswap V3.",
        },
        { status: 400 },
      )
    }

    // Log the investment attempt
    await walletService.logActivity(agentId, "trade", `Attempting to buy ${tokenSymbol} for ${amountUsdc} USDC`, {
      tokenAddress,
      amountUsdc,
      triggerReason,
      poolFee: poolCheck.fee,
    })

    // Get swap quote
    const amountIn = parseUnits(amountUsdc.toString(), 6)
    const quote = await walletService.getSwapQuote(tokenAddress as Address, amountIn, true)

    if (!quote) {
      await walletService.logActivity(agentId, "error", `Failed to get quote for ${tokenSymbol}`, {
        tokenAddress,
        amountUsdc,
      })
      return NextResponse.json(
        {
          error: "Could not get swap quote",
          details: "The pool exists but the quote request failed. This may be due to insufficient liquidity.",
        },
        { status: 400 },
      )
    }

    // Apply slippage tolerance
    const slippageBps = Math.floor(agent.max_slippage * 100) // Convert percent to basis points
    const minAmountOut = (quote.amountOut * BigInt(10000 - slippageBps)) / 10000n

    // Execute the swap
    const result = await walletService.executeSwap(tokenAddress as Address, amountIn, minAmountOut, true)

    if (!result.success) {
      await walletService.logActivity(agentId, "error", `Swap failed for ${tokenSymbol}: ${result.error}`, {
        tokenAddress,
        amountUsdc,
        error: result.error,
      })
      return NextResponse.json({ error: result.error || "Swap failed" }, { status: 500 })
    }

    // Record the trade
    const tradeId = await walletService.recordTrade(
      agentId,
      "buy",
      tokenAddress as Address,
      tokenSymbol || "UNKNOWN",
      result.amountIn,
      result.amountOut,
      result.txHash!,
      triggerReason || "Manual investment",
      strategyScore || 0,
    )

    // Update portfolio
    await walletService.updatePortfolio(
      agentId,
      tokenAddress as Address,
      tokenSymbol || "UNKNOWN",
      tokenName || "Unknown Token",
      "buy",
      result.amountOut,
      result.amountIn,
    )

    // Log success
    await walletService.logActivity(agentId, "trade", `Successfully bought ${tokenSymbol} for ${amountUsdc} USDC`, {
      tokenAddress,
      amountUsdc,
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
    console.error("[Agent Invest API] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
