import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { bucket, filePath, contentType } = body

    console.log("[v0] Generating signed upload URL:", { bucket, filePath, contentType })

    if (!bucket || !filePath) {
      console.error("[v0] Missing required fields:", { bucket, filePath })
      return NextResponse.json({ error: "Missing required fields: bucket and filePath" }, { status: 400 })
    }

    // Use admin client to generate signed upload URL (bypasses RLS)
    const supabase = createAdminClient()

    console.log("[v0] Admin client created, attempting to generate signed URL...")

    // Generate a signed upload URL that's valid for 10 minutes
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(filePath)

    if (error) {
      console.error("[v0] Signed URL generation error:", error)
      return NextResponse.json({ error: `Failed to generate signed URL: ${error.message}` }, { status: 500 })
    }

    if (!data) {
      console.error("[v0] No data returned from createSignedUploadUrl")
      return NextResponse.json({ error: "No data returned from storage API" }, { status: 500 })
    }

    console.log("[v0] Signed upload URL generated successfully:", data.path)

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: data.path,
      token: data.token,
    })
  } catch (error) {
    console.error("[v0] Signed URL error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate signed upload URL" },
      { status: 500 },
    )
  }
}
