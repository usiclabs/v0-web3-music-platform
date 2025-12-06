import { type NextRequest, NextResponse } from "next/server"
import { TokenSniperAgentService } from "@/lib/agents/token-sniper-agent"
import type { Address } from "viem"

export async function POST(request: NextRequest) {
  try {
    const { agentId, tokenAddress, tokenSymbol, tokenName, artistAddress, artistName } = await request.json()

    if (!agentId || !tokenAddress) {
      return NextResponse.json({ error: "Agent ID and token address required" }, { status: 400 })
    }

    const sniper = new TokenSniperAgentService(agentId)
    const result = await sniper.handleNewTokenDeployment({
      address: tokenAddress as Address,
      symbol: tokenSymbol || "TOKEN",
      name: tokenName || "Unknown",
      artistAddress: artistAddress || "",
      artistName: artistName || "Unknown Artist",
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[API] Token sniper error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
