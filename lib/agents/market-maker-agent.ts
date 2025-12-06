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
  ERC20_ABI,
} from "@/lib/web3/contracts"

const USI_TOKEN_ADDRESS = "0x987603A52d8B966E10FBD29DcB1A574049E25B07" as Address
const USI_TOKEN_SYMBOL = "USI"
const USI_TOKEN_NAME = "Universal Sound Index"

const BUY_AMOUNT_ETH = "0.0001"
const BUY_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const SELL_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as Address // Base WETH
const WETH_ABI = [
  {
    inputs: [],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "wad", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

function getRpcUrl(): string {
  const alchemyKey = process.env.ALCHEMY_API_KEY
  if (alchemyKey) {
    return `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
  }
  // Fallback to public RPC
  return "https://mainnet.base.org"
}

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
  multi_wallet_mode?: boolean
  active_wallets?: number
}

export interface MMAgentStats {
  totalBuys: number
  totalSells: number
  volumeGenerated: string
  usiBalance: string
  walletStats?: {
    address: string
    buys: number
    sells: number
    usiBalance: string
  }[]
}

/**
 * Market Maker Agent Service
 * Automatically buys and sells $USI tokens to generate healthy ecosystem volume
 */
export class MarketMakerAgentService {
  private walletService: AgentWalletService
  private agentId: string
  private _account: any | null = null
  private _wallets: Map<number, any> = new Map()
  private _currentWalletIndex = 0

  constructor(agentId: string) {
    this.walletService = getAgentWalletService()
    this.agentId = agentId
  }

  private get account(): any {
    if (!this._account) {
      const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY
      if (!privateKey) {
        throw new Error("SERVER_WALLET_PRIVATE_KEY not configured")
      }
      // Ensure the private key has 0x prefix
      const formattedKey = privateKey.startsWith("0x")
        ? (privateKey as `0x${string}`)
        : (`0x${privateKey}` as `0x${string}`)
      this._account = privateKeyToAccount(formattedKey)
    }
    return this._account
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
  private shouldBuy(agent: MMAgentConfig, now: Date): boolean {
    if (!agent.last_buy_at) return true
    const lastBuy = new Date(agent.last_buy_at).getTime()
    const intervalMs = agent.buy_interval_minutes * 60 * 1000
    return now.getTime() - lastBuy >= intervalMs
  }

  /**
   * Check if it's time to sell based on interval
   */
  private shouldSell(agent: MMAgentConfig, now: Date): boolean {
    if (!agent.last_sell_at) return true
    const lastSell = new Date(agent.last_sell_at).getTime()
    const intervalMs = agent.sell_interval_minutes * 60 * 1000
    return now.getTime() - lastSell >= intervalMs
  }

  /**
   * Execute a buy operation - swap ETH/WETH for USI
   * Enhanced to support buying with both ETH and WETH
   */
  async executeBuy(
    amountEth: string,
    walletAccount: any,
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log(`[MM Agent] Attempting to buy $USI with ${amountEth} ETH...`)

      const rpcUrl = getRpcUrl()
      console.log(`[MM Agent] Using RPC: ${rpcUrl.substring(0, 40)}...`)

      const chain = process.env.NEXT_PUBLIC_CHAIN_ID === "8453" ? base : baseSepolia

      const ethAmount = parseEther(amountEth)
      const minAmountOut = (ethAmount * 95n) / 100n // 5% slippage

      const publicClient = createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      })

      const walletClient = createWalletClient({
        chain: base,
        transport: http(rpcUrl),
        account: walletAccount,
      })

      const routerAddress = UNISWAP_V3_ROUTER[base.id as keyof typeof UNISWAP_V3_ROUTER] as Address

      const wethBalance = (await publicClient.readContract({
        address: WETH_ADDRESS,
        abi: WETH_ABI,
        functionName: "balanceOf",
        args: [walletAccount.address],
      })) as bigint

      console.log(`[MM Agent] WETH balance: ${formatUnits(wethBalance, 18)}`)
      console.log(`[MM Agent] Need: ${formatUnits(ethAmount, 18)} ETH/WETH`)

      let useWeth = false
      let txValue = 0n

      // If we have enough WETH, use it; otherwise use native ETH
      if (wethBalance >= ethAmount) {
        console.log(`[MM Agent] Using WETH for purchase`)
        useWeth = true

        // Approve WETH spending
        await this.walletService.ensureApproval(WETH_ADDRESS, routerAddress, ethAmount)
      } else {
        console.log(`[MM Agent] Using native ETH for purchase`)
        txValue = ethAmount
      }

      // Execute the swap using exactInputSingle
      const feeTiers = [3000, 10000, 500]
      for (const fee of feeTiers) {
        try {
          console.log(`[MM Agent] Attempting buy with fee tier ${fee} (using ${useWeth ? "WETH" : "ETH"})`)

          const txHash = await walletClient.writeContract({
            address: routerAddress,
            abi: UNISWAP_V3_ROUTER_ABI,
            functionName: "exactInputSingle",
            args: [
              {
                tokenIn: WETH_ADDRESS,
                tokenOut: USI_TOKEN_ADDRESS,
                fee,
                recipient: walletAccount.address,
                amountIn: ethAmount,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: 0n,
              },
            ],
            value: txValue, // Only set if using native ETH
            gas: 300000n,
          })

          console.log(`[MM Agent] Buy transaction sent: ${txHash}`)

          const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

          if (receipt.status === "success") {
            console.log(`[MM Agent] Buy successful! TX: ${txHash}`)

            await this.recordTrade("buy", ethAmount, minAmountOut, txHash)

            await this.logActivity(
              "buy_executed",
              `Bought ${formatUnits(minAmountOut, 18)} $USI with ${amountEth} ${useWeth ? "WETH" : "ETH"}`,
              {
                txHash,
                amountIn: amountEth,
                currency: useWeth ? "WETH" : "ETH",
                amountOut: formatUnits(minAmountOut, 18),
              },
            )

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
   * Enhanced to unwrap WETH to ETH after selling
   */
  async executeSell(walletAccount: any): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log("[MM Agent] Attempting to sell accumulated $USI...")

      const rpcUrl = getRpcUrl()
      console.log(`[MM Agent] Using RPC: ${rpcUrl.substring(0, 40)}...`)

      const chain = process.env.NEXT_PUBLIC_CHAIN_ID === "8453" ? base : baseSepolia

      const publicClient = createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      })

      const walletClient = createWalletClient({
        chain: base,
        transport: http(rpcUrl),
        account: walletAccount,
      })

      const routerAddress = UNISWAP_V3_ROUTER[base.id as keyof typeof UNISWAP_V3_ROUTER] as Address

      // Get current $USI balance
      const usiBalance = await publicClient.readContract({
        address: USI_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [walletAccount.address],
      })

      if (usiBalance === 0n) {
        console.log(`[MM Agent] No $USI tokens to sell`)
        return { success: false, error: "No tokens to sell" }
      }

      console.log(`[MM Agent] Current $USI balance: ${formatUnits(usiBalance, 18)}`)

      // Estimate output
      const minEthOut = await this.getQuote(USI_TOKEN_ADDRESS, WETH_ADDRESS, usiBalance)
      console.log(`[MM Agent] Expected WETH output: ${formatUnits(minEthOut, 18)}`)

      console.log(`[MM Agent] Checking approval for router...`)
      await this.walletService.ensureApproval(USI_TOKEN_ADDRESS, routerAddress, usiBalance)

      // Execute the swap (sell = swap tokens for WETH)
      const feeTiers = [3000, 10000, 500]
      let sellTxHash: string | undefined

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
                recipient: walletAccount.address,
                amountIn: usiBalance,
                amountOutMinimum: minEthOut,
                sqrtPriceLimitX96: 0n,
              },
            ],
            gas: 300000n,
          })

          console.log(`[MM Agent] Sell transaction sent: ${txHash}`)

          const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

          if (receipt.status === "success") {
            console.log(`[MM Agent] Sell successful! TX: ${txHash}`)
            sellTxHash = txHash
            break
          }
        } catch (error: any) {
          console.log(`[MM Agent] Fee tier ${fee} failed: ${error.message}`)
          continue
        }
      }

      if (!sellTxHash) {
        const error = "All fee tiers failed"
        console.error(`[MM Agent] Sell failed: ${error}`)
        await this.logActivity("sell_failed", error)
        return { success: false, error }
      }

      try {
        console.log(`[MM Agent] Unwrapping WETH to ETH...`)

        const wethBalance = (await publicClient.readContract({
          address: WETH_ADDRESS,
          abi: WETH_ABI,
          functionName: "balanceOf",
          args: [walletAccount.address],
        })) as bigint

        if (wethBalance > 0n) {
          const unwrapTxHash = await walletClient.writeContract({
            address: WETH_ADDRESS,
            abi: WETH_ABI,
            functionName: "withdraw",
            args: [wethBalance],
            gas: 100000n,
          })

          console.log(`[MM Agent] Unwrap transaction sent: ${unwrapTxHash}`)

          const unwrapReceipt = await publicClient.waitForTransactionReceipt({ hash: unwrapTxHash })

          if (unwrapReceipt.status === "success") {
            console.log(`[MM Agent] Successfully unwrapped ${formatUnits(wethBalance, 18)} WETH to ETH`)
          }
        }
      } catch (error: any) {
        console.log(`[MM Agent] Warning: Failed to unwrap WETH: ${error.message}`)
        // Continue anyway, the sell was successful
      }

      // Record the trade
      await this.recordTrade("sell", usiBalance, minEthOut, sellTxHash)

      // Log success
      await this.logActivity(
        "sell_executed",
        `Sold ${formatUnits(usiBalance, 18)} $USI for ${formatUnits(minEthOut, 18)} ETH`,
        {
          txHash: sellTxHash,
          amountIn: formatUnits(usiBalance, 18),
          amountOut: formatUnits(minEthOut, 18),
        },
      )

      // Update last sell time
      await this.updateLastSellTime()

      return { success: true, txHash: sellTxHash }
    } catch (error: any) {
      console.error("[MM Agent] Sell execution error:", error)
      await this.logActivity("sell_error", error.message || "Unknown error during sell")
      return { success: false, error: error.message || "Unknown error" }
    }
  }

  /**
   * Run a market making cycle (check and execute buy/sell if needed)
   */
  async runCycle(forceBuy?: boolean, forceSell?: boolean): Promise<void> {
    const supabase = await createClient()

    const { data: agent, error } = await supabase.from("mm_agents").select("*").eq("id", this.agentId).single()

    if (error || !agent || !agent.is_active) {
      throw new Error("Agent not found or inactive")
    }

    const now = new Date()

    // Determine which wallet to use
    const walletAccount = await this.getNextWallet(agent)
    const walletAddress = walletAccount.address

    console.log(`[MM Agent] Running cycle with wallet ${walletAddress} (multi-wallet: ${agent.multi_wallet_mode})`)

    // Buy logic
    if (forceBuy || this.shouldBuy(agent, now)) {
      try {
        await this.executeBuy(agent.buy_amount_eth || "0.0001", walletAccount)
        await supabase.from("mm_agents").update({ last_buy_at: now.toISOString() }).eq("id", this.agentId)

        // Update wallet stats
        if (agent.multi_wallet_mode) {
          await supabase
            .from("mm_agent_wallets")
            .update({
              total_buys: supabase.rpc("increment", { x: 1 }),
              last_used_at: now.toISOString(),
            })
            .eq("agent_id", this.agentId)
            .eq("wallet_address", walletAddress)
        }

        await this.logActivity("buy", "Buy executed successfully", {
          amount: agent.buy_amount_eth,
          wallet: walletAddress,
        })
      } catch (error: any) {
        console.error("[MM Agent] Buy failed:", error.message)
        await this.logActivity("error", `Buy failed: ${error.message}`, {
          wallet: walletAddress,
        })
      }
    }

    // Sell logic
    if (forceSell || this.shouldSell(agent, now)) {
      try {
        await this.executeSell(walletAccount)
        await supabase.from("mm_agents").update({ last_sell_at: now.toISOString() }).eq("id", this.agentId)

        // Update wallet stats
        if (agent.multi_wallet_mode) {
          await supabase
            .from("mm_agent_wallets")
            .update({
              total_sells: supabase.rpc("increment", { x: 1 }),
              last_used_at: now.toISOString(),
            })
            .eq("agent_id", this.agentId)
            .eq("wallet_address", walletAddress)
        }

        await this.logActivity("sell", "Sell executed successfully", {
          wallet: walletAddress,
        })
      } catch (error: any) {
        console.error("[MM Agent] Sell failed:", error.message)
        await this.logActivity("error", `Sell failed: ${error.message}`, {
          wallet: walletAddress,
        })
      }
    }

    await this.logActivity("cycle_complete", "Market making cycle completed", {
      wallet: walletAddress,
    })
  }

  /**
   * Get agent statistics
   */
  async getStats(): Promise<MMAgentStats> {
    const supabase = await createClient()

    const { data: agent } = await supabase.from("mm_agents").select("*").eq("id", this.agentId).single()

    if (!agent) {
      return {
        totalBuys: 0,
        totalSells: 0,
        volumeGenerated: "0",
        usiBalance: "0",
      }
    }

    const { data: activities } = await supabase
      .from("mm_agent_activity")
      .select("activity_type")
      .eq("agent_id", this.agentId)

    const totalBuys = activities?.filter((a) => a.activity_type === "buy").length || 0
    const totalSells = activities?.filter((a) => a.activity_type === "sell").length || 0

    let walletStats = undefined
    if (agent.multi_wallet_mode) {
      const { data: wallets } = await supabase
        .from("mm_agent_wallets")
        .select("*")
        .eq("agent_id", this.agentId)
        .eq("is_active", true)
        .order("wallet_index")

      if (wallets) {
        walletStats = await Promise.all(
          wallets.map(async (wallet) => {
            const balance = await this.getTokenBalance(wallet.wallet_address as Address)
            return {
              address: wallet.wallet_address,
              buys: wallet.total_buys,
              sells: wallet.total_sells,
              usiBalance: balance,
            }
          }),
        )
      }
    }

    const usiBalance = await this.getTokenBalance(agent.multi_wallet_mode ? undefined : this.account.address)

    return {
      totalBuys,
      totalSells,
      volumeGenerated: agent.total_volume_generated?.toString() || "0",
      usiBalance,
      walletStats,
    }
  }

  /**
   * Helper methods
   */
  private async logActivity(activityType: string, description: string, metadata?: any): Promise<void> {
    const supabase = await createClient()
    await supabase.from("mm_agent_activity").insert({
      agent_id: this.agentId,
      activity_type: activityType,
      description,
      metadata,
      wallet_address: metadata?.wallet || null,
    })
  }

  private async updateLastBuyTime(): Promise<void> {
    const supabase = await createClient()
    await supabase.from("mm_agents").update({ last_buy_at: new Date().toISOString() }).eq("id", this.agentId)
  }

  private async updateLastSellTime(): Promise<void> {
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
          const rpcUrl = getRpcUrl()

          const publicClient = createPublicClient({
            chain: base,
            transport: http(rpcUrl),
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

  private async getWallet(walletIndex: number): Promise<any> {
    if (this._wallets.has(walletIndex)) {
      return this._wallets.get(walletIndex)
    }

    const supabase = await createClient()
    const { data: wallet, error } = await supabase
      .from("mm_agent_wallets")
      .select("*")
      .eq("agent_id", this.agentId)
      .eq("wallet_index", walletIndex)
      .eq("is_active", true)
      .single()

    if (error || !wallet) {
      throw new Error(`Wallet ${walletIndex} not found or inactive`)
    }

    // Decrypt private key (for now, we'll use env vars MM_WALLET_1 through MM_WALLET_5)
    const privateKey = process.env[`MM_WALLET_${walletIndex}`]
    if (!privateKey) {
      throw new Error(`MM_WALLET_${walletIndex} not configured`)
    }

    const formattedKey = privateKey.startsWith("0x")
      ? (privateKey as `0x${string}`)
      : (`0x${privateKey}` as `0x${string}`)

    const account = privateKeyToAccount(formattedKey)
    this._wallets.set(walletIndex, account)
    return account
  }

  private async getNextWallet(agent: any): Promise<any> {
    if (!agent.multi_wallet_mode) {
      return this.account
    }

    // Round-robin through active wallets
    this._currentWalletIndex = (this._currentWalletIndex % agent.active_wallets) + 1
    return await this.getWallet(this._currentWalletIndex)
  }

  static async setupMultiWallet(agentId: string, numWallets = 5): Promise<void> {
    const supabase = await createClient()

    // Update agent to enable multi-wallet mode
    await supabase
      .from("mm_agents")
      .update({
        multi_wallet_mode: true,
        active_wallets: numWallets,
      })
      .eq("id", agentId)

    // Create wallet records (wallets 1-5)
    const wallets = []
    for (let i = 1; i <= numWallets; i++) {
      const privateKey = process.env[`MM_WALLET_${i}`]
      if (!privateKey) continue

      const formattedKey = privateKey.startsWith("0x")
        ? (privateKey as `0x${string}`)
        : (`0x${privateKey}` as `0x${string}`)

      const account = privateKeyToAccount(formattedKey)

      wallets.push({
        agent_id: agentId,
        wallet_index: i,
        wallet_address: account.address,
        encrypted_private_key: privateKey, // In production, encrypt this properly
        is_active: true,
      })
    }

    if (wallets.length > 0) {
      await supabase.from("mm_agent_wallets").upsert(wallets, {
        onConflict: "agent_id,wallet_index",
      })
    }
  }

  private async getTokenBalance(address?: Address): Promise<string> {
    if (!address) {
      // Get combined balance from all wallets
      const supabase = await createClient()
      const { data: wallets } = await supabase
        .from("mm_agent_wallets")
        .select("wallet_address")
        .eq("agent_id", this.agentId)
        .eq("is_active", true)

      if (!wallets || wallets.length === 0) return "0"

      const rpcUrl = `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
      const publicClient = createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      })

      let totalBalance = 0n
      for (const wallet of wallets) {
        const balance = await publicClient.readContract({
          address: USI_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [wallet.wallet_address as Address],
        })
        totalBalance += balance as bigint
      }

      return formatUnits(totalBalance, 18)
    }

    const rpcUrl = getRpcUrl()
    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    })

    const balance = await publicClient.readContract({
      address: USI_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address],
    })

    return formatUnits(balance as bigint, 18)
  }
}
