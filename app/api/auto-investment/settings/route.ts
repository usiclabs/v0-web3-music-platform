import { type NextRequest, NextResponse } from "next/server"
import { getAutoInvestmentSettings, updateAutoInvestmentSettings } from "@/lib/auto-investment/session-keys"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get("userAddress")

    if (!userAddress) {
      return NextResponse.json({ error: "Missing userAddress" }, { status: 400 })
    }

    const settings = await getAutoInvestmentSettings(userAddress)
    return NextResponse.json(settings)
  } catch (error) {
    console.error("[Auto-Investment] Get settings error:", error)
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userAddress, ...settings } = await request.json()

    if (!userAddress) {
      return NextResponse.json({ error: "Missing userAddress" }, { status: 400 })
    }

    await updateAutoInvestmentSettings(userAddress, settings)
    return NextResponse.json({ success: true, message: "Settings updated" })
  } catch (error) {
    console.error("[Auto-Investment] Update settings error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
