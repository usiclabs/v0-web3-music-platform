/**
 * FOMO Mode Engine - The Ultimate Market Making Strategy
 *
 * This engine leverages deep understanding of trading psychology to create
 * buying pressure patterns that attract organic buyers and reverse chart dips.
 *
 * Key Psychological Principles:
 * 1. Loss Aversion - Traders fear missing gains more than losing money
 * 2. Social Proof - Large buy walls signal confidence
 * 3. Momentum Chasing - Green candles attract momentum traders
 * 4. Support Level Psychology - Visible floors create safety perception
 * 5. Breakout Anticipation - Accumulation patterns signal imminent moves
 */

import { parseEther } from "viem"

export interface FOMOPattern {
  name: string
  description: string
  phases: FOMOPhase[]
  expectedImpact: string
  psychologicalTrigger: string
}

export interface FOMOPhase {
  type: "accumulate" | "hold" | "push" | "consolidate" | "breakout" | "absorb_sells"
  duration: number // in minutes
  buyMultiplier: number // relative to base amount
  sellMultiplier: number // 0 = no sells
  walletRotation: "sequential" | "random" | "clustered"
  timing: "steady" | "accelerating" | "decelerating" | "random_natural"
  volumeProfile: "increasing" | "decreasing" | "wave" | "spike"
}

export interface FOMOExecutionPlan {
  pattern: FOMOPattern
  currentPhase: number
  phaseStartTime: number
  tradesExecuted: number
  totalBuyVolume: bigint
  totalSellVolume: bigint
  priceAtStart: number
  currentPrice: number
  buyPressureRatio: number
}

