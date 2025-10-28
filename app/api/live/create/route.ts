import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createLivepeerStream } from "@/lib/livepeer/client"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { address, title, description } = await request.json()

    if (!address || !title) {
      return NextResponse.json({ error: "Address and title required" }, { status: 400 })
    }

    console.log("[v0] Creating live stream for:", address)

    const { data: tracks } = await supabase
      .from("tracks")
      .select("id")
      .ilike("artist_id", address)
      .eq("is_active", true)

    if (!tracks || tracks.length < 3) {
      return NextResponse.json({ error: "You need at least 3 published tracks to go live" }, { status: 403 })
    }

    let livepeerStream
    try {
      livepeerStream = await createLivepeerStream(title)
      console.log("[v0] Livepeer stream created - Full response:", JSON.stringify(livepeerStream, null, 2))
    } catch (livepeerError: any) {
      console.error("[v0] Livepeer API error:", livepeerError)
      return NextResponse.json(
        { error: `Failed to create stream on Livepeer: ${livepeerError.message}` },
        { status: 500 },
      )
    }

    const streamKey = livepeerStream.streamKey || livepeerStream.stream_key

    // Try multiple possible locations for playbackId
    let playbackId = livepeerStream.playbackId || livepeerStream.playback_id || livepeerStream.id

    // If playbackId is an object (some API versions return it as an object), extract the ID
    if (playbackId && typeof playbackId === "object") {
      playbackId = playbackId.id || playbackId.playbackId
    }

    console.log("[v0] Extracted values - streamKey:", streamKey, "playbackId:", playbackId)

    if (!streamKey) {
      console.error("[v0] Missing streamKey in Livepeer response:", livepeerStream)
      return NextResponse.json(
        { error: "Invalid response from streaming service: missing stream key" },
        { status: 500 },
      )
    }

    if (!playbackId) {
      console.error("[v0] Missing playbackId in Livepeer response:", livepeerStream)
      return NextResponse.json(
        { error: "Invalid response from streaming service: missing playback ID" },
        { status: 500 },
      )
    }

    // Save to database
    const { data: liveStream, error } = await supabase
      .from("live_streams")
      .insert({
        artist_address: address.toLowerCase(),
        stream_key: streamKey,
        playback_id: playbackId,
        title,
        description,
        is_live: false,
        viewer_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving live stream:", error)
      return NextResponse.json({ error: "Failed to create live stream" }, { status: 500 })
    }

    console.log("[v0] Live stream created successfully:", {
      id: liveStream.id,
      playback_id: liveStream.playback_id,
      stream_key: liveStream.stream_key ? "present" : "missing",
    })

    return NextResponse.json(liveStream)
  } catch (error: any) {
    console.error("[v0] Error creating live stream:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
