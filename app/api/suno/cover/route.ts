import { type NextRequest, NextResponse } from "next/server"

const SUNO_API_KEY = process.env.SUNO_API_KEY
const SUNO_API_BASE = "https://api.sunoapi.org/api/v1"

export async function POST(request: NextRequest) {
  try {
    if (!SUNO_API_KEY) {
      return NextResponse.json({ error: "Suno API key not configured" }, { status: 500 })
    }

    const body = await request.json()
    const {
      audioId,
      prompt,
      style,
      title,
      instrumental = false,
      model = "V4",
      negativeTags,
      vocalGender,
      styleWeight = 0.65,
      weirdnessConstraint = 0.65,
      audioWeight = 0.65,
    } = body

    if (!audioId) {
      return NextResponse.json({ error: "Audio ID is required" }, { status: 400 })
    }

    const origin = request.headers.get("origin") || request.headers.get("host") || "http://localhost:3000"
    const protocol = origin.includes("localhost") ? "http://" : "https://"
    const baseUrl = origin.startsWith("http") ? origin : `${protocol}${origin}`
    const callBackUrl = `${baseUrl}/api/suno/callback`

    const response = await fetch(`${SUNO_API_BASE}/generate/cover`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audioId,
        prompt: !instrumental ? prompt : undefined,
        style,
        title,
        instrumental,
        model,
        negativeTags: negativeTags || undefined,
        vocalGender: vocalGender === "any" ? undefined : vocalGender,
        styleWeight,
        weirdnessConstraint,
        audioWeight,
        callBackUrl,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Suno cover API error:", errorText)
      return NextResponse.json({ error: "Failed to create cover" }, { status: response.status })
    }

    const data = await response.json()

    if (data.code !== 200) {
      return NextResponse.json({ error: data.msg || "Cover generation failed" }, { status: 400 })
    }

    return NextResponse.json({ taskId: data.data.taskId })
  } catch (error) {
    console.error("Cover music error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
