import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Suno callback received:", JSON.stringify(body, null, 2))

    // The callback contains:
    // - callbackType: "text" | "first" | "complete"
    // - task_id: string
    // - data: array of generated tracks with audio_url, image_url, etc.

    // For now, we just log the callback
    // In a production app, you might want to:
    // 1. Store the results in a database
    // 2. Send a notification to the user
    // 3. Update the UI via websockets/SSE

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Callback error:", error)
    return NextResponse.json({ error: "Callback processing failed" }, { status: 500 })
  }
}
