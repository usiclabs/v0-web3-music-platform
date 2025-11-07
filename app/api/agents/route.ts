import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const owner = searchParams.get("owner")

  const supabase = await createServerClient()

  let query = supabase.from("agents").select("*").eq("is_active", true).order("created_at", { ascending: false })

  if (owner) {
    query = query.eq("owner_address", owner.toLowerCase())
  }

  const { data: agents, error } = await query

  if (error) {
    console.error("[v0] Error fetching agents:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch feedback stats for each agent
  const agentsWithStats = await Promise.all(
    (agents || []).map(async (agent) => {
      const { data: feedbackData } = await supabase
        .from("agent_feedback")
        .select("rating")
        .eq("agent_address", agent.agent_address.toLowerCase())

      const feedbackCount = feedbackData?.length || 0
      const averageRating = feedbackCount > 0 ? feedbackData!.reduce((sum, f) => sum + f.rating, 0) / feedbackCount : 0

      return {
        ...agent,
        feedback_count: feedbackCount,
        average_rating: averageRating,
      }
    }),
  )

  return NextResponse.json({ agents: agentsWithStats })
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const body = await request.json()

  const { name, description, version, capabilities, apiEndpoint, websocketEndpoint, ownerAddress, agentAddress } = body

  if (!name || !ownerAddress || !agentAddress || !capabilities) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("agents")
    .insert({
      agent_address: agentAddress.toLowerCase(),
      name,
      description,
      version: version || "1.0.0",
      capabilities: Array.isArray(capabilities) ? capabilities : capabilities.split(",").map((c: string) => c.trim()),
      api_endpoint: apiEndpoint || null,
      websocket_endpoint: websocketEndpoint || null,
      owner_address: ownerAddress.toLowerCase(),
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating agent:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ agent: data })
}
