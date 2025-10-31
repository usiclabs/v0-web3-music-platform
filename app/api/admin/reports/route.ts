import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || "").toLowerCase().split(",")

export async function GET(request: NextRequest) {
  try {
    // Get wallet address from headers
    const walletAddress = request.headers.get("x-wallet-address")

    if (!walletAddress || !ADMIN_ADDRESSES.includes(walletAddress.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all reports with track and reporter info
    const { data: reports, error } = await supabase
      .from("reports")
      .select(
        `
        *,
        tracks (
          id,
          title,
          artist_id,
          cover_url,
          is_hidden,
          profiles!tracks_artist_id_fkey (
            artist_name
          )
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Admin] Failed to fetch reports:", error)
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
    }

    return NextResponse.json({ reports })
  } catch (error) {
    console.error("[Admin] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get wallet address from headers
    const walletAddress = request.headers.get("x-wallet-address")

    if (!walletAddress || !ADMIN_ADDRESSES.includes(walletAddress.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reportId, status } = body

    if (!reportId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Update report status
    const { error } = await supabase
      .from("reports")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: walletAddress.toLowerCase(),
      })
      .eq("id", reportId)

    if (error) {
      console.error("[Admin] Failed to update report:", error)
      return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
    }

    console.log("[Admin] Report updated:", reportId, status)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Admin] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
