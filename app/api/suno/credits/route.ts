import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const apiKey = process.env.SUNO_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Suno API key not configured" }, { status: 500 })
  }

  try {
    const response = await fetch("https://api.sunoapi.org/api/v1/generate/credit", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Suno API error:", errorText)
      return NextResponse.json({ error: "Failed to fetch credits" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ credits: data.data || data || 0 })
  } catch (error) {
    console.error("Credits fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 })
  }
}
