import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Suno video callback received:", JSON.stringify(body, null, 2))

    // Store callback data if needed for real-time updates
    // For now, just acknowledge receipt

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Video callback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