// The 5 Master FOMO Patterns - Each exploits different psychological triggers
export const FOMO_PATTERNS: Record<string, FOMOPattern> = {
  // Pattern 1: Stealth Accumulation -> Breakout
  // Psychology: Creates "smart money is buying" narrative
  accumulation: {
    name: "Stealth Accumulation",
    description: "Quiet accumulation followed by explosive breakout - mimics institutional buying",
    psychologicalTrigger: "Smart money detection - traders see large buys with no sells and FOMO in",
    expectedImpact: "Creates 'hidden whale' narrative that attracts copy-traders",
    phases: [
      {
        type: "accumulate",
        duration: 30,
        buyMultiplier: 0.5, // Small, steady buys
        sellMultiplier: 0,
        walletRotation: "random",
        timing: "random_natural",
        volumeProfile: "increasing",
      },
      {
        type: "hold",
        duration: 10,
        buyMultiplier: 0.2,
        sellMultiplier: 0,
        walletRotation: "sequential",
        timing: "steady",
        volumeProfile: "decreasing",
      },
      {
        type: "push",
        duration: 5,
        buyMultiplier: 3.0, // Large buys to trigger breakout
        sellMultiplier: 0,
        walletRotation: "clustered",
        timing: "accelerating",
        volumeProfile: "spike",
      },
      {
        type: "consolidate",
        duration: 15,
        buyMultiplier: 1.0,
        sellMultiplier: 0.3, // Small sells to appear organic
        walletRotation: "random",
        timing: "random_natural",
        volumeProfile: "wave",
      },
    ],
  },

  // Pattern 2: Momentum Cascade
  // Psychology: Exploits momentum trading and green candle chasing
  breakout: {
    name: "Momentum Cascade",
    description: "Rapid sequential buys creating unstoppable upward momentum",
    psychologicalTrigger: "Green candle cascade triggers momentum traders' fear of missing the pump",
    expectedImpact: "Creates FOMO spiral as each green candle attracts new buyers",
    phases: [
      {
        type: "accumulate",
        duration: 10,
        buyMultiplier: 0.8,
        sellMultiplier: 0,
        walletRotation: "random",
        timing: "steady",
        volumeProfile: "increasing",
      },
      {
        type: "push",
        duration: 3,
        buyMultiplier: 2.5,
        sellMultiplier: 0,
        walletRotation: "clustered",
        timing: "accelerating",
        volumeProfile: "spike",
      },
      {
        type: "push",
        duration: 3,
        buyMultiplier: 3.5,
        sellMultiplier: 0,
        walletRotation: "clustered",
        timing: "accelerating",
        volumeProfile: "spike",
      },
      {
        type: "push",
        duration: 3,
        buyMultiplier: 4.0,
        sellMultiplier: 0,
        walletRotation: "sequential",
        timing: "accelerating",
        volumeProfile: "spike",
      },
      {
        type: "consolidate",
        duration: 20,
        buyMultiplier: 1.5,
        sellMultiplier: 0.5,
        walletRotation: "random",
        timing: "random_natural",
        volumeProfile: "wave",
      },
    ],
  },

  // Pattern 3: Support Floor Builder
  // Psychology: Creates visible price floor that gives buyers confidence
  momentum: {
    name: "Support Floor Builder",
    description: "Establishes visible price support that attracts bottom buyers",
    psychologicalTrigger: "Traders see consistent buying at a level, perceive it as 'safe' entry",
    expectedImpact: "Creates self-fulfilling support level as others front-run expected bounces",
    phases: [
      {
        type: "absorb_sells",
        duration: 20,
        buyMultiplier: 1.2,
        sellMultiplier: 0,
        walletRotation: "clustered",
        timing: "steady",
        volumeProfile: "wave",
      },
      {
        type: "accumulate",
        duration: 25,
        buyMultiplier: 0.8,
        sellMultiplier: 0.1,
        walletRotation: "random",
        timing: "random_natural",
        volumeProfile: "increasing",
      },
      {
        type: "push",
        duration: 8,
        buyMultiplier: 2.0,
        sellMultiplier: 0,
        walletRotation: "sequential",
        timing: "accelerating",
        volumeProfile: "spike",
      },
      {
        type: "hold",
        duration: 15,
        buyMultiplier: 0.6,
        sellMultiplier: 0.2,
        walletRotation: "random",
        timing: "steady",
        volumeProfile: "decreasing",
      },
    ],
  },

  // Pattern 4: Dip Reversal Engine
  // Psychology: Exploits "buy the dip" mentality and bottom-fishing instincts
  reversal: {
    name: "Dip Reversal Engine",
    description: "Aggressive dip buying that flips chart sentiment from bearish to bullish",
    psychologicalTrigger: "Visible dip buying signals 'smart money accumulating' - bears get trapped",
    expectedImpact: "Converts panic sellers into FOMO buyers as reversal becomes apparent",
    phases: [
      {
        type: "absorb_sells",
        duration: 15,
        buyMultiplier: 2.0, // Aggressive absorption of sell pressure
        sellMultiplier: 0,
        walletRotation: "clustered",
        timing: "steady",
        volumeProfile: "spike",
      },
      {
        type: "absorb_sells",
        duration: 10,
        buyMultiplier: 2.5,
        sellMultiplier: 0,
        walletRotation: "random",
        timing: "accelerating",
        volumeProfile: "increasing",
      },
      {
        type: "push",
        duration: 5,
        buyMultiplier: 4.0, // Massive push to confirm reversal
        sellMultiplier: 0,
        walletRotation: "sequential",
        timing: "accelerating",
        volumeProfile: "spike",
      },
      {
        type: "push",
        duration: 5,
        buyMultiplier: 3.0,
        sellMultiplier: 0,
        walletRotation: "clustered",
        timing: "accelerating",
        volumeProfile: "spike",
      },
      {
        type: "consolidate",
        duration: 20,
        buyMultiplier: 1.0,
        sellMultiplier: 0.3,
        walletRotation: "random",
        timing: "random_natural",
        volumeProfile: "wave",
      },
    ],
  },

  // Pattern 5: Whale Signal Mimicry
  // Psychology: Mimics large whale buys that retail traders always chase
  whale_signal: {
    name: "Whale Signal Mimicry",
    description: "Simulates whale accumulation patterns that trigger retail FOMO",
    psychologicalTrigger: "Large single buys signal 'insider knowledge' - retail rushes to follow",
    expectedImpact: "Creates 'whale alert' moments that go viral on trading communities",
    phases: [
      {
        type: "hold",
        duration: 5,
        buyMultiplier: 0.1,
        sellMultiplier: 0,
        walletRotation: "random",
        timing: "steady",
        volumeProfile: "decreasing",
      },
      {
        type: "push",
        duration: 1, // Single massive buy
        buyMultiplier: 8.0,
        sellMultiplier: 0,
        walletRotation: "sequential",
        timing: "steady",
        volumeProfile: "spike",
      },
      {
        type: "hold",
        duration: 10,
        buyMultiplier: 0.2,
        sellMultiplier: 0,
        walletRotation: "random",
        timing: "random_natural",
        volumeProfile: "decreasing",
      },
      {
        type: "push",
        duration: 1,
        buyMultiplier: 6.0,
        sellMultiplier: 0,
        walletRotation: "sequential",
        timing: "steady",
        volumeProfile: "spike",
      },
      {
        type: "accumulate",
        duration: 20,
        buyMultiplier: 1.0,
        sellMultiplier: 0.2,
        walletRotation: "random",
        timing: "random_natural",
        volumeProfile: "wave",
      },
    ],
  },

  // Pattern 6: Apex Predator - The Ultimate MM Strategy
  // Psychology: Combines ALL psychological triggers in a coordinated assault
  apex_predator: {
    name: "Apex Predator",
    description:
      "The ultimate MM strategy - combines all psychological triggers for maximum buyer attraction and chart reversal",
    psychologicalTrigger:
      "Multi-layered psychological warfare: scarcity, social proof, momentum, fear, greed, and herd mentality all triggered simultaneously",
    expectedImpact:
      "Creates irresistible FOMO cascade - organic buyers rush in, shorts get liquidated, sentiment flips from extreme fear to extreme greed",
    phases: [
      // Phase 1: Silent Accumulation (Create the 'floor')
      {
        type: "absorb_sells",
        duration: 20,
        buyMultiplier: 1.5,
        sellMultiplier: 0,
        walletRotation: "random",
        timing: "random_natural",
        volumeProfile: "increasing",
      },
      // Phase 2: Whale Signal (Trigger whale watchers)
      {
        type: "push",
        duration: 2,
        buyMultiplier: 10.0, // Massive single buy
        sellMultiplier: 0,
        walletRotation: "sequential",
        timing: "steady",
        volumeProfile: "spike",
      },
      // Phase 3: Brief Pause (Let FOMO build)
      {
        type: "hold",
        duration: 5,
        buyMultiplier: 0.1,
        sellMultiplier: 0,
        walletRotation: "random",
        timing: "decelerating",
        volumeProfile: "decreasing",
      },
      // Phase 4: Momentum Cascade (Green candle parade)
      {
        type: "push",
        duration: 3,
        buyMultiplier: 3.0,
        sellMultiplier: 0,
        walletRotation: "clustered",
        timing: "accelerating",
        volumeProfile: "spike",
      },
      {
        type: "push",
        duration: 3,
        buyMultiplier: 4.0,
        sellMultiplier: 0,
        walletRotation: "clustered",
        timing: "accelerating",
        volumeProfile: "spike",
      },
      {
        type: "push",
        duration: 2,
        buyMultiplier: 5.0,
        sellMultiplier: 0,
        walletRotation: "sequential",
        timing: "accelerating",
        volumeProfile: "spike",
      },
      // Phase 5: Second Whale Signal (Confirm the move)
      {
        type: "push",
        duration: 1,
        buyMultiplier: 8.0,
        sellMultiplier: 0,
        walletRotation: "sequential",
        timing: "steady",
        volumeProfile: "spike",
      },
      // Phase 6: Support Establishment (Create new floor)
      {
        type: "absorb_sells",
        duration: 15,
        buyMultiplier: 2.0,
        sellMultiplier: 0,
        walletRotation: "clustered",
        timing: "steady",
        volumeProfile: "wave",
      },
      // Phase 7: Controlled Consolidation (Appear organic)
      {
        type: "consolidate",
        duration: 25,
        buyMultiplier: 1.2,
        sellMultiplier: 0.2, // Tiny sells to appear natural
        walletRotation: "random",
        timing: "random_natural",
        volumeProfile: "wave",
      },
      // Phase 8: Final Push (Breakout confirmation)
      {
        type: "push",
        duration: 5,
        buyMultiplier: 6.0,
        sellMultiplier: 0,
        walletRotation: "sequential",
        timing: "accelerating",
        volumeProfile: "spike",
      },
    ],
  },
}

