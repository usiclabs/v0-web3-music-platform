import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ensureBucket } from "@/lib/supabase/storage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const file = formData.get("file") as File
    const type = formData.get("type") as string // 'cover' or 'avatar'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB for images)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Image size must be less than 5MB" }, { status: 400 })
    }

    // Determine bucket based on type
    const bucket = type === "avatar" ? "avatars" : "covers"

    const bucketReady = await ensureBucket(bucket as "avatars" | "covers")

    if (!bucketReady) {
      return NextResponse.json({ error: "Storage bucket not available. Please contact support." }, { status: 500 })
    }

    const supabase = createAdminClient()

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filePath = `${bucket}/${filename}`

    const arrayBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error(`[v0] ${type} upload error:`, error)
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return NextResponse.json({
      url: publicUrl,
      path: data.path,
    })
  } catch (error) {
    console.error("[v0] Image upload error:", error)
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
