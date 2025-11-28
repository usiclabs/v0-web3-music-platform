import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient, http, formatUnits } from "viem"
import { base } from "viem/chains"
import { USDC_ADDRESS } from "@/lib/web3/contracts"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const GENERATION_PRICE_USDC = 1_000_000 // $1 USDC (6 decimals)
const PLATFORM_WALLET = process.env.NEXT_PUBLIC_RELAYER_ADDRESS || "0x0000000000000000000000000000000000000000"

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

    const publicClient = createPublicClient({
      chain: base,
      transport: http(
        process.env.ALCHEMY_API_KEY
          ? `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
          : undefined,
      ),
    })

    const usdcAddress = USDC_ADDRESS[8453]

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
    const balance = await publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [walletAddress as `0x${string}`],
    })

    const hasBalance = balance >= BigInt(GENERATION_PRICE_USDC)

    // Check allowance for relayer
    const allowance = await publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [walletAddress as `0x${string}`, PLATFORM_WALLET as `0x${string}`],
    })

    const hasAllowance = allowance >= BigInt(GENERATION_PRICE_USDC)

    return NextResponse.json({
      hasBalance,
      hasAllowance,
      balance: formatUnits(balance, 6),
      requiredAmount: "1.00",
      recipient: PLATFORM_WALLET,
    })
  } catch (error) {
    console.error("[v0] x402 generate verify error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
