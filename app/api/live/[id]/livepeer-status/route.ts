import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const LIVEPEER_API_KEY = process.env.LIVEPEER_API_KEY || ""
const LIVEPEER_API_URL = "https://livepeer.studio/api"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Get stream from database
    const supabase = await createClient()
    const { data: stream, error } = await supabase.from("live_streams").select("playback_id").eq("id", id).single()

    if (error || !stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 })
    }

    if (!LIVEPEER_API_KEY) {
      console.error("[v0] LIVEPEER_API_KEY not configured")
      return NextResponse.json({ error: "Streaming service not configured" }, { status: 500 })
    }

    // Check Livepeer stream status
    const livepeerResponse = await fetch(`${LIVEPEER_API_URL}/stream/${stream.playback_id}`, {
      headers: {
        Authorization: `Bearer ${LIVEPEER_API_KEY}`,
      },
    })

    if (!livepeerResponse.ok) {
      console.error("[v0] Livepeer API error:", await livepeerResponse.text())
      return NextResponse.json({ error: "Failed to check stream status" }, { status: 500 })
    }

    const livepeerStream = await livepeerResponse.json()

    console.log("[v0] Livepeer stream status:", {
      id: stream.playback_id,
      isActive: livepeerStream.isActive,
      isHealthy: livepeerStream.isHealthy,
    })

    return NextResponse.json({
      isActive: livepeerStream.isActive || false,
      isHealthy: livepeerStream.isHealthy,
      lastSeen: livepeerStream.lastSeen,
      issues: livepeerStream.issues || [],
    })
  } catch (error: any) {
    console.error("[v0] Error checking Livepeer status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
