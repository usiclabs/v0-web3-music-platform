import { createClient } from "@supabase/supabase-js"
import { StrategyEngine } from "./strategy-engine"
import { getInvestmentWalletAccount } from "./investment-wallet-service"
import { publicClient } from "@/lib/viem/client"
import { formatEther } from "viem"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export class InvestmentAgent {
  private agentId: string
  private strategyEngine: StrategyEngine | null = null

  constructor(agentId: string) {
    this.agentId = agentId
  }

  async runCycle(): Promise<{ success: boolean; scanResults?: any; tradeResults?: any; error?: string }> {
    try {
      // Fetch agent config from database
      const { data: agent, error: agentError } = await supabase
        .from("investment_agents")
        .select("*")
        .eq("id", this.agentId)
        .single()

      if (agentError || !agent) {
        throw new Error(`Agent not found: ${agentError?.message}`)
      }

      if (!agent.is_active) {
        console.log(`[v0] Agent ${this.agentId} is inactive, skipping cycle`)
        return { success: false, error: "Agent is inactive" }
      }

      // Get wallet and check balance
      const walletAccount = await getInvestmentWalletAccount(this.agentId)
      const ethBalance = await publicClient.getBalance({ address: walletAccount.address })
      const ethBalanceFormatted = Number.parseFloat(formatEther(ethBalance))

      console.log(`[v0] Investment agent wallet: ${walletAccount.address}, balance: ${ethBalanceFormatted} ETH`)

      if (ethBalanceFormatted < 0.0005) {
        const errorMsg = `Insufficient ETH balance: ${ethBalanceFormatted} ETH (minimum 0.0005 ETH for gas)`
        console.log(`[v0] ${errorMsg}`)

        // Log the insufficient balance as an activity so user knows why agent isn't running
        await supabase.from("agent_activity_log").insert({
          agent_id: this.agentId,
          activity_type: "scan",
          description: `⚠️ Agent paused: ${errorMsg}. Please fund the wallet with ETH for gas fees.`,
          metadata: {
            walletAddress: walletAccount.address,
            currentBalance: ethBalanceFormatted,
            minimumRequired: 0.0005,
            reason: "insufficient_balance",
          },
          created_at: new Date().toISOString(),
        })

        throw new Error(errorMsg)
      }

      // Initialize strategy engine
      this.strategyEngine = new StrategyEngine(agent)

      // Run scan cycle
      const scanResults = await this.strategyEngine.runScanCycle()
      console.log(
        `[v0] Scan completed: ${scanResults.tokensScanned} tokens scanned, ${scanResults.signals.length} signals detected`,
      )

      await supabase.from("agent_activity_log").insert({
        agent_id: this.agentId,
        activity_type: "scan",
        description: `Scan cycle complete: ${scanResults.tokensScanned} tokens scanned, ${scanResults.signals.length} signals detected`,
        metadata: { tokensScanned: scanResults.tokensScanned, signalsFound: scanResults.signals.length },
        created_at: new Date().toISOString(),
      })

      // Execute trades based on signals
      const tradeResults = []
      for (const signal of scanResults.signals) {
        try {
          const tradeResult = await this.strategyEngine.executeTrade(signal, walletAccount)
          tradeResults.push(tradeResult)

          await supabase.from("agent_activity_log").insert({
            agent_id: this.agentId,
            activity_type: "trade",
            description: `Successfully bought ${signal.tokenName || signal.tokenSymbol || "token"} for ${signal.inputAmount || "unknown"} USDC`,
            metadata: {
              tokenName: signal.tokenName,
              tokenSymbol: signal.tokenSymbol,
              tokenAddress: signal.tokenAddress,
              ...tradeResult,
            },
            created_at: new Date().toISOString(),
          })

          console.log(`[v0] Trade executed: ${signal.tokenName}`)
        } catch (tradeError: any) {
          console.error(`[v0] Trade failed for ${signal.tokenName}:`, tradeError.message)

          await supabase.from("agent_activity_log").insert({
            agent_id: this.agentId,
            activity_type: "trade",
            description: `Attempting to buy ${signal.tokenName || signal.tokenSymbol || "token"} for ${signal.inputAmount || "unknown"} USDC`,
            metadata: {
              tokenName: signal.tokenName,
              tokenSymbol: signal.tokenSymbol,
              tokenAddress: signal.tokenAddress,
              error: tradeError.message,
            },
            created_at: new Date().toISOString(),
          })

          tradeResults.push({ success: false, error: tradeError.message })
        }
      }

      // Update last activity timestamp
      await supabase
        .from("investment_agents")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", this.agentId)

      return { success: true, scanResults, tradeResults }
    } catch (error: any) {
      console.error(`[v0] Agent cycle error for ${this.agentId}:`, error.message)
      return { success: false, error: error.message }
    }
  }
}
