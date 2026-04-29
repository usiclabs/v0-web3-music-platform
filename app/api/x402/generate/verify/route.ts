import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient, http, formatUnits, isAddress } from "viem"
import { base } from "viem/chains"
import { USDC_ADDRESS } from "@/lib/web3/contracts"
import { createClient } from "@supabase/supabase-js"
import { getPlatformWalletAddress } from "@/lib/x402/platform-wallet"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const GENERATION_PRICE_USDC = 1_000_000 // $1 USDC (6 decimals)

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
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
    const { walletAddress, txHash, nonce } = body

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    if (!isAddress(walletAddress)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
    }

    const platformWallet = getPlatformWalletAddress()

    if (!platformWallet) {
      console.error("[v0] Cannot verify payments - server wallet not configured correctly")
      return NextResponse.json({ error: "Payment system not configured. Please contact support." }, { status: 503 })
    }

    console.log("[v0] Platform wallet for verification:", platformWallet)

    const usdcAddress = USDC_ADDRESS[8453] || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    console.log("[v0] USDC address:", usdcAddress)

    const publicClient = createPublicClient({
      chain: base,
      transport: http(
        process.env.ALCHEMY_API_KEY
          ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
          : "https://mainnet.base.org",
      ),
    })

    // If txHash is provided, verify the transaction
    if (txHash) {
      try {
        const receipt = await publicClient.getTransactionReceipt({ hash: txHash })

        if (receipt.status === "success") {
          // Record the payment
          await supabase.from("generation_payments").insert({
            wallet_address: walletAddress.toLowerCase(),
            tx_hash: txHash,
            amount_usdc: GENERATION_PRICE_USDC,
            nonce,
            status: "completed",
            created_at: new Date().toISOString(),
          })

          return NextResponse.json({
            verified: true,
            txHash,
            message: "Payment verified successfully",
          })
        } else {
          return NextResponse.json({ error: "Transaction failed", verified: false }, { status: 400 })
        }
      } catch (err) {
        console.error("[v0] Error verifying transaction:", err)
        return NextResponse.json({ error: "Could not verify transaction", verified: false }, { status: 400 })
      }
    }

    // Check if user has sufficient balance
    let balance = BigInt(0)
    let allowance = BigInt(0)

    try {
      balance = await publicClient.readContract({
        address: usdcAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [walletAddress as `0x${string}`],
      })
      console.log("[v0] User USDC balance:", formatUnits(balance, 6))
    } catch (err) {
      console.error("[v0] Error reading balance:", err)
    }

    try {
      allowance = await publicClient.readContract({
        address: usdcAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [walletAddress as `0x${string}`, platformWallet],
      })
      console.log("[v0] User USDC allowance to", platformWallet, ":", formatUnits(allowance, 6))
    } catch (err) {
      console.error("[v0] Error reading allowance:", err)
    }

    const hasBalance = balance >= BigInt(GENERATION_PRICE_USDC)
    const hasAllowance = allowance >= BigInt(GENERATION_PRICE_USDC)

    return NextResponse.json({
      hasBalance,
      hasAllowance,
      balance: formatUnits(balance, 6),
      requiredAmount: "1.00",
      recipient: platformWallet,
    })
  } catch (error) {
    console.error("[v0] x402 generate verify error:", error)
    return NextResponse.json(
      {
        error: "Verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
