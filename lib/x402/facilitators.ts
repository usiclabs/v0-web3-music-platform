import type { X402FacilitatorConfig, X402PaymentPayload, X402PaymentPreferences } from "./types"

const FACILITATORS: X402FacilitatorConfig[] = [
  {
    url: process.env.NEXT_PUBLIC_X402_FACILITATOR_PRIMARY || "https://api.coinbase.com/x402",
    name: "Coinbase",
    priority: 1,
    networks: ["base", "ethereum", "optimism", "arbitrum"],
    enabled: true,
  },
  {
    url: process.env.NEXT_PUBLIC_X402_FACILITATOR_BACKUP || "https://x402.usic.app",
    name: "Self-Hosted",
    priority: 2,
    networks: ["base"],
    enabled: !!process.env.NEXT_PUBLIC_X402_FACILITATOR_BACKUP,
  },
]

export function selectFacilitator(network: string, preferences?: X402PaymentPreferences): X402FacilitatorConfig | null {
  const available = FACILITATORS.filter((f) => f.enabled && f.networks.includes(network)).sort(
    (a, b) => a.priority - b.priority,
  )

  if (preferences?.preferredFacilitator) {
    const preferred = available.find((f) => f.name === preferences.preferredFacilitator)
    if (preferred) return preferred
  }

  return available[0] || null
}

export async function verifyWithFallback(
  payload: X402PaymentPayload,
  preferences?: X402PaymentPreferences,
): Promise<{ verified: boolean; facilitator: string }> {
  const facilitators = FACILITATORS.filter((f) => f.enabled && f.networks.includes(payload.network)).sort(
    (a, b) => a.priority - b.priority,
  )

  for (const facilitator of facilitators) {
    try {
      console.log(`[v0] Attempting verification with ${facilitator.name}...`)

      const response = await fetch(`${facilitator.url}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`[v0] Verification successful with ${facilitator.name}`)
        return { verified: result.verified, facilitator: facilitator.name }
      }

      console.log(`[v0] ${facilitator.name} verification failed with status ${response.status}`)
    } catch (error) {
      console.error(`[v0] ${facilitator.name} failed:`, error)
    }
  }

  throw new Error("All facilitators unavailable - verification failed")
}
