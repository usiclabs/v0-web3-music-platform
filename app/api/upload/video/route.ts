import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ensureBucket } from "@/lib/supabase/storage"

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB for video
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"]

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
          error: "Failed to parse upload data. File may be too large (max 500MB).",
        },
        { status: 413 },
      )
    }

    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload MP4, MOV, AVI, MKV, or WebM files." },
        { status: 400 },
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 500MB." }, { status: 413 })
    }

    const supabase = createAdminClient()

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const fileExt = file.name.split(".").pop()
    const fileName = `${timestamp}-${randomString}.${fileExt}`
    const filePath = `videos/${fileName}`

    const arrayBuffer = await file.arrayBuffer()

    const { data, error } = await supabase.storage.from("audio").upload(filePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("[v0] Video upload error:", error)
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
    console.error("[v0] Video upload error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    )
  }
}