/**
 * Calculate optimal timing between trades to appear natural
 * Uses golden ratio and fibonacci-like spacing for organic feel
 */
export function calculateNaturalTiming(
  timing: FOMOPhase["timing"],
  baseIntervalMs: number,
  tradeIndex: number,
  totalTrades: number,
): number {
  const goldenRatio = 1.618
  const randomFactor = 0.7 + Math.random() * 0.6 // 70-130% variance

  switch (timing) {
    case "steady":
      return baseIntervalMs * randomFactor

    case "accelerating":
      // Each trade comes faster - creates urgency
      const accelerationFactor = Math.pow(0.85, tradeIndex)
      return baseIntervalMs * accelerationFactor * randomFactor

    case "decelerating":
      // Trades slow down - signals confidence/holding
      const decelerationFactor = Math.pow(1.15, tradeIndex)
      return baseIntervalMs * decelerationFactor * randomFactor

    case "random_natural":
      // Fibonacci-inspired random delays that feel organic
      const fibFactors = [1, 1, 2, 3, 5, 8, 13]
      const fibIndex = tradeIndex % fibFactors.length
      const fibMultiplier = fibFactors[fibIndex] / 5 // Normalize to ~0.2-2.6
      return baseIntervalMs * fibMultiplier * randomFactor

    default:
      return baseIntervalMs * randomFactor
  }
}

