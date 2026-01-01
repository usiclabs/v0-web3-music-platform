import type { AgentPlugin } from "../types"
import { MarketMakerAgentService } from "@/lib/agents/market-maker-agent"

/**
 * Token Trading Plugin for Eliza agents
 * Allows agents to trade musician tokens
 */
export const tradingPlugin: AgentPlugin = {
  name: "trading",
  description: "Trade musician tokens autonomously",
  actions: [
    {
      name: "buy_token",
      similes: ["purchase_token", "acquire_token", "invest_in"],
      description: "Buy a musician's token",
      validate: (params) => {
        return typeof params.tokenAddress === "string" && typeof params.amountEth === "string"
      },
      handler: async (params, context) => {
        const { tokenAddress, amountEth } = params

        console.log(`[Trading Plugin] Buying token for agent ${context.agentId}`)

        // Use existing MM agent infrastructure
        const mmService = new MarketMakerAgentService(context.agentId)
        const result = await mmService.executeBuy(Number.parseFloat(amountEth))

        return {
          success: true,
          txHash: result.txHash,
          amountSpent: amountEth,
        }
      },
    },
    {
      name: "sell_token",
      similes: ["liquidate_token", "exit_position"],
      description: "Sell a musician's token",
      validate: (params) => {
        return typeof params.tokenAddress === "string" && typeof params.percentage === "number"
      },
      handler: async (params, context) => {
        const { tokenAddress, percentage } = params

        console.log(`[Trading Plugin] Selling token for agent ${context.agentId}`)

        const mmService = new MarketMakerAgentService(context.agentId)
        const result = await mmService.executeSell(percentage)

        return {
          success: true,
          txHash: result.txHash,
          percentage,
        }
      },
    },
  ],
  evaluators: [
    {
      name: "trading_opportunity",
      description: "Evaluate if there's a good trading opportunity",
      evaluate: async (context) => {
        const supabase = await (await import("@/lib/supabase/server")).createClient()

        // Check if agent has trading capability
        const { data: agent } = await supabase
          .from("eliza_agents")
          .select("capabilities")
          .eq("id", context.agentId)
          .single()

        if (!agent || !agent.capabilities.includes("token_trading")) {
          return 0
        }

        // Check recent trades
        const recentTrades = context.recentActions.filter(
          (a) => (a.action_type === "buy_token" || a.action_type === "sell_token") && a.status === "completed",
        )

        // Don't trade too frequently (max once per 5 minutes)
        if (recentTrades.length > 0) {
          const lastTrade = new Date(recentTrades[0].created_at)
          const minutesSince = (Date.now() - lastTrade.getTime()) / (1000 * 60)

          if (minutesSince < 5) {
            return 0
          }
        }

        // Return moderate score for trading
        return 0.7
      },
    },
  ],
  providers: [],
}
