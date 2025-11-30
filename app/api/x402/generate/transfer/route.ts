import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient, createWalletClient, http, isAddress } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { USDC_ADDRESS } from "@/lib/web3/contracts"
import { createClient } from "@supabase/supabase-js"
import { getFormattedPrivateKey, getPlatformWalletAddress } from "@/lib/x402/platform-wallet"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const GENERATION_PRICE_USDC = 1_000_000 // $1 USDC (6 decimals)

const ERC20_ABI = [
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from, nonce } = body

    if (!from || !nonce) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!isAddress(from)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
    }

    const privateKey = getFormattedPrivateKey()
    if (!privateKey) {
      console.error("[v0] SERVER_WALLET_PRIVATE_KEY not configured or invalid")
      return NextResponse.json({ error: "Server wallet not configured" }, { status: 500 })
    }

    let account
    try {
      account = privateKeyToAccount(privateKey)
    } catch (pkError) {
      console.error("[v0] Failed to create account from private key:", pkError)
      return NextResponse.json({ error: "Server wallet configuration error" }, { status: 500 })
    }

    const relayerAddress = account.address

    // Verify this matches what we told the user to approve
    const expectedAddress = getPlatformWalletAddress()
    if (expectedAddress !== relayerAddress) {
      console.error("[v0] CRITICAL: Address mismatch!", { relayerAddress, expectedAddress })
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    console.log("[v0] Using relayer address:", relayerAddress)

    const publicClient = createPublicClient({
      chain: base,
      transport: http(
        process.env.ALCHEMY_API_KEY
          ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
          : undefined,
      ),
    })

    const walletClient = createWalletClient({
      chain: base,
      transport: http(
        process.env.ALCHEMY_API_KEY
          ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
          : undefined,
      ),
      account,
    })

    const usdcAddress = USDC_ADDRESS[8453]

    // Check allowance
    const allowance = await publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [from as `0x${string}`, relayerAddress],
    })

    console.log("[v0] Allowance from", from, "to", relayerAddress, ":", allowance.toString())

    if (allowance < BigInt(GENERATION_PRICE_USDC)) {
      return NextResponse.json(
        {
          error: "Insufficient allowance. Please approve USDC first.",
          details: {
            allowance: allowance.toString(),
            required: GENERATION_PRICE_USDC.toString(),
            spender: relayerAddress,
          },
        },
        { status: 400 },
      )
    }

    // Execute the transfer
    const txHash = await walletClient.writeContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: "transferFrom",
      args: [from as `0x${string}`, relayerAddress, BigInt(GENERATION_PRICE_USDC)],
    })

    console.log("[v0] Generation payment transfer sent:", txHash)

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    })

    if (receipt.status !== "success") {
      return NextResponse.json({ error: "Transfer failed" }, { status: 500 })
    }

    // Record the payment
    await supabase.from("generation_payments").insert({
      wallet_address: from.toLowerCase(),
      tx_hash: txHash,
      amount_usdc: GENERATION_PRICE_USDC,
      nonce,
      status: "completed",
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      txHash,
      message: "Payment completed successfully",
    })
  } catch (error) {
    console.error("[v0] x402 generate transfer error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Transfer failed" }, { status: 500 })
  }
}
