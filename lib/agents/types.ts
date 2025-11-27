import type { Address } from "viem"

export interface InvestmentAgent {
  id: string
  owner_address: string
  name: string
  is_active: boolean

  // Budget
  total_budget: number
  spent_amount: number
  daily_limit: number
  per_trade_limit: number

  // Strategy
  strategy_type: "momentum" | "value" | "balanced" | "custom"
  min_liquidity: number
  max_slippage: number

  // Risk
  stop_loss_percent: number
  take_profit_percent: number
  max_portfolio_percent: number

  // Filters
  min_holder_count: number
  min_artist_followers: number
  preferred_genres: string[]
  blacklisted_tokens: string[]
  whitelisted_tokens: string[]

  // Metadata
  created_at: string
  updated_at: string
  last_active_at: string | null
}

export interface AgentPortfolioItem {
  id: string
  agent_id: string
  token_address: string
  token_symbol: string
  token_name: string
  amount: number
  avg_buy_price: number
  total_invested: number
  current_value: number
  unrealized_pnl: number
  realized_pnl: number
  first_buy_at: string
  last_updated_at: string
}

export interface AgentTrade {
  id: string
  agent_id: string
  trade_type: "buy" | "sell"
  token_address: string
  token_symbol: string
  amount_in: number
  amount_out: number
  price_per_token: number
  slippage_percent: number
  tx_hash: string
  status: "pending" | "confirmed" | "failed"
  error_message: string | null
  trigger_reason: string
  strategy_score: number
  created_at: string
  confirmed_at: string | null
  gas_used: number
}

export interface AgentSignal {
  id: string
  agent_id: string
  signal_type: "buy" | "sell" | "hold"
  token_address: string
  token_symbol: string
  confidence_score: number
  price_at_signal: number
  momentum_score: number
  volume_score: number
  social_score: number
  artist_score: number
  was_executed: boolean
  execution_trade_id: string | null
  created_at: string
  expires_at: string
}

export interface TokenAnalysis {
  address: Address
  symbol: string
  name: string
  price: number
  priceChange24h: number
  volume24h: number
  liquidity: number
  holderCount: number
  artistFollowers: number
  artistName: string
  genre: string

  // Scores (0-100)
  momentumScore: number
  volumeScore: number
  socialScore: number
  artistScore: number
  overallScore: number

  // Recommendation
  recommendation: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell"
  confidence: number
  reasons: string[]
}

export interface AgentStats {
  totalTrades: number
  successfulTrades: number
  totalProfit: number
  totalLoss: number
  winRate: number
  avgTradeSize: number
  bestTrade: AgentTrade | null
  worstTrade: AgentTrade | null
  portfolioValue: number
  remainingBudget: number
}
