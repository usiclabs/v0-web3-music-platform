import useSWR from "swr"

interface EarningsPayment {
  id: string
  trackId: string
  trackTitle: string
  listenerAddress: string
  chunkIndex: number
  amountPaid: number
  txHash: string
  recordedAt: string
}

interface EarningsSummary {
  totalEarned: number
  chunksCount: number
  lastPaymentAt: string | null
  averagePerChunk: number
}

interface EarningsData {
  success: boolean
  summary: EarningsSummary
  recentPayments: EarningsPayment[]
  dailyEarnings: Record<string, number>
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

interface UseEarningsOptions {
  artistId: string
  trackId?: string
  limit?: number
  offset?: number
  refreshInterval?: number // milliseconds, default 5000ms
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

/**
 * Hook for real-time earnings updates
 * Automatically polls for new payments every 5 seconds
 */
export function useEarnings({
  artistId,
  trackId,
  limit = 50,
  offset = 0,
  refreshInterval = 5000,
}: UseEarningsOptions) {
  const params = new URLSearchParams({
    artistId,
    limit: limit.toString(),
    offset: offset.toString(),
  })

  if (trackId) {
    params.append("trackId", trackId)
  }

  const { data, error, isLoading, mutate } = useSWR<EarningsData>(
    `/api/earnings/stream?${params.toString()}`,
    fetcher,
    {
      refreshInterval, // Poll every X milliseconds
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Avoid duplicate requests within 2 seconds
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  )

  return {
    earnings: data,
    summary: data?.summary || null,
    recentPayments: data?.recentPayments || [],
    dailyEarnings: data?.dailyEarnings || {},
    isLoading,
    isError: !!error,
    error,
    mutate, // Manual refresh function
  }
}

/**
 * Format earnings data for display
 */
export function formatEarnings(amount: number, decimals = 2): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Get earnings for a specific time period
 */
export function getEarningsPeriod(
  dailyEarnings: Record<string, number>,
  startDate: Date,
  endDate: Date
): number {
  let total = 0
  const current = new Date(startDate)

  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0]
    total += dailyEarnings[dateStr] || 0
    current.setDate(current.getDate() + 1)
  }

  return total
}
