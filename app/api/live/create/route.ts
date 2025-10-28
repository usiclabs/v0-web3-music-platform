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
      console.log("[v0] Livepeer stream created:", JSON.stringify(livepeerStream, null, 2))
    } catch (livepeerError: any) {
      console.error("[v0] Livepeer API error:", livepeerError)
      return NextResponse.json(
        { error: `Failed to create stream on Livepeer: ${livepeerError.message}` },
        { status: 500 },
      )
    }

    const streamKey = livepeerStream.streamKey || livepeerStream.stream_key
    const playbackId = livepeerStream.playbackId || livepeerStream.playback_id || livepeerStream.id

    if (!streamKey || !playbackId) {
      console.error("[v0] Invalid Livepeer response structure:", livepeerStream)
      return NextResponse.json({ error: "Invalid response from streaming service" }, { status: 500 })
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

    console.log("[v0] Live stream created successfully:", liveStream.id)

    return NextResponse.json(liveStream)
  } catch (error: any) {
    console.error("[v0] Error creating live stream:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
