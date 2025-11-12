import type { WalletClient } from "viem"
import { base } from "wagmi/chains"

export interface WalletCapabilities {
  sendCalls?: {
    supported: boolean
  }
  atomicBatch?: {
    supported: boolean
  }
}

export interface BatchedCall {
  to: `0x${string}`
  data: `0x${string}`
  value?: bigint
}

export interface SendCallsParams {
  account: `0x${string}`
  calls: BatchedCall[]
  chainId?: number
  capabilities?: Record<string, any>
}

export interface SendCallsResult {
  id: string
  txHash?: string
}

export interface CallsStatus {
  status: "pending" | "confirmed" | "failed"
  receipts?: Array<{
    logs: any[]
    status: "success" | "reverted"
    blockHash: string
    blockNumber: string
    gasUsed: string
    transactionHash: string
  }>
}

/**
 * Check if the connected wallet supports EIP-5792 wallet_sendCalls
 */
export async function checkEIP5792Support(walletClient: WalletClient): Promise<boolean> {
  try {
    if (!walletClient.request) return false

    // Try to call wallet_getCapabilities
    const capabilities = (await walletClient.request({
      method: "wallet_getCapabilities" as any,
      params: [walletClient.account?.address],
    } as any)) as Record<number, WalletCapabilities>

    console.log("[v0] [EIP-5792] Wallet capabilities:", capabilities)

    // Check if sendCalls is supported on Base chain
    const baseCapabilities = capabilities[base.id]
    return baseCapabilities?.sendCalls?.supported === true
  } catch (error) {
    console.log("[v0] [EIP-5792] Capability check failed:", error)
    return false
  }
}

/**
 * Send batched calls using EIP-5792 wallet_sendCalls
 */
export async function sendBatchedCalls(walletClient: WalletClient, params: SendCallsParams): Promise<SendCallsResult> {
  if (!walletClient.request) {
    throw new Error("Wallet does not support EIP-5792")
  }

  try {
    console.log("[v0] [EIP-5792] Sending batched calls:", params)

    const result = (await walletClient.request({
      method: "wallet_sendCalls" as any,
      params: [
        {
          version: "1.0",
          chainId: `0x${(params.chainId || base.id).toString(16)}`,
          from: params.account,
          calls: params.calls.map((call) => ({
            to: call.to,
            data: call.data,
            value: call.value ? `0x${call.value.toString(16)}` : undefined,
          })),
          capabilities: params.capabilities,
        },
      ],
    } as any)) as string

    console.log("[v0] [EIP-5792] Batch call ID:", result)

    return {
      id: result,
    }
  } catch (error) {
    console.error("[v0] [EIP-5792] sendBatchedCalls failed:", error)
    throw error
  }
}

/**
 * Get the status of batched calls
 */
export async function getCallsStatus(walletClient: WalletClient, batchId: string): Promise<CallsStatus> {
  if (!walletClient.request) {
    throw new Error("Wallet does not support EIP-5792")
  }

  try {
    const status = (await walletClient.request({
      method: "wallet_getCallsStatus" as any,
      params: [batchId],
    } as any)) as CallsStatus

    console.log("[v0] [EIP-5792] Batch status:", status)
    return status
  } catch (error) {
    console.error("[v0] [EIP-5792] getCallsStatus failed:", error)
    throw error
  }
}

/**
 * Create USDC approve call data
 */
export function createApproveCallData(spender: `0x${string}`, amount: bigint): `0x${string}` {
  // encode approve(address spender, uint256 amount)
  const fnSelector = "0x095ea7b3" // approve function selector
  const encodedSpender = spender.slice(2).padStart(64, "0")
  const encodedAmount = amount.toString(16).padStart(64, "0")

  return `${fnSelector}${encodedSpender}${encodedAmount}` as `0x${string}`
}

/**
 * Create USDC transferWithAuthorization call data for EIP-3009
 */
export function createTransferWithAuthCallData(
  from: `0x${string}`,
  to: `0x${string}`,
  value: bigint,
  validAfter: bigint,
  validBefore: bigint,
  nonce: `0x${string}`,
  v: number,
  r: `0x${string}`,
  s: `0x${string}`,
): `0x${string}` {
  // encode transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)
  const fnSelector = "0xe3ee160e" // transferWithAuthorization function selector

  const encodedFrom = from.slice(2).padStart(64, "0")
  const encodedTo = to.slice(2).padStart(64, "0")
  const encodedValue = value.toString(16).padStart(64, "0")
  const encodedValidAfter = validAfter.toString(16).padStart(64, "0")
  const encodedValidBefore = validBefore.toString(16).padStart(64, "0")
  const encodedNonce = nonce.slice(2).padStart(64, "0")
  const encodedV = v.toString(16).padStart(64, "0")
  const encodedR = r.slice(2).padStart(64, "0")
  const encodedS = s.slice(2).padStart(64, "0")

  return `${fnSelector}${encodedFrom}${encodedTo}${encodedValue}${encodedValidAfter}${encodedValidBefore}${encodedNonce}${encodedV}${encodedR}${encodedS}` as `0x${string}`
}

/**
 * Wait for batched calls to complete
 */
export async function waitForBatchCompletion(
  walletClient: WalletClient,
  batchId: string,
  maxAttempts = 60,
  intervalMs = 2000,
): Promise<CallsStatus> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getCallsStatus(walletClient, batchId)

    if (status.status === "confirmed" || status.status === "failed") {
      return status
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error("Batch transaction timeout")
}
