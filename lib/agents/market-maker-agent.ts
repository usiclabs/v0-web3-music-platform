import { getAgentWalletService, type AgentWalletService } from "./wallet-service"
import { createClient } from "@/lib/supabase/server"
import { formatUnits, type Address, parseEther, parseUnits } from "viem"
import { createPublicClient, createWalletClient, http } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import {
  UNISWAP_V3_ROUTER_ABI,
  UNISWAP_V3_FACTORY_ABI,
  ERC20_ABI,
  UNISWAP_V3_ROUTER,
  UNISWAP_V3_FACTORY,
} from "@/lib/web3/contracts"
import { getAgentWalletKeys, generateWalletsForAgent } from "./wallet-generator"

// Removed hardcoded USI_TOKEN_ADDRESS, it will be fetched from agent config
const USI_TOKEN_SYMBOL = "USI"
const USI_TOKEN_NAME = "Universal Sound Index"

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

const BASE_RPC_ENDPOINTS = [
  "https://base-rpc.publicnode.com", // More reliable than mainnet.base.org
  "https://base.blockpi.network/v1/rpc/public",
  "https://1rpc.io/base",
  "https://mainnet.base.org",
]

let currentRpcIndex = 0
let rpcFailureCount = 0
const MAX_FAILURES_BEFORE_ROTATION = 3

function getRpcUrl(): string {
  // Rotate to next RPC if current one is failing
  if (rpcFailureCount >= MAX_FAILURES_BEFORE_ROTATION) {
    currentRpcIndex = (currentRpcIndex + 1) % BASE_RPC_ENDPOINTS.length
    rpcFailureCount = 0
    console.log(`[MM Agent] Rotating to RPC endpoint ${currentRpcIndex + 1}/${BASE_RPC_ENDPOINTS.length}`)
  }

  return BASE_RPC_ENDPOINTS[currentRpcIndex]
}

