import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  console.log("[v0] Fetching playlist:", id)

  try {
    const supabase = await createServerClient()

    const { data: playlist, error } = await supabase
      .from("playlists")
      .select(`
        *,
        playlist_tracks(
          *,
          tracks(
            *,
            artist:profiles!tracks_artist_id_fkey(*)
          )
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("[v0] Error fetching playlist:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Found playlist with", playlist.playlist_tracks?.length || 0, "tracks")

    return NextResponse.json(playlist)
  } catch (error) {
    console.error("[v0] Failed to fetch playlist:", error)
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    const body = await request.json()
    const { name, description, isPublic } = body

    console.log("[v0] Updating playlist:", id)

    const supabase = await createServerClient()

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (isPublic !== undefined) updates.is_public = isPublic
    updates.updated_at = new Date().toISOString()

    const { data: playlist, error } = await supabase.from("playlists").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating playlist:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Updated playlist:", id)

    return NextResponse.json(playlist)
  } catch (error) {
    console.error("[v0] Failed to update playlist:", error)
    return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  console.log("[v0] Deleting playlist:", id)

  try {
    const supabase = await createServerClient()

    const { error } = await supabase.from("playlists").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting playlist:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Deleted playlist:", id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete playlist:", error)
    return NextResponse.json({ error: "Failed to delete playlist" }, { status: 500 })
  }
}
