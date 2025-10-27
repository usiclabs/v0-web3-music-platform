import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/follows/stats/[address] - Get follower/following counts for an artist
export async function GET(request: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await params
    const supabase = await createClient()

    // Get follower count
    const { count: followerCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_address", address.toLowerCase())

    // Get following count
    const { count: followingCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_address", address.toLowerCase())

    return NextResponse.json({
      followers: followerCount || 0,
      following: followingCount || 0,
    })
  } catch (error) {
    console.error("Get follow stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
