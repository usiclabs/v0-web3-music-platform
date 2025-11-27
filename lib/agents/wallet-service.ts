import { createPublicClient, createWalletClient, http, type Address, type Hex, formatUnits } from "viem"
import { base, baseSepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import {
  USDC_ADDRESS,
  ERC20_ABI,
  UNISWAP_V3_ROUTER,
  UNISWAP_V3_ROUTER_ABI,
  UNISWAP_V3_QUOTER,
  UNISWAP_V3_QUOTER_ABI,
} from "@/lib/web3/contracts"
import { createClient } from "@/lib/supabase/server"

// Get the appropriate chain based on environment
function getChain() {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || "8453"
  return chainId === "8453" ? base : baseSepolia
}

// RPC endpoints with fallbacks
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY

const BASE_RPC_ENDPOINTS = ALCHEMY_API_KEY
  ? [`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`]
  : ["https://mainnet.base.org", "https://base.blockpi.network/v1/rpc/public", "https://base-rpc.publicnode.com"]

const BASE_SEPOLIA_RPC_ENDPOINTS = ALCHEMY_API_KEY
  ? [`https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`]
  : ["https://sepolia.base.org", "https://base-sepolia.blockpi.network/v1/rpc/public"]

/**
 * Initialize server wallet for agent operations
 */
function getServerAccount() {
  const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY

  if (!privateKey || privateKey.trim() === "") {
    throw new Error("SERVER_WALLET_PRIVATE_KEY not configured")
  }

  const formattedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
  return privateKeyToAccount(formattedPrivateKey as `0x${string}`)
}

/**
 * Create viem clients for blockchain interaction
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

export interface AgentWalletBalance {
  usdc: bigint
  eth: bigint
  usdcFormatted: string
  ethFormatted: string
}

export interface SwapQuote {
  amountOut: bigint
  amountOutFormatted: string
  priceImpact: number
  route: string
}

export interface SwapResult {
  success: boolean
  txHash?: string
  amountIn: bigint
  amountOut: bigint
  error?: string
}

/**
 * Agent Wallet Service - Handles autonomous trading operations
 */
export class AgentWalletService {
  private publicClient: ReturnType<typeof createPublicClient>
  private walletClient: ReturnType<typeof createWalletClient>
  private account: ReturnType<typeof privateKeyToAccount>
  private chainId: number

  constructor() {
    const { publicClient, walletClient, account } = getClients()
    this.publicClient = publicClient
    this.walletClient = walletClient
    this.account = account
    this.chainId = getChain().id
  }

  /**
   * Get the agent wallet address
   */
  getAddress(): Address {
    return this.account.address
  }

  /**
   * Get agent wallet balances
   */
  async getBalances(): Promise<AgentWalletBalance> {
    const usdcAddress = USDC_ADDRESS[this.chainId as keyof typeof USDC_ADDRESS] as Address

    const [usdcBalance, ethBalance] = await Promise.all([
      this.publicClient.readContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [this.account.address],
      }) as Promise<bigint>,
      this.publicClient.getBalance({ address: this.account.address }),
    ])

    return {
      usdc: usdcBalance,
      eth: ethBalance,
      usdcFormatted: formatUnits(usdcBalance, 6),
      ethFormatted: formatUnits(ethBalance, 18),
    }
  }

  /**
   * Get token balance for a specific token
   */
  async getTokenBalance(tokenAddress: Address): Promise<bigint> {
    try {
      const balance = await this.publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [this.account.address],
      })
      return balance as bigint
    } catch (error) {
      console.error("[AgentWallet] Failed to get token balance:", error)
      return 0n
    }
  }

  /**
   * Get a swap quote for buying a token with USDC
   */
  async getSwapQuote(tokenAddress: Address, amountInUsdc: bigint, isBuy = true): Promise<SwapQuote | null> {
    try {
      const quoterAddress = UNISWAP_V3_QUOTER[this.chainId as keyof typeof UNISWAP_V3_QUOTER] as Address
      const usdcAddress = USDC_ADDRESS[this.chainId as keyof typeof USDC_ADDRESS] as Address

      const tokenIn = isBuy ? usdcAddress : tokenAddress
      const tokenOut = isBuy ? tokenAddress : usdcAddress
      const decimalsIn = isBuy ? 6 : 18 // Assume 18 decimals for tokens

      // Try different fee tiers
      const feeTiers = [3000, 10000, 500, 100]

      for (const fee of feeTiers) {
        try {
          const result = await this.publicClient.simulateContract({
            address: quoterAddress,
            abi: UNISWAP_V3_QUOTER_ABI,
            functionName: "quoteExactInputSingle",
            args: [
              {
                tokenIn,
                tokenOut,
                amountIn: amountInUsdc,
                fee,
                sqrtPriceLimitX96: 0n,
              },
            ],
          })

          const amountOut = (result.result as [bigint, bigint, number, bigint])[0]

          if (amountOut > 0n) {
            return {
              amountOut,
              amountOutFormatted: formatUnits(amountOut, isBuy ? 18 : 6),
              priceImpact: 0, // Would need more complex calculation
              route: `USDC -> Token (${fee / 10000}% fee)`,
            }
          }
        } catch {
          // Try next fee tier
          continue
        }
      }

      return null
    } catch (error) {
      console.error("[AgentWallet] Failed to get swap quote:", error)
      return null
    }
  }

  /**
   * Execute a swap - buy a token with USDC
   */
  async executeSwap(
    tokenAddress: Address,
    amountInUsdc: bigint,
    minAmountOut: bigint,
    isBuy = true,
  ): Promise<SwapResult> {
    try {
      console.log("[AgentWallet] Executing swap:", {
        tokenAddress,
        amountInUsdc: amountInUsdc.toString(),
        minAmountOut: minAmountOut.toString(),
        isBuy,
      })

      const routerAddress = UNISWAP_V3_ROUTER[this.chainId as keyof typeof UNISWAP_V3_ROUTER] as Address
      const usdcAddress = USDC_ADDRESS[this.chainId as keyof typeof USDC_ADDRESS] as Address

      const tokenIn = isBuy ? usdcAddress : tokenAddress
      const tokenOut = isBuy ? tokenAddress : usdcAddress

      // Check and set approval if needed
      const currentAllowance = (await this.publicClient.readContract({
        address: tokenIn,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [this.account.address, routerAddress],
      })) as bigint

      if (currentAllowance < amountInUsdc) {
        console.log("[AgentWallet] Setting approval for router...")
        const approveHash = await this.walletClient.writeContract({
          address: tokenIn,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [routerAddress, amountInUsdc * 2n], // Approve 2x for future trades
        })

        await this.publicClient.waitForTransactionReceipt({ hash: approveHash })
        console.log("[AgentWallet] Approval confirmed")
      }

      // Try different fee tiers
      const feeTiers = [3000, 10000, 500]
      let txHash: Hex | undefined
      let actualAmountOut = 0n

      for (const fee of feeTiers) {
        try {
          const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200) // 20 minutes

          const { request } = await this.publicClient.simulateContract({
            address: routerAddress,
            abi: UNISWAP_V3_ROUTER_ABI,
            functionName: "exactInputSingle",
            args: [
              {
                tokenIn,
                tokenOut,
                fee,
                recipient: this.account.address,
                amountIn: amountInUsdc,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: 0n,
              },
            ],
            account: this.account,
          })

          txHash = await this.walletClient.writeContract(request)
          console.log("[AgentWallet] Swap transaction sent:", txHash)

          const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash })

          if (receipt.status === "success") {
            // Get actual amount out from logs (simplified - would need proper parsing)
            actualAmountOut = minAmountOut // Approximation

            return {
              success: true,
              txHash,
              amountIn: amountInUsdc,
              amountOut: actualAmountOut,
            }
          }
        } catch (error) {
          console.log(`[AgentWallet] Fee tier ${fee} failed, trying next...`)
          continue
        }
      }

      return {
        success: false,
        amountIn: amountInUsdc,
        amountOut: 0n,
        error: "All fee tiers failed",
      }
    } catch (error: any) {
      console.error("[AgentWallet] Swap execution failed:", error)
      return {
        success: false,
        amountIn: amountInUsdc,
        amountOut: 0n,
        error: error.message || "Failed to execute swap",
      }
    }
  }

  /**
   * Log agent activity to database
   */
  async logActivity(
    agentId: string,
    activityType: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const supabase = await createClient()
      await supabase.from("agent_activity_log").insert({
        agent_id: agentId,
        activity_type: activityType,
        description,
        metadata,
      })
    } catch (error) {
      console.error("[AgentWallet] Failed to log activity:", error)
    }
  }

  /**
   * Record a trade in the database
   */
  async recordTrade(
    agentId: string,
    tradeType: "buy" | "sell",
    tokenAddress: Address,
    tokenSymbol: string,
    amountIn: bigint,
    amountOut: bigint,
    txHash: string,
    triggerReason: string,
    strategyScore: number,
  ): Promise<string | null> {
    try {
      const supabase = await createClient()

      const pricePerToken =
        tradeType === "buy"
          ? Number(formatUnits(amountIn, 6)) / Number(formatUnits(amountOut, 18))
          : Number(formatUnits(amountOut, 6)) / Number(formatUnits(amountIn, 18))

      const { data, error } = await supabase
        .from("agent_trades")
        .insert({
          agent_id: agentId,
          trade_type: tradeType,
          token_address: tokenAddress,
          token_symbol: tokenSymbol,
          amount_in: formatUnits(amountIn, tradeType === "buy" ? 6 : 18),
          amount_out: formatUnits(amountOut, tradeType === "buy" ? 18 : 6),
          price_per_token: pricePerToken,
          tx_hash: txHash,
          status: "confirmed",
          trigger_reason: triggerReason,
          strategy_score: strategyScore,
          confirmed_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (error) throw error
      return data?.id || null
    } catch (error) {
      console.error("[AgentWallet] Failed to record trade:", error)
      return null
    }
  }

  /**
   * Update agent portfolio after a trade
   */
  async updatePortfolio(
    agentId: string,
    tokenAddress: Address,
    tokenSymbol: string,
    tokenName: string,
    tradeType: "buy" | "sell",
    amount: bigint,
    usdcAmount: bigint,
  ): Promise<void> {
    try {
      const supabase = await createClient()

      // Get current portfolio entry
      const { data: existing } = await supabase
        .from("agent_portfolio")
        .select("*")
        .eq("agent_id", agentId)
        .eq("token_address", tokenAddress)
        .single()

      if (tradeType === "buy") {
        if (existing) {
          // Update existing position
          const newAmount = Number.parseFloat(existing.amount) + Number(formatUnits(amount, 18))
          const newTotalInvested = Number.parseFloat(existing.total_invested) + Number(formatUnits(usdcAmount, 6))
          const newAvgPrice = newTotalInvested / newAmount

          await supabase
            .from("agent_portfolio")
            .update({
              amount: newAmount,
              total_invested: newTotalInvested,
              avg_buy_price: newAvgPrice,
              last_updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
        } else {
          // Create new position
          const amountFloat = Number(formatUnits(amount, 18))
          const investedFloat = Number(formatUnits(usdcAmount, 6))

          await supabase.from("agent_portfolio").insert({
            agent_id: agentId,
            token_address: tokenAddress,
            token_symbol: tokenSymbol,
            token_name: tokenName,
            amount: amountFloat,
            avg_buy_price: investedFloat / amountFloat,
            total_invested: investedFloat,
          })
        }
      } else if (tradeType === "sell" && existing) {
        // Reduce position
        const soldAmount = Number(formatUnits(amount, 18))
        const newAmount = Number.parseFloat(existing.amount) - soldAmount
        const proceeds = Number(formatUnits(usdcAmount, 6))
        const costBasis = soldAmount * Number.parseFloat(existing.avg_buy_price)
        const realizedPnl = proceeds - costBasis

        if (newAmount <= 0) {
          // Position fully closed
          await supabase.from("agent_portfolio").delete().eq("id", existing.id)
        } else {
          await supabase
            .from("agent_portfolio")
            .update({
              amount: newAmount,
              realized_pnl: Number.parseFloat(existing.realized_pnl || "0") + realizedPnl,
              last_updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
        }
      }

      // Update agent's spent amount
      if (tradeType === "buy") {
        const { data: agent } = await supabase
          .from("investment_agents")
          .select("spent_amount")
          .eq("id", agentId)
          .single()

        if (agent) {
          await supabase
            .from("investment_agents")
            .update({
              spent_amount: Number.parseFloat(agent.spent_amount) + Number(formatUnits(usdcAmount, 6)),
              last_active_at: new Date().toISOString(),
            })
            .eq("id", agentId)
        }
      }
    } catch (error) {
      console.error("[AgentWallet] Failed to update portfolio:", error)
    }
  }
}

// Singleton instance
let agentWalletInstance: AgentWalletService | null = null

export function getAgentWalletService(): AgentWalletService {
  if (!agentWalletInstance) {
    agentWalletInstance = new AgentWalletService()
  }
  return agentWalletInstance
}
