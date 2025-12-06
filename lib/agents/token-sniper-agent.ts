import { createClient } from "@/lib/supabase/server"
import { getAgentWalletService } from "./wallet-service"
import type { Address } from "viem"

export interface TokenSniperAgent {
  id: string
  owner_address: string
  name: string
  is_active: boolean
  auto_buy_enabled: boolean
  buy_amount_usdc: number // Amount to buy per new token
  max_daily_buys: number
  buys_today: number
  min_artist_followers: number // Only snipe tokens from artists with X+ followers
  whitelist_artists: string[] // Only snipe from these artists (if set)
  blacklist_artists: string[] // Never snipe from these artists
  created_at: string
  last_active_at: string | null
}

/**
 * Token Sniper Agent Service
 * Monitors new token deployments and automatically buys them
 */
export class TokenSniperAgentService {
  private agentId: string
  private walletService: ReturnType<typeof getAgentWalletService>

  constructor(agentId: string) {
    this.agentId = agentId
    this.walletService = getAgentWalletService()
  }

  /**
   * Handle new token deployment event
   */
  async handleNewTokenDeployment(tokenData: {
    address: Address
    symbol: string
    name: string
    artistAddress: string
    artistName: string
  }): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log(`[TokenSniper] New token detected: ${tokenData.symbol} at ${tokenData.address}`)

      const supabase = await createClient()

      // Get agent configuration
      const { data: agent, error: agentError } = await supabase
        .from("token_sniper_agents")
        .select("*")
        .eq("id", this.agentId)
        .single()

      if (agentError || !agent || !agent.is_active || !agent.auto_buy_enabled) {
        console.log("[TokenSniper] Agent not active or auto-buy disabled")
        return { success: false, error: "Agent not active" }
      }

      // Check daily buy limit
      if (agent.buys_today >= agent.max_daily_buys) {
        console.log("[TokenSniper] Daily buy limit reached")
        await this.logActivity("limit_reached", "Daily buy limit reached")
        return { success: false, error: "Daily limit reached" }
      }

      // Check whitelist
      if (agent.whitelist_artists && agent.whitelist_artists.length > 0) {
        if (!agent.whitelist_artists.includes(tokenData.artistAddress.toLowerCase())) {
          console.log(`[TokenSniper] Artist not in whitelist: ${tokenData.artistName}`)
          return { success: false, error: "Artist not whitelisted" }
        }
      }

      // Check blacklist
      if (agent.blacklist_artists?.includes(tokenData.artistAddress.toLowerCase())) {
        console.log(`[TokenSniper] Artist in blacklist: ${tokenData.artistName}`)
        return { success: false, error: "Artist blacklisted" }
      }

      // Check artist followers
      const { data: artistProfile } = await supabase
        .from("profiles")
        .select("wallet_address")
        .eq("wallet_address", tokenData.artistAddress.toLowerCase())
        .single()

