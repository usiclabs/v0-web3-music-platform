import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/follows/toggle
 * Toggle follow status for an artist
 * 
 * Body: { artistAddress: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { artistAddress } = await request.json()

    if (!artistAddress) {
      return NextResponse.json({ error: "artistAddress is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const normalizedArtist = artistAddress.toLowerCase()
    const userAddress = user.user_metadata?.wallet_address?.toLowerCase()

    if (!userAddress) {
      return NextResponse.json({ error: "User wallet not found" }, { status: 400 })
    }

    if (userAddress === normalizedArtist) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    // Check if already following
    const { data: existingFollow, error: checkError } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_address", userAddress)
      .eq("following_address", normalizedArtist)
      .maybeSingle()

    if (checkError) {
      console.error("[v0] Error checking follow status:", checkError.message)
      return NextResponse.json({ error: "Failed to check follow status" }, { status: 500 })
    }

    let isFollowing = false

    if (existingFollow) {
      // Unfollow
      const { error: deleteError } = await supabase
        .from("follows")
        .delete()
        .eq("id", existingFollow.id)

      if (deleteError) {
        console.error("[v0] Error unfollowing:", deleteError.message)
        return NextResponse.json({ error: "Failed to unfollow" }, { status: 500 })
      }

      isFollowing = false
    } else {
      // Follow
      const { error: insertError } = await supabase.from("follows").insert({
        follower_address: userAddress,
        following_address: normalizedArtist,
        followed_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("[v0] Error following:", insertError.message)
        return NextResponse.json({ error: "Failed to follow" }, { status: 500 })
      }

      isFollowing = true
    }

    // Invalidate cache by revalidating the artist profile page
    // This triggers a server revalidation
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/revalidate?path=/artist/${normalizedArtist}`,
        { method: "POST" }
      )
    } catch (error) {
      console.warn("[v0] Failed to revalidate cache:", error)
    }

    return NextResponse.json({
      success: true,
      isFollowing,
      action: isFollowing ? "followed" : "unfollowed",
    })
  } catch (error) {
    console.error("[v0] Follow toggle error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * GET /api/follows/status
 * Check if current user is following an artist
 */
export async function GET(request: NextRequest) {
  try {
    const artistAddress = request.nextUrl.searchParams.get("artist")

    if (!artistAddress) {
      return NextResponse.json({ error: "artist parameter required" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ isFollowing: false })
    }

    const userAddress = user.user_metadata?.wallet_address?.toLowerCase()

    if (!userAddress) {
      return NextResponse.json({ isFollowing: false })
    }

    const { data: follow, error } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_address", userAddress)
      .eq("following_address", artistAddress.toLowerCase())
      .maybeSingle()

    if (error) {
      console.error("[v0] Error checking follow status:", error.message)
      return NextResponse.json({ isFollowing: false })
    }

    return NextResponse.json({ isFollowing: !!follow })
  } catch (error) {
    console.error("[v0] Follow status error:", error)
    return NextResponse.json({ isFollowing: false })
  }
}
