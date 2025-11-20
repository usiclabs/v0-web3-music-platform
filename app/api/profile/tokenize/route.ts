import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { checkProfileTokenGate } from "@/lib/web3/profile-token-gate"
import { deployClankerERC20 } from "@/lib/erc20-deploy"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, tokenName, tokenSymbol, chainId } = body

    if (!address || !tokenName || !tokenSymbol) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check token gate requirements
    const gateStatus = await checkProfileTokenGate(address, chainId || 8453)

    if (!gateStatus.canTokenize) {
      const reasons = []
      if (!gateStatus.hasEnoughUSI) reasons.push("Insufficient $USI balance (need 0)")
      if (!gateStatus.hasEnoughTracks) reasons.push("Need at least 0 uploaded tracks")
      if (gateStatus.alreadyTokenized) reasons.push("Profile already tokenized")

      return NextResponse.json(
        {
          error: "Cannot tokenize profile",
          reasons,
          status: gateStatus,
        },
        { status: 403 },
      )
    }

    // Check if profile already has a token
    const supabase = await createServerClient()
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("profile_token_address")
      .eq("wallet_address", address.toLowerCase())
      .single()

    if (existingProfile?.profile_token_address) {
      return NextResponse.json(
        {
          error: "Profile already tokenized",
          tokenAddress: existingProfile.profile_token_address,
        },
        { status: 400 },
      )
    }

    console.log("[Profile Tokenize] Deploying token via Clanker:", {
      address,
      tokenName,
      tokenSymbol,
    })

    // Deploy token via Clanker
    const deploymentResult = await deployClankerERC20({
      name: tokenName,
      symbol: tokenSymbol,
      decimals: 18,
      totalSupply: 1000000000, // 1 billion tokens
      deployerAddress: address,
      description: `Profile token for ${tokenName}`,
      targetMarketCapEth: 0.1, // Start with 0.1 ETH market cap
    })

    if (!deploymentResult.success || !deploymentResult.tokenAddress) {
      console.error("[Profile Tokenize] Deployment failed:", deploymentResult.error)
      return NextResponse.json(
        {
          error: "Token deployment failed",
          details: deploymentResult.error,
        },
        { status: 500 },
      )
    }

    // Update profile with token address
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ profile_token_address: deploymentResult.tokenAddress })
      .eq("wallet_address", address.toLowerCase())

    if (updateError) {
      console.error("[Profile Tokenize] Failed to update profile:", updateError)
      return NextResponse.json(
        {
          error: "Failed to save token address",
          details: updateError.message,
        },
        { status: 500 },
      )
    }

    console.log("[Profile Tokenize] Success:", {
      address,
      tokenAddress: deploymentResult.tokenAddress,
      txHash: deploymentResult.txHash,
    })

    return NextResponse.json({
      success: true,
      tokenAddress: deploymentResult.tokenAddress,
      txHash: deploymentResult.txHash,
    })
  } catch (error) {
    console.error("[Profile Tokenize] Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
