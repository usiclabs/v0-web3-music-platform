import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  console.log("[Reports API] Received report submission request")

  try {
    const body = await request.json()
    const { trackId, reporterAddress, reason, details } = body

    console.log("[Reports API] Request body:", { trackId, reporterAddress, reason, hasDetails: !!details })

    if (!trackId || !reporterAddress || !reason) {
      console.log("[Reports API] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if user already reported this track
    console.log("[Reports API] Checking for existing report...")
    const { data: existingReport, error: checkError } = await supabase
      .from("reports")
      .select("id")
      .eq("track_id", trackId)
      .eq("reporter_address", reporterAddress.toLowerCase())
      .maybeSingle()

    if (checkError) {
      console.error("[Reports API] Error checking existing report:", checkError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existingReport) {
      console.log("[Reports API] User already reported this track")
      return NextResponse.json({ error: "You have already reported this track" }, { status: 400 })
    }

    // Create report
    console.log("[Reports API] Creating new report...")
    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        track_id: trackId,
        reporter_address: reporterAddress.toLowerCase(),
        reason,
        details: details || null,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[Reports API] Failed to create report:", error)
      return NextResponse.json({ error: "Failed to create report: " + error.message }, { status: 500 })
    }

    console.log("[Reports API] Report created successfully:", report.id)

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error("[Reports API] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}
