import { publicClient, walletClient } from "@/lib/viem/client"
import { USDC_ADDRESS } from "./contracts"
import { base } from "viem/chains"
import { formatUnits, parseUnits } from "viem"

export const ERC20_TRANSFER_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
    stateMutability: "nonpayable",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
] as const

// Get live USDC balance from blockchain
export async function getUsdcBalance(address: `0x${string}`): Promise<number> {
  try {
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS[base.id] as `0x${string}`,
      abi: ERC20_TRANSFER_ABI,
      functionName: "balanceOf",
      args: [address],
    })

    console.log("[v0] Live USDC balance from blockchain:", balance.toString())
    return Number(formatUnits(balance as bigint, 6)) // USDC has 6 decimals
  } catch (error) {
    console.error("[v0] Error fetching USDC balance:", error)
    return 0
  }
}

// Get live ETH balance from blockchain
export async function getEthBalance(address: `0x${string}`): Promise<number> {
  try {
    const balance = await publicClient.getBalance({ address })
    console.log("[v0] Live ETH balance from blockchain:", balance.toString())
    return Number(formatUnits(balance, 18))
  } catch (error) {
    console.error("[v0] Error fetching ETH balance:", error)
    return 0
  }
}

// Transfer USDC from user wallet to agent wallet
export async function transferUsdcToAgent(
  fromAddress: `0x${string}`,
  toAddress: `0x${string}`,
  amount: number,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log(`[v0] Transferring ${amount} USDC from ${fromAddress} to ${toAddress}...`)

    // Check balance first
    const balance = await getUsdcBalance(fromAddress)
    if (balance < amount) {
      return {
        success: false,
        error: `Insufficient USDC balance. You have ${balance} USDC but need ${amount} USDC`,
      }
    }

    const amountInSmallestUnit = parseUnits(amount.toString(), 6)

    const txHash = await walletClient.writeContract({
      address: USDC_ADDRESS[base.id] as `0x${string}`,
      abi: ERC20_TRANSFER_ABI,
      functionName: "transfer",
      args: [toAddress, amountInSmallestUnit],
      account: fromAddress,
    })

    console.log("[v0] USDC transfer submitted:", txHash)

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

    if (receipt.status === "success") {
      console.log("[v0] USDC transfer confirmed:", txHash)
      return { success: true, txHash }
    } else {
      return { success: false, error: "Transaction failed" }
    }
  } catch (error) {
    console.error("[v0] USDC transfer error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to transfer USDC",
    }
  }
}

// Transfer USDC from agent wallet back to user wallet
export async function transferUsdcFromAgent(
  agentWalletAddress: `0x${string}`,
  toAddress: `0x${string}`,
  amount: number,
  agentPrivateKey: `0x${string}`,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log(`[v0] Withdrawing ${amount} USDC from agent wallet to ${toAddress}...`)

    // Check agent wallet balance
    const balance = await getUsdcBalance(agentWalletAddress)
    if (balance < amount) {
      return {
        success: false,
        error: `Insufficient agent wallet balance. Agent has ${balance} USDC but needs ${amount} USDC`,
      }
    }

    const amountInSmallestUnit = parseUnits(amount.toString(), 6)

    // Use agent's private key to execute transfer
    const txHash = await walletClient.writeContract({
      address: USDC_ADDRESS[base.id] as `0x${string}`,
      abi: ERC20_TRANSFER_ABI,
      functionName: "transfer",
      args: [toAddress, amountInSmallestUnit],
      account: agentWalletAddress,
      privateKey: agentPrivateKey,
    })

    console.log("[v0] Agent withdrawal submitted:", txHash)

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

    if (receipt.status === "success") {
      console.log("[v0] Agent withdrawal confirmed:", txHash)
      return { success: true, txHash }
    } else {
      return { success: false, error: "Withdrawal transaction failed" }
    }
  } catch (error) {
    console.error("[v0] Withdrawal error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to withdraw USDC",
    }
  }
}
