import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export async function GET(request: NextRequest, { params }: { params: { trackId: string } }) {
  try {
    const supabase = await createClient()
    const { trackId } = params

    if (!isValidUUID(trackId)) {
      return NextResponse.json({ error: "Invalid track ID format" }, { status: 400 })
    }

    const { count, error } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("track_id", trackId)

    if (error && error.code === "PGRST205") {
      return NextResponse.json({ count: 0 })
    }

    if (error) throw error

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("[v0] Error fetching likes:", error)
    return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { trackId: string } }) {
  try {
    const supabase = await createClient()
    const { trackId } = params

    if (!isValidUUID(trackId)) {
      return NextResponse.json({ error: "Invalid track ID format" }, { status: 400 })
    }

    const { userAddress } = await request.json()

    if (!userAddress) {
      return NextResponse.json({ error: "User address required" }, { status: 400 })
    }

    const { error } = await supabase.from("likes").insert({
      user_address: userAddress.toLowerCase(),
      track_id: trackId,
    })

    if (error && error.code === "PGRST205") {
      return NextResponse.json(
        { error: "Likes feature not available. Please run migration: 002_create_likes_table.sql" },
        { status: 503 },
      )
    }

    if (error && error.code === "23505") {
      return NextResponse.json({ success: true, message: "Already liked" })
    }

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error liking track:", error)
    return NextResponse.json({ error: "Failed to like track" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { trackId: string } }) {
  try {
    const supabase = await createClient()
    const { trackId } = params

    if (!isValidUUID(trackId)) {
      return NextResponse.json({ error: "Invalid track ID format" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get("userAddress")

    if (!userAddress) {
      return NextResponse.json({ error: "User address required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_address", userAddress.toLowerCase())
      .eq("track_id", trackId)

    if (error && error.code === "PGRST205") {
      return NextResponse.json(
        { error: "Likes feature not available. Please run migration: 002_create_likes_table.sql" },
        { status: 503 },
      )
    }

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error unliking track:", error)
    return NextResponse.json({ error: "Failed to unlike track" }, { status: 500 })
  }
}
