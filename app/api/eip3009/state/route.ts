import { NextResponse } from "next/server"
import type { Address, Hex } from "viem"
import { checkAuthorizationState } from "@/lib/eip3009/relayer"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const authorizer = searchParams.get("authorizer")
    const nonce = searchParams.get("nonce")

    if (!authorizer || !nonce) {
      return NextResponse.json({ error: "Missing authorizer or nonce" }, { status: 400 })
    }

    const isUsed = await checkAuthorizationState(authorizer as Address, nonce as Hex)

    return NextResponse.json({ used: isUsed })
  } catch (error) {
    console.error("[API] State check error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to check authorization state",
      },
      { status: 500 },
    )
  }
}
