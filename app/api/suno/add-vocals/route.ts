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
      uploadUrl,
      prompt,
      style,
      title,
      negativeTags,
      vocalGender,
      styleWeight = 0.65,
      weirdnessConstraint = 0.65,
      audioWeight = 0.65,
      model = "V4_5PLUS",
    } = body

    if (!uploadUrl) {
      return NextResponse.json({ error: "Upload URL is required" }, { status: 400 })
    }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required for vocals" }, { status: 400 })
    }

    const origin = request.headers.get("origin") || request.headers.get("host") || "http://localhost:3000"
    const protocol = origin.includes("localhost") ? "http://" : "https://"
    const baseUrl = origin.startsWith("http") ? origin : `${protocol}${origin}`
    const callBackUrl = `${baseUrl}/api/suno/callback`

    const response = await fetch(`${SUNO_API_BASE}/generate/add-vocals`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uploadUrl,
        prompt,
        style: style || "Pop",
        title: title || "Untitled Vocals",
        negativeTags: negativeTags || "",
        vocalGender: vocalGender === "any" ? undefined : vocalGender,
        styleWeight,
        weirdnessConstraint,
        audioWeight,
        model,
        callBackUrl,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Suno add-vocals API error:", errorText)
      return NextResponse.json({ error: "Failed to add vocals" }, { status: response.status })
    }

    const data = await response.json()

    if (data.code !== 200) {
      return NextResponse.json({ error: data.msg || "Vocal generation failed" }, { status: 400 })
    }

    return NextResponse.json({ taskId: data.data.taskId })
  } catch (error) {
    console.error("Add vocals error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