      if (artistProfile) {
        const { count: followersCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_address", tokenData.artistAddress.toLowerCase())

        if ((followersCount || 0) < agent.min_artist_followers) {
          console.log(
            `[TokenSniper] Artist doesn't meet follower requirement: ${followersCount} < ${agent.min_artist_followers}`,
          )
          return { success: false, error: "Insufficient artist followers" }
        }
      }

      console.log(`[TokenSniper] All checks passed, attempting to snipe ${tokenData.symbol}`)

      // Execute snipe buy
      const buyAmountUsdc = BigInt(Math.floor(agent.buy_amount_usdc * 1e6))

      // Check if pool exists
      const poolCheck = await this.walletService.checkPoolExists(tokenData.address)
      if (!poolCheck.exists) {
        console.log(`[TokenSniper] No liquidity pool yet for ${tokenData.symbol}, will retry later`)
        // Schedule retry logic here if needed
        return { success: false, error: "No liquidity pool yet" }
      }

      // Get quote
      const quote = await this.walletService.getSwapQuote(tokenData.address, buyAmountUsdc, true)
      if (!quote) {
        console.log(`[TokenSniper] Could not get quote for ${tokenData.symbol}`)
        return { success: false, error: "No quote available" }
      }

      // Set minimum amount out with 5% slippage
      const minAmountOut = (quote.amountOut * 95n) / 100n

      // Execute swap
      const swapResult = await this.walletService.executeSwap(tokenData.address, buyAmountUsdc, minAmountOut, true)

      if (!swapResult.success) {
        console.error(`[TokenSniper] Swap failed:`, swapResult.error)
        await this.logActivity("snipe_failed", `Failed to snipe ${tokenData.symbol}: ${swapResult.error}`, {
          tokenAddress: tokenData.address,
          error: swapResult.error,
        })
        return { success: false, error: swapResult.error }
      }

      console.log(`[TokenSniper] Successfully sniped ${tokenData.symbol}! TX: ${swapResult.txHash}`)

      // Record trade
      await this.walletService.recordTrade(
        this.agentId,
        "buy",
        tokenData.address,
        tokenData.symbol,
        swapResult.amountIn,
        swapResult.amountOut,
        swapResult.txHash!,
        `First-buyer snipe: ${tokenData.artistName}`,
        100, // Max strategy score for successful snipe
      )

      // Update portfolio
      await this.walletService.updatePortfolio(
        this.agentId,
        tokenData.address,
        tokenData.symbol,
        tokenData.name,
        "buy",
        swapResult.amountOut,
        swapResult.amountIn,
      )

      // Update agent stats
      await supabase
        .from("token_sniper_agents")
        .update({
          buys_today: agent.buys_today + 1,
          last_active_at: new Date().toISOString(),
        })
        .eq("id", this.agentId)

      // Log successful snipe
      await this.logActivity(
        "snipe_success",
        `Successfully sniped ${tokenData.symbol} for ${agent.buy_amount_usdc} USDC`,
        {
          tokenAddress: tokenData.address,
          tokenSymbol: tokenData.symbol,
          artistName: tokenData.artistName,
          amountUsdc: agent.buy_amount_usdc,
          amountTokens: swapResult.amountOut.toString(),
          txHash: swapResult.txHash,
        },
      )

      return {
        success: true,
        txHash: swapResult.txHash,
      }
    } catch (error: any) {
      console.error("[TokenSniper] Error in snipe attempt:", error)
      await this.logActivity("snipe_error", error.message, { tokenAddress: tokenData.address })
      return { success: false, error: error.message }
    }
  }

  /**
   * Log agent activity
   */
  private async logActivity(activityType: string, description: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const supabase = await createClient()
      await supabase.from("agent_activity_log").insert({
        agent_id: this.agentId,
        activity_type: activityType,
        description,
        metadata,
      })
    } catch (error) {
      console.error("[TokenSniper] Failed to log activity:", error)
    }
  }
}

/**
 * Monitor new token deployments and trigger sniper agents
 */
export async function monitorNewTokenDeployments(): Promise<void> {
  const supabase = await createClient()

  // Subscribe to new token deployments via realtime
  const channel = supabase
    .channel("token_deployments")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "tracks",
        filter: "coin_address=not.is.null",
      },
      async (payload) => {
        const track = payload.new

        if (!track.coin_address) return

        console.log(`[TokenMonitor] New token deployment detected: ${track.coin_address}`)

        // Get artist info
        const { data: artist } = await supabase
          .from("profiles")
          .select("artist_name, wallet_address")
          .eq("wallet_address", track.artist_id)
          .single()

        const tokenData = {
          address: track.coin_address as Address,
          symbol: track.title?.slice(0, 6).toUpperCase() || "TOKEN",
          name: track.title || "Unknown Token",
          artistAddress: track.artist_id,
          artistName: artist?.artist_name || "Unknown Artist",
        }

        // Get all active sniper agents
        const { data: sniperAgents } = await supabase
          .from("token_sniper_agents")
          .select("*")
          .eq("is_active", true)
          .eq("auto_buy_enabled", true)

        if (!sniperAgents || sniperAgents.length === 0) {
          console.log("[TokenMonitor] No active sniper agents found")
          return
        }

        // Trigger each sniper agent
        for (const agent of sniperAgents) {
          const sniper = new TokenSniperAgentService(agent.id)
          await sniper.handleNewTokenDeployment(tokenData)
        }
      },
    )
    .subscribe()

  console.log("[TokenMonitor] Subscribed to new token deployments")
}
