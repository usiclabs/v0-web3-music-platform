import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { userAddress, trackIds } = await request.json()

    if (!userAddress || !trackIds || !Array.isArray(trackIds)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("likes")
      .select("track_id")
      .eq("user_address", userAddress.toLowerCase())
      .in("track_id", trackIds)

    // If table doesn't exist, return empty likes
    if (error && error.code === "PGRST205") {
      console.log("[v0] Likes table not found - returning empty likes")
      const result: Record<string, boolean> = {}
      trackIds.forEach((id) => {
        result[id] = false
      })
      return NextResponse.json(result)
    }

    if (error) throw error

    const likedTrackIds = new Set(data?.map((like) => like.track_id) || [])
    const result: Record<string, boolean> = {}
    trackIds.forEach((id) => {
      result[id] = likedTrackIds.has(id)
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error checking likes:", error)
    return NextResponse.json({ error: "Failed to check likes" }, { status: 500 })
  }
}
