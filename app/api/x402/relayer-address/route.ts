import { NextResponse } from "next/server"
import { privateKeyToAccount } from "viem/accounts"

function normalizePrivateKey(key: string): `0x${string}` {
  key = key.trim()
  if (!key.startsWith("0x")) {
    key = `0x${key}`
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(`Invalid private key format`)
  }
  return key as `0x${string}`
}

export async function GET() {
  try {
    const relayerPrivateKey = process.env.SERVER_WALLET_PRIVATE_KEY
    
    if (!relayerPrivateKey) {
      return NextResponse.json(
        { error: "Relayer not configured" },
        { status: 500 }
      )
    }

    const normalizedKey = normalizePrivateKey(relayerPrivateKey)
    const relayerAccount = privateKeyToAccount(normalizedKey)

    return NextResponse.json({
      address: relayerAccount.address,
    })
  } catch (error) {
    console.error("[v0] Failed to get relayer address:", error)
    return NextResponse.json(
      { error: "Failed to get relayer address" },
      { status: 500 }
    )
  }
}
