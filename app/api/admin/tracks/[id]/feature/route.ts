import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ADMIN_ADDRESSES = process.env.NEXT_PUBLIC_ADMIN_ADDRESSES?.toLowerCase().split(",") || []

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const walletAddress = request.headers.get("x-wallet-address")?.toLowerCase()

    console.log("[v0] Feature track request:", { id, walletAddress })

    // Verify admin
    if (!walletAddress || !ADMIN_ADDRESSES.includes(walletAddress)) {
      console.log("[v0] Unauthorized: Not an admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { featured } = await request.json()
    console.log("[v0] Setting featured status:", featured)

    const supabase = await createServerClient()

    // If featuring this track, unfeature others if we already have 5 featured tracks
    if (featured) {
      const { data: featuredTracks } = await supabase.from("tracks").select("id").eq("is_featured", true).limit(5)

      if (featuredTracks && featuredTracks.length >= 5) {
        // Unfeature the oldest featured track
        const { error: unfeaturedError } = await supabase
          .from("tracks")
          .update({ is_featured: false })
          .eq("id", featuredTracks[0].id)

        if (unfeaturedError) {
          console.error("[v0] Error unfeaturing old track:", unfeaturedError)
        }
      }
    }

    // Update the track's featured status
    const { error } = await supabase.from("tracks").update({ is_featured: featured }).eq("id", id)

    if (error) {
      console.error("[v0] Error updating featured status:", error)
      return NextResponse.json({ error: "Failed to update featured status" }, { status: 500 })
    }

    console.log("[v0] Successfully updated featured status")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Feature track error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
