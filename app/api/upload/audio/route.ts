import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ensureBucket } from "@/lib/supabase/storage"

export async function POST(request: NextRequest) {
  try {
    const bucketReady = await ensureBucket("audio")
    if (!bucketReady) {
      return NextResponse.json({ error: "Storage bucket not available. Please contact support." }, { status: 500 })
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      console.error("[v0] Failed to parse form data:", error)
      return NextResponse.json(
        {
          error: "Failed to parse upload data. File may be too large (max 50MB).",
        },
        { status: 413 },
      )
    }

    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      return NextResponse.json({ error: "File must be an audio file" }, { status: 400 })
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size must be less than 50MB" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filePath = `audio/${filename}`

    const arrayBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { data, error } = await supabase.storage.from("audio").upload(filePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("[v0] Audio upload error:", error)
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("audio").getPublicUrl(data.path)

    return NextResponse.json({
      url: publicUrl,
      path: data.path,
    })
  } catch (error) {
    console.error("[v0] Audio upload error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    )
  }
}
