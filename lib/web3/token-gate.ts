import { createPublicClient, http, formatUnits } from "viem"
import { base, baseSepolia } from "viem/chains"
import { USI_TOKEN_ADDRESS, ERC20_ABI } from "./contracts"

export async function getRequiredTokenBalance(chainId: number): Promise<bigint> {
  try {
    const chain = chainId === 8453 ? base : baseSepolia
    const tokenAddress = USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS]

    if (!tokenAddress) {
      console.error("Token address not found for chain:", chainId)
      return BigInt("0")
    }

    const client = createPublicClient({
      chain,
      transport: http(),
    })

    // Fetch total supply
    const totalSupply = (await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "totalSupply",
    })) as bigint

    // Calculate 0.1% of total supply (0.001 * totalSupply)
    const requiredBalance = (totalSupply * BigInt(1)) / BigInt(1000)

    console.log("[v0] Total supply:", formatUnits(totalSupply, 18), "$USI")
    console.log("[v0] Required balance (0.1%):", formatUnits(requiredBalance, 18), "$USI")

    return requiredBalance
  } catch (error) {
    console.error("[v0] Error fetching total supply:", error)
    // Fallback to 10M tokens if fetch fails
    return BigInt("10000000000000000000000000") // 10,000,000 tokens with 18 decimals
  }
}

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

    const requiredBalance = await getRequiredTokenBalance(chainId)

    const balance = (await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    })) as bigint

    console.log("[v0] Token balance:", formatUnits(balance, 18), "$USI")
    console.log("[v0] Required balance:", formatUnits(requiredBalance, 18), "$USI")

    return balance >= requiredBalance
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
