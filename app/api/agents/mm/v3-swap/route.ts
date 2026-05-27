import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createPublicClient, createWalletClient, http } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { parseUnits, isAddress, type Address, formatUnits } from "viem"
import {
  UNISWAP_V3_ROUTER_ABI,
  UNISWAP_V3_ROUTER,
  ERC20_ABI,
  WETH_ADDRESS,
} from "@/lib/web3/contracts"
import { getAgentWalletKeys } from "@/lib/agents/wallet-generator"

export async function POST(request: NextRequest) {
  try {
    const { agentId, tokenAddress, amount, walletIndex = 1, ownerAddress } = await request.json()

    if (!agentId || !tokenAddress || !isAddress(tokenAddress) || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get wallet keys
    const walletKeys = await getAgentWalletKeys(agentId, ownerAddress)
    const privateKey = walletKeys.get(walletIndex)

    if (!privateKey) {
      return NextResponse.json(
        { error: `Wallet ${walletIndex} not found for agent` },
        { status: 404 }
      )
    }

    const formattedKey = privateKey.startsWith("0x") ? (privateKey as `0x${string}`) : (`0x${privateKey}` as `0x${string}`)
    const account = privateKeyToAccount(formattedKey)

    const rpcUrl = "https://base-rpc.publicnode.com"
    const publicClient = createPublicClient({ chain: base, transport: http(rpcUrl) })
    const walletClient = createWalletClient({ chain: base, transport: http(rpcUrl), account })

    const chainId = base.id
    const routerAddress = UNISWAP_V3_ROUTER[chainId as keyof typeof UNISWAP_V3_ROUTER] as Address

    // Approve token transfer if needed
    try {
      const allowance = await publicClient.readContract({
        address: tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [account.address, routerAddress],
      })

      const buyAmount = parseUnits(amount, 18)

      if ((allowance as bigint) < buyAmount) {
        console.log("[V3 Swap API] Approving token spending")
        const approveTxHash = await walletClient.writeContract({
          address: tokenAddress as Address,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [routerAddress, buyAmount],
        })

        // Wait for approval
        await publicClient.waitForTransactionReceipt({ hash: approveTxHash })
      }
    } catch (approvalError) {
      console.log("[V3 Swap API] Approval skipped (may not be needed for this swap)")
    }

    // Execute V3 swap using swapExactETHForTokens
    const buyAmount = parseUnits(amount, 18)
    const params = {
      amountOutMinimum: 0n, // Accept any amount for simplicity
      path: [WETH_ADDRESS, tokenAddress as Address], // WETH -> Token
      to: account.address,
      deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 60), // 1 hour deadline
    }

    console.log("[V3 Swap API] Executing swapExactETHForTokens on V3:", {
      amountIn: formatUnits(buyAmount, 18),
      path: params.path,
    })

    const swapTxHash = await walletClient.writeContract({
      address: routerAddress,
      abi: UNISWAP_V3_ROUTER_ABI,
      functionName: "swapExactETHForTokens",
      args: [params.amountOutMinimum, params.path, params.to, params.deadline],
      value: buyAmount,
    })

    // Wait for swap confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: swapTxHash })

    if (receipt.status !== "success") {
      return NextResponse.json(
        { success: false, error: "Swap transaction failed" },
        { status: 500 }
      )
    }

    // Get amount out from transaction logs (simplified - just return basic info)
    const tokenBalance = await publicClient.readContract({
      address: tokenAddress as Address,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [account.address],
    })

    return NextResponse.json({
      success: true,
      txHash: swapTxHash,
      amountOut: formatUnits(tokenBalance as bigint, 18),
      poolVersion: "V3",
      poolConfiguration: {
        fee: 3000, // 0.3% standard fee (would be detected in real implementation)
      },
    })
  } catch (error: any) {
    console.error("[V3 Swap API] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
