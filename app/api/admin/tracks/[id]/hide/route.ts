import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || "").toLowerCase().split(",")

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: trackId } = await params

    // Get wallet address from headers
    const walletAddress = request.headers.get("x-wallet-address")

    if (!walletAddress || !ADMIN_ADDRESSES.includes(walletAddress.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { isHidden } = body

    if (typeof isHidden !== "boolean") {
      return NextResponse.json({ error: "Invalid isHidden value" }, { status: 400 })
    }

    const supabase = await createClient()

    console.log("[Admin] Updating track visibility:", trackId, { isHidden })

    const { error } = await supabase
      .from("tracks")
      .update({
        is_hidden: isHidden,
        is_active: !isHidden, // When hiding, set is_active to false; when restoring, set to true
      })
      .eq("id", trackId)

    if (error) {
      console.error("[Admin] Failed to update track visibility:", error)
      return NextResponse.json({ error: "Failed to update track" }, { status: 500 })
    }

    console.log("[Admin] Track visibility updated successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Admin] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
