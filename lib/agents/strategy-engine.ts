import { createClient } from "@/lib/supabase/server"
import { getAgentWalletService } from "./wallet-service"
import type { InvestmentAgent, TokenAnalysis, AgentSignal } from "./types"
import type { Address } from "viem"

interface TokenData {
  address: string
  symbol: string
  name: string
  price: number
  priceChange24h: number
  volume24h: number
  liquidity: number
  holderCount: number
  artistAddress: string
  artistName: string
  artistFollowers: number
  genre: string
  streamCount: number
  createdAt: string
}

/**
 * Investment Strategy Engine
 * Analyzes tokens and generates buy/sell signals based on agent configuration
 */
export class StrategyEngine {
  private agent: InvestmentAgent

  constructor(agent: InvestmentAgent) {
    this.agent = agent
  }

  /**
   * Analyze a token and generate a score
   */
  async analyzeToken(token: TokenData): Promise<TokenAnalysis> {
    const scores = {
      momentum: this.calculateMomentumScore(token),
      volume: this.calculateVolumeScore(token),
      social: this.calculateSocialScore(token),
      artist: this.calculateArtistScore(token),
    }

    // Weight scores based on strategy type
    const weights = this.getStrategyWeights()

    const overallScore =
      scores.momentum * weights.momentum +
      scores.volume * weights.volume +
      scores.social * weights.social +
      scores.artist * weights.artist

    const recommendation = this.getRecommendation(overallScore, token)
    const reasons = this.getReasons(scores, token)

    return {
      address: token.address as Address,
      symbol: token.symbol,
      name: token.name,
      price: token.price,
      priceChange24h: token.priceChange24h,
      volume24h: token.volume24h,
      liquidity: token.liquidity,
      holderCount: token.holderCount,
      artistFollowers: token.artistFollowers,
      artistName: token.artistName,
      genre: token.genre,
      momentumScore: scores.momentum,
      volumeScore: scores.volume,
      socialScore: scores.social,
      artistScore: scores.artist,
      overallScore,
      recommendation,
      confidence: this.calculateConfidence(scores, token),
      reasons,
    }
  }

