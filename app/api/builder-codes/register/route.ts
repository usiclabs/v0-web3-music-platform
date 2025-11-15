import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { code, name, description, ownerAddress, websiteUrl, logoUrl } = body

    // Validate required fields
    if (!code || !name || !ownerAddress) {
      return NextResponse.json(
        { error: "Missing required fields: code, name, ownerAddress" },
        { status: 400 }
      )
    }

    // Validate code format (alphanumeric, hyphens, underscores only)
    if (!/^[a-z0-9-_]+$/.test(code)) {
      return NextResponse.json(
        { error: "Builder code must be lowercase alphanumeric with hyphens or underscores" },
        { status: 400 }
      )
    }

    // Check if code already exists
    const { data: existing } = await supabase
      .from("builder_codes")
      .select("code")
      .eq("code", code)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Builder code already registered" },
        { status: 409 }
      )
    }

    // Register builder code
    const { data, error } = await supabase
      .from("builder_codes")
      .insert({
        code,
        name,
        description,
        owner_address: ownerAddress.toLowerCase(),
        website_url: websiteUrl,
        logo_url: logoUrl,
        payout_percentage: 10.0, // Default 10% of platform fees
        is_active: true,
        verified: false, // Requires admin approval
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to register builder code:", error)
      return NextResponse.json(
        { error: "Failed to register builder code" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      builderCode: data,
      message: "Builder code registered successfully. Pending verification.",
    })
  } catch (error) {
    console.error("Builder code registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
