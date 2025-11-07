import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const metadata = await request.json()

    // Validate metadata
    if (!metadata.name || !metadata.description || !metadata.owner) {
      return NextResponse.json({ error: "Missing required metadata fields" }, { status: 400 })
    }

    // Generate a unique filename
    const filename = `agents/${metadata.owner}-${Date.now()}.json`

    // Upload to Vercel Blob
    const blob = await put(filename, JSON.stringify(metadata, null, 2), {
      access: "public",
      contentType: "application/json",
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[v0] Failed to upload agent metadata:", error)
    return NextResponse.json({ error: "Failed to upload metadata" }, { status: 500 })
  }
}