/**
 * Calculate buy amount for current phase with psychological sizing
 * Uses varying sizes to appear like different traders
 */
export function calculateFOMOBuyAmount(
  baseBuyAmountEth: string,
  phase: FOMOPhase,
  intensity: number, // 1-10
  tradeIndex: number,
): bigint {
  const baseAmount = parseEther(baseBuyAmountEth)
  const intensityMultiplier = 0.5 + (intensity / 10) * 1.5 // 0.5x to 2x based on intensity

  // Apply phase multiplier
  let amount = BigInt(Math.floor(Number(baseAmount) * phase.buyMultiplier * intensityMultiplier))

  // Add variance based on volume profile
  switch (phase.volumeProfile) {
    case "increasing":
      amount = BigInt(Math.floor(Number(amount) * (1 + tradeIndex * 0.1)))
      break
    case "decreasing":
      amount = BigInt(Math.floor(Number(amount) * Math.max(0.3, 1 - tradeIndex * 0.1)))
      break
    case "wave":
      const waveMultiplier = 0.7 + Math.sin(tradeIndex * 0.5) * 0.6
      amount = BigInt(Math.floor(Number(amount) * waveMultiplier))
      break
    case "spike":
      // Random spikes within the phase
      const spikeChance = Math.random()
      if (spikeChance > 0.7) {
        amount = BigInt(Math.floor(Number(amount) * (1.5 + Math.random())))
      }
      break
  }

  // Add final randomness for natural appearance (±20%)
  const finalRandomness = 0.8 + Math.random() * 0.4
  return BigInt(Math.floor(Number(amount) * finalRandomness))
}

/**
 * Select which wallet to use based on rotation strategy
 * Different strategies create different on-chain patterns
 */
export function selectWalletForFOMO(
  wallets: { address: string; index: number }[],
  rotation: FOMOPhase["walletRotation"],
  tradeIndex: number,
  lastUsedIndex: number,
): number {
  switch (rotation) {
    case "sequential":
      // Use wallets in order - creates "coordinated" appearance
      return (lastUsedIndex + 1) % wallets.length

    case "random":
      // Random selection - appears like unrelated traders
      return Math.floor(Math.random() * wallets.length)

    case "clustered":
      // Use small groups of wallets together - appears like whale + followers
      const clusterSize = Math.min(3, wallets.length)
      const clusterStart = (Math.floor(tradeIndex / 5) * clusterSize) % wallets.length
      return (clusterStart + (tradeIndex % clusterSize)) % wallets.length

    default:
      return Math.floor(Math.random() * wallets.length)
  }
}

