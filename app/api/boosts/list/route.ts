import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const ownerAddress = request.headers.get("x-user-address")

    if (!ownerAddress) {
      return NextResponse.json({ message: "User address required" }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: boosts, error } = await supabase
      .from("boosts")
      .select("*")
      .eq("owner_address", ownerAddress)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Boosts List] Error:", error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ boosts })
  } catch (error) {
    console.error("[Boosts List API] Error:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
