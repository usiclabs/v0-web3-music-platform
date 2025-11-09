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
 */
function computePoolId(poolKey: V4PoolKey): `0x${string}` {
  // Pool ID = keccak256(abi.encode(poolKey))
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
 * Gets a quote for a V4 swap
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

    // Get current pool state using StateView
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
      throw new Error("Pool has no liquidity")
    }

    const sqrtPriceX96 = slot0[0]

    // Calculate approximate output using constant product formula
    // This is a simplified calculation - for production, use the Quoter contract
    const price = (sqrtPriceX96 * sqrtPriceX96) / 2n ** 192n
    const amountOut = zeroForOne ? (amountIn * price) / 10n ** 18n : (amountIn * 10n ** 18n) / price

    // Apply fee (use the pool's fee)
    const feeMultiplier = 10000n - BigInt(poolKey.fee) / 100n
    const amountOutAfterFee = (amountOut * feeMultiplier) / 10000n

    console.log("[v0] V4 quote calculated:", {
      amountIn: amountIn.toString(),
      amountOut: amountOutAfterFee.toString(),
      sqrtPriceX96: sqrtPriceX96.toString(),
      liquidity: liquidity.toString(),
    })

    return amountOutAfterFee
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
 * Executes a V4 swap
 */
export async function executeV4Swap(
  params: V4SwapParams,
  poolKey: V4PoolKey,
  walletClient: any,
  publicClient: PublicClient,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log("[v0] Executing V4 swap:", params)

    const poolManagerAddress = UNISWAP_V4_POOL_MANAGER[
      params.chainId as keyof typeof UNISWAP_V4_POOL_MANAGER
    ] as Address

    if (!poolManagerAddress) {
      return { success: false, error: "V4 PoolManager not available on this chain" }
    }

    // Determine swap direction
    const zeroForOne = params.tokenIn.toLowerCase() === poolKey.currency0.toLowerCase()

    // Build swap parameters for PoolManager
    const swapParams = {
      zeroForOne,
      amountSpecified: params.amountIn,
      sqrtPriceLimitX96: zeroForOne ? 4295128739n : 1461446703485210103287273052203988822378723970342n, // Min/max price limits
    }

    console.log("[v0] Swap params:", swapParams)

    // Execute swap via PoolManager
    const poolId = computePoolId(poolKey)

    const { request } = await publicClient.simulateContract({
      address: poolManagerAddress,
      abi: UNISWAP_V4_POOL_MANAGER_ABI,
      functionName: "swap",
      args: [poolKey, swapParams, "0x"],
      account: params.recipient,
    })

    const txHash = await walletClient.writeContract(request)

    console.log("[v0] Swap transaction sent:", txHash)

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

    if (receipt.status === "success") {
      console.log("[v0] Swap successful!")
      return { success: true, txHash }
    } else {
      return { success: false, error: "Transaction failed" }
    }
  } catch (error: any) {
    console.error("[v0] Swap execution failed:", error)
    return {
      success: false,
      error: error.message || "Failed to execute swap",
    }
  }
}
