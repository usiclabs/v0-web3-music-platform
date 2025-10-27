import { type NextRequest, NextResponse } from "next/server"

// X402 payment verification endpoint
export async function POST(request: NextRequest) {
  try {
    const paymentPayload = await request.json()

    console.log("[v0] Verifying X402 payment:", JSON.stringify(paymentPayload, null, 2))

    // Extract payment data
    const { scheme, network, authorization } = paymentPayload

    // Validate required fields
    if (!scheme || !network || !authorization) {
      console.log("[v0] Verification failed: Missing required fields")
      return NextResponse.json({ error: "Missing required fields: scheme, network, or authorization" }, { status: 400 })
    }

    // Validate network
    if (network !== "base") {
      console.log("[v0] Verification failed: Unsupported network:", network)
      return NextResponse.json({ error: "Unsupported network. Only 'base' is supported." }, { status: 400 })
    }

    // Validate scheme
    if (scheme !== "exact" && scheme !== "upto") {
      console.log("[v0] Verification failed: Invalid scheme:", scheme)
      return NextResponse.json({ error: "Invalid scheme. Must be 'exact' or 'upto'." }, { status: 400 })
    }

    const { from, to, value, validAfter, validBefore, nonce, v, r, s } = authorization

    // Validate authorization fields
    if (!from || !to || !value || validAfter === undefined || validBefore === undefined || !nonce) {
      console.log("[v0] Verification failed: Missing authorization fields")
      return NextResponse.json({ error: "Missing required authorization fields" }, { status: 400 })
    }

    if (v === undefined || !r || !s) {
      console.log("[v0] Verification failed: Missing signature components (v, r, s)")
      return NextResponse.json({ error: "Missing signature components (v, r, s)" }, { status: 400 })
    }

    if (typeof v !== "number" || !r.startsWith("0x") || !s.startsWith("0x") || r.length !== 66 || s.length !== 66) {
      console.log("[v0] Verification failed: Invalid signature format")
      return NextResponse.json(
        { error: "Invalid signature format. v must be a number, r and s must be 0x-prefixed 32-byte hex strings" },
        { status: 400 },
      )
    }

    // Artists are allowed to play their own tracks for free without payment
    // if (from.toLowerCase() === to.toLowerCase()) {
    //   console.log("[v0] Verification failed: Cannot pay yourself")
    //   return NextResponse.json(
    //     { error: "Invalid payment: sender and recipient cannot be the same address" },
    //     { status: 400 },
    //   )
    // }

    // Check if authorization is still valid (time-based)
    const now = Math.floor(Date.now() / 1000)
    if (now < validAfter) {
      console.log("[v0] Verification failed: Authorization not yet valid")
      return NextResponse.json({ error: "Authorization not yet valid" }, { status: 400 })
    }
    if (now > validBefore) {
      console.log("[v0] Verification failed: Authorization expired")
      return NextResponse.json({ error: "Authorization expired" }, { status: 400 })
    }

    console.log("[v0] Payment verification successful")

    // Return success
    return NextResponse.json({
      success: true,
      verified: true,
      authorization: {
        from,
        to,
        value,
        nonce,
      },
    })
  } catch (error) {
    console.error("[v0] X402 verify error:", error)
    return NextResponse.json(
      { error: "Verification failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
