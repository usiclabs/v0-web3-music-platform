// Gas subsidy information for the platform
// Tracks whether the gas subsidy pool has funds available

interface GasSubsidyInfo {
  available: boolean
  remainingFunds?: string
  dailyLimit?: string
  userLimit?: string
}

/**
 * Check if gas subsidy is available for users
 * This function checks the gas subsidy pool to see if there are funds available
 * to sponsor gasless transactions for users
 */
export async function getGasSubsidyInfo(): Promise<GasSubsidyInfo> {
  try {
    const response = await fetch("/api/gas-subsidy/info")

    if (!response.ok) {
      console.warn("[v0] Failed to fetch gas subsidy info, assuming available")
      return { available: true }
    }

    const data = await response.json()
    return {
      available: data.available ?? true,
      remainingFunds: data.remainingFunds,
      dailyLimit: data.dailyLimit,
      userLimit: data.userLimit,
    }
  } catch (error) {
    console.warn("[v0] Error fetching gas subsidy info:", error)
    // Default to available if we can't check
    return { available: true }
  }
}
