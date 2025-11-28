import { createPublicClient, http, formatUnits } from "viem"
import { base, baseSepolia } from "viem/chains"
import { USI_TOKEN_ADDRESS, ERC20_ABI } from "./contracts"

export const AGENT_REQUIRED_BALANCE = BigInt("2000000000000000000000000000") // 2,000,000,000 tokens (2 billion)

export const USI_TOTAL_SUPPLY = BigInt("100000000000000000000000000000") // 100,000,000,000 tokens (100 billion)

export interface AgentTokenGateStatus {
  hasAccess: boolean
  balance: bigint
  required: bigint
  percentageOwned: number // Changed from percentOwned to match page usage
  formattedBalance: string // Added for formatted display
  status: "approved" | "insufficient"
}

export async function checkAgentTokenGate(address: string, chainId = 8453): Promise<AgentTokenGateStatus> {
  try {
    const chain = chainId === 8453 ? base : baseSepolia
    const tokenAddress = USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS]

    if (!tokenAddress) {
      console.error("[Agent Token Gate] Token address not found for chain:", chainId)
      return {
        hasAccess: false,
        balance: BigInt(0),
        required: AGENT_REQUIRED_BALANCE,
        percentageOwned: 0,
        formattedBalance: "0",
        status: "insufficient",
      }
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

    // Calculate percentage with 4 decimal precision
    const percentageOwned = Number((balance * BigInt(1000000)) / USI_TOTAL_SUPPLY) / 10000

    console.log("[Agent Token Gate] Balance:", formatUnits(balance, 18), "$USI")
    console.log("[Agent Token Gate] Required:", formatUnits(AGENT_REQUIRED_BALANCE, 18), "$USI (2%)")
    console.log("[Agent Token Gate] Percent owned:", percentageOwned, "%")

    const hasAccess = balance >= AGENT_REQUIRED_BALANCE

    return {
      hasAccess,
      balance,
      required: AGENT_REQUIRED_BALANCE,
      percentageOwned, // Renamed from percentOwned
      formattedBalance: formatTokenAmount(balance), // Added formatted balance
      status: hasAccess ? "approved" : "insufficient",
    }
  } catch (error) {
    console.error("[Agent Token Gate] Error:", error)
    return {
      hasAccess: false,
      balance: BigInt(0),
      required: AGENT_REQUIRED_BALANCE,
      percentageOwned: 0,
      formattedBalance: "0",
      status: "insufficient",
    }
  }
}

export function formatTokenAmount(amount: bigint): string {
  const num = Number(formatUnits(amount, 18))
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + "B"
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + "M"
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + "K"
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 })
}
