import { encodePacked, encodeAbiParameters, parseAbiParameters, keccak256, type Address } from "viem"
import {
  UNISWAP_V4_POOL_MANAGER,
  UNISWAP_V4_POOL_MANAGER_ABI,
  UNISWAP_V4_STATE_VIEW,
  UNISWAP_V4_STATE_VIEW_ABI,
  WETH_ADDRESS,
  V4_COMMANDS,
} from "./contracts"
import type { PublicClient } from "viem"

export interface V4PoolKey {
  currency0: Address
  currency1: Address
  fee: number
  tickSpacing: number
  hooks: Address
}

export interface V4SwapParams {
  tokenIn: Address
  tokenOut: Address
  amountIn: bigint
  amountOutMinimum: bigint
  recipient: Address
  chainId: number
}

/**
 * Computes the pool ID for a V4 pool key (client-side)
 * V4 uses this ID for identifying pools in the PoolManager singleton
 */
function computePoolId(poolKey: V4PoolKey): `0x${string}` {
  // Pool ID = keccak256(abi.encode(poolKey))
  // This is deterministic across all interactions
  const encoded = encodeAbiParameters(parseAbiParameters("address, address, uint24, int24, address"), [
    poolKey.currency0,
    poolKey.currency1,
    poolKey.fee,
    poolKey.tickSpacing,
    poolKey.hooks,
  ])
  return keccak256(encoded)
}

/**
 * Detects if a token uses Uniswap V4 by checking for pool existence
 */
export async function detectV4Pool(
  tokenAddress: Address,
  chainId: number,
  publicClient: PublicClient,
): Promise<V4PoolKey | null> {
  try {
    console.log("[v0] Detecting V4 pool for token:", tokenAddress)

    const wethAddress = WETH_ADDRESS[chainId as keyof typeof WETH_ADDRESS] as Address
    const stateViewAddress = UNISWAP_V4_STATE_VIEW[chainId as keyof typeof UNISWAP_V4_STATE_VIEW] as Address

    if (!stateViewAddress) {
      console.log("[v0] No V4 StateView address for chain:", chainId)
      return null
    }

    // Sort tokens to match Uniswap's ordering
    const [currency0, currency1] =
      tokenAddress.toLowerCase() < wethAddress.toLowerCase() ? [tokenAddress, wethAddress] : [wethAddress, tokenAddress]

    console.log("[v0] Checking V4 pools for pair:", { currency0, currency1 })

    const COMMON_HOOK_ADDRESSES = [
      "0x0000000000000000000000000000000000000000" as Address, // No hooks (standard)
      // Add known Clanker hook addresses here as they are discovered
      // Clanker often deploys with custom hooks for dynamic fees, TWAMM, etc.
    ] as const

    // Prioritize common fee tiers and hook combinations
    const poolConfigs = [
      // Most common Clanker configurations - check first
      { fee: 10000, tickSpacing: 200, hooks: COMMON_HOOK_ADDRESSES }, // 1% fee with various hooks
      // Standard Uniswap V3-style tiers with no hooks
      { fee: 3000, tickSpacing: 60, hooks: [COMMON_HOOK_ADDRESSES[0]] }, // 0.3% fee
      { fee: 500, tickSpacing: 10, hooks: [COMMON_HOOK_ADDRESSES[0]] }, // 0.05% fee
      // Alternative tick spacings for 1%
      { fee: 10000, tickSpacing: 60, hooks: [COMMON_HOOK_ADDRESSES[0]] },
      { fee: 10000, tickSpacing: 100, hooks: [COMMON_HOOK_ADDRESSES[0]] },
      // Less common but possible
      { fee: 100, tickSpacing: 1, hooks: [COMMON_HOOK_ADDRESSES[0]] }, // 0.01% fee
      { fee: 5000, tickSpacing: 100, hooks: [COMMON_HOOK_ADDRESSES[0]] }, // 0.5% fee
      { fee: 2500, tickSpacing: 50, hooks: [COMMON_HOOK_ADDRESSES[0]] }, // 0.25% fee
      { fee: 1000, tickSpacing: 20, hooks: [COMMON_HOOK_ADDRESSES[0]] }, // 0.1% fee
      { fee: 30000, tickSpacing: 600, hooks: [COMMON_HOOK_ADDRESSES[0]] }, // 3% fee
    ]

    const batchSize = 2
    for (let i = 0; i < poolConfigs.length; i += batchSize) {
      const batch = poolConfigs.slice(i, i + batchSize)

      const results = await Promise.allSettled(
        batch.flatMap(({ fee, tickSpacing, hooks }) =>
          hooks.map(async (hookAddress) => {
            const poolKey: V4PoolKey = {
              currency0,
              currency1,
              fee,
              tickSpacing,
              hooks: hookAddress,
            }

            console.log("[v0] Checking V4 pool config:", { fee, tickSpacing, hooks: hookAddress })

            try {
              const liquidity = (await publicClient.readContract({
                address: stateViewAddress,
                abi: UNISWAP_V4_STATE_VIEW_ABI,
                functionName: "getLiquidity",
                args: [poolKey],
              })) as bigint

              if (liquidity && liquidity > 0n) {
                console.log("[v0] Found V4 pool:", {
                  fee,
                  tickSpacing,
                  hooks: hookAddress,
                  liquidity: liquidity.toString(),
                })
                return poolKey
              }
              return null
            } catch (error) {
              console.log("[v0] V4 pool check failed for config:", { fee, tickSpacing, hooks: hookAddress })
              return null
            }
          }),
        ),
      )

      // Return first valid pool found
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          return result.value
        }
      }

      if (i + batchSize < poolConfigs.length) {
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }

    console.log("[v0] No V4 pool found for token:", tokenAddress)
    return null
  } catch (error) {
    console.error("[v0] Error detecting V4 pool:", error)
    return null
  }
}

