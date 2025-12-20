export interface RiskLimits {
  maxPositionSize: number // Max USDC per position
  maxPortfolioExposure: number // Max % of portfolio in one market
  maxDailyLoss: number // Max daily loss before cooldown
  minResolutionDays: number // Min days until resolution
}

export const DEFAULT_RISK_LIMITS: RiskLimits = {
  maxPositionSize: 10000, // $10K per position
  maxPortfolioExposure: 0.25, // 25% max per market
  maxDailyLoss: 500, // $500 max daily loss
  minResolutionDays: 1, // Min 1 day to resolution
}

export function validateRiskLimits(
  tradeAmount: number,
  userPortfolioValue: number,
  userDailyLoss: number,
  marketResolutionDays: number,
  limits: RiskLimits = DEFAULT_RISK_LIMITS,
): { valid: boolean; reason?: string } {
  // Check position size
  if (tradeAmount > limits.maxPositionSize) {
    return { valid: false, reason: `Position size exceeds $${limits.maxPositionSize}` }
  }

  // Check portfolio exposure
  if (userPortfolioValue > 0 && tradeAmount / userPortfolioValue > limits.maxPortfolioExposure) {
    return {
      valid: false,
      reason: `Exceeds maximum ${limits.maxPortfolioExposure * 100}% portfolio exposure`,
    }
  }

  // Check daily loss
  if (userDailyLoss + tradeAmount > limits.maxDailyLoss) {
    return {
      valid: false,
      reason: `Would exceed daily loss limit of $${limits.maxDailyLoss}`,
    }
  }

  // Check resolution timeline
  if (marketResolutionDays < limits.minResolutionDays) {
    return {
      valid: false,
      reason: `Market must have at least ${limits.minResolutionDays} days until resolution`,
    }
  }

  return { valid: true }
}

export function calculateMaxTradeSize(userPortfolioValue: number, limits: RiskLimits = DEFAULT_RISK_LIMITS): number {
  return Math.min(limits.maxPositionSize, userPortfolioValue * limits.maxPortfolioExposure)
}
