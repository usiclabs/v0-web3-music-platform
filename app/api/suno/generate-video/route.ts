import { type NextRequest, NextResponse } from "next/server"

const SUNO_API_KEY = process.env.SUNO_API_KEY
const SUNO_API_BASE = "https://api.sunoapi.org/api/v1"

export async function POST(request: NextRequest) {
  try {
    if (!SUNO_API_KEY) {
      return NextResponse.json({ error: "Suno API key not configured" }, { status: 500 })
    }

    const body = await request.json()
    const { taskId, audioId, author } = body

    if (!taskId || !audioId) {
      return NextResponse.json({ error: "Task ID and Audio ID are required" }, { status: 400 })
    }

    const origin = request.headers.get("origin") || "http://localhost:3000"
    const callBackUrl = `${origin}/api/suno/video-callback`

    const response = await fetch(`${SUNO_API_BASE}/mp4/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId,
        audioId,
        callBackUrl,
        author: author || "Artist",
        domainName: new URL(origin).hostname,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Suno API error:", errorText)
      return NextResponse.json({ error: "Failed to generate video" }, { status: response.status })
    }

    const data = await response.json()

    if (data.code !== 200) {
      return NextResponse.json({ error: data.msg || "Video generation failed" }, { status: 400 })
    }

    return NextResponse.json({ taskId: data.data.taskId })
  } catch (error) {
    console.error("Generate video error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
