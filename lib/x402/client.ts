export interface X402PaymentInstructions {
  scheme: string
  network: string
  token: string
  amount: string
  recipient: string
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

const pendingRequests = new Map<string, Promise<any>>()

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
export async function requestChunk(trackId: string, chunkIndex: number, builderCode?: string): Promise<X402PaymentInstructions> {
  const requestKey = `chunk-${trackId}-${chunkIndex}`
  
  return deduplicateRequest(requestKey, async () => {
    const url = new URL(`/api/x402/stream/${trackId}`, window.location.origin)
    url.searchParams.set('chunk', chunkIndex.toString())
    if (builderCode) {
      url.searchParams.set('builderCode', builderCode)
    }
    
    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000) // 10 second timeout
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
      signal: AbortSignal.timeout(60000) // 60 second timeout for mobile
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
): Promise<{ success: boolean; chunkUnlocked: number; txHash?: string }> {
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
      signal: AbortSignal.timeout(90000) // 90 second timeout for on-chain settlement
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.details || "Payment settlement failed")
    }

    return response.json()
  })
}

export async function checkPaymentStatus(nonce: string): Promise<{ pending: boolean; settled: boolean; error?: string }> {
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
