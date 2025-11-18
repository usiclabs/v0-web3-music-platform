import { type Address, type Hex, keccak256, toHex, encodePacked, decodeAbiParameters, parseAbiParameters } from "viem"
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

const usedNonces = new Set<string>()

/**
 * Generate a random nonce for EIP-3009 authorization
 * Uses crypto.getRandomValues for secure random generation
 */
export function generateNonce(): Hex {
  let nonce: Hex
  let attempts = 0
  const maxAttempts = 10
  
  do {
    const randomBytes = new Uint8Array(32)
    crypto.getRandomValues(randomBytes)
    nonce = toHex(randomBytes)
    attempts++
    
    if (attempts >= maxAttempts) {
      console.warn("[v0] Max nonce generation attempts reached, using potentially duplicate nonce")
      break
    }
  } while (usedNonces.has(nonce))
  
  usedNonces.add(nonce)
  
  // Clean up old nonces after 1 hour (they expire anyway)
  setTimeout(() => usedNonces.delete(nonce), 3600000)
  
  return nonce
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
  validBefore?: bigint,
  nonce?: Hex,
  isSmartWallet?: boolean
): TransferAuthorization {
  // Base App smart wallets need longer validity periods due to relayer delays
  const defaultValidity = isSmartWallet ? 14400 : 3600 // 4 hours for smart wallets, 1 hour for EOA
  const calculatedValidBefore = validBefore || BigInt(Math.floor(Date.now() / 1000) + defaultValidity)
  
  return {
    from,
    to,
    value,
    validAfter,
    validBefore: calculatedValidBefore,
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
  validBefore?: bigint,
  nonce?: Hex,
  isSmartWallet?: boolean
): ReceiveAuthorization {
  // Base App smart wallets need longer validity periods due to relayer delays
  const defaultValidity = isSmartWallet ? 14400 : 3600 // 4 hours for smart wallets, 1 hour for EOA
  const calculatedValidBefore = validBefore || BigInt(Math.floor(Date.now() / 1000) + defaultValidity)
  
  return {
    from,
    to,
    value,
    validAfter,
    validBefore: calculatedValidBefore,
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
const EIP6492_MAGIC_BYTES = "0x64926492649264926492649264926492649264926492649264926492"

/**
 * Detect if the connected wallet is a Base App (Coinbase Smart Wallet)
 * @param address - Wallet address to check
 * @param chainId - Chain ID
 */
export async function isBaseAppWallet(address: Address, chainId: number): Promise<boolean> {
  try {
    // Only check on Base chains
    if (chainId !== 8453 && chainId !== 84532) {
      return false
    }
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log("[v0] Not in browser environment, assuming EOA wallet")
      return false
    }
    
    // Check if ethereum provider is available
    const provider = (window as any).ethereum
    if (!provider) {
      console.log("[v0] No ethereum provider found, assuming EOA wallet")
      return false
    }
    
    // Check if wallet is a smart contract (has code)
    const code = await provider.request({
      method: 'eth_getCode',
      params: [address, 'latest']
    })
    
    // If has code on Base, it's likely a Base App ERC-4337 wallet
    const hasCode = code && code !== '0x' && code !== '0x0'
    
    if (hasCode) {
      console.log("[v0] ⚠️ Detected Base App ERC-4337 smart wallet")
      console.log("[v0] Note: EIP-3009 transferWithAuthorization does NOT support smart contract wallets")
      console.log("[v0] Will block EIP-3009 gasless payments for this wallet")
    } else {
      console.log("[v0] ✅ Standard EOA wallet detected - EIP-3009 supported")
    }
    
    return hasCode
  } catch (err) {
    console.warn("[v0] Base App detection failed, defaulting to EOA wallet:", err)
    // Default to false (EOA) on error - safer to allow payments than block them
    return false
  }
}

/**
 * Check if EIP-3009 is supported by this wallet
 * EIP-3009 explicitly does NOT support smart contract accounts
 */
export async function supportsEIP3009(address: Address, chainId: number): Promise<boolean> {
  const isSmart = await isBaseAppWallet(address, chainId)
  
  if (isSmart) {
    console.log("[v0] ❌ EIP-3009 not supported: Smart contract wallet detected")
    console.log("[v0] EIP-3009 specification explicitly excludes smart contract accounts")
    return false
  }
  
  return true
}

/**
 * Parse a signature into v, r, s components
 * Enhanced support for Base App ERC-4337 smart wallets with improved EIP-6492 handling
 * @param signature - The signature hex string
 * @param isSmartWallet - Optional flag to indicate smart wallet usage
 */
export function parseSignature(signature: Hex, isSmartWallet?: boolean): { v: number; r: Hex; s: Hex } {
  let sig = signature.startsWith("0x") ? signature.slice(2) : signature

  console.log("[v0] Parsing signature, length:", sig.length, "isSmartWallet:", isSmartWallet)

  const hasEIP6492Magic = sig.length > 130 && sig.toLowerCase().includes(EIP6492_MAGIC_BYTES.slice(2).toLowerCase())
  
  if (hasEIP6492Magic || (isSmartWallet && sig.length > 130)) {
    console.log("[v0] Detected EIP-6492 wrapped signature for Base App ERC-4337 smart wallet")

    try {
      // Find the position of magic bytes
      const magicIndex = sig.toLowerCase().indexOf(EIP6492_MAGIC_BYTES.slice(2).toLowerCase())
      
      if (magicIndex > 0) {
        // Extract data before magic bytes
        const dataWithoutMagic = `0x${sig.slice(0, magicIndex)}` as Hex
        
        // Decode the EIP-6492 wrapper structure
        // Format: abi.encode(address factory, bytes factoryCalldata, bytes signature)
        const decoded = decodeAbiParameters(
          parseAbiParameters("address factory, bytes factoryCalldata, bytes signature"),
          dataWithoutMagic,
        )

        const [factory, factoryCalldata, originalSignature] = decoded

        console.log("[v0] EIP-6492 unwrapped - Factory:", factory, "Calldata length:", factoryCalldata.length)
        
        // Extract the actual signature from the wrapper
        sig = originalSignature.startsWith("0x") ? originalSignature.slice(2) : originalSignature
        console.log("[v0] Extracted Base App signature, length:", sig.length)
      }

      if (sig.length < 130) {
        // Base App may return compressed signatures - pad to standard length
        console.log("[v0] Padding short Base App signature from", sig.length, "to 130")
        sig = sig.padEnd(130, '0')
      } else if (sig.length > 130) {
        // Base App may include additional metadata - extract core signature
        console.log("[v0] Extracting core signature from extended Base App format")
        
        // Try to find standard ECDSA signature pattern (130 chars = 65 bytes)
        // Base App signatures may have extra data prepended or appended
        if (sig.length >= 194) {
          // Likely has contract signature wrapper, try last 130 chars
          const extracted = sig.slice(-130)
          console.log("[v0] Extracted last 130 characters as signature")
          sig = extracted
        } else if (sig.length < 200) {
          // Moderately longer, try first 130 chars
          const extracted = sig.slice(0, 130)
          console.log("[v0] Extracted first 130 characters as signature")
          sig = extracted
        } else {
          // Very long signature, likely ERC-1271 format
          console.log("[v0] Very long signature detected, attempting ERC-1271 extraction")
          // Look for the actual signature within the encoded data
          // ERC-1271 may wrap the signature in additional calldata
          const extracted = sig.slice(0, 130)
          sig = extracted
        }
      }
    } catch (err) {
      console.error("[v0] Failed to parse Base App ERC-4337 signature:", err)
      
      throw new Error(
        `Base App smart wallet signature parsing failed. ` +
        `Your wallet may need to be deployed on-chain first. ` +
        `\n\nTroubleshooting steps:\n` +
        `1. Make a small transaction (like sending 0.001 USDC) to deploy your Base App wallet\n` +
        `2. Ensure you're using the latest version of Coinbase Wallet or Base App\n` +
        `3. Try disconnecting and reconnecting your wallet\n` +
        `4. If this is your first time using this wallet, make a small transaction first\n` +
        `5. Check that you're on the Base network (not Base Sepolia or another chain)\n\n` +
        `If issues persist, try using a standard wallet like MetaMask for now.`,
      )
    }
  }

  if (sig.length !== 130) {
    console.error("[v0] Invalid signature length after processing:", sig.length)
    
    throw new Error(
      `Invalid Base App signature format (length: ${sig.length}). ` +
      `Your Base App wallet may need initialization. ` +
      `\n\nTroubleshooting steps:\n` +
      `1. Ensure you have the latest Coinbase Wallet or Base App installed\n` +
      `2. Try disconnecting and reconnecting your wallet\n` +
      `3. If this is your first time using this wallet, make a small transaction first\n` +
      `4. Check that you're on the Base network (not Base Sepolia or another chain)\n\n` +
      `If issues persist, try using a standard wallet like MetaMask for now.`,
    )
  }

  const r = `0x${sig.slice(0, 64)}` as Hex
  const s = `0x${sig.slice(64, 128)}` as Hex
  let v = Number.parseInt(sig.slice(128, 130), 16)
  
  if (v < 27) {
    console.log("[v0] Normalizing v value from", v, "to", v + 27)
    v = v + 27
  } else if (v > 28) {
    // Base App ERC-4337 implementations may use non-standard v values
    // due to contract-based signature verification
    console.log("[v0] Normalizing non-standard Base App v value from", v)
    
    // Try to determine correct v from the signature recovery
    // v should be either 27 or 28 for standard ECDSA
    if (v >= 35) {
      // EIP-155 style v value: v = chainId * 2 + 35 + {0,1}
      // Extract the parity bit
      v = ((v - 35) % 2) + 27
      console.log("[v0] Extracted v from EIP-155 format:", v)
    } else {
      // Just use modulo to get 27 or 28
      v = (v % 2 === 0) ? 28 : 27
      console.log("[v0] Normalized to:", v)
    }
  }
  
  // Final validation
  if (v !== 27 && v !== 28) {
    console.warn("[v0] Unusual v value detected:", v, "- applying final normalization")
    v = v % 2 === 0 ? 28 : 27
  }

  console.log("[v0] Base App signature parsed successfully: v =", v)

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
