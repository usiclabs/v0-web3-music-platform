import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient, http, formatUnits } from "viem"
import { base } from "viem/chains"

const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get("address")
    const tokenAddress = searchParams.get("tokenAddress")

    if (!address || !tokenAddress) {
      return NextResponse.json({ error: "Missing address or tokenAddress parameter" }, { status: 400 })
    }

    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    })

    const [balance, decimals] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      }),
      publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "decimals",
      }),
    ])

    const formattedBalance = formatUnits(balance, decimals)

    return NextResponse.json({
      balance: formattedBalance,
      raw: balance.toString(),
      decimals,
    })
  } catch (error) {
    console.error("[API] Error fetching token balance:", error)
    return NextResponse.json({ error: "Failed to fetch token balance" }, { status: 500 })
  }
}