/**
 * Generate execution plan for a FOMO pattern
 */
export function generateFOMOExecutionPlan(patternKey: string, startPrice: number): FOMOExecutionPlan {
  const pattern = FOMO_PATTERNS[patternKey] || FOMO_PATTERNS.reversal

  return {
    pattern,
    currentPhase: 0,
    phaseStartTime: Date.now(),
    tradesExecuted: 0,
    totalBuyVolume: 0n,
    totalSellVolume: 0n,
    priceAtStart: startPrice,
    currentPrice: startPrice,
    buyPressureRatio: 1.0,
  }
}

/**
 * Analyze current market conditions to select optimal FOMO pattern
 */
export function selectOptimalFOMOPattern(
  priceChange24h: number,
  volume24h: number,
  currentPrice: number,
  allTimeHigh: number,
): string {
  const priceFromATH = ((allTimeHigh - currentPrice) / allTimeHigh) * 100

  // If in severe dip (>50% from ATH), deploy Apex Predator
  if (priceFromATH > 50) {
    return "apex_predator"
  }

  // If in heavy dip (>30% from ATH), use reversal engine
  if (priceFromATH > 30) {
    return "reversal"
  }

  // If bleeding slowly, use support floor builder
  if (priceChange24h < -10 && priceChange24h > -30) {
    return "momentum"
  }

  // If volume is low, use whale signal to wake up the market
  if (volume24h < 1000) {
    return "whale_signal"
  }

  // If slightly negative or flat, use accumulation -> breakout
  if (priceChange24h >= -10 && priceChange24h <= 5) {
    return "accumulation"
  }

  // If already positive momentum, amplify with cascade
  return "breakout"
}

export const FOMO_MODE_DESCRIPTION = `
FOMO Mode - The Ultimate Market Making Strategy

This mode leverages deep understanding of trading psychology to create 
buying pressure patterns that attract organic buyers and reverse chart dips.

5 Master Patterns:
1. Stealth Accumulation - Quiet buys followed by explosive breakout
2. Momentum Cascade - Rapid sequential buys creating unstoppable momentum  
3. Support Floor Builder - Establishes visible price support
4. Dip Reversal Engine - Aggressive dip buying that flips sentiment
5. Whale Signal Mimicry - Simulates whale buys that trigger retail FOMO

Each pattern exploits proven psychological triggers:
- Loss Aversion (fear of missing gains)
- Social Proof (large buys signal confidence)
- Momentum Chasing (green candles attract traders)
- Support Psychology (visible floors create safety)
- Breakout Anticipation (accumulation signals moves)
`

export const APEX_PREDATOR_DESCRIPTION = `
APEX PREDATOR MODE - The Ultimate Market Making Strategy

This is the most sophisticated MM strategy ever developed, combining ALL 
psychological triggers in a coordinated multi-phase assault designed to:

1. ABSORB all sell pressure and establish an unbreakable floor
2. TRIGGER whale-watching bots with massive coordinated buys
3. CREATE cascading green candles that attract momentum traders
4. ESTABLISH new support levels that give buyers confidence
5. FORCE short liquidations as price rapidly appreciates
6. FLIP sentiment from extreme fear to extreme greed

The 10-Phase Execution:
- Phase 1: Silent floor establishment (absorb all sells)
- Phase 2: Whale signal (massive buy triggers alerts)
- Phase 3: Strategic pause (let FOMO build)
- Phase 4-6: Momentum cascade (unstoppable green parade)
- Phase 7: Second whale confirmation
- Phase 8: New support establishment
- Phase 9: Organic consolidation appearance
- Phase 10: Breakout confirmation push

Psychological Triggers Exploited:
- Loss Aversion (fear of missing the reversal)
- Social Proof (whale buys = smart money signal)
- Momentum Psychology (green candles attract chasers)
- Support Psychology (visible floor = safe entry)
- Scarcity Mindset (limited time to buy the dip)
- Herd Mentality (everyone is buying)
- FOMO Cascade (each buyer triggers more buyers)

WARNING: This mode uses maximum resources and is designed for 
critical chart reversals. Use with adequate ETH reserves.
`
