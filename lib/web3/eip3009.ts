import { type Address, type Hex, keccak256, toHex, encodePacked } from "viem"
import { USDC_ADDRESS } from "./contracts"

// EIP-3009 Transfer With Authorization types
export interface TransferAuthorization {
  from: Address
  to: Address
  value: bigint
  validAfter: bigint
  validBefore: bigint
  nonce: Hex
}

export interface ReceiveAuthorization {
  from: Address
  to: Address
  value: bigint
  validAfter: bigint
  validBefore: bigint
  nonce: Hex
}

export interface CancelAuthorization {
  authorizer: Address
  nonce: Hex
}

// EIP-712 Domain for USDC on Base
export function getEIP3009Domain(chainId: number) {
  const usdcAddress = USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS]

  return {
    name: "USD Coin",
    version: "2",
    chainId,
    verifyingContract: usdcAddress as Address,
  }
}

// EIP-712 Types for TransferWithAuthorization
export const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const

// EIP-712 Types for ReceiveWithAuthorization
export const RECEIVE_WITH_AUTHORIZATION_TYPES = {
  ReceiveWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const

// EIP-712 Types for CancelAuthorization
export const CANCEL_AUTHORIZATION_TYPES = {
  CancelAuthorization: [
    { name: "authorizer", type: "address" },
    { name: "nonce", type: "bytes32" },
  ],
} as const

/**
 * Generate a random nonce for EIP-3009 authorization
 * Uses crypto.getRandomValues for secure random generation
 */
export function generateNonce(): Hex {
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes)
  return toHex(randomBytes)
}

/**
 * Create a transfer authorization object
 * @param from - Address sending tokens
 * @param to - Address receiving tokens
 * @param value - Amount of tokens (in smallest unit, e.g., USDC has 6 decimals)
 * @param validAfter - Unix timestamp after which the authorization is valid (0 for immediate)
 * @param validBefore - Unix timestamp before which the authorization is valid (use far future for no expiry)
 * @param nonce - Random nonce (use generateNonce())
 */
export function createTransferAuthorization(
  from: Address,
  to: Address,
  value: bigint,
  validAfter = 0n,
  validBefore: bigint = BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
  nonce?: Hex,
): TransferAuthorization {
  return {
    from,
    to,
    value,
    validAfter,
    validBefore,
    nonce: nonce || generateNonce(),
  }
}

/**
 * Create a receive authorization object
 * Similar to transfer authorization but intended for recipient-initiated transfers
 */
export function createReceiveAuthorization(
  from: Address,
  to: Address,
  value: bigint,
  validAfter = 0n,
  validBefore: bigint = BigInt(Math.floor(Date.now() / 1000) + 3600),
  nonce?: Hex,
): ReceiveAuthorization {
  return {
    from,
    to,
    value,
    validAfter,
    validBefore,
    nonce: nonce || generateNonce(),
  }
}

/**
 * Create a cancel authorization object
 */
export function createCancelAuthorization(authorizer: Address, nonce: Hex): CancelAuthorization {
  return {
    authorizer,
    nonce,
  }
}

// EIP-6492 magic bytes used to identify wrapped signatures for undeployed smart contract wallets
const EIP6492_MAGIC_BYTES = "0x6492649264926492649264926492649264926492649264926492649264926492"

/**
 * Parse a signature into v, r, s components
 * Supports both standard ECDSA signatures and EIP-6492 wrapped signatures for smart contract wallets
 * @param signature - The signature hex string
 */