  /**
   * Calculate momentum score (price action)
   */
  private calculateMomentumScore(token: TokenData): number {
    let score = 50 // Base score

    // Price change impact
    if (token.priceChange24h > 0) {
      // Positive momentum
      if (token.priceChange24h >= 5 && token.priceChange24h <= 20) {
        score += 30 // Sweet spot - good growth without being too volatile
      } else if (token.priceChange24h > 20 && token.priceChange24h <= 50) {
        score += 20 // Strong growth but might be overheated
      } else if (token.priceChange24h > 50) {
        score += 10 // Possibly too volatile, might be a pump
      } else {
        score += 15 // Mild positive
      }
    } else {
      // Negative momentum
      if (token.priceChange24h >= -5) {
        score += 5 // Minor dip - could be buying opportunity
      } else if (token.priceChange24h >= -15) {
        score -= 10 // Moderate decline
      } else {
        score -= 25 // Significant decline
      }
    }

    // Age factor - newer tokens with momentum get bonus
    const ageInDays = (Date.now() - new Date(token.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    if (ageInDays < 7 && token.priceChange24h > 0) {
      score += 10 // New token with positive momentum
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate volume score
   */
  private calculateVolumeScore(token: TokenData): number {
    let score = 50

    // Volume to liquidity ratio
    const volumeToLiquidity = token.liquidity > 0 ? token.volume24h / token.liquidity : 0

    if (volumeToLiquidity >= 0.1 && volumeToLiquidity <= 0.5) {
      score += 25 // Healthy trading activity
    } else if (volumeToLiquidity > 0.5 && volumeToLiquidity <= 1) {
      score += 15 // High activity
    } else if (volumeToLiquidity > 1) {
      score += 5 // Very high - could be manipulation
    } else {
      score -= 10 // Low activity
    }

    // Absolute liquidity check
    if (token.liquidity >= this.agent.min_liquidity) {
      score += 15
    } else {
      score -= 20 // Below minimum liquidity threshold
    }

    // Holder count bonus
    if (token.holderCount >= this.agent.min_holder_count) {
      score += 10
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate social score (based on streaming and engagement)
   */
  private calculateSocialScore(token: TokenData): number {
    let score = 50

    // Stream count indicates platform engagement
    if (token.streamCount > 10000) {
      score += 30
    } else if (token.streamCount > 1000) {
      score += 20
    } else if (token.streamCount > 100) {
      score += 10
    }

    // Holder count as a proxy for community size
    if (token.holderCount > 1000) {
      score += 20
    } else if (token.holderCount > 100) {
      score += 10
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate artist score
   */
  private calculateArtistScore(token: TokenData): number {
    let score = 50

    // Artist followers
    if (token.artistFollowers >= this.agent.min_artist_followers) {
      if (token.artistFollowers > 10000) {
        score += 30
      } else if (token.artistFollowers > 1000) {
        score += 20
      } else if (token.artistFollowers > 100) {
        score += 10
      }
    } else {
      score -= 15 // Below minimum follower threshold
    }

    // Genre preference bonus
    if (this.agent.preferred_genres?.length > 0) {
      if (this.agent.preferred_genres.includes(token.genre)) {
        score += 15
      }
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Get strategy-specific weights
   */
  private getStrategyWeights() {
    switch (this.agent.strategy_type) {
      case "momentum":
        return { momentum: 0.4, volume: 0.3, social: 0.15, artist: 0.15 }
      case "value":
        return { momentum: 0.2, volume: 0.25, social: 0.25, artist: 0.3 }
      case "balanced":
        return { momentum: 0.25, volume: 0.25, social: 0.25, artist: 0.25 }
      case "custom":
      default:
        return { momentum: 0.25, volume: 0.25, social: 0.25, artist: 0.25 }
    }
  }

  /**
   * Get recommendation based on score
   */
  private getRecommendation(score: number, token: TokenData): "strong_buy" | "buy" | "hold" | "sell" | "strong_sell" {
    // Check blacklist
    if (this.agent.blacklisted_tokens?.includes(token.address.toLowerCase())) {
      return "hold"
    }

    // Check whitelist - always consider whitelisted tokens favorably
    const isWhitelisted = this.agent.whitelisted_tokens?.includes(token.address.toLowerCase())

    if (score >= 80 || (score >= 70 && isWhitelisted)) {
      return "strong_buy"
    } else if (score >= 65 || (score >= 55 && isWhitelisted)) {
      return "buy"
    } else if (score >= 40) {
      return "hold"
    } else if (score >= 25) {
      return "sell"
    } else {
      return "strong_sell"
    }
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(
    scores: { momentum: number; volume: number; social: number; artist: number },
    token: TokenData,
  ): number {
    // Higher confidence when scores are consistent
    const scoreValues = Object.values(scores)
    const avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
    const variance = scoreValues.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scoreValues.length
    const stdDev = Math.sqrt(variance)

    // Lower variance = higher confidence
    let confidence = 100 - stdDev

    // Boost confidence for high liquidity
    if (token.liquidity > this.agent.min_liquidity * 2) {
      confidence += 10
    }

    // Boost confidence for established tokens
    const ageInDays = (Date.now() - new Date(token.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    if (ageInDays > 30) {
      confidence += 5
    }

    return Math.max(0, Math.min(100, confidence))
  }

  /**
   * Generate human-readable reasons
   */
  private getReasons(
    scores: { momentum: number; volume: number; social: number; artist: number },
    token: TokenData,
  ): string[] {
    const reasons: string[] = []

    if (scores.momentum >= 70) {
      reasons.push(`Strong price momentum (+${token.priceChange24h.toFixed(1)}% 24h)`)
    } else if (scores.momentum <= 30) {
      reasons.push(`Weak price action (${token.priceChange24h.toFixed(1)}% 24h)`)
    }

    if (scores.volume >= 70) {
      reasons.push(`Healthy trading volume ($${(token.volume24h / 1000).toFixed(1)}K)`)
    } else if (scores.volume <= 30) {
      reasons.push(`Low trading activity`)
    }

    if (scores.social >= 70) {
      reasons.push(`High platform engagement (${token.streamCount.toLocaleString()} streams)`)
    }

    if (scores.artist >= 70) {
      reasons.push(`Popular artist (${token.artistFollowers.toLocaleString()} followers)`)
    }

    if (token.liquidity < this.agent.min_liquidity) {
      reasons.push(`Low liquidity warning ($${token.liquidity.toLocaleString()})`)
    }

    return reasons
  }

  /**
   * Check if agent should sell a position (stop-loss or take-profit)
   */
  async checkPositionExits(): Promise<{ token: string; reason: string; action: "stop_loss" | "take_profit" }[]> {
    const exits: { token: string; reason: string; action: "stop_loss" | "take_profit" }[] = []
    const supabase = await createClient()

    // Get portfolio positions
    const { data: positions } = await supabase.from("agent_portfolio").select("*").eq("agent_id", this.agent.id)

    if (!positions) return exits

    for (const position of positions) {
      if (position.current_value <= 0 || position.total_invested <= 0) continue

      const pnlPercent = ((position.current_value - position.total_invested) / position.total_invested) * 100

      if (pnlPercent <= -this.agent.stop_loss_percent) {
        exits.push({
          token: position.token_address,
          reason: `Stop-loss triggered: ${pnlPercent.toFixed(1)}% loss`,
          action: "stop_loss",
        })
      } else if (pnlPercent >= this.agent.take_profit_percent) {
        exits.push({
          token: position.token_address,
          reason: `Take-profit triggered: +${pnlPercent.toFixed(1)}% gain`,
          action: "take_profit",
        })
      }
    }

    return exits
  }

  /**
   * Generate a signal and optionally save to database
   */
  async generateSignal(analysis: TokenAnalysis, save = true): Promise<AgentSignal | null> {
    if (analysis.recommendation === "hold") {
      return null
    }

    const signal: Partial<AgentSignal> = {
      agent_id: this.agent.id,
      signal_type: analysis.recommendation.includes("buy") ? "buy" : "sell",
      token_address: analysis.address,
      token_symbol: analysis.symbol,
      confidence_score: analysis.confidence,
      price_at_signal: analysis.price,
      momentum_score: analysis.momentumScore,
      volume_score: analysis.volumeScore,
      social_score: analysis.socialScore,
      artist_score: analysis.artistScore,
      was_executed: false,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hour expiry
    }

    if (save) {
      const supabase = await createClient()
      const { data, error } = await supabase.from("agent_signals").insert(signal).select().single()

      if (error) {
        console.error("[StrategyEngine] Failed to save signal:", error)
        return null
      }

      return data as AgentSignal
    }

    return signal as AgentSignal
  }
}

/**
 * Run the autonomous agent cycle
 * This should be called periodically (e.g., every hour)
 */
export async function runAgentCycle(agentId: string): Promise<{
  scanned: number
  signals: number
  trades: number
  errors: string[]
}> {
  const results = {
    scanned: 0,
    signals: 0,
    trades: 0,
    errors: [] as string[],
  }

  try {
    const supabase = await createClient()
    const walletService = getAgentWalletService()

    // Get agent configuration
    const { data: agent, error: agentError } = await supabase
      .from("investment_agents")
      .select("*")
      .eq("id", agentId)
      .single()

    if (agentError || !agent || !agent.is_active) {
      results.errors.push("Agent not found or inactive")
      return results
    }

    // Log cycle start
    await walletService.logActivity(agentId, "scan", "Starting autonomous scan cycle")

    const engine = new StrategyEngine(agent)

    // Check for position exits first
    const exits = await engine.checkPositionExits()
    for (const exit of exits) {
      try {
        // Get position details
        const { data: position } = await supabase
          .from("agent_portfolio")
          .select("*")
          .eq("agent_id", agentId)
          .eq("token_address", exit.token)
          .single()

        if (position && position.amount > 0) {
          // Execute sell
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/sell`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              agentId,
              tokenAddress: exit.token,
              tokenSymbol: position.token_symbol,
              amount: position.amount,
              triggerReason: exit.reason,
              strategyScore: exit.action === "take_profit" ? 80 : 20,
            }),
          })

          if (response.ok) {
            results.trades++
          } else {
            results.errors.push(`Failed to execute ${exit.action} for ${position.token_symbol}`)
          }
        }
      } catch (error: any) {
        results.errors.push(`Exit error: ${error.message}`)
      }
    }

    // Get available tokens to analyze
    const { data: tokens } = await supabase
      .from("tracks")
      .select(`
        coin_address,
        title,
        artist_id,
        profiles!tracks_artist_id_fkey (
          artist_name,
          wallet_address
        )
      `)
      .not("coin_address", "is", null)
      .limit(50)

    if (!tokens || tokens.length === 0) {
      await walletService.logActivity(agentId, "scan", "No tokens found to analyze")
      return results
    }

    // Analyze each token (simplified - would need real price data)
    for (const token of tokens) {
      if (!token.coin_address) continue

      results.scanned++

      // Skip blacklisted tokens
      if (agent.blacklisted_tokens?.includes(token.coin_address.toLowerCase())) {
        continue
      }

      // Build token data (would need real data from DEX/API)
      const tokenData: TokenData = {
        address: token.coin_address,
        symbol: token.title?.slice(0, 6).toUpperCase() || "TOKEN",
        name: token.title || "Unknown",
        price: 0.001, // Would need real price
        priceChange24h: Math.random() * 40 - 10, // Placeholder
        volume24h: Math.random() * 10000, // Placeholder
        liquidity: Math.random() * 50000 + 1000, // Placeholder
        holderCount: Math.floor(Math.random() * 500) + 10, // Placeholder
        artistAddress: (token.profiles as any)?.wallet_address || "",
        artistName: (token.profiles as any)?.artist_name || "Unknown Artist",
        artistFollowers: Math.floor(Math.random() * 1000), // Placeholder
        genre: "Electronic", // Placeholder
        streamCount: Math.floor(Math.random() * 5000), // Placeholder
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      try {
        const analysis = await engine.analyzeToken(tokenData)

        // Only generate signals for strong recommendations
        if (analysis.recommendation === "strong_buy" || analysis.recommendation === "buy") {
          const signal = await engine.generateSignal(analysis)
          if (signal) {
            results.signals++

            // Auto-execute if confidence is high enough and budget allows
            if (
              analysis.confidence >= 70 &&
              analysis.recommendation === "strong_buy" &&
              agent.spent_amount < agent.total_budget
            ) {
              const investAmount = Math.min(agent.per_trade_limit, agent.total_budget - agent.spent_amount)

              if (investAmount > 0) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/invest`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    agentId,
                    tokenAddress: token.coin_address,
                    tokenSymbol: tokenData.symbol,
                    tokenName: tokenData.name,
                    amountUsdc: investAmount,
                    triggerReason: analysis.reasons.join("; "),
                    strategyScore: analysis.overallScore,
                  }),
                })

                if (response.ok) {
                  results.trades++
                }
              }
            }
          }
        }
      } catch (error: any) {
        results.errors.push(`Analysis error for ${token.coin_address}: ${error.message}`)
      }
    }

    // Log cycle completion
    await walletService.logActivity(
      agentId,
      "scan",
      `Scan cycle complete: ${results.scanned} tokens scanned, ${results.signals} signals, ${results.trades} trades`,
      results,
    )

    return results
  } catch (error: any) {
    results.errors.push(`Cycle error: ${error.message}`)
    return results
  }
}