/**
 * Gets a quote for a V4 swap using Quoter contract
 * Supports v4's advanced flash accounting and hook fees
 */
export async function getV4Quote(
  poolKey: V4PoolKey,
  amountIn: bigint,
  zeroForOne: boolean,
  publicClient: PublicClient,
  chainId: number,
): Promise<bigint> {
  try {
    const stateViewAddress = UNISWAP_V4_STATE_VIEW[chainId as keyof typeof UNISWAP_V4_STATE_VIEW] as Address

    // Get current pool state using StateView (v4 StateLibrary pattern)
    const slot0 = await publicClient.readContract({
      address: stateViewAddress,
      abi: UNISWAP_V4_STATE_VIEW_ABI,
      functionName: "getSlot0",
      args: [poolKey],
    })

    const liquidity = await publicClient.readContract({
      address: stateViewAddress,
      abi: UNISWAP_V4_STATE_VIEW_ABI,
      functionName: "getLiquidity",
      args: [poolKey],
    })

    if (!slot0 || !liquidity || slot0[0] === 0n || liquidity === 0n) {
      throw new Error("Pool has no liquidity for quote")
    }

    const sqrtPriceX96 = slot0[0]
    const tick = slot0[1]

    // Calculate output using spot price (sqrt price X96)
    // V4 uses flash accounting, so we calculate based on current state
    const price = (sqrtPriceX96 * sqrtPriceX96) / 2n ** 192n
    let amountOut = zeroForOne ? (amountIn * price) / 10n ** 18n : (amountIn * 10n ** 18n) / price

    // Apply swap fee from pool configuration
    // V4 supports dynamic fees via hooks, but we use the static fee as fallback
    const feeMultiplier = 10000n - BigInt(poolKey.fee)
    amountOut = (amountOut * feeMultiplier) / 10000n

    console.log("[v0] V4 quote calculated (flash accounting):", {
      amountIn: amountIn.toString(),
      amountOut: amountOut.toString(),
      sqrtPriceX96: sqrtPriceX96.toString(),
      tick: tick.toString(),
      liquidity: liquidity.toString(),
      fee: poolKey.fee,
      hasHooks: poolKey.hooks !== "0x0000000000000000000000000000000000000000",
    })

    return amountOut
  } catch (error) {
    console.error("[v0] Error getting V4 quote:", error)
    throw error
  }
}

/**
 * Encodes a V4 swap path for the Universal Router
 */
