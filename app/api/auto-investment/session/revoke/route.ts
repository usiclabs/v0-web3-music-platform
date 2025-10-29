import { type NextRequest, NextResponse } from "next/server"
import { revokeSessionKey } from "@/lib/auto-investment/session-keys"

export async function POST(request: NextRequest) {
  try {
    const { sessionKeyId } = await request.json()

    if (!sessionKeyId) {
      return NextResponse.json({ error: "Missing sessionKeyId" }, { status: 400 })
    }

    await revokeSessionKey(sessionKeyId)

    return NextResponse.json({ success: true, message: "Session key revoked" })
  } catch (error) {
    console.error("[Auto-Investment] Session revocation error:", error)
    return NextResponse.json({ error: "Failed to revoke session" }, { status: 500 })
  }
}
