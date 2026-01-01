import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { from, nonce } = await request.json()

    if (!from) {
      return NextResponse.json({ error: "Missing from address" }, { status: 400 })
    }

    console.log("[v0] Smart wallet generation transfer request:", { from, nonce })

    // Get Supabase client for database operations
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    // Record the transaction in generation_payments
    const { data: paymentRecord, error: paymentError } = await supabase
      .from("generation_payments")
      .insert({
        wallet_address: from.toLowerCase(),
        tx_hash: `gen-${nonce || Date.now()}`,
        amount_usdc: 1.0,
        nonce,
        status: "completed",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (paymentError) {
      console.error("[v0] Failed to record payment:", paymentError)
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
    }

    console.log("[v0] Generation payment recorded:", paymentRecord)

    return NextResponse.json({
      success: true,
      txHash: paymentRecord.tx_hash,
      amount: "1.0",
      currency: "USDC",
    })
  } catch (error) {
    console.error("[v0] Smart wallet generation transfer error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Transfer failed" }, { status: 500 })
  }
}
