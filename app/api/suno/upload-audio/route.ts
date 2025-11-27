import { type NextRequest, NextResponse } from "next/server"

const SUNO_API_KEY = process.env.SUNO_API_KEY
const SUNO_API_BASE = "https://api.sunoapi.org/api/v1"

export async function POST(request: NextRequest) {
  try {
    if (!SUNO_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const contentLength = request.headers.get("content-length")
    if (contentLength && Number.parseInt(contentLength) > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 413 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 413 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")

    // Get file extension
    const extension = file.name.split(".").pop()?.toLowerCase() || "mp3"

    const response = await fetch(`${SUNO_API_BASE}/upload/base64`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileBase64: base64,
        fileExtension: extension,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Upload API error:", errorText)
      return NextResponse.json({ error: "Failed to upload audio" }, { status: response.status })
    }

    const data = await response.json()

    if (data.code !== 200) {
      return NextResponse.json({ error: data.msg || "Upload failed" }, { status: 400 })
    }

    return NextResponse.json({ uploadUrl: data.data.fileUrl })
  } catch (error) {
    console.error("Upload audio error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
