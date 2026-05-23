import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface AgentSummary {
  type: "auto-stream" | "market-maker" | "autonomous-artist" | "investment" | "boost"
  id: string
  name: string
  isActive: boolean
  status: "active" | "inactive" | "error"
  earnings: number
  recentActivityCount: number
  lastActivityAt: string | null
}

interface DashboardData {
  musician: {
    address: string
    name: string
    avatarUrl: string | null
  }
  agents: AgentSummary[]
  stats: {
    totalEarningsToday: number
    totalEarningsWeek: number
    totalEarningsMonth: number
    activeAgentsCount: number
    totalAgentsDeployed: number
  }
  recentActivity: Array<{
    id: string
    type: string
    agentType: string
    description: string
    amount: number | null
    timestamp: string
  }>
}

/**
 * GET /api/managr/dashboard
 * Aggregates all agent data for connected musician
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const musicianAddress = searchParams.get("address")

    if (!musicianAddress) {
      return NextResponse.json({ error: "Musician address required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch musician profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", musicianAddress)
      .single()

    // Fetch all agent types for this musician
    const [autoStreamAgents, mmAgents, autonomousArtistAgents, investmentAgents, boosts] = await Promise.all([
      supabase.from("auto_stream_agents").select("*").eq("owner_address", musicianAddress),
      supabase.from("mm_agents").select("*").eq("owner_address", musicianAddress),
      supabase.from("autonomous_artist_agents").select("*").eq("owner_address", musicianAddress),
      supabase.from("investment_agents").select("*").eq("owner_address", musicianAddress),
      supabase.from("boosts").select("*").eq("boosted_by_address", musicianAddress),
    ])

    // Aggregate agents
    const agents: AgentSummary[] = []

    // Auto-Stream Agents
    autoStreamAgents.data?.forEach((agent: any) => {
      agents.push({
        type: "auto-stream",
        id: agent.id,
        name: agent.owner_address?.slice(0, 8) || "Auto-Stream",
        isActive: agent.is_active,
        status: agent.is_active ? "active" : "inactive",
        earnings: Number(agent.total_amount_paid || 0),
        recentActivityCount: agent.total_streams_count || 0,
        lastActivityAt: agent.last_stream_at,
      })
    })

    // Market Maker Agents
    mmAgents.data?.forEach((agent: any) => {
      agents.push({
        type: "market-maker",
        id: agent.id,
        name: agent.token_symbol || "Market Maker",
        isActive: agent.is_active,
        status: agent.is_active ? "active" : "inactive",
        earnings: Number(agent.total_volume_generated || 0),
        recentActivityCount: agent.active_wallets || 0,
        lastActivityAt: agent.last_buy_at || agent.last_sell_at,
      })
    })

    // Autonomous Artist Agents
    autonomousArtistAgents.data?.forEach((agent: any) => {
      agents.push({
        type: "autonomous-artist",
        id: agent.id,
        name: agent.name || "Autonomous Artist",
        isActive: agent.is_active,
        status: agent.is_active ? "active" : "inactive",
        earnings: Number(agent.total_earnings_usdc || 0),
        recentActivityCount: agent.total_songs_generated || 0,
        lastActivityAt: agent.last_generation_at,
      })
    })

    // Investment Agents
    investmentAgents.data?.forEach((agent: any) => {
      agents.push({
        type: "investment",
        id: agent.id,
        name: agent.name || "Investment Agent",
        isActive: agent.is_active,
        status: agent.is_active ? "active" : "inactive",
        earnings: 0, // Will calculate from activity
        recentActivityCount: 0,
        lastActivityAt: agent.last_active_at,
      })
    })

    // Boosts
    boosts.data?.forEach((boost: any) => {
      agents.push({
        type: "boost",
        id: boost.id,
        name: `Boost: ${boost.token_symbol}`,
        isActive: boost.is_active,
        status: boost.is_active ? "active" : "inactive",
        earnings: Number(boost.user_earnings || 0),
        recentActivityCount: boost.total_trades || 0,
        lastActivityAt: boost.ended_at || boost.started_at,
      })
    })

    // Fetch recent activity across all sources
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [autoStreamActivity, autonomousArtistActivity, boostActivity, earningsEvents] = await Promise.all([
      supabase
        .from("auto_stream_activity")
        .select("*")
        .eq("agent_id", autoStreamAgents.data?.[0]?.id || "null")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("autonomous_artist_activity")
        .select("*")
        .eq("agent_id", autonomousArtistAgents.data?.[0]?.id || "null")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("boost_activity")
        .select("*")
        .eq("boost_id", boosts.data?.[0]?.id || "null")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("earnings_events")
        .select("*")
        .eq("artist_address", musicianAddress)
        .gte("created_at", oneMonthAgo.toISOString())
        .order("created_at", { ascending: false }),
    ])

    // Aggregate earnings by time period
    const stats = {
      totalEarningsToday: 0,
      totalEarningsWeek: 0,
      totalEarningsMonth: 0,
      activeAgentsCount: agents.filter((a) => a.isActive).length,
      totalAgentsDeployed: agents.length,
    }

    earningsEvents.data?.forEach((event: any) => {
      const eventDate = new Date(event.created_at)
      const amount = Number(event.amount || 0)

      if (eventDate >= oneDayAgo) stats.totalEarningsToday += amount
      if (eventDate >= oneWeekAgo) stats.totalEarningsWeek += amount
      stats.totalEarningsMonth += amount
    })

    // Build recent activity feed
    const recentActivity = [
      ...((autoStreamActivity.data || []).map((a: any) => ({
        id: a.id,
        type: a.activity_type || "stream",
        agentType: "auto-stream",
        description: `${a.chunks_played || 0} chunks played`,
        amount: Number(a.amount_paid || 0),
        timestamp: a.created_at,
      })) as any[]),
      ...((autonomousArtistActivity.data || []).map((a: any) => ({
        id: a.id,
        type: a.activity_type || "generation",
        agentType: "autonomous-artist",
        description: a.song_title || "Song generated",
        amount: Number(a.cost_usdc || 0),
        timestamp: a.created_at,
      })) as any[]),
      ...((boostActivity.data || []).map((a: any) => ({
        id: a.id,
        type: a.activity_type || "trade",
        agentType: "boost",
        description: `${a.token_amount || 0} tokens`,
        amount: Number(a.usdc_amount || 0),
        timestamp: a.created_at,
      })) as any[]),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)

    const dashboard: DashboardData = {
      musician: {
        address: musicianAddress,
        name: profile?.artist_name || "Musician",
        avatarUrl: profile?.avatar_url || null,
      },
      agents,
      stats,
      recentActivity,
    }

    return NextResponse.json(dashboard)
  } catch (error: any) {
    console.error("[MANAGR Dashboard API] Error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch dashboard data" }, { status: 500 })
  }
}
