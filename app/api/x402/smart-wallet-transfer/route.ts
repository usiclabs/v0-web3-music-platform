import { NextResponse } from "next/server"
import { createPublicClient, createWalletClient, http, type Address } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { USDC_ADDRESS } from "@/lib/web3/contracts"

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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { from, to, amount, trackId, chunkIndex } = body

    if (!from || !to || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    console.log("[v0] Smart wallet transfer request:", {
      from,
      to,
      amount,
      trackId,
      chunkIndex,
    })

    // Get relayer private key from env
    const relayerPrivateKey = process.env.SERVER_WALLET_PRIVATE_KEY
    if (!relayerPrivateKey) {
      console.error("[v0] SERVER_WALLET_PRIVATE_KEY not configured")
      return NextResponse.json({ error: "Payment service not configured" }, { status: 500 })
    }

    // Create clients
    const publicClient = createPublicClient({
      chain: base,
      transport: http(
        process.env.ALCHEMY_API_KEY
          ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
          : "https://mainnet.base.org"
      ),
    })

    const relayerAccount = privateKeyToAccount(relayerPrivateKey as `0x${string}`)
    const relayerWalletClient = createWalletClient({
      account: relayerAccount,
      chain: base,
      transport: http(
        process.env.ALCHEMY_API_KEY
          ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
          : "https://mainnet.base.org"
      ),
    })

    console.log("[v0] Relayer address:", relayerAccount.address)

    // Check allowance
    const allowance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [from as Address, relayerAccount.address],
    })

    console.log("[v0] Allowance from user to relayer:", allowance.toString())

    if (allowance < BigInt(amount)) {
      return NextResponse.json(
        {
          error: `Insufficient allowance. User has approved ${allowance.toString()} but ${amount} is needed. Please approve first.`,
        },
        { status: 400 }
      )
    }

    // Execute transferFrom using relayer
    console.log("[v0] Executing transferFrom...")
    const txHash = await relayerWalletClient.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "transferFrom",
      args: [from as Address, to as Address, BigInt(amount)],
    })

    console.log("[v0] Transfer transaction sent:", txHash)

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    })

    console.log("[v0] Transfer confirmed! Block:", receipt.blockNumber)

    // Record payment in database
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/x402/record-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackId,
            userId: from,
            chunkIndex,
            txHash,
            amount,
          }),
        }
      )
    } catch (err) {
      console.warn("[v0] Failed to record payment:", err)
      // Don't fail the whole transaction if recording fails
    }

    return NextResponse.json({
      success: true,
      txHash,
      blockNumber: receipt.blockNumber.toString(),
    })
  } catch (error) {
    console.error("[v0] Smart wallet transfer error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Transfer failed",
      },
      { status: 500 }
    )
  }
}
