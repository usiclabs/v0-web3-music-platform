"use client"

import { useEarnings, formatEarnings } from "@/hooks/use-earnings"
import { Card } from "@/components/ui/card"
import { format } from "date-fns"
import { Spinner } from "@/components/ui/spinner"

interface EarningsDashboardProps {
  artistId: string
  trackId?: string
}

export function EarningsDashboard({ artistId, trackId }: EarningsDashboardProps) {
  const { summary, recentPayments, isLoading, isError } = useEarnings({
    artistId,
    trackId,
    refreshInterval: 5000, // Update every 5 seconds
  })

  if (isError) {
    return (
      <div className="rounded-lg border border-red-500 bg-red-50 p-4">
        <p className="text-sm text-red-800">Failed to load earnings data. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Earned */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Total Earned</p>
            {isLoading ? (
              <Spinner className="h-8 w-8" />
            ) : (
              <p className="text-2xl font-bold text-green-600">${formatEarnings(summary?.totalEarned || 0)}</p>
            )}
            <p className="text-xs text-gray-500">
              Last payment: {summary?.lastPaymentAt ? format(new Date(summary.lastPaymentAt), "PPp") : "Never"}
            </p>
          </div>
        </Card>

        {/* Chunks Played */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Chunks Played</p>
            <p className="text-2xl font-bold text-blue-600">{summary?.chunksCount || 0}</p>
            <p className="text-xs text-gray-500">
              Avg: ${formatEarnings(summary?.averagePerChunk || 0, 4)} per chunk
            </p>
          </div>
        </Card>

        {/* Revenue Rate */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Rate</p>
            <p className="text-2xl font-bold text-purple-600">${formatEarnings((summary?.averagePerChunk || 0) * 1000)}</p>
            <p className="text-xs text-gray-500">per 1000 chunks</p>
          </div>
        </Card>
      </div>

      {/* Recent Payments Table */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Recent Payments</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : recentPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-sm font-medium text-gray-600">Track</th>
                  <th className="text-left text-sm font-medium text-gray-600">Chunk</th>
                  <th className="text-left text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left text-sm font-medium text-gray-600">Time</th>
                  <th className="text-left text-sm font-medium text-gray-600">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 text-sm text-gray-900">{payment.trackTitle}</td>
                    <td className="py-3 text-sm text-gray-600">#{payment.chunkIndex}</td>
                    <td className="py-3 text-sm font-medium text-green-600">${formatEarnings(payment.amountPaid, 4)}</td>
                    <td className="py-3 text-sm text-gray-600">{format(new Date(payment.recordedAt), "PPp")}</td>
                    <td className="py-3 text-sm">
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-600">
                        {payment.txHash.slice(0, 8)}...
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">No payments yet. Streams will appear here.</p>
        )}
      </Card>
    </div>
  )
}