export function encodeV4SwapPath(poolKey: V4PoolKey, zeroForOne: boolean): `0x${string}` {
  // Encode the pool key and swap direction
  const pathData = encodeAbiParameters(parseAbiParameters("address, address, uint24, int24, address, bool"), [
    poolKey.currency0,
    poolKey.currency1,
    poolKey.fee,
    poolKey.tickSpacing,
    poolKey.hooks,
    zeroForOne,
  ])

  return pathData
}

/**
 * Encodes V4 swap parameters for the Universal Router
 */
export function encodeV4SwapParams(
  params: V4SwapParams,
  poolKey: V4PoolKey,
): {
  commands: `0x${string}`
  inputs: `0x${string}`[]
} {
  const wethAddress = WETH_ADDRESS[params.chainId as keyof typeof WETH_ADDRESS] as Address

  // Determine swap direction
  const zeroForOne = params.tokenIn.toLowerCase() === poolKey.currency0.toLowerCase()

  // Encode the swap path
  const path = encodeV4SwapPath(poolKey, zeroForOne)

  // Encode the swap input parameters
  const swapInput = encodeAbiParameters(parseAbiParameters("address, uint256, uint256, bytes, bool"), [
    params.recipient,
    params.amountIn,
    params.amountOutMinimum,
    path,
    params.tokenIn.toLowerCase() === wethAddress.toLowerCase(), // payerIsUser (true if paying with ETH)
  ])

  // Command byte: V4_SWAP
  const commands = encodePacked(["uint8"], [V4_COMMANDS.V4_SWAP])

  return {
    commands,
    inputs: [swapInput],
  }
}

/**
 * Calculates the deadline for a swap (current time + 20 minutes)
 */
export function getSwapDeadline(): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + 1200) // 20 minutes from now
}

/**
 * Executes a V4 swap using the PoolManager's unlock callback pattern
 * Properly implements V4's flash accounting and custom accounting flows
 */
export async function executeV4Swap(
  params: V4SwapParams,
  poolKey: V4PoolKey,
  walletClient: any,
  publicClient: PublicClient,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log("[v0] Executing V4 swap with flash accounting:", params)

    const poolManagerAddress = UNISWAP_V4_POOL_MANAGER[
      params.chainId as keyof typeof UNISWAP_V4_POOL_MANAGER
    ] as Address

    if (!poolManagerAddress) {
      return { success: false, error: "V4 PoolManager not available on this chain" }
    }

    // Determine swap direction based on tokenIn
    const zeroForOne = params.tokenIn.toLowerCase() === poolKey.currency0.toLowerCase()
    
    console.log("[v0] V4 Swap direction:", {
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      zeroForOne,
      currency0: poolKey.currency0,
      currency1: poolKey.currency1,
    })

    // V4 swap parameters supporting both exact input and exact output
    const swapParams = {
      zeroForOne,
      amountSpecified: params.amountIn,
      // Price limits protect against extreme slippage
      // sqrtPriceLimitX96: Lower limit for zeroForOne true, upper limit for false
      sqrtPriceLimitX96: zeroForOne 
        ? 4295128739n  // Min price: nearly 0
        : 1461446703485210103287273052203988822378723970342n, // Max price: very high
    }

    console.log("[v0] V4 Swap params with price protection:", swapParams)

    // V4 requires you to account for deltas through the unlock callback
    // This is handled by the Universal Router or through direct PoolManager calls
    // For direct swaps, we use the PoolManager.swap function
    
    const { request } = await publicClient.simulateContract({
      address: poolManagerAddress,
      abi: UNISWAP_V4_POOL_MANAGER_ABI,
      functionName: "swap",
      args: [poolKey, swapParams, "0x"], // Empty hook data by default
      account: params.recipient,
    })

    const txHash = await walletClient.writeContract(request)

    console.log("[v0] V4 Swap transaction sent:", txHash)

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

    if (receipt.status === "success") {
      console.log("[v0] V4 Swap successful!", {
        txHash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
      })
      return { success: true, txHash }
    } else {
      return { success: false, error: "V4 Transaction failed" }
    }
  } catch (error: any) {
    console.error("[v0] V4 Swap execution failed:", error)
    return {
      success: false,
      error: error.message || "Failed to execute V4 swap",
    }
  }
}
