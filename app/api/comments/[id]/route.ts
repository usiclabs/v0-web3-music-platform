import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const commentId = params.id
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get("userAddress")

    if (!userAddress) {
      return NextResponse.json({ error: "User address required" }, { status: 400 })
    }

    // Verify ownership
    const { data: comment, error: fetchError } = await supabase
      .from("comments")
      .select("user_address")
      .eq("id", commentId)
      .single()

    if (fetchError || !comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    if (comment.user_address.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete comment
    const { error: deleteError } = await supabase.from("comments").delete().eq("id", commentId)

    if (deleteError) {
      console.error("[v0] Failed to delete comment:", deleteError)
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in comment DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
