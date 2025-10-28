import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

console.log("[v0] Create stream route module loaded")

export async function POST(request: NextRequest) {
  console.log("[v0] === CREATE STREAM API CALLED ===")

  try {
    // Parse request body
    console.log("[v0] Parsing request body...")
    const body = await request.json()
    const { address, title, description } = body

    console.log("[v0] Stream creation request:", { address, title, hasDescription: !!description })

    // Validate required fields
    if (!address || !title) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Address and title required" }, { status: 400 })
    }

    // Create Supabase client for eligibility check
    console.log("[v0] Creating Supabase client...")
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

    const trackCount = tracks?.length || 0
    console.log("[v0] Found tracks:", trackCount)

    if (trackCount < 3) {
      console.log("[v0] Not enough tracks")
      return NextResponse.json({ error: "You need at least 3 published tracks to go live" }, { status: 403 })
    }

    console.log("[v0] Creating Livepeer stream...")
    const LIVEPEER_API_KEY = process.env.LIVEPEER_API_KEY

    if (!LIVEPEER_API_KEY) {
      console.error("[v0] LIVEPEER_API_KEY not configured")
      return NextResponse.json({ error: "Streaming service not configured" }, { status: 500 })
    }

    let livepeerStream
    try {
      const livepeerResponse = await fetch("https://livepeer.studio/api/stream", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LIVEPEER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: title,
          profiles: [
            { name: "720p", bitrate: 2000000, fps: 30, width: 1280, height: 720 },
            { name: "480p", bitrate: 1000000, fps: 30, width: 854, height: 480 },
            { name: "360p", bitrate: 500000, fps: 30, width: 640, height: 360 },
          ],
        }),
      })

      if (!livepeerResponse.ok) {
        const errorData = await livepeerResponse.json()
        console.error("[v0] Livepeer API error:", errorData)
        throw new Error(errorData.message || "Failed to create stream")
      }

      livepeerStream = await livepeerResponse.json()
      console.log("[v0] Livepeer stream created successfully")
    } catch (livepeerError: any) {
      console.error("[v0] Livepeer error:", livepeerError.message)
      return NextResponse.json({ error: `Failed to create stream: ${livepeerError.message}` }, { status: 500 })
    }

    // Extract stream credentials
    const streamKey = livepeerStream.streamKey || livepeerStream.stream_key
    let playbackId = livepeerStream.playbackId || livepeerStream.playback_id || livepeerStream.id

    if (playbackId && typeof playbackId === "object") {
      playbackId = playbackId.id || playbackId.playbackId
    }

    console.log("[v0] Stream credentials extracted:", { hasStreamKey: !!streamKey, hasPlaybackId: !!playbackId })

    if (!streamKey || !playbackId) {
      console.error("[v0] Missing stream credentials")
      return NextResponse.json({ error: "Invalid response from streaming service" }, { status: 500 })
    }

    // Save to database with admin client
    console.log("[v0] Saving stream to database...")
    const adminClient = createAdminClient()

    const { data: liveStream, error: dbError } = await adminClient
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

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      return NextResponse.json({ error: "Failed to save stream" }, { status: 500 })
    }

    console.log("[v0] Stream created successfully:", liveStream.id)

    // Return success response
    return NextResponse.json({
      id: liveStream.id,
      streamKey: liveStream.stream_key,
      playbackId: liveStream.playback_id,
      title: liveStream.title,
      description: liveStream.description,
    })
  } catch (error: any) {
    console.error("[v0] Unexpected error in create stream:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
