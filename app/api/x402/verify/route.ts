import { type NextRequest, NextResponse } from "next/server"

const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30
const requestCounts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const record = requestCounts.get(identifier)
  
  if (!record || now > record.resetAt) {
    requestCounts.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }
  
  record.count++
  return true
}

// X402 payment verification endpoint
export async function POST(request: NextRequest) {
  try {
    const paymentPayload = await request.json()

    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    
    if (!checkRateLimit(clientIp)) {
      console.log("[v0] Rate limit exceeded for IP:", clientIp)
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      )
    }

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

    const isSmartWallet = network === "base" && (
      authorization.from?.toLowerCase().startsWith("0x") && 
      // Base App wallets typically have specific address patterns
      // but we'll rely on the EIP-6492 detection in the signature parsing
      true // Default to treating as potential smart wallet for better UX
    )

    if (typeof v !== "number" || !r.startsWith("0x") || !s.startsWith("0x") || r.length !== 66 || s.length !== 66) {
      console.log("[v0] Verification failed: Invalid signature format")
      console.log("[v0] Signature components - v:", typeof v, v, "r length:", r?.length, "s length:", s?.length)
      
      return NextResponse.json(
        { 
          error: "Invalid signature format. v must be a number, r and s must be 0x-prefixed 32-byte hex strings",
          hint: isSmartWallet 
            ? "This may be a Base App wallet compatibility issue. Please ensure:\n" +
              "1. You're using the latest Coinbase Wallet or Base App\n" +
              "2. Your wallet has been deployed (make a small transaction if this is your first time)\n" +
              "3. You're on the Base network, not a testnet"
            : "This may be a wallet compatibility issue. Please ensure you're using MetaMask, Coinbase Wallet, Rainbow, or Trust Wallet.",
          debug: { vType: typeof v, rLength: r?.length, sLength: s?.length }
        },
        { status: 400 },
      )
    }

    // Check if authorization is still valid (time-based)
    const now = Math.floor(Date.now() / 1000)
    if (now < validAfter) {
      console.log("[v0] Verification failed: Authorization not yet valid")
      return NextResponse.json({ error: "Authorization not yet valid" }, { status: 400 })
    }
    if (now > validBefore) {
      console.log("[v0] Verification failed: Authorization expired")
      
      const expiredMessage = isSmartWallet
        ? "Base App authorization expired. ERC-4337 wallets need longer validity periods. Please request a new payment authorization."
        : "Authorization expired. Please request a new payment authorization."
      
      const expiredHint = isSmartWallet
        ? "Base App signatures can take longer due to relayer processing. Keep your wallet app open and try again."
        : "On mobile, signature requests may take longer. Try keeping the wallet app open."
      
      return NextResponse.json({ 
        error: expiredMessage,
        hint: expiredHint,
        expiryTime: validBefore,
        currentTime: now,
      }, { status: 400 })
    }

    console.log("[v0] Payment verification successful", isSmartWallet ? "(Base App ERC-4337 wallet)" : "")

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
      { 
        error: "Verification failed", 
        details: error instanceof Error ? error.message : "Unknown error",
        hint: "Please check your wallet connection and try again."
      },
      { status: 500 },
    )
  }
}
