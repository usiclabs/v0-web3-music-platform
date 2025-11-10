import { Clanker } from "clanker-sdk/v4"
import { createWalletClient, createPublicClient, http, type Address } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

export interface ClankerDeployParams {
  name: string
  symbol: string
  totalSupply: number
  decimals: number
  deployerAddress: string
  imageUrl?: string
  description?: string
}

export interface ClankerDeployResult {
  success: boolean
  tokenAddress?: string
  txHash?: string
  error?: string
}

/**
 * Deploy a token using Clanker SDK v4
 * Following the official documentation: https://clanker.gitbook.io/clanker-documentation/sdk/v4.0.0
 */
export async function deployClankerToken(params: ClankerDeployParams): Promise<ClankerDeployResult> {
  console.log("[v0] [Clanker] Starting token deployment with params:", {
    name: params.name,
    symbol: params.symbol,
    tokenAdmin: params.deployerAddress,
    hasImage: !!params.imageUrl,
    hasDescription: !!params.description,
  })

  try {
    const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY
    if (!privateKey) {
      throw new Error("SERVER_WALLET_PRIVATE_KEY not configured")
    }

    const formattedPrivateKey = privateKey.trim().startsWith("0x") ? privateKey.trim() : `0x${privateKey.trim()}`

    console.log("[v0] [Clanker] Creating viem account...")
    const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`)
    console.log("[v0] [Clanker] Server wallet address:", account.address)

    console.log("[v0] [Clanker] Creating public client...")
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    })

    console.log("[v0] [Clanker] Creating wallet client...")
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(),
    })

    const balance = await publicClient.getBalance({ address: account.address })
    console.log("[v0] [Clanker] Server wallet balance:", balance.toString(), "wei")

    if (balance === 0n) {
      throw new Error(`Server wallet (${account.address}) has no ETH balance. Please fund the wallet to deploy tokens.`)
    }

    console.log("[v0] [Clanker] Initializing SDK...")
    const clanker = new Clanker({
      publicClient,
      wallet: walletClient,
    })

    const deployConfig: any = {
      name: params.name,
      symbol: params.symbol,
      tokenAdmin: params.deployerAddress as Address,
      pool: {
        initialMarketCap: "1", // 1 ETH for initial liquidity
      },
    }

    console.log("[v0] [Clanker] Calling deploy() with minimal config:", deployConfig)

    const result = await clanker.deploy(deployConfig)

    console.log("[v0] [Clanker] Raw deploy result:", {
      hasTxHash: !!result.txHash,
      hasWaitForTransaction: !!result.waitForTransaction,
      hasError: !!result.error,
      errorType: result.error ? typeof result.error : "none",
    })

    if (result.error) {
      console.error("[v0] [Clanker] SDK error detected")
      console.error("[v0] [Clanker] Error type:", typeof result.error)
      console.error("[v0] [Clanker] Error constructor:", result.error?.constructor?.name)

      // Log all error properties
      if (typeof result.error === "object" && result.error !== null) {
        console.error("[v0] [Clanker] Error keys:", Object.keys(result.error))
        console.error("[v0] [Clanker] Error properties:", {
          message: result.error.message,
          name: result.error.name,
          cause: result.error.cause,
          details: result.error.details,
          metaMessages: result.error.metaMessages,
          shortMessage: result.error.shortMessage,
          version: result.error.version,
        })
      }

      // Try to extract the most useful error message
      let errorMessage = "Token deployment failed"
      if (result.error.message) {
        errorMessage = result.error.message
      } else if (result.error.shortMessage) {
        errorMessage = result.error.shortMessage
      } else if (result.error.details) {
        errorMessage = result.error.details
      } else if (typeof result.error === "string") {
        errorMessage = result.error
      }

      console.error("[v0] [Clanker] Final error message:", errorMessage)
      throw new Error(errorMessage)
    }

    if (!result.txHash || !result.waitForTransaction) {
      throw new Error("Deploy returned no transaction hash")
    }

    console.log("[v0] [Clanker] Transaction hash:", result.txHash)
    console.log("[v0] [Clanker] Waiting for transaction confirmation...")

    const txResult = await result.waitForTransaction()

    console.log("[v0] [Clanker] Transaction result:", {
      hasAddress: !!txResult.address,
      hasError: !!txResult.error,
    })

    if (txResult.error) {
      console.error("[v0] [Clanker] Transaction wait error:", txResult.error)
      throw new Error(txResult.error.message || "Transaction confirmation failed")
    }

    if (!txResult.address) {
      throw new Error("No token address returned after deployment")
    }

    console.log("[v0] [Clanker] Token deployed successfully!")
    console.log("[v0] [Clanker] Token address:", txResult.address)
    console.log("[v0] [Clanker] Transaction hash:", result.txHash)

    return {
      success: true,
      tokenAddress: txResult.address,
      txHash: result.txHash,
    }
  } catch (error) {
    console.error("[v0] [Clanker] Deployment failed:", error)

    let errorMessage = "Unknown error during token deployment"

    if (error instanceof Error) {
      errorMessage = error.message
      console.error("[v0] [Clanker] Error message:", error.message)
      console.error("[v0] [Clanker] Error stack:", error.stack)
    } else if (typeof error === "string") {
      errorMessage = error
    } else if (error && typeof error === "object" && "message" in error) {
      errorMessage = String((error as any).message)
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
