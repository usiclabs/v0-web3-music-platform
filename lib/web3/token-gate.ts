import { createPublicClient, http, formatUnits } from "viem"
import { base, baseSepolia } from "viem/chains"
import { USI_TOKEN_ADDRESS, ERC20_ABI } from "./contracts"

export const REQUIRED_TOKEN_BALANCE = BigInt("1000000000000000000000000000") // 1,000,000,000 tokens with 18 decimals

export async function checkTokenGate(address: string, chainId: number): Promise<boolean> {
  try {
    const chain = chainId === 8453 ? base : baseSepolia
    const tokenAddress = USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS]

    if (!tokenAddress) {
      console.error("Token address not found for chain:", chainId)
      return false
    }

    const client = createPublicClient({
      chain,
      transport: http(),
    })

    const balance = (await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    })) as bigint

    console.log("[v0] Token balance:", formatUnits(balance, 18), "$USI")
    console.log("[v0] Required balance:", formatUnits(REQUIRED_TOKEN_BALANCE, 18), "$USI")

    return balance >= REQUIRED_TOKEN_BALANCE
  } catch (error) {
    console.error("[v0] Error checking token balance:", error)
    return false
  }
}

export function formatTokenBalance(balance: bigint): string {
  return Number(formatUnits(balance, 18)).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })
}
