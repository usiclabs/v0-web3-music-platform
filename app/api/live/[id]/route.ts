import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid stream ID format" }, { status: 400 })
    }

    const { data: stream, error } = await supabase.from("live_streams").select("*").eq("id", id).single()

    if (error || !stream) {
      console.error("[v0] Stream not found:", id)
      return NextResponse.json({ error: "Stream not found" }, { status: 404 })
    }

    // Fetch artist profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address, artist_name, avatar_url")
      .eq("wallet_address", stream.artist_address)
      .single()

    const streamWithArtist = {
      ...stream,
      artist: profile || {
        wallet_address: stream.artist_address,
        artist_name: null,
        avatar_url: null,
      },
    }

    console.log("[v0] Fetched stream:", stream.id)
    return NextResponse.json(streamWithArtist)
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

    const supabase = createAdminClient()

    const { data: stream, error } = await supabase.from("live_streams").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating stream:", error.message)
      return NextResponse.json({ error: error.message || "Failed to update stream" }, { status: 500 })
    }

    if (!stream) {
      console.error("[v0] Stream not found after update:", id)
      return NextResponse.json({ error: "Stream not found" }, { status: 404 })
    }

    console.log("[v0] Stream updated successfully:", stream.id)
    return NextResponse.json(stream)
  } catch (error) {
    console.error("[v0] Error in update route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
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
