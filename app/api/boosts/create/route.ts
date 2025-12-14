import { createAdminClient } from "@/lib/supabase/admin"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { encrypt } from "@/lib/crypto"
import { parseEther } from "viem"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artistAddress, tokenAddress, tokenSymbol, ethAmount } = body

    if (!artistAddress || !tokenAddress || !ethAmount) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get current user from request (would need auth context in real implementation)
    // For now, we'll extract from headers or require it to be passed
    const ownerAddress = (request.headers.get("x-user-address") || "0x0") as string

    if (ownerAddress === "0x0") {
      return NextResponse.json({ message: "User address required" }, { status: 401 })
    }

    const ethWei = parseEther(ethAmount.toString())

    // Create boost record
    const { data: boost, error: boostError } = await supabase
      .from("boosts")
      .insert({
        owner_address: ownerAddress,
        artist_address: artistAddress,
        token_address: tokenAddress,
        token_symbol: tokenSymbol,
        initial_eth_funding: ethWei.toString(),
        current_balance: ethWei.toString(),
        status: "active",
      })
      .select()
      .single()

    if (boostError) {
      console.error("[Boost] Creation error:", boostError)
      return NextResponse.json({ message: boostError.message }, { status: 500 })
    }

    // Create wallet for boost
    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)
    const encryptedKey = encrypt(privateKey)

    const { error: walletError } = await supabase.from("boost_wallets").insert({
      boost_id: boost.id,
      wallet_address: account.address,
      private_key_encrypted: encryptedKey,
    })

    if (walletError) {
      console.error("[Boost] Wallet creation error:", walletError)
      return NextResponse.json({ message: walletError.message }, { status: 500 })
    }

    // Log creation activity
    await supabase.from("boost_activity").insert({
      boost_id: boost.id,
      activity_type: "created",
      amount_traded: ethWei.toString(),
    })

    return NextResponse.json({
      boostId: boost.id,
      walletAddress: account.address,
      initialFunding: ethWei.toString(),
    })
  } catch (error) {
    console.error("[Boost API] Error:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
