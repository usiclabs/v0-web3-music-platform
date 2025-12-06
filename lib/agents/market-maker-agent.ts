import { getAgentWalletService, type AgentWalletService } from "./wallet-service"
import { createClient } from "@/lib/supabase/server"
import { formatUnits, type Address, parseEther } from "viem"
import { createPublicClient, createWalletClient, http } from "viem"
import { base, baseSepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import {
  UNISWAP_V3_ROUTER,
  UNISWAP_V3_ROUTER_ABI,
  UNISWAP_V3_QUOTER,
  UNISWAP_V3_QUOTER_ABI,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_FACTORY_ABI,
  ERC20_ABI, // Import ERC20_ABI from contracts.ts instead of non-existent erc20.ts
} from "@/lib/web3/contracts"

const USI_TOKEN_ADDRESS = "0x987603A52d8B966E10FBD29DcB1A574049E25B07" as Address
const USI_TOKEN_SYMBOL = "USI"
const USI_TOKEN_NAME = "Universal Sound Index"

const BUY_AMOUNT_ETH = "0.0001"
const BUY_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const SELL_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

export interface MMAgentConfig {
  id: string
  wallet_address: string
  is_active: boolean
  buy_amount_eth: string
  buy_interval_minutes: number
  sell_interval_minutes: number
  last_buy_at: string | null
  last_sell_at: string | null
  total_volume_generated: string
}

export interface MMAgentStats {
  totalBuys: number
  totalSells: number
  volumeGenerated: number
  currentUsiBalance: string
  currentEthBalance: string
}

/**
 * Market Maker Agent Service
 * Automatically buys and sells $USI tokens to generate healthy ecosystem volume
 */
export class MarketMakerAgentService {
  private walletService: AgentWalletService
  private agentId: string
  private account: any

  constructor(agentId: string) {
    this.walletService = getAgentWalletService()
    this.agentId = agentId
    this.account = privateKeyToAccount(process.env.SERVER_WALLET_PRIVATE_KEY as `0x${string}`)
  }

  /**
   * Get or create MM agent for a wallet address
   */
  static async getOrCreateByWallet(walletAddress: string): Promise<MMAgentConfig> {
    const supabase = await createClient()

    const { data: existing, error: fetchError } = await supabase
      .from("mm_agents")
      .select("*")
      .eq("wallet_address", walletAddress)
      .maybeSingle()

    if (fetchError) {
      console.error("[MM Agent] Error fetching agent:", fetchError)
      throw new Error(`Failed to fetch MM agent: ${fetchError.message}`)
    }

    if (existing) {
      return existing as MMAgentConfig
    }

    // Create new agent
    const { data: newAgent, error } = await supabase
      .from("mm_agents")
      .insert({
        wallet_address: walletAddress,
        is_active: false,
        buy_amount_eth: BUY_AMOUNT_ETH,
        buy_interval_minutes: 5,
        sell_interval_minutes: 10,
      })
      .select()
      .single()

    if (error) {
      console.error("[MM Agent] Error creating agent:", error)
      throw new Error(`Failed to create MM agent: ${error.message}`)
    }

    return newAgent as MMAgentConfig
  }

  /**
   * Check if it's time to buy based on interval
   */
  private shouldBuy(lastBuyAt: string | null, intervalMinutes: number): boolean {
    if (!lastBuyAt) return true
    const lastBuy = new Date(lastBuyAt).getTime()
    const now = Date.now()
    const intervalMs = intervalMinutes * 60 * 1000
    return now - lastBuy >= intervalMs
  }

  /**
   * Check if it's time to sell based on interval
   */
  private shouldSell(lastSellAt: string | null, intervalMinutes: number): boolean {
    if (!lastSellAt) return true
    const lastSell = new Date(lastSellAt).getTime()
    const now = Date.now()
    const intervalMs = intervalMinutes * 60 * 1000
    return now - lastSell >= intervalMs
  }

  /**
   * Execute a buy operation - swap ETH for USI
   */
  async executeBuy(amountEth: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log(`[MM Agent] Attempting to buy $USI with ${amountEth} ETH...`)

      const chain = process.env.NEXT_PUBLIC_CHAIN_ID === "8453" ? base : baseSepolia
      const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY
      if (!privateKey) throw new Error("SERVER_WALLET_PRIVATE_KEY not configured")

      const ethAmount = parseEther(amountEth)
      const minAmountOut = (ethAmount * 95n) / 100n // 5% slippage

      const publicClient = createPublicClient({
        chain: base,
        transport: http("https://mainnet.base.org"),
      })

      const walletClient = createWalletClient({
        chain: base,
        transport: http("https://mainnet.base.org"),
        account: this.account,
      })

      // Execute the swap using exactInputSingle with ETH
      const routerAddress = UNISWAP_V3_ROUTER[base.id as keyof typeof UNISWAP_V3_ROUTER] as Address
      const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as Address // Base WETH

      const feeTiers = [3000, 10000, 500]
      for (const fee of feeTiers) {
        try {
          console.log(`[MM Agent] Attempting buy with fee tier ${fee}`)

          const txHash = await walletClient.writeContract({
            address: routerAddress,
            abi: UNISWAP_V3_ROUTER_ABI,
            functionName: "exactInputSingle",
            args: [
              {
                tokenIn: WETH_ADDRESS,
                tokenOut: USI_TOKEN_ADDRESS,
                fee,
                recipient: this.account.address,
                amountIn: ethAmount,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: 0n,
              },
            ],
            value: ethAmount,
            gas: 300000n, // Manual gas limit
          })

          console.log(`[MM Agent] Buy transaction sent: ${txHash}`)

          const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

          if (receipt.status === "success") {
            console.log(`[MM Agent] Buy successful! TX: ${txHash}`)

            // Record the trade
            await this.recordTrade("buy", ethAmount, minAmountOut, txHash)

            // Log success
            await this.logActivity(
              "buy_executed",
              `Bought ${formatUnits(minAmountOut, 18)} $USI for ${amountEth} ETH`,
              { txHash, amountIn: amountEth, amountOut: formatUnits(minAmountOut, 18) },
            )

            // Update last buy time
            await this.updateLastBuyTime()

            return { success: true, txHash }
          }
        } catch (error: any) {
          console.log(`[MM Agent] Fee tier ${fee} failed: ${error.message}`)
          continue
        }
      }

      const error = "All fee tiers failed"
      console.error(`[MM Agent] Buy failed: ${error}`)
      await this.logActivity("buy_failed", error)
      return { success: false, error }
    } catch (error: any) {
      console.error("[MM Agent] Buy execution error:", error)
      await this.logActivity("buy_error", error.message || "Unknown error during buy")
      return { success: false, error: error.message || "Unknown error" }
    }
  }

  /**
   * Execute a sell operation - swap accumulated USI for ETH
   */
  async executeSell(): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log("[MM Agent] Attempting to sell accumulated $USI...")

      const chain = process.env.NEXT_PUBLIC_CHAIN_ID === "8453" ? base : baseSepolia
      const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY
      if (!privateKey) throw new Error("SERVER_WALLET_PRIVATE_KEY not configured")

      const publicClient = createPublicClient({
        chain: base,
        transport: http("https://mainnet.base.org"),
      })

      const walletClient = createWalletClient({
        chain: base,
        transport: http("https://mainnet.base.org"),
        account: this.account,
      })

      const routerAddress = UNISWAP_V3_ROUTER[base.id as keyof typeof UNISWAP_V3_ROUTER] as Address
      const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as Address

      // Get current $USI balance
      const usiBalance = await publicClient.readContract({
        address: USI_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [this.account.address],
      })

      if (usiBalance === 0n) {
        console.log(`[MM Agent] No $USI tokens to sell`)
        return { success: false, error: "No tokens to sell" }
      }

      console.log(`[MM Agent] Current $USI balance: ${formatUnits(usiBalance, 18)}`)

      // Estimate output
      const minEthOut = await this.getQuote(USI_TOKEN_ADDRESS, WETH_ADDRESS, usiBalance)
      console.log(`[MM Agent] Expected ETH output: ${formatUnits(minEthOut, 18)}`)

      // Ensure approval for the router
      console.log(`[MM Agent] Checking approval for router...`)
      await this.walletService.ensureApproval(
        this.account,
        USI_TOKEN_ADDRESS,
        routerAddress,
        usiBalance,
        publicClient,
        walletClient,
      )

      // Execute the swap (sell = swap tokens for ETH)
      const feeTiers = [3000, 10000, 500]
      for (const fee of feeTiers) {
        try {
          console.log(`[MM Agent] Attempting sell with fee tier ${fee}`)

          const txHash = await walletClient.writeContract({
            address: routerAddress,
            abi: UNISWAP_V3_ROUTER_ABI,
            functionName: "exactInputSingle",
            args: [
              {
                tokenIn: USI_TOKEN_ADDRESS,
                tokenOut: WETH_ADDRESS,
                fee,
                recipient: this.account.address,
                amountIn: usiBalance,
                amountOutMinimum: minEthOut,
                sqrtPriceLimitX96: 0n,
              },
            ],
            gas: 300000n, // Manual gas limit
          })

          console.log(`[MM Agent] Sell transaction sent: ${txHash}`)

          const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

          if (receipt.status === "success") {
            console.log(`[MM Agent] Sell successful! TX: ${txHash}`)

            // Record the trade
            await this.recordTrade("sell", usiBalance, minEthOut, txHash)

            // Log success
            await this.logActivity(
              "sell_executed",
              `Sold ${formatUnits(usiBalance, 18)} $USI for ${formatUnits(minEthOut, 18)} ETH`,
              {
                txHash,
                amountIn: formatUnits(usiBalance, 18),
                amountOut: formatUnits(minEthOut, 18),
              },
            )

            // Update last sell time
            await this.updateLastSellTime()

            return { success: true, txHash }
          }
        } catch (error: any) {
          console.log(`[MM Agent] Fee tier ${fee} failed: ${error.message}`)
          continue
        }
      }

      const error = "All fee tiers failed"
      console.error(`[MM Agent] Sell failed: ${error}`)
      await this.logActivity("sell_failed", error)
      return { success: false, error }
    } catch (error: any) {
      console.error("[MM Agent] Sell execution error:", error)
      await this.logActivity("sell_error", error.message || "Unknown error during sell")
      return { success: false, error: error.message || "Unknown error" }
    }
  }

  /**
   * Run a market making cycle (check and execute buy/sell if needed)
   */
  async runCycle(): Promise<{ buyExecuted: boolean; sellExecuted: boolean; messages: string[] }> {
    const messages: string[] = []
    let buyExecuted = false
    let sellExecuted = false

    try {
      console.log("[MM Agent] Running market making cycle...")

      // Get agent config from database
      const supabase = await createClient()
      const { data: config } = await supabase.from("mm_agents").select("*").eq("id", this.agentId).single()

      if (!config || !config.is_active) {
        messages.push("Agent is not active")
        return { buyExecuted, sellExecuted, messages }
      }

      // Check if it's time to buy
      if (this.shouldBuy(config.last_buy_at, config.buy_interval_minutes)) {
        messages.push("Executing buy cycle...")
        const buyResult = await this.executeBuy(config.buy_amount_eth)
        if (buyResult.success) {
          buyExecuted = true
          messages.push(`✓ Bought $USI - TX: ${buyResult.txHash}`)
        } else {
          messages.push(`✗ Buy failed: ${buyResult.error}`)
        }
      } else {
        messages.push("Not time to buy yet")
      }

      // Check if it's time to sell
      if (this.shouldSell(config.last_sell_at, config.sell_interval_minutes)) {
        messages.push("Executing sell cycle...")
        const sellResult = await this.executeSell()
        if (sellResult.success) {
          sellExecuted = true
          messages.push(`✓ Sold $USI - TX: ${sellResult.txHash}`)
        } else {
          messages.push(`✗ Sell failed: ${sellResult.error}`)
        }
      } else {
        messages.push("Not time to sell yet")
      }

      await this.logActivity("cycle_completed", messages.join(" | "))
    } catch (error: any) {
      console.error("[MM Agent] Cycle error:", error)
      messages.push(`Error: ${error.message}`)
      await this.logActivity("cycle_error", error.message)
    }

    return { buyExecuted, sellExecuted, messages }
  }

  /**
   * Get agent statistics
   */
  async getStats(): Promise<MMAgentStats> {
    const supabase = await createClient()

    // Get trade counts
    const { data: trades } = await supabase
      .from("agent_trades")
      .select("trade_type, amount_out")
      .eq("agent_id", this.agentId)
      .eq("token_address", USI_TOKEN_ADDRESS)

    const totalBuys = trades?.filter((t) => t.trade_type === "buy").length || 0
    const totalSells = trades?.filter((t) => t.trade_type === "sell").length || 0

    // Calculate volume (sum of all ETH amounts)
    const volumeGenerated = trades?.reduce((sum, t) => sum + Number.parseFloat(t.amount_out), 0) || 0

    // Get current balances
    const balances = await this.walletService.getBalances()
    const usiBalance = await this.walletService.getTokenBalance(USI_TOKEN_ADDRESS)

    return {
      totalBuys,
      totalSells,
      volumeGenerated,
      currentUsiBalance: formatUnits(usiBalance, 18),
      currentEthBalance: balances.ethFormatted,
    }
  }

  /**
   * Helper methods
   */
  private async logActivity(activityType: string, description: string, metadata?: Record<string, any>) {
    try {
      const supabase = await createClient()
      await supabase
        .from("mm_agents")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", this.agentId)

      console.log(`[MM Agent] ${activityType}: ${description}`, metadata || {})
    } catch (error) {
      console.error("[MM Agent] Failed to log activity:", error)
    }
  }

  private async updateLastBuyTime() {
    const supabase = await createClient()
    await supabase.from("mm_agents").update({ last_buy_at: new Date().toISOString() }).eq("id", this.agentId)
  }

  private async updateLastSellTime() {
    const supabase = await createClient()
    await supabase.from("mm_agents").update({ last_sell_at: new Date().toISOString() }).eq("id", this.agentId)
  }

  private async checkPoolExists(
    publicClient: any,
    tokenAddress: Address,
    chainId: number,
  ): Promise<{ exists: boolean; fee?: number }> {
    try {
      const factoryAddress = UNISWAP_V3_FACTORY[chainId as keyof typeof UNISWAP_V3_FACTORY] as Address
      const WETH_ADDRESS =
        chainId === 8453
          ? ("0x4200000000000000000000000000000000000006" as Address)
          : ("0x4200000000000000000000000000000000000006" as Address)

      const [token0, token1] =
        tokenAddress.toLowerCase() < WETH_ADDRESS.toLowerCase()
          ? [tokenAddress, WETH_ADDRESS]
          : [WETH_ADDRESS, tokenAddress]

      const feeTiers = [3000, 10000, 500, 100]

      for (const fee of feeTiers) {
        try {
          const poolAddress = (await publicClient.readContract({
            address: factoryAddress,
            abi: UNISWAP_V3_FACTORY_ABI,
            functionName: "getPool",
            args: [token0, token1, fee],
          })) as Address

          if (poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000") {
            return { exists: true, fee }
          }
        } catch {
          continue
        }
      }

      return { exists: false }
    } catch (error) {
      console.error("[MM Agent] Error checking pool:", error)
      return { exists: false }
    }
  }

  private async getQuote(tokenIn: Address, tokenOut: Address, amountIn: bigint): Promise<bigint> {
    try {
      const quoterAddress = UNISWAP_V3_QUOTER[base.id as keyof typeof UNISWAP_V3_QUOTER] as Address

      const feeTiers = [3000, 10000, 500]

      for (const fee of feeTiers) {
        try {
          const publicClient = createPublicClient({
            chain: base,
            transport: http("https://mainnet.base.org"),
          })

          const result = await publicClient.readContract({
            address: quoterAddress,
            abi: UNISWAP_V3_QUOTER_ABI,
            functionName: "quoteExactInputSingle",
            args: [
              {
                tokenIn,
                tokenOut,
                amountIn,
                fee,
                sqrtPriceLimitX96: 0n,
              },
            ],
          })

          const amountOut = (result as [bigint, bigint, number, bigint])[0]

          if (amountOut > 0n) {
            return amountOut
          }
        } catch {
          continue
        }
      }

      throw new Error("Failed to get quote")
    } catch (error) {
      console.error("[MM Agent] Failed to get quote:", error)
      throw error
    }
  }

  private async recordTrade(
    tradeType: "buy" | "sell",
    amountIn: bigint,
    amountOut: bigint,
    txHash: string,
  ): Promise<void> {
    try {
      const supabase = await createClient()

      // Update volume in mm_agents table
      const { data: agent } = await supabase
        .from("mm_agents")
        .select("total_volume_generated")
        .eq("id", this.agentId)
        .single()

      if (agent) {
        const volumeEth = tradeType === "buy" ? Number(formatUnits(amountIn, 18)) : Number(formatUnits(amountOut, 18))

        const newVolume = Number(agent.total_volume_generated || 0) + volumeEth

        await supabase
          .from("mm_agents")
          .update({
            total_volume_generated: newVolume,
            updated_at: new Date().toISOString(),
          })
          .eq("id", this.agentId)
      }

      console.log(`[MM Agent] Recorded ${tradeType} trade: ${txHash}`)
    } catch (error) {
      console.error("[MM Agent] Failed to record trade:", error)
    }
  }
}
