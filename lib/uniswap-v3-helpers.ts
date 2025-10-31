/**
 * Uniswap V3 Helper Functions
 * Utilities for price calculations and pool initialization
 */

/**
 * Encode a price as sqrtPriceX96 for Uniswap V3 pool initialization
 * @param price - The price as token1/token0 (e.g., if 1 TOKEN = 0.6 USI, price = 0.6)
 * @returns sqrtPriceX96 as a bigint
 *
 * Formula: sqrtPriceX96 = sqrt(price) * 2^96
 *
 * Example:
 * - If 1 NEWTOKEN = 0.6 USI, then price = 0.6
 * - sqrtPriceX96 = sqrt(0.6) * 2^96 = 0.7746 * 79228162514264337593543950336
 * - sqrtPriceX96 ≈ 61374856475597396682053120000
 */
export function encodePriceSqrt(price: number): bigint {
  // Calculate sqrt(price)
  const sqrtPrice = Math.sqrt(price)

  // 2^96 = 79228162514264337593543950336
  const Q96 = 2n ** 96n

  // Convert to bigint with precision
  // We multiply by 10^18 first to maintain precision, then divide after
  const precision = 10n ** 18n
  const sqrtPriceBigInt = BigInt(Math.floor(sqrtPrice * Number(precision)))

  // sqrtPriceX96 = sqrtPrice * 2^96
  const sqrtPriceX96 = (sqrtPriceBigInt * Q96) / precision

  return sqrtPriceX96
}

/**
 * Calculate the required amounts for a Uniswap V3 pool
 * @param totalSupply - Total supply of the new token
 * @param targetMcUsd - Target market cap in USD
 * @param usiPriceUsd - Current USI price in USD
 * @returns Object with token amounts and price info
 */
export function calculatePoolAmounts(
  totalSupply: number,
  targetMcUsd: number,
  usiPriceUsd: number,
): {
  newTokenAmount: bigint
  usiAmount: bigint
  pricePerToken: number
  tokenPerUsi: number
} {
  // Price per new token = targetMC / totalSupply
  const pricePerToken = targetMcUsd / totalSupply

  // Token price in USI = (pricePerTokenUsd / usiPriceUsd)
  const tokenPerUsi = pricePerToken / usiPriceUsd

  // Required USI = totalSupply * tokenPerUsi
  const requiredUsi = totalSupply * tokenPerUsi

  // Convert to bigint (18 decimals)
  const newTokenAmount = BigInt(Math.floor(totalSupply * 1e18))
  const usiAmount = BigInt(Math.floor(requiredUsi * 1e18))

  return {
    newTokenAmount,
    usiAmount,
    pricePerToken,
    tokenPerUsi,
  }
}

/**
 * Determine token0 and token1 based on address sorting
 * Uniswap V3 requires token0 < token1 (lexicographically)
 */
export function sortTokens(
  tokenA: string,
  tokenB: string,
): {
  token0: string
  token1: string
  isToken0First: boolean
} {
  const isToken0First = tokenA.toLowerCase() < tokenB.toLowerCase()

  return {
    token0: isToken0First ? tokenA : tokenB,
    token1: isToken0First ? tokenB : tokenA,
    isToken0First,
  }
}

/**
 * Calculate sqrtPriceX96 for pool initialization
 * Handles token ordering automatically
 */
export function calculateSqrtPriceX96(
  tokenA: string,
  tokenB: string,
  priceAPerB: number,
): {
  sqrtPriceX96: bigint
  token0: string
  token1: string
} {
  const { token0, token1, isToken0First } = sortTokens(tokenA, tokenB)

  // If tokenA is token0, price is correct
  // If tokenA is token1, we need to invert the price
  const price = isToken0First ? priceAPerB : 1 / priceAPerB

  return {
    sqrtPriceX96: encodePriceSqrt(price),
    token0,
    token1,
  }
}
