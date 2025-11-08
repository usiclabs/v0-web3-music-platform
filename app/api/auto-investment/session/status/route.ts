import { type NextRequest, NextResponse } from "next/server"
import { getActiveSessionKey } from "@/lib/auto-investment/session-keys"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get("userAddress")

    if (!userAddress) {
      return NextResponse.json({ error: "Missing userAddress" }, { status: 400 })
    }

    const sessionKey = await getActiveSessionKey(userAddress)

    if (!sessionKey) {
      return NextResponse.json({ active: false, sessionKey: null })
    }

    return NextResponse.json({
      active: true,
      sessionKey: {
        id: sessionKey.id,
        spending_limit: sessionKey.spending_limit,
        spent_amount: sessionKey.spent_amount,
        max_per_transaction: sessionKey.max_per_transaction,
        valid_until: sessionKey.valid_until,
        remaining: sessionKey.spending_limit - sessionKey.spent_amount,
      },
    })
  } catch (error) {
    console.error("[Auto-Investment] Session status error:", error)
    return NextResponse.json({ active: false, sessionKey: null })
  }
}