function handleRpcError(error: any) {
  // Check if error is rate limiting
  if (error?.message?.includes("rate limit") || error?.message?.includes("429")) {
    rpcFailureCount++
    console.log(`[MM Agent] RPC rate limit hit (${rpcFailureCount}/${MAX_FAILURES_BEFORE_ROTATION})`)
  }
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
  owner_address?: string
  token_address?: string
  token_symbol?: string
  profitable_mode?: boolean
  burst_mode?: boolean
  burst_trades_count?: number
  burst_delay_seconds?: number
  pro_mode?: boolean
  max_mode?: boolean
  volume_generated?: bigint
  fomo_mode?: boolean
  fomo_intensity?: number // 1-10 scale for aggressiveness
  fomo_pattern?: "accumulation" | "breakout" | "momentum" | "reversal" | "whale_signal"
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
  private ownerAddress: string | null = null
  private _walletKeys: Map<number, string> = new Map()
  private _walletAccounts: Map<number, any> = new Map()
  private _currentWalletIndex = 0

  constructor(agentId: string, ownerAddress?: string) {
    this.walletService = getAgentWalletService()
    this.agentId = agentId
    this.ownerAddress = ownerAddress || null
  }

  async getStats(): Promise<{
    totalBuys: number
    totalSells: number
    volumeGenerated: string
    walletStats?: any[]
  }> {
    const supabase = await createClient()

    try {
      console.log("[v0] Getting stats for agent:", this.agentId)

      // Get wallet stats - these track individual wallet buy/sell counts
      const { data: wallets, error: walletsError } = await supabase
        .from("mm_agent_wallets")
        .select("*")
        .eq("agent_id", this.agentId)
        .order("wallet_index", { ascending: true })

      console.log("[v0] Wallets fetched:", wallets?.length || 0, walletsError?.message)

      // Get trades for volume calculation
      const { data: trades, error: tradesError } = await supabase
        .from("agent_trades")
        .select("*")
        .eq("agent_id", this.agentId)

      console.log("[v0] Trades fetched:", trades?.length || 0, tradesError?.message)

      let totalBuys = 0
      let totalSells = 0
      let volumeGenerated = 0n

      if (wallets && wallets.length > 0) {
        for (const wallet of wallets) {
          // Wallets have total_buys and total_sells fields that track cumulative counts
          const buys = wallet.total_buys || 0
          const sells = wallet.total_sells || 0
          totalBuys += buys
          totalSells += sells

          console.log("[v0] Wallet stats:", {
            address: wallet.wallet_address,
            buys,
            sells,
            ethBalance: wallet.eth_balance,
          })
        }
      }

      if (trades && trades.length > 0) {
        for (const trade of trades) {
          try {
            let amount = 0n

            // Use amount_out for sell trades, amount_in for buy trades
            if (trade.trade_type === "sell" && trade.amount_out) {
              amount = BigInt(Math.floor(Number(trade.amount_out) * 1e18))
            } else if (trade.trade_type === "buy" && trade.amount_in) {
              amount = BigInt(Math.floor(Number(trade.amount_in) * 1e18))
            }

            volumeGenerated += amount
          } catch (e) {
            console.error("[v0] Error processing trade:", e, trade)
          }
        }
        console.log("[v0] Volume calculated from trades:", (Number(volumeGenerated) / 1e18).toFixed(6))
      }

      const result = {
        totalBuys,
        totalSells,
        volumeGenerated: (Number(volumeGenerated) / 1e18).toFixed(6),
        walletStats: wallets || [],
      }

      console.log("[v0] Final stats result:", result)
      return result
    } catch (error) {
      console.error("[v0] Error in getStats:", error)
      return {
        totalBuys: 0,
        totalSells: 0,
        volumeGenerated: "0.000000",
        walletStats: [],
      }
    }
  }

  private async loadWalletKeys(): Promise<void> {
    if (this._walletKeys.size > 0) return // Already loaded

    if (!this.ownerAddress) {
      // Fetch owner address from agent
      const supabase = await createClient()
      const { data: agent } = await supabase.from("mm_agents").select("owner_address").eq("id", this.agentId).single()

      if (!agent?.owner_address) {
        throw new Error("Agent owner address not found")
      }
      this.ownerAddress = agent.owner_address
    }

    // Load encrypted keys from database
    this._walletKeys = await getAgentWalletKeys(this.agentId, this.ownerAddress)

    if (this._walletKeys.size === 0) {
      console.log(`[MM Agent] No wallets found for agent ${this.agentId}, generating now...`)
      await generateWalletsForAgent(this.agentId, this.ownerAddress)
      this._walletKeys = await getAgentWalletKeys(this.agentId, this.ownerAddress)
    }

    console.log(`[MM Agent] Loaded ${this._walletKeys.size} wallet keys for agent ${this.agentId}`)
  }

  private async getWallet(walletIndex: number): Promise<any> {
    if (this._walletAccounts.has(walletIndex)) {
      return this._walletAccounts.get(walletIndex)
    }

    await this.loadWalletKeys()

    const privateKey = this._walletKeys.get(walletIndex)
    if (!privateKey) {
      throw new Error(`Wallet ${walletIndex} not found`)
    }

    const formattedKey = privateKey.startsWith("0x")
      ? (privateKey as `0x${string}`)
      : (`0x${privateKey}` as `0x${string}`)

    const account = privateKeyToAccount(formattedKey)
    this._walletAccounts.set(walletIndex, account)
    return account
  }

  private async getNextWallet(agent: any): Promise<any> {
    if (!agent.multi_wallet_mode) {
      // Single wallet mode - use wallet 1
      return await this.getWallet(1)
    }

    // Round-robin through active wallets
    this._currentWalletIndex = (this._currentWalletIndex % agent.active_wallets) + 1
    return await this.getWallet(this._currentWalletIndex)
  }

  /**
   * Get or create MM agent for a wallet address
   */
  static async getOrCreateByWallet(walletAddress: string): Promise<MMAgentConfig> {
    const supabase = await createClient()

    const { data: existingRows, error: fetchError } = await supabase
      .from("mm_agents")
      .select("*")
      .eq("wallet_address", walletAddress)
      .order("created_at", { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error("[MM Agent] Error fetching agent:", fetchError)
      throw new Error(`Failed to fetch MM agent: ${fetchError.message}`)
    }

    if (existingRows && existingRows.length > 0) {
      return existingRows[0] as MMAgentConfig
    }

    // Create new agent
    const { data: newAgent, error } = await supabase
      .from("mm_agents")
      .insert({
        wallet_address: walletAddress,
        is_active: false,
        buy_amount_eth: "0.0001",
        buy_interval_minutes: 5,
        sell_interval_minutes: 10,
        profitable_mode: false, // Default profitable mode to false
        burst_mode: false, // Default burst mode to false
        burst_trades_count: 5, // Default burst trades count
        burst_delay_seconds: 3, // Default burst delay seconds
        pro_mode: false, // Default pro mode to false
        max_mode: false, // Default max mode to false
        volume_generated: BigInt(0), // Initialize volume_generated as BigInt
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
  async executeBuy(wallet: any): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log("[v0] [MM Agent] Starting executeBuy...")

      console.log("[MM Agent] Attempting to buy tokens...")

      const { publicClient, walletClient, rpcUrl } = await this.createClients(wallet)
      const chainId = base.id

      const routerAddress = UNISWAP_V3_ROUTER[chainId as keyof typeof UNISWAP_V3_ROUTER] as Address

      const supabase = await createClient()
      const { data: agent } = await supabase.from("mm_agents").select("*").eq("id", this.agentId).single()

      if (!agent) {
        throw new Error("Agent not found")
      }

      const TOKEN_ADDRESS = (agent.token_address || "0x987603A52d8B966E10FBD29DcB1A574049E25B07") as Address
      const TOKEN_SYMBOL = agent.token_symbol || "USI"
      console.log(`[v0] [MM Agent] Token config - Address: ${TOKEN_ADDRESS}, Symbol: ${TOKEN_SYMBOL}`)
      console.log(
        `[v0] [MM Agent] Agent config - token_address: ${agent.token_address}, token_symbol: ${agent.token_symbol}`,
      )
      console.log(`[MM Agent] Trading token: ${TOKEN_SYMBOL} (${TOKEN_ADDRESS})`)

      const baseBuyAmount = parseEther(agent.buy_amount_eth)
      const randomMultiplier = 0.75 + Math.random() * 0.5 // Random between 0.75 and 1.25 (±5-25%)
      const configuredBuyAmount = BigInt(Math.floor(Number(baseBuyAmount) * randomMultiplier))

      console.log(`[MM Agent] Base buy amount: ${agent.buy_amount_eth} ETH`)
      console.log(
        `[MM Agent] Randomized buy amount: ${formatUnits(configuredBuyAmount, 18)} ETH (${(randomMultiplier * 100).toFixed(1)}%)`,
      )

      // Check ETH balance
      const ethBalance = await publicClient.getBalance({
        address: wallet.address,
      })

      console.log(`[MM Agent] Current ETH balance: ${formatUnits(ethBalance, 18)} ETH`)

      // Check WETH balance
      const wethBalance = (await publicClient.readContract({
        address: WETH_ADDRESS,
        abi: WETH_ABI,
        functionName: "balanceOf",
        args: [wallet.address],
      })) as bigint

      console.log(`[MM Agent] Current WETH balance: ${formatUnits(wethBalance, 18)} WETH`)

      const gasBuffer = parseEther("0.00015") // Reduced from 0.0003 to 0.00015 ETH - typical Base swaps cost ~0.0001 ETH
      let buyAmount: bigint
      let useWETH = false

      if (wethBalance >= configuredBuyAmount) {
        buyAmount = wethBalance
        useWETH = true
        console.log(`[MM Agent] Using WETH for buy: ${formatUnits(buyAmount, 18)} WETH`)
      } else if (ethBalance >= configuredBuyAmount + gasBuffer) {
        // Full configured amount available
        buyAmount = configuredBuyAmount
        console.log(`[MM Agent] Using ETH for buy: ${formatUnits(buyAmount, 18)} ETH`)
      } else if (ethBalance > gasBuffer + parseEther("0.00005")) {
        // Adaptive buy - use available balance minus gas buffer if we can't afford full amount
        // This allows smaller trades when balance is low instead of failing completely
        buyAmount = ethBalance - gasBuffer
        console.log(
          `[MM Agent] Adaptive buy - using available ETH: ${formatUnits(buyAmount, 18)} ETH (balance too low for configured amount)`,
        )
      } else {
        const error = `Insufficient balance. Have: ${formatUnits(ethBalance, 18)} ETH + ${formatUnits(wethBalance, 18)} WETH. Need at least: ${formatUnits(gasBuffer + parseEther("0.00005"), 18)} ETH`
        console.error(`[MM Agent] ${error}`)
        await this.logActivity("buy_failed", error, { wallet: wallet.address })
        return { success: false, error }
      }

      // Get quote for expected output with 5% slippage
      const expectedTokens = await this.getQuote(useWETH ? WETH_ADDRESS : WETH_ADDRESS, TOKEN_ADDRESS, buyAmount)
      const minTokensOut = (expectedTokens * 95n) / 100n
      console.log(
        `[MM Agent] Expected ${TOKEN_SYMBOL} output: ${formatUnits(expectedTokens, 18)} (min: ${formatUnits(minTokensOut, 18)})`,
      )

      if (useWETH) {
        console.log(`[MM Agent] Checking WETH approval for router...`)
        await this.walletService.ensureApproval(WETH_ADDRESS, routerAddress, buyAmount)
      }

      // Execute the swap
      const bestPool = await this.getBestPoolByLiquidity(publicClient, TOKEN_ADDRESS, chainId)

      if (!bestPool) {
        const error = "No liquidity pool found for this token"
        console.error(`[MM Agent] ${error}`)
        await this.logActivity("buy_failed", error, { wallet: wallet.address })
        return { success: false, error }
      }

      const feeTier = bestPool.fee

      let buyTxHash: string | undefined
      let lastError = ""

      try {
        console.log(`[MM Agent] Executing buy with best pool fee tier ${feeTier} (${feeTier / 10000}%)`)

        if (useWETH) {
          const gasEstimate = await publicClient.estimateContractGas({
            address: routerAddress,
            abi: UNISWAP_V3_ROUTER_ABI,
            functionName: "exactInputSingle",
            args: [
              {
                tokenIn: WETH_ADDRESS,
                tokenOut: TOKEN_ADDRESS,
                fee: feeTier,
                recipient: wallet.address,
                amountIn: buyAmount,
                amountOutMinimum: minTokensOut,
                sqrtPriceLimitX96: 0n,
              },
            ],
            account: wallet,
          })

          const gasLimit = (gasEstimate * 120n) / 100n
          const gasPrice = await publicClient.getGasPrice()

          const txHash = await walletClient.writeContract({
            address: routerAddress,
            abi: UNISWAP_V3_ROUTER_ABI,
            functionName: "exactInputSingle",
            args: [
              {
                tokenIn: WETH_ADDRESS,
                tokenOut: TOKEN_ADDRESS,
                fee: feeTier,
                recipient: wallet.address,
                amountIn: buyAmount,
                amountOutMinimum: minTokensOut,
                sqrtPriceLimitX96: 0n,
              },
            ],
            gas: gasLimit,
            gasPrice: gasPrice,
          })

          console.log(`[MM Agent] Buy transaction (WETH) sent: ${txHash}`)
          const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

          if (receipt.status === "success") {
            console.log(`[MM Agent] Buy successful! TX: ${txHash}`)
            buyTxHash = txHash
          }
        } else {
          const gasEstimate = await publicClient.estimateContractGas({
            address: routerAddress,
            abi: UNISWAP_V3_ROUTER_ABI,
            functionName: "exactInputSingle",
            args: [
              {
                tokenIn: WETH_ADDRESS,
                tokenOut: TOKEN_ADDRESS,
                fee: feeTier,
                recipient: wallet.address,
                amountIn: buyAmount,
                amountOutMinimum: minTokensOut,
                sqrtPriceLimitX96: 0n,
              },
            ],
            account: wallet,
            value: buyAmount,
          })

          const gasLimit = (gasEstimate * 120n) / 100n
          const gasPrice = await publicClient.getGasPrice()

          const txHash = await walletClient.writeContract({
            address: routerAddress,
            abi: UNISWAP_V3_ROUTER_ABI,
            functionName: "exactInputSingle",
            args: [
              {
                tokenIn: WETH_ADDRESS,
                tokenOut: TOKEN_ADDRESS,
                fee: feeTier,
                recipient: wallet.address,
                amountIn: buyAmount,
                amountOutMinimum: minTokensOut,
                sqrtPriceLimitX96: 0n,
              },
            ],
            value: buyAmount,
            gas: gasLimit,
            gasPrice: gasPrice,
          })

          console.log(`[MM Agent] Buy transaction (ETH) sent: ${txHash}`)
          const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

          if (receipt.status === "success") {
            console.log(`[MM Agent] Buy successful! TX: ${txHash}`)
            buyTxHash = txHash
          }
        }
      } catch (error: any) {
        lastError = error.message || error.toString()
        console.log(`[MM Agent] Best pool fee tier ${feeTier} failed: ${lastError}`)

        if (lastError.includes("insufficient funds")) {
          console.error(`[MM Agent] Insufficient funds for gas. Please fund the wallet.`)
        }
      }

      if (!buyTxHash) {
        const error = `Trade failed with best pool: ${lastError}`
        console.error(`[MM Agent] Buy failed: ${error}`)
        await this.logActivity("buy_failed", error, { wallet: wallet.address })
        return { success: false, error }
      }

      // Record the trade
      await this.recordTrade("buy", buyAmount, minTokensOut, buyTxHash, wallet.address)

      await this.logActivity("buy_executed", `Bought ${formatUnits(minTokensOut, 18)} ${TOKEN_SYMBOL}`, {
        wallet: wallet.address,
        txHash: buyTxHash,
        amountIn: formatUnits(buyAmount, 18),
        currency: useWETH ? "WETH" : "ETH",
        amountOut: formatUnits(minTokensOut, 18),
      })

      if (buyTxHash) {
        try {
          const ethSpent = Number(formatUnits(buyAmount, 18))
          const tokensReceived = Number(formatUnits(minTokensOut, 18))
          const buyPrice = ethSpent / tokensReceived // ETH per token

          const supabase = await createClient()
          await supabase
            .from("mm_agent_wallets")
            .update({
              last_buy_price: buyPrice,
              last_buy_amount: tokensReceived,
            })
            .eq("agent_id", this.agentId)
            .eq("wallet_address", wallet.address)

          console.log(`[MM Agent] Recorded buy price: ${buyPrice.toFixed(8)} ETH per ${TOKEN_SYMBOL}`)
        } catch (error) {
          console.error("[MM Agent] Failed to record buy price:", error)
        }
      }

      await this.updateLastBuyTime()

      return { success: true, txHash: buyTxHash }
    } catch (error: any) {
      console.error("[MM Agent] Buy execution error:", error.message)
      await this.logActivity("buy_error", error.message || "Unknown error during buy", { wallet: wallet.address })
      return { success: false, error: error.message || "Unknown error" }
    }
  }

  /**
   * Execute a sell operation - swap accumulated USI for ETH
   * Enhanced to unwrap WETH to ETH after selling
   */
  async executeSell(
    wallet: any,
    amountTokens?: string,
    slippageBps = 500,
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log("[v0] [MM Agent] Starting executeSell...")

      console.log("[MM Agent] Attempting to sell accumulated tokens...")

      const { publicClient, walletClient, rpcUrl } = await this.createClients(wallet)
      const chainId = base.id

      const routerAddress = UNISWAP_V3_ROUTER[chainId as keyof typeof UNISWAP_V3_ROUTER] as Address

      const supabase = await createClient()
      const { data: agent } = await supabase.from("mm_agents").select("*").eq("id", this.agentId).single()

      if (!agent) {
        throw new Error("Agent not found")
      }

      const TOKEN_ADDRESS = (agent.token_address || "0x987603A52d8B966E10FBD29DcB1A574049E25B07") as Address
      const TOKEN_SYMBOL = agent.token_symbol || "USI"
      console.log(`[v0] [MM Agent] Token config - Address: ${TOKEN_ADDRESS}, Symbol: ${TOKEN_SYMBOL}`)
      console.log(
        `[v0] [MM Agent] Agent config - token_address: ${agent.token_address}, token_symbol: ${agent.token_symbol}`,
      )
      console.log(`[MM Agent] Selling token: ${TOKEN_SYMBOL} (${TOKEN_ADDRESS})`)

      const tokenBalance = await publicClient.readContract({
        address: TOKEN_ADDRESS, // Use configured token
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [wallet.address],
      })

      console.log(`[v0] Raw balance from contract: ${tokenBalance.toString()}`)

      if (tokenBalance === 0n) {
        console.log(`[MM Agent] No ${TOKEN_SYMBOL} tokens to sell`)
        return { success: false, error: "No tokens to sell" }
      }

      if (agent.profitable_mode) {
        const { data: walletData } = await supabase
          .from("mm_agent_wallets")
          .select("last_buy_price")
          .eq("agent_id", this.agentId)
          .eq("wallet_address", wallet.address)
          .single()

        if (walletData && walletData.last_buy_price > 0) {
          // Get current price by querying expected ETH output for 1 token
          const oneToken = parseUnits("1", 18)
          const currentEthForOneToken = await this.getQuote(TOKEN_ADDRESS, WETH_ADDRESS, oneToken)
          const currentPrice = Number(formatUnits(currentEthForOneToken, 18)) // ETH per token

          const buyPrice = Number(walletData.last_buy_price)
          const profitPercent = ((currentPrice - buyPrice) / buyPrice) * 100

          console.log(`[MM Agent] Profitable Mode Check:`)
          console.log(`  Buy price: ${buyPrice.toFixed(8)} ETH per ${TOKEN_SYMBOL}`)
          console.log(`  Current price: ${currentPrice.toFixed(8)} ETH per ${TOKEN_SYMBOL}`)
          console.log(`  Profit: ${profitPercent.toFixed(2)}%`)

          if (profitPercent < 10) {
            const message = `Not profitable yet. Current profit: ${profitPercent.toFixed(2)}%, need >10%`
            console.log(`[MM Agent] ${message}`)
            await this.logActivity("sell_skipped", message, { wallet: wallet.address })
            return { success: false, error: message }
          }

          console.log(`[MM Agent] ✓ Profit threshold met (${profitPercent.toFixed(2)}%), proceeding with sell`)
        }
      }

      let sellAmount = amountTokens ? parseUnits(amountTokens, 18) : tokenBalance / 2n // Default to 50% if not specified
      console.log(`[MM Agent] Total balance: ${formatUnits(tokenBalance, 18)} ${TOKEN_SYMBOL}`)
      console.log(`[MM Agent] Selling ${amountTokens ? formatUnits(sellAmount, 18) : "50%"} ${TOKEN_SYMBOL}`)

      // Ensure sell amount is not more than the available balance
      if (sellAmount > tokenBalance) {
        console.log(
          `[MM Agent] Requested sell amount (${formatUnits(sellAmount, 18)}) exceeds balance (${formatUnits(tokenBalance, 18)}). Selling max available.`,
        )
        sellAmount = tokenBalance
      }

      if (sellAmount < parseUnits("1", 18)) {
        console.log(`[MM Agent] Sell amount too small, need at least 1 ${TOKEN_SYMBOL}`)
        return { success: false, error: "Sell amount too small" }
      }

      // Estimate output with slippage
      const minEthOut = await this.getQuote(TOKEN_ADDRESS, WETH_ADDRESS, sellAmount) // Use configured token
      const minEthOutWithSlippage = (minEthOut * (10000n - BigInt(slippageBps))) / 10000n
      console.log(
        `[MM Agent] Expected WETH output: ${formatUnits(minEthOut, 18)} (min: ${formatUnits(minEthOutWithSlippage, 18)})`,
      )

      console.log(`[MM Agent] Checking approval for router...`)
      const currentAllowance = await publicClient.readContract({
        address: TOKEN_ADDRESS, // Use configured token
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [wallet.address, routerAddress],
      })

      console.log(`[v0] Current allowance: ${formatUnits(currentAllowance as bigint, 18)} ${TOKEN_SYMBOL}`)

      if ((currentAllowance as bigint) < sellAmount) {
        console.log(`[MM Agent] Insufficient allowance, approving ${formatUnits(sellAmount, 18)} ${TOKEN_SYMBOL}`)

        const approvalAmount = sellAmount * 2n // Approve 2x for future trades
        const approveHash = await walletClient.writeContract({
          address: TOKEN_ADDRESS, // Use configured token
          abi: ERC20_ABI,
          functionName: "approve",
          args: [routerAddress, approvalAmount],
        })

        console.log(`[MM Agent] Approval transaction sent: ${approveHash}`)
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
        console.log(`[MM Agent] Approval confirmed, proceeding with swap...`)
      }

      // Get the best pool by liquidity and use its fee tier
      const bestPool = await this.getBestPoolByLiquidity(publicClient, TOKEN_ADDRESS, chainId)

      if (!bestPool) {
        const error = "No liquidity pool found for this token"
        console.error(`[MM Agent] ${error}`)
        await this.logActivity("sell_failed", error, { wallet: wallet.address })
        return { success: false, error }
      }

      const feeTier = bestPool.fee

      let sellTxHash: string | undefined
      let lastError = ""

      try {
        console.log(`[MM Agent] Executing sell with best pool fee tier ${feeTier} (${feeTier / 10000}%)`)

        const gasEstimate = await publicClient.estimateContractGas({
          address: routerAddress,
          abi: UNISWAP_V3_ROUTER_ABI,
          functionName: "exactInputSingle",
          args: [
            {
              tokenIn: TOKEN_ADDRESS, // Use configured token
              tokenOut: WETH_ADDRESS,
              fee: feeTier,
              recipient: wallet.address,
              amountIn: sellAmount,
              amountOutMinimum: minEthOutWithSlippage,
              sqrtPriceLimitX96: 0n,
            },
          ],
          account: wallet,
        })

        const gasLimit = (gasEstimate * 120n) / 100n
        console.log(`[MM Agent] Gas estimate: ${gasEstimate}, using limit: ${gasLimit}`)

        const gasPrice = await publicClient.getGasPrice()
        console.log(`[MM Agent] Current gas price: ${formatUnits(gasPrice, 9)} gwei`)

        const txHash = await walletClient.writeContract({
          address: routerAddress,
          abi: UNISWAP_V3_ROUTER_ABI,
          functionName: "exactInputSingle",
          args: [
            {
              tokenIn: TOKEN_ADDRESS, // Use configured token
              tokenOut: WETH_ADDRESS,
              fee: feeTier,
              recipient: wallet.address,
              amountIn: sellAmount,
              amountOutMinimum: minEthOutWithSlippage,
              sqrtPriceLimitX96: 0n,
            },
          ],
          gas: gasLimit,
          gasPrice: gasPrice,
        })

        console.log(`[MM Agent] Sell transaction sent: ${txHash}`)

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

        if (receipt.status === "success") {
          console.log(`[MM Agent] Sell successful! TX: ${txHash}`)
          sellTxHash = txHash
        } else {
          lastError = `Transaction reverted for fee tier ${feeTier}`
          console.log(`[MM Agent] ${lastError}`)
        }
      } catch (error: any) {
        lastError = error.message || error.toString()
        console.log(`[MM Agent] Best pool fee tier ${feeTier} failed: ${lastError}`)

        if (lastError.includes("insufficient funds")) {
          console.error(`[MM Agent] Insufficient funds for gas. Please fund the wallet.`)
        }
      }

      if (!sellTxHash) {
        const error = `Trade failed with best pool: ${lastError}`
        console.error(`[MM Agent] Sell failed: ${error}`)
        await this.logActivity("sell_failed", error, { wallet: wallet.address })
        return { success: false, error }
      }

      try {
        console.log(`[MM Agent] Unwrapping WETH to ETH...`)

        const wethBalance = (await publicClient.readContract({
          address: WETH_ADDRESS,
          abi: WETH_ABI,
          functionName: "balanceOf",
          args: [wallet.address],
        })) as bigint

        if (wethBalance > 0n) {
          const unwrapGasEstimate = await publicClient.estimateContractGas({
            address: WETH_ADDRESS,
            abi: WETH_ABI,
            functionName: "withdraw",
            args: [wethBalance],
            account: wallet,
          })

          const unwrapGasLimit = (unwrapGasEstimate * 120n) / 100n
          const gasPrice = await publicClient.getGasPrice()

          const unwrapTxHash = await walletClient.writeContract({
            address: WETH_ADDRESS,
            abi: WETH_ABI,
            functionName: "withdraw",
            args: [wethBalance],
            gas: unwrapGasLimit,
            gasPrice: gasPrice,
          })

          console.log(`[MM Agent] Unwrap transaction sent: ${unwrapTxHash}`)

          const unwrapReceipt = await publicClient.waitForTransactionReceipt({ hash: unwrapTxHash })

          if (unwrapReceipt.status === "success") {
            console.log(`[MM Agent] Successfully unwrapped ${formatUnits(wethBalance, 18)} WETH to ETH`)
          }
        }
      } catch (error: any) {
        console.log(`[MM Agent] Warning: Failed to unwrap WETH: ${error.message}`)
      }

      // Record the trade
      await this.recordTrade("sell", sellAmount, minEthOutWithSlippage, sellTxHash, wallet.address)

      await this.logActivity("sell_executed", `Sold ${formatUnits(sellAmount, 18)} ${TOKEN_SYMBOL}`, {
        wallet: wallet.address,
        txHash: sellTxHash,
        amountIn: formatUnits(sellAmount, 18),
        currency: TOKEN_SYMBOL,
        amountOut: formatUnits(minEthOutWithSlippage, 18),
      })

      await this.updateLastSellTime()

      return { success: true, txHash: sellTxHash }
    } catch (error: any) {
      console.error("[MM Agent] Sell execution error:", error.message)
      await this.logActivity("sell_error", error.message || "Unknown error during sell", { wallet: wallet.address })
      return { success: false, error: error.message || "Unknown error" }
    }
  }

  private async createClients(wallet: any) {
    const rpcUrl = getRpcUrl()
    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl),
    })

    const walletClient = createWalletClient({
      chain: base,
      transport: http(rpcUrl),
      account: wallet,
    })

    return { publicClient, walletClient, rpcUrl }
  }

  private async getQuote(tokenIn: Address, tokenOut: Address, amountIn: bigint): Promise<bigint> {
    const supabase = await createClient()
    const { data: quote } = await supabase.rpc("get_quote", {
      token_in: tokenIn,
      token_out: tokenOut,
      amount_in: amountIn.toString(),
    })

    if (!quote) {
      throw new Error("Failed to get quote")
    }

    return BigInt(quote.amount_out)
  }

  private async getBestPoolByLiquidity(publicClient: any, tokenAddress: Address, chainId: number): Promise<any> {
    const factoryAddress = UNISWAP_V3_FACTORY[chainId as keyof typeof UNISWAP_V3_FACTORY] as Address

    const pools = await publicClient.readContracts({
      contracts: [
        {
          address: factoryAddress,
          abi: UNISWAP_V3_FACTORY_ABI,
          functionName: "getPool",
          args: [tokenAddress, WETH_ADDRESS, 500], // 0.05% fee tier
        },
        {
          address: factoryAddress,
          abi: UNISWAP_V3_FACTORY_ABI,
          functionName: "getPool",
          args: [tokenAddress, WETH_ADDRESS, 3000], // 0.3% fee tier
        },
        {
          address: factoryAddress,
          abi: UNISWAP_V3_FACTORY_ABI,
          functionName: "getPool",
          args: [tokenAddress, WETH_ADDRESS, 10000], // 1% fee tier
        },
      ],
    })

    const bestPool = pools.find((pool: any) => pool.result !== null)
    return bestPool
  }

  private async recordTrade(
    action: "buy" | "sell",
    amountIn: bigint,
    amountOut: bigint,
    txHash: string,
    walletAddress: string,
  ): Promise<void> {
    const supabase = await createClient()
    await supabase.from("mm_agent_trades").insert({
      agent_id: this.agentId,
      wallet_address: walletAddress,
      action: action,
      amount_in: amountIn.toString(),
      amount_out: amountOut.toString(),
      tx_hash: txHash,
    })
  }

  private async logActivity(activityType: string, message: string, metadata?: any): Promise<void> {
    const supabase = await createClient()
    await supabase.from("mm_agent_activities").insert({
      agent_id: this.agentId,
      activity_type: activityType,
      message: message,
      metadata: metadata || {},
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

  async runCycle(
    shouldBuy = true,
    shouldSell = true,
  ): Promise<{ buyExecuted: boolean; sellExecuted: boolean; messages: string[] }> {
    const messages: string[] = []
    let buyExecuted = false
    let sellExecuted = false

    try {
      // Get next wallet for execution
      const wallet = await this.getNextWallet(null)
      if (!wallet) {
        messages.push("No available wallets for execution")
        return { buyExecuted, sellExecuted, messages }
      }

      // Execute buy if requested
      if (shouldBuy) {
        try {
          const buyResult = await this.executeBuy(wallet)
          if (buyResult.success) {
            buyExecuted = true
            messages.push(`Buy executed successfully: ${buyResult.txHash}`)
          } else {
            messages.push(`Buy failed: ${buyResult.error}`)
          }
        } catch (buyError: any) {
          messages.push(`Buy error: ${buyError.message}`)
        }
      }

      // Execute sell if requested
      if (shouldSell) {
        try {
          const sellResult = await this.executeSell(wallet)
          if (sellResult.success) {
            sellExecuted = true
            messages.push(`Sell executed successfully: ${sellResult.txHash}`)
          } else {
            messages.push(`Sell failed: ${sellResult.error}`)
          }
        } catch (sellError: any) {
          messages.push(`Sell error: ${sellError.message}`)
        }
      }
    } catch (error: any) {
      messages.push(`Cycle error: ${error.message}`)
    }

    return { buyExecuted, sellExecuted, messages }
  }
}
