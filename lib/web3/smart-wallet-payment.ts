import { Address, parseUnits } from "viem"
import { createPublicClient, createWalletClient, custom, http } from "viem"
import { base } from "viem/chains"
import { USDC_ADDRESS } from "./contracts"

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const

export interface SmartWalletPaymentParams {
  from: Address
  to: Address
  amount: bigint
  trackId: string
  chunkIndex: number
}

export interface SmartWalletPaymentResult {
  success: boolean
  txHash?: string
  error?: string
}

/**
 * Execute a payment from a smart wallet (ERC-4337) using standard ERC-20 approve + backend transfer
 * This is an alternative to EIP-3009 which doesn't support smart contract wallets
 */
export async function executeSmartWalletPayment(
  params: SmartWalletPaymentParams
): Promise<SmartWalletPaymentResult> {
  try {
    console.log("[v0] Executing smart wallet payment:", params)

    if (!window.ethereum) {
      return { success: false, error: "No wallet provider found" }
    }

    // Create clients
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    })

    const walletClient = createWalletClient({
      chain: base,
      transport: custom(window.ethereum),
    })

    // Check balance first
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [params.from],
    })

    console.log("[v0] USDC balance:", balance.toString())

    if (balance < params.amount) {
      return {
        success: false,
        error: `Insufficient USDC balance. You have ${Number(balance) / 1e6} USDC but need ${Number(params.amount) / 1e6} USDC`,
      }
    }

    // Check current allowance
    const currentAllowance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [params.from, params.to],
    })

    console.log("[v0] Current allowance:", currentAllowance.toString())

    // If allowance is insufficient, request approval
    if (currentAllowance < params.amount) {
      console.log("[v0] Requesting approval for", params.amount.toString(), "USDC")

      const approveTxHash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [params.to, params.amount],
        account: params.from,
      })

      console.log("[v0] Approval transaction sent:", approveTxHash)

      // Wait for approval confirmation
      await publicClient.waitForTransactionReceipt({
        hash: approveTxHash,
        confirmations: 1,
      })

      console.log("[v0] Approval confirmed!")
    } else {
      console.log("[v0] Sufficient allowance already exists")
    }

    // Now trigger backend to execute the transfer
    console.log("[v0] Requesting backend to execute transfer...")

    const response = await fetch("/api/x402/smart-wallet-transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: params.from,
        to: params.to,
        amount: params.amount.toString(),
        trackId: params.trackId,
        chunkIndex: params.chunkIndex,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.error || "Backend transfer failed",
      }
    }

    const result = await response.json()
    console.log("[v0] Smart wallet payment completed:", result.txHash)

    return {
      success: true,
      txHash: result.txHash,
    }
  } catch (error) {
    console.error("[v0] Smart wallet payment error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
