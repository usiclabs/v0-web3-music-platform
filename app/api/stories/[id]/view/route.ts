import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { viewerAddress } = await request.json()

    if (!viewerAddress) {
      return NextResponse.json({ error: "Viewer address required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Insert view (unique constraint prevents duplicates)
    const { error: viewError } = await supabase.from("story_views").insert({
      story_id: params.id,
      viewer_address: viewerAddress,
    })

    // Ignore duplicate key errors
    if (viewError && !viewError.message.includes("duplicate")) {
      console.error("[Story View API] Error recording view:", viewError)
    }

    // Increment view count
    const { error: updateError } = await supabase
      .from("stories")
      .update({ view_count: supabase.raw("view_count + 1") as any })
      .eq("id", params.id)

    if (updateError) {
      console.error("[Story View API] Error updating view count:", updateError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Story View API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
