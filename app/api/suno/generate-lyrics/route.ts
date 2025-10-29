import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const apiKey = process.env.SUNO_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Suno API key not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { prompt, style } = body

    const baseUrl = request.headers.get("origin") || "http://localhost:3000"
    const callBackUrl = `${baseUrl}/api/suno/callback`

    const response = await fetch("https://api.sunoapi.org/api/v1/generate/lyrics", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        style: style || undefined,
        callBackUrl,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Suno API error:", errorText)
      return NextResponse.json({ error: errorText || "Failed to generate lyrics" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ taskId: data.data.taskId })
  } catch (error) {
    console.error("Lyrics generation error:", error)
    return NextResponse.json({ error: "Failed to generate lyrics" }, { status: 500 })
  }
}
