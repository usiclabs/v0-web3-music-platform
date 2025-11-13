import { createPublicClient, createWalletClient, http, type Address, type Hex } from "viem"
import { base, baseSepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { USDC_ADDRESS, EIP3009_ABI } from "@/lib/web3/contracts"
import { createClient } from "@/lib/supabase/server"

// Get the appropriate chain based on environment
function getChain() {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || "8453"
  return chainId === "8453" ? base : baseSepolia
}

// Get USDC contract address for current chain
function getUSDCAddress(): Address {
  const chain = getChain()
  return USDC_ADDRESS[chain.id as keyof typeof USDC_ADDRESS] as Address
}

/**
 * Initialize server wallet for relayer operations
 */
function getServerAccount() {
  const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY

  if (!privateKey || privateKey.trim() === "") {
    throw new Error("SERVER_WALLET_PRIVATE_KEY not configured")
  }

  const formattedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
  return privateKeyToAccount(formattedPrivateKey as `0x${string}`)
}

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY

const BASE_RPC_ENDPOINTS = ALCHEMY_API_KEY
  ? [`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`]
  : [
      "https://mainnet.base.org",
      "https://base.blockpi.network/v1/rpc/public",
      "https://base-rpc.publicnode.com",
      "https://1rpc.io/base",
    ]

const BASE_SEPOLIA_RPC_ENDPOINTS = ALCHEMY_API_KEY
  ? [`https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`]
  : [
      "https://sepolia.base.org",
      "https://base-sepolia.blockpi.network/v1/rpc/public",
      "https://base-sepolia-rpc.publicnode.com",
    ]

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: Error | undefined

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Check if it's a rate limit error
      const isRateLimitError =
        error?.message?.includes("rate limit") ||
        error?.message?.includes("429") ||
        error?.details?.includes("rate limit")

      if (!isRateLimitError || i === maxRetries - 1) {
        throw error
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000
      console.log(`[Relayer] Rate limited, retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error("Max retries exceeded")
}

/**
 * Create viem clients for blockchain interaction with fallback RPC endpoints
 */
function getClients() {
  const chain = getChain()
  const account = getServerAccount()

  const rpcEndpoints = chain.id === base.id ? BASE_RPC_ENDPOINTS : BASE_SEPOLIA_RPC_ENDPOINTS

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcEndpoints[0], {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
  })

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcEndpoints[0], {
      retryCount: 3,
      retryDelay: 1000,
    }),
  })

  return { publicClient, walletClient, account }
}

/**
 * Submit a transferWithAuthorization transaction to the blockchain
 */
export async function relayTransferAuthorization(
  from: Address,
  to: Address,
  value: bigint,
  validAfter: bigint,
  validBefore: bigint,
  nonce: Hex,
  v: number,
  r: Hex,
  s: Hex,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log("[Relayer] Relaying transfer authorization...")
    console.log("[Relayer] From:", from)
    console.log("[Relayer] To:", to)
    console.log("[Relayer] Value:", value.toString())
    console.log("[Relayer] Nonce:", nonce)

    const { publicClient, walletClient, account } = getClients()
    const usdcAddress = getUSDCAddress()

    const isUsed = await retryWithBackoff(async () => {
      return await publicClient.readContract({
        address: usdcAddress,
        abi: EIP3009_ABI,
        functionName: "authorizationState",
        args: [from, nonce],
      })
    })

    if (isUsed) {
      console.log("[Relayer] Authorization already used")
      return { success: false, error: "Authorization has already been used" }
    }

    // Check if authorization is still valid
    const currentTime = BigInt(Math.floor(Date.now() / 1000))
    if (currentTime < validAfter) {
      return { success: false, error: "Authorization not yet valid" }
    }
    if (currentTime > validBefore) {
      return { success: false, error: "Authorization has expired" }
    }

    try {
      await retryWithBackoff(async () => {
        return await publicClient.simulateContract({
          address: usdcAddress,
          abi: EIP3009_ABI,
          functionName: "transferWithAuthorization",
          args: [from, to, value, validAfter, validBefore, nonce, v, r, s],
          account,
        })
      })
    } catch (simulateError) {
      console.error("[Relayer] Transaction simulation failed:", simulateError)
      return {
        success: false,
        error: `Transaction would fail: ${simulateError instanceof Error ? simulateError.message : "Unknown error"}`,
      }
    }

    // Execute the transaction
    console.log("[Relayer] Submitting transaction...")
    const hash = await walletClient.writeContract({
      address: usdcAddress,
      abi: EIP3009_ABI,
      functionName: "transferWithAuthorization",
      args: [from, to, value, validAfter, validBefore, nonce, v, r, s],
    })

    console.log("[Relayer] Transaction submitted:", hash)

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === "success") {
      console.log("[Relayer] Transaction confirmed:", hash)
      return { success: true, txHash: hash }
    } else {
      console.error("[Relayer] Transaction failed")
      return { success: false, error: "Transaction reverted" }
    }
  } catch (error) {
    console.error("[Relayer] Failed to relay authorization:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to relay authorization",
    }
  }
}

/**
 * Check if an authorization has been used
 */
export async function checkAuthorizationState(authorizer: Address, nonce: Hex): Promise<boolean> {
  try {
    const { publicClient } = getClients()
    const usdcAddress = getUSDCAddress()

    const isUsed = await retryWithBackoff(async () => {
      return await publicClient.readContract({
        address: usdcAddress,
        abi: EIP3009_ABI,
        functionName: "authorizationState",
        args: [authorizer, nonce],
      })
    })

    return isUsed as boolean
  } catch (error) {
    console.error("[Relayer] Failed to check authorization state:", error)
    throw error
  }
}

/**
 * Store relayed transaction in database
 */
export async function storeRelayedTransaction(
  from: Address,
  to: Address,
  value: bigint,
  nonce: Hex,
  txHash: string,
  gasUsed: bigint,
  metadata?: Record<string, any>,
) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("relayed_transactions").insert({
      from_address: from,
      to_address: to,
      value: value.toString(),
      nonce,
      tx_hash: txHash,
      gas_used: gasUsed.toString(),
      metadata,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[Relayer] Failed to store transaction:", error)
    }
  } catch (error) {
    console.error("[Relayer] Failed to store transaction:", error)
  }
}

/**
 * Get gas usage statistics for a user
 */
export async function getUserGasUsage(userAddress: Address): Promise<{
  totalTransactions: number
  totalGasUsed: bigint
  remainingSubsidy: number
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("relayed_transactions")
      .select("gas_used")
      .eq("from_address", userAddress)

    if (error) {
      console.error("[Relayer] Failed to get gas usage:", error)
      return { totalTransactions: 0, totalGasUsed: 0n, remainingSubsidy: 0 }
    }

    const totalTransactions = data?.length || 0
    const totalGasUsed = data?.reduce((sum, tx) => sum + BigInt(tx.gas_used || "0"), 0n) || 0n

    // Calculate remaining subsidy (e.g., 10 transactions per user)
    const maxSubsidyPerUser = 10
    const remainingSubsidy = Math.max(0, maxSubsidyPerUser - totalTransactions)

    return { totalTransactions, totalGasUsed, remainingSubsidy }
  } catch (error) {
    console.error("[Relayer] Failed to get gas usage:", error)
    return { totalTransactions: 0, totalGasUsed: 0n, remainingSubsidy: 0 }
  }
}

/**
 * Check if user is eligible for gas subsidy
 */
export async function isEligibleForSubsidy(userAddress: Address): Promise<boolean> {
  const { remainingSubsidy } = await getUserGasUsage(userAddress)
  return remainingSubsidy > 0
}
