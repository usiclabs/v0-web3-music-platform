import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Calculate APY based on platform revenue and total staked
    // This is a simplified calculation - in production, you'd want more sophisticated logic

    // Get total platform revenue from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: revenueData, error: revenueError } = await supabase
      .from("payment_history")
      .select("amount")
      .gte("created_at", thirtyDaysAgo.toISOString())

    if (revenueError) {
      console.error("Error fetching revenue:", revenueError)
      return NextResponse.json({ apy: 0 }, { status: 200 })
    }

    // Calculate total revenue in USDC (amount is in smallest unit, 6 decimals)
    const totalRevenue = revenueData.reduce((sum, payment) => {
      return sum + Number.parseFloat(payment.amount) / 1_000_000
    }, 0)

    // Assume 50% of revenue goes to stakers
    const stakingRewards = totalRevenue * 0.5

    // Annualize the 30-day revenue
    const annualizedRewards = (stakingRewards / 30) * 365

    // TODO: Replace mock total staked with real on-chain data once staking vault is deployed
    // Fetch from staking vault contract: vault.totalStaked()
    const totalStaked = 1_000_000 // 1M $USI tokens staked (mock value)

    // Calculate APY: (annual rewards / total staked) * 100
    const apy = totalStaked > 0 ? (annualizedRewards / totalStaked) * 100 : 0

    return NextResponse.json({
      apy: Math.max(0, Math.min(apy, 100)), // Cap between 0-100%
      totalRevenue,
      stakingRewards,
      annualizedRewards,
      totalStaked,
    })
  } catch (error) {
    console.error("Error calculating APY:", error)
    return NextResponse.json({ apy: 0 }, { status: 500 })
  }
}
