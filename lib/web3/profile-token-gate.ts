import { createPublicClient, http, formatUnits } from "viem"
import { base, baseSepolia } from "viem/chains"
import { USI_TOKEN_ADDRESS, ERC20_ABI } from "./contracts"
import { createBrowserClient } from "@/lib/supabase/client"

// No USI tokens required for profile tokenization
export const PROFILE_TOKEN_REQUIRED_USI = BigInt("0")
export const PROFILE_TOKEN_REQUIRED_TRACKS = 0

export interface ProfileTokenGateStatus {
  hasEnoughUSI: boolean
  hasEnoughTracks: boolean
  canTokenize: boolean
  usiBalance: bigint
  trackCount: number
  alreadyTokenized: boolean
}

export async function checkProfileTokenGate(address: string, chainId: number): Promise<ProfileTokenGateStatus> {
  try {
    const chain = chainId === 8453 ? base : baseSepolia
    const tokenAddress = USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS]

    if (!tokenAddress) {
      console.error("[Profile Token Gate] Token address not found for chain:", chainId)
      return {
        hasEnoughUSI: true,
        hasEnoughTracks: true,
        canTokenize: true,
        usiBalance: BigInt(0),
        trackCount: 0,
        alreadyTokenized: false,
      }
    }

    // Check $USI balance (informational only, not required)
    const client = createPublicClient({
      chain,
      transport: http(),
    })

    const usiBalance = (await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    })) as bigint

    // No USI requirement - always true
    const hasEnoughUSI = true

    // Check track count (no minimum required now)
    const supabase = createBrowserClient()
    const { count: trackCount } = await supabase
      .from("tracks")
      .select("*", { count: "exact", head: true })
      .eq("artist_id", address.toLowerCase())

    // No track requirement - always true
    const hasEnoughTracks = true

    // Check if already tokenized
    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_token_address")
      .eq("wallet_address", address.toLowerCase())
      .single()

    const alreadyTokenized = !!profile?.profile_token_address

    console.log("[Profile Token Gate] Status:", {
      address,
      usiBalance: formatUnits(usiBalance, 18),
      hasEnoughUSI,
      trackCount,
      hasEnoughTracks,
      alreadyTokenized,
      canTokenize: hasEnoughUSI && hasEnoughTracks && !alreadyTokenized,
    })

    return {
      hasEnoughUSI,
      hasEnoughTracks,
      canTokenize: hasEnoughUSI && hasEnoughTracks && !alreadyTokenized,
      usiBalance,
      trackCount: trackCount || 0,
      alreadyTokenized,
    }
  } catch (error) {
    console.error("[Profile Token Gate] Error checking gate:", error)
    return {
      hasEnoughUSI: true,
      hasEnoughTracks: true,
      canTokenize: true,
      usiBalance: BigInt(0),
      trackCount: 0,
      alreadyTokenized: false,
    }
  }
}

export function formatUSIBalance(balance: bigint): string {
  return Number(formatUnits(balance, 18)).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })
}
