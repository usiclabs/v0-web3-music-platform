import { NextResponse } from "next/server"
import type { Address, Hex } from "viem"
import { relayTransferAuthorization, storeRelayedTransaction, isEligibleForSubsidy } from "@/lib/eip3009/relayer"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { authorization, signature, metadata } = body

    // Validate request
    if (!authorization || !signature) {
      return NextResponse.json({ error: "Missing authorization or signature" }, { status: 400 })
    }

    const { from, to, value, validAfter, validBefore, nonce } = authorization
    const { v, r, s } = signature

    // Validate all required fields
    if (!from || !to || !value || !validAfter || !validBefore || !nonce || !v || !r || !s) {
      return NextResponse.json({ error: "Invalid authorization format" }, { status: 400 })
    }

    console.log("[API] Received relay request from:", from)

    // Check if user is eligible for gas subsidy
    const eligible = await isEligibleForSubsidy(from as Address)
    if (!eligible) {
      return NextResponse.json(
        {
          error: "Gas subsidy limit reached. You have used all your free transactions.",
        },
        { status: 429 },
      )
    }

    // Relay the transaction
    const result = await relayTransferAuthorization(
      from as Address,
      to as Address,
      BigInt(value),
      BigInt(validAfter),
      BigInt(validBefore),
      nonce as Hex,
      v,
      r as Hex,
      s as Hex,
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Store transaction in database
    if (result.txHash) {
      await storeRelayedTransaction(
        from as Address,
        to as Address,
        BigInt(value),
        nonce as Hex,
        result.txHash,
        21000n, // Approximate gas used
        metadata,
      )
    }

    return NextResponse.json({
      success: true,
      txHash: result.txHash,
    })
  } catch (error) {
    console.error("[API] Relay error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to relay transaction",
      },
      { status: 500 },
    )
  }
}
