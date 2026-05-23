import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/managr/profile
 * Get musician's MANAGR profile settings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const musicianAddress = searchParams.get("address")

    if (!musicianAddress) {
      return NextResponse.json({ error: "Musician address required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get or create profile
    const { data: profile, error } = await supabase
      .from("managr_musician_profile")
      .select("*")
      .eq("musician_address", musicianAddress)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows found"
      throw error
    }

    if (!profile) {
      // Create default profile
      const { data: newProfile, error: createError } = await supabase
        .from("managr_musician_profile")
        .insert({
          musician_address: musicianAddress,
          preferred_agents: [],
          analytics_enabled: true,
          auto_management_enabled: true,
          risk_tolerance: "medium",
          max_total_budget: 10000,
        })
        .select()
        .single()

      if (createError) throw createError

      return NextResponse.json(newProfile)
    }

    return NextResponse.json(profile)
  } catch (error: any) {
    console.error("[MANAGR Profile GET] Error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch profile" }, { status: 500 })
  }
}

/**
 * PUT /api/managr/profile
 * Update musician's MANAGR profile settings
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const musicianAddress = searchParams.get("address")
    const body = await request.json()

    if (!musicianAddress) {
      return NextResponse.json({ error: "Musician address required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from("managr_musician_profile")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("musician_address", musicianAddress)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(profile)
  } catch (error: any) {
    console.error("[MANAGR Profile PUT] Error:", error)
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 })
  }
}
