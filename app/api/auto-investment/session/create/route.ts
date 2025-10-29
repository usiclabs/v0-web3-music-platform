import { type NextRequest, NextResponse } from "next/server"
import { createSessionKey } from "@/lib/auto-investment/session-keys"

export async function POST(request: NextRequest) {
  try {
    const { userAddress, spendingLimit, maxPerTransaction, validityHours } = await request.json()

    if (!userAddress || !spendingLimit || !maxPerTransaction) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const sessionKey = await createSessionKey(userAddress, spendingLimit, maxPerTransaction, validityHours || 24)

    return NextResponse.json({
      success: true,
      sessionKey: {
        id: sessionKey.id,
        spending_limit: sessionKey.spending_limit,
        spent_amount: sessionKey.spent_amount,
        max_per_transaction: sessionKey.max_per_transaction,
        valid_until: sessionKey.valid_until,
      },
    })
  } catch (error) {
    console.error("[Auto-Investment] Session creation error:", error)
    return NextResponse.json(
      { error: "Failed to create session", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
