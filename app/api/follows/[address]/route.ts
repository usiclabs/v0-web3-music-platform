import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/follows/[address] - Follow an artist
export async function POST(request: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await params
    const { followerAddress } = await request.json()

    if (!followerAddress) {
      return NextResponse.json({ error: "Follower address is required" }, { status: 400 })
    }

    // Prevent self-follows
    if (followerAddress.toLowerCase() === address.toLowerCase()) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if already following
    const { data: existing } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_address", followerAddress.toLowerCase())
      .eq("following_address", address.toLowerCase())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Already following this artist" }, { status: 400 })
    }

    // Create follow relationship
    const { error } = await supabase.from("follows").insert({
      follower_address: followerAddress.toLowerCase(),
      following_address: address.toLowerCase(),
    })

    if (error) {
      console.error("Follow error:", error)
      return NextResponse.json({ error: "Failed to follow artist" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Follow error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/follows/[address] - Unfollow an artist
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await params
    const { searchParams } = new URL(request.url)
    const followerAddress = searchParams.get("followerAddress")

    if (!followerAddress) {
      return NextResponse.json({ error: "Follower address is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_address", followerAddress.toLowerCase())
      .eq("following_address", address.toLowerCase())

    if (error) {
      console.error("Unfollow error:", error)
      return NextResponse.json({ error: "Failed to unfollow artist" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unfollow error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
