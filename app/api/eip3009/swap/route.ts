import { NextResponse } from "next/server"
import type { Address, Hex } from "viem"
import { createPublicClient, createWalletClient, http } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { relayTransferAuthorization, storeRelayedTransaction, isEligibleForSubsidy } from "@/lib/eip3009/relayer"
import {
  USDC_ADDRESS,
  USI_TOKEN_ADDRESS,
  UNISWAP_V3_ROUTER,
  UNISWAP_V3_ROUTER_ABI,
  ERC20_ABI,
} from "@/lib/web3/contracts"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { authorization, signature, metadata } = body

    // Validate request
    if (!authorization || !signature || !metadata?.swapParams) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const { from, to, value, validAfter, validBefore, nonce } = authorization
    const { v, r, s } = signature
    const { tokenIn, tokenOut, amountIn, minAmountOut, slippage, poolFee } = metadata.swapParams

    // Validate swap parameters
    if (tokenIn !== "USDC" || tokenOut !== "USI") {
      return NextResponse.json({ error: "Only USDC → USI swaps are supported" }, { status: 400 })
    }

    console.log("[API] Received gasless swap request from:", from)

    // Check if user is eligible for gas subsidy
    const eligible = await isEligibleForSubsidy(from as Address)
    if (!eligible) {
      return NextResponse.json(
        {
          error: "Gas subsidy limit reached. You have used all your free transactions.",
        },
        { status: 429 },
      )
    }

    // Step 1: Relay the USDC transfer to relayer wallet
    console.log("[API] Step 1: Transferring USDC to relayer...")
    const transferResult = await relayTransferAuthorization(
      from as Address,
      to as Address, // Relayer address
      BigInt(value),
      BigInt(validAfter),
      BigInt(validBefore),
      nonce as Hex,
      v,
      r as Hex,
      s as Hex,
    )

    if (!transferResult.success) {
      return NextResponse.json({ error: transferResult.error }, { status: 400 })
    }

    console.log("[API] USDC transferred to relayer:", transferResult.txHash)

    // Step 2: Execute swap on Uniswap V3
    console.log("[API] Step 2: Executing swap on Uniswap V3...")

    const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY
    if (!privateKey) {
      throw new Error("SERVER_WALLET_PRIVATE_KEY not configured")
    }

    const formattedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
    const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`)

    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    })

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(),
    })

    // Approve Uniswap router to spend USDC
    console.log("[API] Approving Uniswap router...")
    const approveHash = await walletClient.writeContract({
      address: USDC_ADDRESS[8453] as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [UNISWAP_V3_ROUTER[8453] as `0x${string}`, BigInt(amountIn)],
    })

    await publicClient.waitForTransactionReceipt({ hash: approveHash })
    console.log("[API] Approval confirmed:", approveHash)

    // Execute swap
    console.log("[API] Executing swap...")
    const swapHash = await walletClient.writeContract({
      address: UNISWAP_V3_ROUTER[8453] as `0x${string}`,
      abi: UNISWAP_V3_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: USDC_ADDRESS[8453] as `0x${string}`,
          tokenOut: USI_TOKEN_ADDRESS[8453] as `0x${string}`,
          fee: poolFee,
          recipient: from as `0x${string}`, // Send USI directly to user
          amountIn: BigInt(amountIn),
          amountOutMinimum: BigInt(minAmountOut),
          sqrtPriceLimitX96: 0n,
        },
      ],
    })

    const swapReceipt = await publicClient.waitForTransactionReceipt({ hash: swapHash })
    console.log("[API] Swap confirmed:", swapHash)

    // Store transaction in database
    await storeRelayedTransaction(
      from as Address,
      to as Address,
      BigInt(value),
      nonce as Hex,
      swapHash,
      swapReceipt.gasUsed,
      {
        ...metadata,
        transferTxHash: transferResult.txHash,
        swapTxHash: swapHash,
      },
    )

    return NextResponse.json({
      success: true,
      txHash: swapHash,
      transferTxHash: transferResult.txHash,
    })
  } catch (error) {
    console.error("[API] Gasless swap error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to execute gasless swap",
      },
      { status: 500 },
    )
  }
}
