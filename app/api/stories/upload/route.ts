import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ensureBucket } from "@/lib/supabase/storage"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Stories upload request received")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("[v0] No file in FormData")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] File received:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      console.error("[v0] File too large:", file.size)
      return NextResponse.json({ error: "File size must be less than 100MB" }, { status: 400 })
    }

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      console.error("[v0] Invalid file type:", file.type)
      return NextResponse.json({ error: "File must be an image or video" }, { status: 400 })
    }

    const bucket = "stories"
    const bucketReady = await ensureBucket(bucket as any)

    if (!bucketReady) {
      return NextResponse.json({ error: "Storage bucket not available" }, { status: 500 })
    }

    const supabase = createAdminClient()

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filePath = `${bucket}/${filename}`

    console.log("[v0] Uploading to Supabase Storage...")
    const arrayBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage (handles large files)
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("[v0] Upload error:", error)
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path)

    console.log("[v0] Upload successful:", publicUrl)

    return NextResponse.json({
      url: publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("[Stories Upload] Error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 })
  }
}
