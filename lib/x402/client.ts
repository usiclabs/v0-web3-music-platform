export interface X402PaymentInstructions {
  scheme: string
  network: string
  token: string
  amount: string
  recipient: string
  chainId: number
  metadata: {
    trackId: string
    trackTitle: string
    artistName: string
    chunkIndex: number
    totalChunks: number
    chunkDuration: number
    builderCode?: string
  }
}

export interface X402PaymentPayload {
  scheme: string
  network: string
  chainId: number
  authorization: {
    from: string
    to: string
    value: string
    validAfter: number
    validBefore: number
    nonce: string
    v: number
    r: string
    s: string
  }
  builderCode?: string
}

export interface X402Session {
  walletAddress: string
  tracksPurchased: string[]
  expiresAt: number
  signature: string
  chainId: number
  createdAt: number
}

const pendingRequests = new Map<string, Promise<any>>()
const activeSessions = new Map<string, X402Session>()

function deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  const existing = pendingRequests.get(key)
  if (existing) {
    console.log("[v0] Reusing existing request for:", key)
    return existing as Promise<T>
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, promise)
  return promise
}

// Request a chunk and get payment instructions
export async function requestChunk(
  trackId: string,
  chunkIndex: number,
  chainId?: number,
  builderCode?: string,
): Promise<X402PaymentInstructions> {
  const requestKey = `chunk-${trackId}-${chunkIndex}-${chainId || "default"}`

  return deduplicateRequest(requestKey, async () => {
    const url = new URL(`/api/x402/stream/${trackId}`, window.location.origin)
    url.searchParams.set("chunk", chunkIndex.toString())
    if (chainId) {
      url.searchParams.set("chainId", chainId.toString())
    }
    if (builderCode) {
      url.searchParams.set("builderCode", builderCode)
    }

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (response.status !== 402) {
      throw new Error("Expected 402 Payment Required response")
    }

    const data = await response.json()
    return data.payment
  })
}

// Verify payment with X402 facilitator
export async function verifyPayment(paymentPayload: X402PaymentPayload): Promise<boolean> {
  const verifyKey = `verify-${paymentPayload.authorization.nonce}`

  return deduplicateRequest(verifyKey, async () => {
    const response = await fetch("/api/x402/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentPayload),
      signal: AbortSignal.timeout(60000), // 60 second timeout for mobile
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Verification failed")
    }

    const result = await response.json()
    return result.verified === true
  })
}

// Settle payment and unlock chunk
export async function settlePayment(
  paymentPayload: X402PaymentPayload,
  trackId: string,
  listenerAddress: string,
  chunkIndex: number,
): Promise<{ success: boolean; chunkUnlocked: number; txHash?: string; sessionCreated?: boolean }> {
  const settleKey = `settle-${paymentPayload.authorization.nonce}`

  return deduplicateRequest(settleKey, async () => {
    const response = await fetch("/api/x402/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentPayload,
        trackId,
        listenerAddress,
        chunkIndex,
        builderCode: paymentPayload.builderCode,
      }),
      signal: AbortSignal.timeout(90000), // 90 second timeout for on-chain settlement
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.details || "Payment settlement failed")
    }

    const result = await response.json()

    if (result.success) {
      updateSession(listenerAddress, trackId, paymentPayload.chainId)
    }

    return result
  })
}

export async function checkTrackOwnership(walletAddress: string, trackId: string): Promise<boolean> {
  try {
    const session = activeSessions.get(walletAddress.toLowerCase())

    // Check session first
    if (session && session.expiresAt > Date.now() && session.tracksPurchased.includes(trackId)) {
      console.log("[v0] Track ownership verified via session:", trackId)
      return true
    }

    // Fall back to database check
    const response = await fetch(`/api/x402/ownership?address=${walletAddress}&trackId=${trackId}`)
    if (response.ok) {
      const { owns } = await response.json()

      // Update session if they own it
      if (owns && session) {
        if (!session.tracksPurchased.includes(trackId)) {
          session.tracksPurchased.push(trackId)
        }
      }

      return owns
    }

    return false
  } catch (error) {
    console.error("[v0] Failed to check track ownership:", error)
    return false
  }
}

export function updateSession(walletAddress: string, trackId: string, chainId: number, signature?: string): void {
  const key = walletAddress.toLowerCase()
  const existing = activeSessions.get(key)

  const session: X402Session = {
    walletAddress,
    tracksPurchased: existing ? [...existing.tracksPurchased, trackId] : [trackId],
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    signature: signature || existing?.signature || "",
    chainId,
    createdAt: existing?.createdAt || Date.now(),
  }

  // Deduplicate track IDs
  session.tracksPurchased = [...new Set(session.tracksPurchased)]

  activeSessions.set(key, session)
  console.log("[v0] Session updated for wallet:", walletAddress, "- Tracks:", session.tracksPurchased.length)
}

export function getSession(walletAddress: string): X402Session | null {
  const session = activeSessions.get(walletAddress.toLowerCase())

  if (session && session.expiresAt > Date.now()) {
    return session
  }

  // Clean up expired session
  if (session) {
    activeSessions.delete(walletAddress.toLowerCase())
  }

  return null
}

export async function checkPaymentStatus(
  nonce: string,
): Promise<{ pending: boolean; settled: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/x402/status?nonce=${nonce}`)
    if (!response.ok) {
      return { pending: false, settled: false, error: "Failed to check status" }
    }
    return response.json()
  } catch (error) {
    console.error("[v0] Failed to check payment status:", error)
    return { pending: false, settled: false, error: "Network error" }
  }
}
