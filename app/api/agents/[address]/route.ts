import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  const supabase = await createServerClient()

  const { data: agent, error } = await supabase
    .from("agents")
    .select("*")
    .eq("agent_address", address.toLowerCase())
    .eq("is_active", true)
    .single()

  if (error || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  // Fetch feedback
  const { data: feedback } = await supabase
    .from("agent_feedback")
    .select("*, profiles(artist_name, avatar_url)")
    .eq("agent_address", address.toLowerCase())
    .order("created_at", { ascending: false })

  // Calculate stats
  const feedbackCount = feedback?.length || 0
  const averageRating = feedbackCount > 0 ? feedback!.reduce((sum, f) => sum + f.rating, 0) / feedbackCount : 0

  // Get agent's playlists if it's a curator
  const { data: playlists } = await supabase
    .from("playlists")
    .select("*, playlist_tracks(count)")
    .eq("owner_address", address.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(10)

  return NextResponse.json({
    agent: {
      ...agent,
      feedback_count: feedbackCount,
      average_rating: averageRating,
      feedback,
      playlists: playlists || [],
    },
  })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  const supabase = await createServerClient()
  const body = await request.json()

  const { description, apiEndpoint, websocketEndpoint, isActive } = body

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (description !== undefined) updateData.description = description
  if (apiEndpoint !== undefined) updateData.api_endpoint = apiEndpoint
  if (websocketEndpoint !== undefined) updateData.websocket_endpoint = websocketEndpoint
  if (isActive !== undefined) updateData.is_active = isActive

  const { data, error } = await supabase
    .from("agents")
    .update(updateData)
    .eq("agent_address", address.toLowerCase())
    .select()
    .single()

  if (error) {
    console.error("[v0] Error updating agent:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ agent: data })
}
