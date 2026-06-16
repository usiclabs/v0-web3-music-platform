import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const { followerAddress, followingAddress, action } = await request.json()

    if (!followerAddress || !followingAddress || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (followerAddress.toLowerCase() === followingAddress.toLowerCase()) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    const normalizedFollower = followerAddress.toLowerCase()
    const normalizedFollowing = followingAddress.toLowerCase()

    const supabase = await createClient()

    if (action === "follow") {
      // Check if already following
      const { data: existing } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_address", normalizedFollower)
        .eq("following_address", normalizedFollowing)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ error: "Already following" }, { status: 400 })
      }

      // Add follow
      const { error } = await supabase.from("follows").insert({
        follower_address: normalizedFollower,
        following_address: normalizedFollowing,
      })

      if (error) {
        console.error("[v0] Follow error:", error.message)
        return NextResponse.json({ error: "Failed to follow" }, { status: 500 })
      }

      // Invalidate cache for this artist's follower count
      revalidateTag(`artist-${normalizedFollowing}`)
      revalidateTag(`follower-count-${normalizedFollowing}`)

      return NextResponse.json({ success: true, action: "followed" })
    } else if (action === "unfollow") {
      // Remove follow
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_address", normalizedFollower)
        .eq("following_address", normalizedFollowing)

      if (error) {
        console.error("[v0] Unfollow error:", error.message)
        return NextResponse.json({ error: "Failed to unfollow" }, { status: 500 })
      }

      // Invalidate cache for this artist's follower count
      revalidateTag(`artist-${normalizedFollowing}`)
      revalidateTag(`follower-count-${normalizedFollowing}`)

      return NextResponse.json({ success: true, action: "unfollowed" })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Follow/unfollow error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
