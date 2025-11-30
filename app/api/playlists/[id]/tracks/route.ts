import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: playlistId } = await params

  try {
    const body = await request.json()
    const { trackId } = body

    if (!trackId) {
      return NextResponse.json({ error: "Track ID required" }, { status: 400 })
    }

    console.log("[v0] Adding track to playlist:", { playlistId, trackId })

    const supabase = createAdminClient()

    // Get current max position
    const { data: existingTracks } = await supabase
      .from("playlist_tracks")
      .select("position")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: false })
      .limit(1)

    const nextPosition = existingTracks && existingTracks.length > 0 ? existingTracks[0].position + 1 : 0

    const { data: playlistTrack, error } = await supabase
      .from("playlist_tracks")
      .insert({
        playlist_id: playlistId,
        track_id: trackId,
        position: nextPosition,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Track already in playlist" }, { status: 409 })
      }
      console.error("[v0] Error adding track to playlist:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Added track to playlist")

    return NextResponse.json(playlistTrack)
  } catch (error) {
    console.error("[v0] Failed to add track to playlist:", error)
    return NextResponse.json({ error: "Failed to add track to playlist" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: playlistId } = await params
  const searchParams = request.nextUrl.searchParams
  const trackId = searchParams.get("trackId")

  if (!trackId) {
    return NextResponse.json({ error: "Track ID required" }, { status: 400 })
  }

  console.log("[v0] Removing track from playlist:", { playlistId, trackId })

  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("track_id", trackId)

    if (error) {
      console.error("[v0] Error removing track from playlist:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Removed track from playlist")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to remove track from playlist:", error)
    return NextResponse.json({ error: "Failed to remove track from playlist" }, { status: 500 })
  }
}
