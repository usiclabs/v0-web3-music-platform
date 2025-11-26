import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createPublicClient, http, formatUnits } from "viem"
import { base } from "viem/chains"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Relayer wallet address - should have ETH for gas
const RELAYER_ADDRESS = process.env.NEXT_PUBLIC_RELAYER_ADDRESS as `0x${string}` | undefined

export async function GET() {
  try {
    // Check if relayer address is configured
    if (!RELAYER_ADDRESS) {
      console.warn("[v0] Relayer address not configured")
      return NextResponse.json({
        available: true, // Assume available if not configured
        message: "Relayer not configured, assuming subsidy available",
      })
    }

    // Create public client to check relayer balance
    const publicClient = createPublicClient({
      chain: base,
      transport: http(
        process.env.ALCHEMY_API_KEY
          ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
          : "https://mainnet.base.org",
      ),
    })

    // Get relayer ETH balance
    const balance = await publicClient.getBalance({
      address: RELAYER_ADDRESS,
    })

    const balanceInEth = formatUnits(balance, 18)
    const balanceNum = Number.parseFloat(balanceInEth)

    // Consider subsidy available if relayer has at least 0.001 ETH
    const minBalance = 0.001
    const available = balanceNum >= minBalance

    // Get daily usage stats from database
    const today = new Date().toISOString().split("T")[0]
    const { count: todayCount } = await supabase
      .from("relayed_transactions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00Z`)

    return NextResponse.json({
      available,
      remainingFunds: balanceInEth,
      dailyTransactions: todayCount || 0,
      dailyLimit: "1000", // Soft limit
      userLimit: "50", // Per user daily limit
      relayerAddress: RELAYER_ADDRESS,
    })
  } catch (error) {
    console.error("[v0] Error checking gas subsidy:", error)
    // Default to available on error to not block users
    return NextResponse.json({
      available: true,
      error: "Failed to check subsidy status",
    })
  }
}