export function parseSignature(signature: Hex): { v: number; r: Hex; s: Hex } {
  // Remove 0x prefix if present
  let sig = signature.startsWith("0x") ? signature.slice(2) : signature

  console.log("[v0] Parsing signature, length:", sig.length)

  // EIP-6492 signatures end with magic bytes and contain deployment data for undeployed smart wallets
  if (sig.length > 130 && sig.endsWith(EIP6492_MAGIC_BYTES.slice(2))) {
    console.log("[v0] Detected EIP-6492 wrapped signature, unwrapping...")

    // Remove the magic bytes (64 characters)
    sig = sig.slice(0, -64)

    // The signature is ABI-encoded: (address factory, bytes factoryCalldata, bytes signature)
    // We need to extract the original signature from the end
    // The last 130 characters should be the original ECDSA signature

    try {
      // For EIP-6492, the original signature is typically at the end before the magic bytes
      // We'll try to extract the last 130 characters as the signature
      const potentialSig = sig.slice(-130)

      console.log("[v0] Extracted signature from EIP-6492 wrapper, length:", potentialSig.length)

      if (potentialSig.length === 130) {
        sig = potentialSig
      } else {
        // If we can't find a standard signature, try a different approach
        // Look for the signature in the ABI-encoded data
        // The signature should be 65 bytes (130 hex chars) somewhere in the data
        console.log("[v0] Could not extract standard signature, attempting to decode ABI-encoded data...")

        // For now, we'll throw an error and log the signature for debugging
        console.error("[v0] EIP-6492 signature format not fully supported yet. Signature length:", sig.length)
        throw new Error(
          `EIP-6492 signature detected but could not extract standard signature. ` +
            `Please ensure your Coinbase Smart Wallet is deployed on-chain first, or contact support.`,
        )
      }
    } catch (err) {
      console.error("[v0] Failed to unwrap EIP-6492 signature:", err)
      throw new Error(
        `Failed to parse EIP-6492 signature. Your smart wallet may need to be deployed first. ` +
          `Original error: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  if (sig.length !== 130) {
    console.error("[v0] Invalid signature length after parsing:", sig.length)
    console.error("[v0] Signature preview:", sig.slice(0, 100) + "...")
    throw new Error(
      `Invalid signature length: ${sig.length}. Expected 130 characters (65 bytes). ` +
        `If you're using Coinbase Smart Wallet, please ensure your wallet is deployed on-chain first.`,
    )
  }

  const r = `0x${sig.slice(0, 64)}` as Hex
  const s = `0x${sig.slice(64, 128)}` as Hex
  const v = Number.parseInt(sig.slice(128, 130), 16)

  console.log("[v0] Signature parsed successfully:", { v, r: r.slice(0, 10) + "...", s: s.slice(0, 10) + "..." })

  return { v, r, s }
}

/**
 * Format authorization for contract call
 * Converts a signed authorization into the format expected by the smart contract
 */
export function formatAuthorizationForContract(
  authorization: TransferAuthorization | ReceiveAuthorization,
  signature: Hex,
) {
  const { v, r, s } = parseSignature(signature)

  return {
    from: authorization.from,
    to: authorization.to,
    value: authorization.value,
    validAfter: authorization.validAfter,
    validBefore: authorization.validBefore,
    nonce: authorization.nonce,
    v,
    r,
    s,
  }
}

/**
 * Utility to convert USDC amount to smallest unit (6 decimals)
 * @param amount - Amount in USDC (e.g., 1.5 for 1.5 USDC)
 */
export function usdcToSmallestUnit(amount: number): bigint {
  return BigInt(Math.floor(amount * 1_000_000))
}

/**
 * Utility to convert smallest unit to USDC amount
 * @param amount - Amount in smallest unit
 */
export function smallestUnitToUsdc(amount: bigint): number {
  return Number(amount) / 1_000_000
}

/**
 * Check if an authorization is still valid based on time constraints
 */
export function isAuthorizationValid(validAfter: bigint, validBefore: bigint, currentTime?: bigint): boolean {
  const now = currentTime || BigInt(Math.floor(Date.now() / 1000))
  return now >= validAfter && now <= validBefore
}

/**
 * Get the authorization hash (useful for tracking and debugging)
 */
export function getAuthorizationHash(authorization: TransferAuthorization | ReceiveAuthorization): Hex {
  return keccak256(
    encodePacked(
      ["address", "address", "uint256", "uint256", "uint256", "bytes32"],
      [
        authorization.from,
        authorization.to,
        authorization.value,
        authorization.validAfter,
        authorization.validBefore,
        authorization.nonce,
      ],
    ),
  )
}
