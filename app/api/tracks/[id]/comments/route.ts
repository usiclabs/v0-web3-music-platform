import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id: trackId } = await params

    const { data: comments, error } = await supabase
      .from("comments")
      .select("id, content, created_at, updated_at, user_address, parent_id")
      .eq("track_id", trackId)
      .is("parent_id", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Failed to fetch comments:", error)
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
    }

    const userAddresses = [...new Set((comments || []).map((c) => c.user_address))]

    const { data: profiles } = await supabase
      .from("profiles")
      .select("wallet_address, artist_name, avatar_url")
      .in("wallet_address", userAddresses)

    const profileMap = new Map(profiles?.map((p) => [p.wallet_address, p]) || [])

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from("comments")
          .select("id, content, created_at, updated_at, user_address, parent_id")
          .eq("parent_id", comment.id)
          .order("created_at", { ascending: true })

        const replyUserAddresses = [...new Set((replies || []).map((r) => r.user_address))]

        const newAddresses = replyUserAddresses.filter((addr) => !profileMap.has(addr))
        if (newAddresses.length > 0) {
          const { data: replyProfiles } = await supabase
            .from("profiles")
            .select("wallet_address, artist_name, avatar_url")
            .in("wallet_address", newAddresses)

          replyProfiles?.forEach((p) => profileMap.set(p.wallet_address, p))
        }

        const repliesWithProfiles = (replies || []).map((reply) => ({
          ...reply,
          profiles: profileMap.get(reply.user_address) || null,
        }))

        return {
          ...comment,
          profiles: profileMap.get(comment.user_address) || null,
          replies: repliesWithProfiles,
        }
      }),
    )

    return NextResponse.json({ comments: commentsWithReplies })
  } catch (error) {
    console.error("[v0] Error in comments GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id: trackId } = await params
    const body = await request.json()
    const { content, userAddress, parentId } = body

    if (!content || !userAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: "Comment too long (max 1000 characters)" }, { status: 400 })
    }

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        track_id: trackId,
        user_address: userAddress.toLowerCase(),
        content: content.trim(),
        parent_id: parentId || null,
      })
      .select("id, content, created_at, updated_at, user_address, parent_id")
      .single()

    if (error) {
      console.error("[v0] Failed to create comment:", error)
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address, artist_name, avatar_url")
      .eq("wallet_address", userAddress.toLowerCase())
      .single()

    const commentWithProfile = {
      ...comment,
      profiles: profile || null,
    }

    return NextResponse.json({ comment: commentWithProfile })
  } catch (error) {
    console.error("[v0] Error in comments POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
