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
    builderCode?: string // Builder code for revenue attribution
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

// Request a chunk and get payment instructions
export async function requestChunk(trackId: string, chunkIndex: number, builderCode?: string): Promise<X402PaymentInstructions> {
  const url = new URL(`/api/x402/stream/${trackId}`, window.location.origin)
  url.searchParams.set('chunk', chunkIndex.toString())
  if (builderCode) {
    url.searchParams.set('builderCode', builderCode)
  }
  
  const response = await fetch(url.toString())

  if (response.status !== 402) {
    throw new Error("Expected 402 Payment Required response")
  }

  const data = await response.json()
  return data.payment
}

// Verify payment with X402 facilitator
export async function verifyPayment(paymentPayload: X402PaymentPayload): Promise<boolean> {
  const response = await fetch("/api/x402/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentPayload),
  })

  const result = await response.json()
  return result.verified === true
}

// Settle payment and unlock chunk
export async function settlePayment(
  paymentPayload: X402PaymentPayload,
  trackId: string,
  listenerAddress: string,
  chunkIndex: number,
): Promise<{ success: boolean; chunkUnlocked: number; txHash?: string }> {
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
  })

  if (!response.ok) {
    throw new Error("Payment settlement failed")
  }

  return response.json()
}
