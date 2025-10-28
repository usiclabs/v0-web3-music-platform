import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid stream ID format" }, { status: 400 })
    }

    const { data: stream, error } = await supabase
      .from("live_streams")
      .select(`
        *,
        artist:profiles!live_streams_artist_address_fkey(*)
      `)
      .eq("id", id)
      .single()

    if (error || !stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 })
    }

    console.log("[v0] Fetched stream for viewer:", {
      id: stream.id,
      title: stream.title,
      playback_id: stream.playback_id,
      is_live: stream.is_live,
      has_playback_id: !!stream.playback_id,
    })

    if (!stream.playback_id) {
      console.error("[v0] Stream missing playback_id:", stream.id)
      return NextResponse.json(
        {
          ...stream,
          error: "Stream configuration incomplete - missing playback ID. Please try creating a new stream.",
        },
        { status: 200 },
      )
    }

    return NextResponse.json(stream)
  } catch (error) {
    console.error("[v0] Error fetching stream:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid stream ID format" }, { status: 400 })
    }

    const updates = await request.json()

    console.log("[v0] Updating stream:", id, updates)

    const { data: stream, error } = await supabase.from("live_streams").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating stream:", error)
      return NextResponse.json({ error: "Failed to update stream" }, { status: 500 })
    }

    return NextResponse.json(stream)
  } catch (error) {
    console.error("[v0] Error in update route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid stream ID format" }, { status: 400 })
    }

    const { error } = await supabase.from("live_streams").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting stream:", error)
      return NextResponse.json({ error: "Failed to delete stream" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in delete route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
