import { Clanker } from "clanker-sdk/v4"
import { createWalletClient, createPublicClient, http, type Address, formatEther } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

export interface ClankerDeployParams {
  name: string
  symbol: string
  totalSupply: number
  decimals: number
  deployerAddress: string
  targetMarketCapEth?: number // Target market cap in ETH (default: 10 ETH)
  feeTier?: number
  imageUrl?: string
  description?: string
}

export interface ClankerDeployResult {
  success: boolean
  tokenAddress?: string
  poolAddress?: string
  txHash?: string
  error?: string
}

/**
 * Deploy a token using Clanker SDK with automatic WETH pairing
 * Uses Clanker's default pool configuration for fair price distribution
 */
export async function deployClankerToken(params: ClankerDeployParams): Promise<ClankerDeployResult> {
  try {
    console.log("[v0] [Clanker Deploy] Starting deployment with params:", {
      name: params.name,
      symbol: params.symbol,
      totalSupply: params.totalSupply,
      decimals: params.decimals,
      deployerAddress: params.deployerAddress,
      hasImageUrl: !!params.imageUrl,
      hasDescription: !!params.description,
    })

    // Get private key from environment
    const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY
    if (!privateKey) {
      throw new Error("SERVER_WALLET_PRIVATE_KEY not configured")
    }

    console.log("[v0] [Clanker Deploy] Private key found, formatting...")
    const formattedPrivateKey = privateKey.trim().startsWith("0x") ? privateKey.trim() : `0x${privateKey.trim()}`

    // Setup viem clients
    console.log("[v0] [Clanker Deploy] Creating viem account from private key...")
    const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`)
    console.log("[v0] [Clanker Deploy] Server wallet address:", account.address)

    console.log("[v0] [Clanker Deploy] Creating public client...")
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    })

    console.log("[v0] [Clanker Deploy] Checking server wallet balance...")
    const balance = await publicClient.getBalance({ address: account.address })
    const balanceInEth = formatEther(balance)
    console.log("[v0] [Clanker Deploy] Server wallet balance:", balanceInEth, "ETH")

    if (balance === 0n) {
      throw new Error(`Server wallet (${account.address}) has no ETH balance. Please fund the wallet to deploy tokens.`)
    }

    if (balance < 10000000000000000n) {
      // Less than 0.01 ETH
      console.warn(
        "[v0] [Clanker Deploy] WARNING: Server wallet balance is low:",
        balanceInEth,
        "ETH. Deployment may fail due to insufficient gas.",
      )
    }

    console.log("[v0] [Clanker Deploy] Creating wallet client...")
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(),
    })

    // Initialize Clanker SDK
    console.log("[v0] [Clanker Deploy] Initializing Clanker SDK...")
    const clanker = new Clanker({
      publicClient,
      wallet: walletClient,
    })
    console.log("[v0] [Clanker Deploy] Clanker SDK initialized successfully")

    const deployConfig: any = {
      name: params.name,
      symbol: params.symbol,
      tokenAdmin: params.deployerAddress as Address,
      rewards: {
        recipients: [
          {
            recipient: params.deployerAddress as Address,
            admin: params.deployerAddress as Address,
            bps: 10_000, // 100%
            token: "Both",
          },
        ],
      },
      // Use the standard pool configuration from Clanker documentation
      // These tick values are tested and known to work
      pool: {
        pairedToken: "0x4200000000000000000000000000000000000006", // WETH on Base
        tickIfToken0IsClanker: -423_800,
        tickSpacing: 200, // Required by contract - all ticks must be multiples of this
        positions: [
          { tickLower: -423_800, tickUpper: -318_400, positionBps: 9500 }, // 95% in tight range
          { tickLower: -318_400, tickUpper: -100_000, positionBps: 500 }, // 5% in wider range
        ],
      },
    }

    if (params.imageUrl) {
      deployConfig.image = params.imageUrl
      console.log("[v0] [Clanker Deploy] Including track artwork:", params.imageUrl)
    }

    if (params.description || params.imageUrl) {
      deployConfig.metadata = {
        description: params.description || `Token for ${params.name}`,
        socialMediaUrls: [],
        auditUrls: [],
      }
      console.log("[v0] [Clanker Deploy] Including metadata")
    }

    deployConfig.context = {
      interface: "Anti-Platform Music",
      platform: "web3-music",
      messageId: "",
      id: params.deployerAddress,
    }

    console.log("[v0] [Clanker Deploy] Deploy config prepared:", {
      name: deployConfig.name,
      symbol: deployConfig.symbol,
      tokenAdmin: deployConfig.tokenAdmin,
      hasImage: !!deployConfig.image,
      hasMetadata: !!deployConfig.metadata,
      hasContext: !!deployConfig.context,
      usingPresetPositions: false,
    })

    console.log("[v0] [Clanker Deploy] Calling clanker.deploy()...")
    const { txHash, waitForTransaction, error } = await clanker.deploy(deployConfig)

    console.log("[v0] [Clanker Deploy] Deploy call returned:", {
      hasTxHash: !!txHash,
      hasWaitForTransaction: !!waitForTransaction,
      hasError: !!error,
    })

    if (error) {
      console.error("[v0] [Clanker Deploy] SDK returned error object")

      // Try to extract the actual contract revert reason
      let errorMessage = "Token deployment failed"
      let errorDetails = ""

      if (error.message) {
        errorMessage = error.message
      }

      // Check if this is a contract revert error
      if ((error as any).error) {
        const innerError = (error as any).error
        console.error("[v0] [Clanker Deploy] Inner error found:", innerError)

        if (typeof innerError === "string") {
          errorDetails = innerError
        } else if (innerError.message) {
          errorDetails = innerError.message
        }

        // Check for common revert reasons
        if (errorDetails.includes("insufficient funds")) {
          errorMessage = `Insufficient funds in server wallet (${account.address}). Current balance: ${balanceInEth} ETH`
        } else if (errorDetails.includes("gas")) {
          errorMessage = "Transaction failed due to gas issues. The server wallet may need more ETH."
        } else if (errorDetails.includes("reverted")) {
          errorMessage = `Contract execution reverted: ${errorDetails}`
        }
      }

      // Check error data for additional context
      if ((error as any).data) {
        console.error("[v0] [Clanker Deploy] Error data:", (error as any).data)
      }

      console.error("[v0] [Clanker Deploy] Final error message:", errorMessage)
      console.error("[v0] [Clanker Deploy] Error details:", errorDetails || "No additional details")

      throw new Error(errorMessage)
    }

    console.log("[v0] [Clanker Deploy] Transaction submitted:", txHash)
    console.log("[v0] [Clanker Deploy] Waiting for transaction confirmation...")

    const { address } = await waitForTransaction()

    console.log("[v0] [Clanker Deploy] Token deployed successfully:", {
      address,
      txHash,
    })

    return {
      success: true,
      tokenAddress: address,
      txHash,
    }
  } catch (error) {
    console.error("[v0] [Clanker Deploy] Deployment failed with error")
    console.error("[v0] [Clanker Deploy] Error type:", typeof error)
    console.error("[v0] [Clanker Deploy] Error instanceof Error:", error instanceof Error)

    if (error instanceof Error) {
      console.error("[v0] [Clanker Deploy] Error.message:", error.message)
      console.error("[v0] [Clanker Deploy] Error.name:", error.name)
      console.error("[v0] [Clanker Deploy] Error.stack:", error.stack)
    }

    let errorMessage = "Unknown error during Clanker deployment"

    if (error instanceof Error) {
      errorMessage = error.message
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
