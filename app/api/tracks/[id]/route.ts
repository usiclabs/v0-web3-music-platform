import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: track, error } = await supabase
      .from("tracks")
      .select(
        `
        *,
        royalty_splits (*)
      `,
      )
      .eq("id", id)
      .single()

    if (error) throw error

    return NextResponse.json(track)
  } catch (error) {
    console.error("[v0] Failed to fetch track:", error)
    return NextResponse.json({ error: "Failed to fetch track" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = params
    const body = await request.json()

    // Verify ownership
    const { data: track } = await supabase.from("tracks").select("artist_id").eq("id", id).single()

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    // Extract track updates and royalty splits
    const { royalty_splits, ...trackUpdates } = body

    // Update track
    const { error: trackError } = await supabase.from("tracks").update(trackUpdates).eq("id", id)

    if (trackError) throw trackError

    // Update royalty splits if provided
    if (royalty_splits && Array.isArray(royalty_splits)) {
      // Delete existing splits
      await supabase.from("royalty_splits").delete().eq("track_id", id)

      // Insert new splits
      const { error: splitsError } = await supabase.from("royalty_splits").insert(
        royalty_splits.map((split: any) => ({
          track_id: id,
          recipient_address: split.address || split.recipient_address,
          share_percentage: split.percentage || split.share_percentage,
        })),
      )

      if (splitsError) throw splitsError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to update track:", error)
    return NextResponse.json({ error: "Failed to update track" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Verify ownership
    const { data: track } = await supabase.from("tracks").select("artist_id").eq("id", id).single()

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    // Delete royalty splits first (foreign key constraint)
    await supabase.from("royalty_splits").delete().eq("track_id", id)

    // Delete the track
    const { error: deleteError } = await supabase.from("tracks").delete().eq("id", id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete track:", error)
    return NextResponse.json({ error: "Failed to delete track" }, { status: 500 })
  }
}
