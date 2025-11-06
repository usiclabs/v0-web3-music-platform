import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || "").toLowerCase().split(",")

export async function PATCH(request: NextRequest, { params }: { params: { address: string } }) {
  try {
    const walletAddress = request.headers.get("x-wallet-address")

    if (!walletAddress || !ADMIN_ADDRESSES.includes(walletAddress.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 })
    }

    const { verified } = await request.json()
    const { address } = params

    const supabase = await createClient()

    const { error } = await supabase.from("profiles").update({ verified }).eq("wallet_address", address.toLowerCase())

    if (error) {
      console.error("[v0] Error updating verification status:", error)
      return NextResponse.json({ error: "Failed to update verification status" }, { status: 500 })
    }

    return NextResponse.json({ success: true, verified })
  } catch (error) {
    console.error("[v0] Error in verify route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
