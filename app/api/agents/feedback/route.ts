import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { agentAddress, rating, comment, userAddress, playlistId } = await request.json()

    if (!agentAddress || !rating || !userAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Submitting feedback for agent:", agentAddress, "rating:", rating)

    // Store feedback in database (could also submit to ERC-8004 Reputation Registry on-chain)
    const supabase = await createClient()

    const { data: feedback, error } = await supabase
      .from("agent_feedback")
      .insert({
        agent_address: agentAddress.toLowerCase(),
        user_address: userAddress.toLowerCase(),
        rating,
        comment,
        playlist_id: playlistId,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error storing feedback:", error)
      return NextResponse.json({ error: "Failed to store feedback" }, { status: 500 })
    }

    console.log("[v0] Feedback stored:", feedback.id)

    return NextResponse.json({ success: true, feedback })
  } catch (error) {
    console.error("[v0] Error submitting feedback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentAddress = searchParams.get("agentAddress")

    if (!agentAddress) {
      return NextResponse.json({ error: "Agent address is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: feedback, error } = await supabase
      .from("agent_feedback")
      .select("*")
      .eq("agent_address", agentAddress.toLowerCase())
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching feedback:", error)
      return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 })
    }

    // Calculate average rating
    const averageRating = feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : 0

    return NextResponse.json({
      feedback,
      averageRating: averageRating.toFixed(1),
      totalFeedback: feedback.length,
    })
  } catch (error) {
    console.error("[v0] Error fetching feedback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
