import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const userAddress = formData.get("user_address")

    if (!userAddress || typeof userAddress !== "string") {
      return NextResponse.json({ error: "Missing user_address" }, { status: 400 })
    }

    const supabase = await createClient()

    await supabase
      .from("user_presence")
      .update({
        status: "offline",
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_address", userAddress)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error setting user offline:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
