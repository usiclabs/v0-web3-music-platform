import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/follows/check - Check if user is following specific artists
export async function POST(request: NextRequest) {
  try {
    const { followerAddress, artistAddresses } = await request.json()

    if (!followerAddress || !artistAddresses || !Array.isArray(artistAddresses)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: follows } = await supabase
      .from("follows")
      .select("following_address")
      .eq("follower_address", followerAddress.toLowerCase())
      .in(
        "following_address",
        artistAddresses.map((a) => a.toLowerCase()),
      )

    // Create a map of artist address -> isFollowing
    const followMap: Record<string, boolean> = {}
    artistAddresses.forEach((address) => {
      followMap[address] = false
    })

    follows?.forEach((follow) => {
      // Find the original cased address
      const originalAddress = artistAddresses.find((a) => a.toLowerCase() === follow.following_address)
      if (originalAddress) {
        followMap[originalAddress] = true
      }
    })

    return NextResponse.json(followMap)
  } catch (error) {
    console.error("Check follows error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
