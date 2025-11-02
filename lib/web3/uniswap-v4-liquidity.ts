import { encodePacked, encodeAbiParameters, parseAbiParameters, type Address } from "viem"

/**
 * Uniswap V4 Pool Key structure
 */
export interface PoolKey {
  currency0: Address
  currency1: Address
  fee: number
  tickSpacing: number
  hooks: Address
}

/**
 * V4 Position parameters for minting
 */
export interface MintPositionParams {
  poolKey: PoolKey
  tickLower: number
  tickUpper: number
  liquidity: bigint
  amount0Max: bigint
  amount1Max: bigint
  owner: Address
  hookData: `0x${string}`
}

/**
 * Encode V4 actions and parameters for modifyLiquidities
 */
export function encodeV4LiquidityActions(actions: number[], params: `0x${string}`[]): `0x${string}` {
  // Encode actions as packed bytes
  const actionsEncoded = encodePacked(
    actions.map(() => "uint256"),
    actions.map((a) => BigInt(a)),
  )

  // Encode the full unlock data
  return encodeAbiParameters(parseAbiParameters("bytes, bytes[]"), [actionsEncoded, params])
}

/**
 * Encode MINT_POSITION parameters
 */
export function encodeMintPositionParams(params: MintPositionParams): `0x${string}` {
  return encodeAbiParameters(
    parseAbiParameters(
      "(address,address,uint24,int24,address) poolKey, int24 tickLower, int24 tickUpper, uint256 liquidity, uint128 amount0Max, uint128 amount1Max, address owner, bytes hookData",
    ),
    [
      [
        params.poolKey.currency0,
        params.poolKey.currency1,
        params.poolKey.fee,
        params.poolKey.tickSpacing,
        params.poolKey.hooks,
      ],
      params.tickLower,
      params.tickUpper,
      params.liquidity,
      params.amount0Max,
      params.amount1Max,
      params.owner,
      params.hookData,
    ],
  )
}

/**
 * Encode SETTLE_PAIR parameters
 */
export function encodeSettlePairParams(currency0: Address, currency1: Address): `0x${string}` {
  return encodeAbiParameters(parseAbiParameters("address, address"), [currency0, currency1])
}

/**
 * Calculate liquidity from token amounts (simplified)
 * For production, use proper sqrt price math
 */
export function calculateLiquidity(amount0: bigint, amount1: bigint, tickLower: number, tickUpper: number): bigint {
  // Simplified calculation - in production, use proper Uniswap V3/V4 math
  // This assumes a balanced position around current price
  const tickRange = BigInt(tickUpper - tickLower)
  const avgAmount = (amount0 + amount1) / 2n
  return (avgAmount * tickRange) / 1000n
}

/**
 * Get tick spacing for fee tier
 */
export function getTickSpacing(fee: number): number {
  switch (fee) {
    case 100:
      return 1
    case 500:
      return 10
    case 3000:
      return 60
    case 10000:
      return 200
    default:
      return 60
  }
}

/**
 * Get nearest valid tick for tick spacing
 */
export function getNearestValidTick(tick: number, tickSpacing: number): number {
  return Math.round(tick / tickSpacing) * tickSpacing
}

/**
 * Compute V4 Pool ID from pool key
 */
export function computePoolId(poolKey: PoolKey): `0x${string}` {
  return encodeAbiParameters(parseAbiParameters("(address,address,uint24,int24,address)"), [
    [poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks],
  ])
}
