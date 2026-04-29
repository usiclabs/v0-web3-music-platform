import { type NextRequest, NextResponse } from "next/server"

const SUNO_API_KEY = process.env.SUNO_API_KEY
const SUNO_API_BASE = "https://api.sunoapi.org/api/v1"

export async function POST(request: NextRequest) {
  try {
    if (!SUNO_API_KEY) {
      return NextResponse.json({ error: "Suno API key not configured" }, { status: 500 })
    }

    const body = await request.json()
    const { prompt, title, style, instrumental, model = "V5" } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const origin = request.headers.get("origin") || request.headers.get("host") || "http://localhost:3000"
    const protocol = origin.includes("localhost") ? "http://" : "https://"
    const baseUrl = origin.startsWith("http") ? origin : `${protocol}${origin}`
    const callBackUrl = `${baseUrl}/api/suno/callback`

    console.log("[v0] Suno generate request with model:", model, "callback URL:", callBackUrl)

    const response = await fetch(`${SUNO_API_BASE}/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        title,
        style,
        customMode: true,
        instrumental: instrumental || false,
        model,
        callBackUrl,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Suno API error:", errorText)
      return NextResponse.json({ error: "Failed to generate music" }, { status: response.status })
    }

    const data = await response.json()

    if (data.code !== 200) {
      return NextResponse.json({ error: data.msg || "Generation failed" }, { status: 400 })
    }

    return NextResponse.json({ taskId: data.data.taskId })
  } catch (error) {
    console.error("Generate music error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
