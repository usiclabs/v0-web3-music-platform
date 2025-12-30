import { formatUnits } from "viem"

export const REQUIRED_TOKEN_BALANCE = BigInt("0") // No token required

export async function checkTokenGate(address: string, chainId: number): Promise<boolean> {
  try {
    return true
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
