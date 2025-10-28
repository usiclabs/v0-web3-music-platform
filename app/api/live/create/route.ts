import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createLivepeerStream } from "@/lib/livepeer/client"

export async function POST(request: NextRequest) {
  console.log("[v0] Create stream API called")

  try {
    const body = await request.json()
    const { address, title, description } = body

    console.log("[v0] Stream creation request:", { address, title, description })

    if (!address || !title) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Address and title required" }, { status: 400 })
    }

    const supabase = await createClient()
    console.log("[v0] Supabase client created")

    // Check eligibility
    console.log("[v0] Checking eligibility for:", address)
    const { data: tracks, error: tracksError } = await supabase
      .from("tracks")
      .select("id")
      .ilike("artist_id", address)
      .eq("is_active", true)

    if (tracksError) {
      console.error("[v0] Error fetching tracks:", tracksError)
      return NextResponse.json({ error: "Failed to verify eligibility" }, { status: 500 })
    }

    console.log("[v0] Found tracks:", tracks?.length || 0)

    if (!tracks || tracks.length < 3) {
      console.log("[v0] Not enough tracks")
      return NextResponse.json({ error: "You need at least 3 published tracks to go live" }, { status: 403 })
    }

    // Create Livepeer stream
    console.log("[v0] Creating Livepeer stream...")
    let livepeerStream
    try {
      livepeerStream = await createLivepeerStream(title)
      console.log("[v0] Livepeer stream created:", livepeerStream)
    } catch (livepeerError: any) {
      console.error("[v0] Livepeer API error:", livepeerError)
      return NextResponse.json({ error: `Failed to create stream: ${livepeerError.message}` }, { status: 500 })
    }

    // Extract stream key and playback ID
    const streamKey = livepeerStream.streamKey || livepeerStream.stream_key
    let playbackId = livepeerStream.playbackId || livepeerStream.playback_id || livepeerStream.id

    if (playbackId && typeof playbackId === "object") {
      playbackId = playbackId.id || playbackId.playbackId
    }

    console.log("[v0] Stream credentials:", { streamKey: !!streamKey, playbackId: !!playbackId })

    if (!streamKey || !playbackId) {
      console.error("[v0] Missing stream data:", { streamKey, playbackId, fullResponse: livepeerStream })
      return NextResponse.json({ error: "Invalid response from streaming service" }, { status: 500 })
    }

    console.log("[v0] Saving stream to database with admin client...")
    const adminClient = createAdminClient()
    const { data: liveStream, error } = await adminClient
      .from("live_streams")
      .insert({
        artist_address: address.toLowerCase(),
        stream_key: streamKey,
        playback_id: playbackId,
        title,
        description: description || "",
        is_live: false,
        viewer_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving stream:", error)
      return NextResponse.json({ error: "Failed to create live stream" }, { status: 500 })
    }

    console.log("[v0] Stream created successfully:", liveStream.id)

    return NextResponse.json({
      id: liveStream.id,
      streamKey: liveStream.stream_key,
      playbackId: liveStream.playback_id,
      title: liveStream.title,
      description: liveStream.description,
    })
  } catch (error: any) {
    console.error("[v0] Error creating stream:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
