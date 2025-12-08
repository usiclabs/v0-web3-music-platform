// Prediction market resolution utilities

export interface ResolutionSource {
  type: "supabase" | "dexscreener" | "on_chain"
  metric: string
  value: number
  timestamp: string
}

export interface MarketResolution {
  marketId: string
  outcome: boolean
  actualValue: number
  threshold: number
  operator: string
  source: ResolutionSource
  winnersCount: number
  totalPayout: number
}

export async function resolveMarket(marketId: string): Promise<MarketResolution> {
  const response = await fetch("/api/predictions/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ marketId }),
  })

  if (!response.ok) {
    throw new Error("Failed to resolve market")
  }

  return response.json()
}

export function formatMetricValue(metric: string, value: number): string {
  switch (metric) {
    case "stream_count":
      return `${value.toLocaleString()} streams`
    case "market_cap_usd":
      return `$${value.toLocaleString()}`
    case "follower_count":
      return `${value.toLocaleString()} followers`
    case "revenue_usd":
      return `$${value.toLocaleString()}`
    case "token_price_usd":
      return `$${value.toFixed(6)}`
    default:
      return value.toString()
  }
}

export function getMetricDisplayName(metric: string): string {
  const names: Record<string, string> = {
    stream_count: "Stream Count",
    market_cap_usd: "Market Cap (USD)",
    follower_count: "Follower Count",
    revenue_usd: "Revenue (USD)",
    token_price_usd: "Token Price (USD)",
  }
  return names[metric] || metric
}
