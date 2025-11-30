import { privateKeyToAccount } from "viem/accounts"

// Shared utility to derive the platform wallet address from SERVER_WALLET_PRIVATE_KEY
// This MUST be used by all x402 generation routes to ensure address consistency

export function getPlatformWalletAddress(): `0x${string}` | null {
  let privateKey = process.env.SERVER_WALLET_PRIVATE_KEY

  if (!privateKey) {
    console.error("[v0] SERVER_WALLET_PRIVATE_KEY not configured")
    return null
  }

  // Ensure private key has 0x prefix
  if (!privateKey.startsWith("0x")) {
    privateKey = `0x${privateKey}`
  }

  // Validate private key length (should be 66 chars with 0x prefix)
  if (privateKey.length !== 66) {
    console.error("[v0] Invalid private key length:", privateKey.length)
    return null
  }

  // Validate it's a valid hex string
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    console.error("[v0] Private key is not valid hex")
    return null
  }

  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`)
    return account.address
  } catch (err) {
    console.error("[v0] Failed to derive address from private key:", err)
    return null
  }
}

export function getFormattedPrivateKey(): `0x${string}` | null {
  let privateKey = process.env.SERVER_WALLET_PRIVATE_KEY

  if (!privateKey) {
    return null
  }

  // Ensure private key has 0x prefix
  if (!privateKey.startsWith("0x")) {
    privateKey = `0x${privateKey}`
  }

  // Validate private key length
  if (privateKey.length !== 66) {
    return null
  }

  // Validate it's a valid hex string
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    return null
  }

  return privateKey as `0x${string}`
}
