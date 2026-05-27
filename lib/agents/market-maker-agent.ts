import { getAgentWalletService, type AgentWalletService } from "./wallet-service"
import { createClient } from "@/lib/supabase/server"
import { formatUnits, type Address, parseEther, parseUnits } from "viem"
import { createPublicClient, createWalletClient, http } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import {
  UNISWAP_V3_ROUTER_ABI,
  UNISWAP_V3_FACTORY_ABI,
  UNISWAP_V3_QUOTER_ABI,
  UNISWAP_V3_POOL_ABI,
  ERC20_ABI,
  UNISWAP_V3_ROUTER,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_QUOTER,
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
  profitable_mode?: boolean // New field for profitable mode
  burst_mode?: boolean // New field for burst mode
  burst_trades_count?: number // New field for burst trades count
  burst_delay_seconds?: number // New field for burst delay seconds
  pro_mode?: boolean // Added pro_mode
  max_mode?: boolean // Added max_mode for 20 wallets
  volume_generated?: bigint // Changed to bigint to match Supabase type
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

      const gasBuffer = parseEther("0.001") // Reserve 0.001 ETH for gas
      let buyAmount: bigint
      let useWETH = false

      if (wethBalance >= configuredBuyAmount) {
        buyAmount = wethBalance
        useWETH = true
        console.log(`[MM Agent] Using WETH for buy: ${formatUnits(buyAmount, 18)} WETH`)
      } else if (ethBalance >= configuredBuyAmount + gasBuffer) {
        // Only need buy amount + small gas buffer
        buyAmount = configuredBuyAmount
        console.log(`[MM Agent] Using ETH for buy: ${formatUnits(buyAmount, 18)} ETH`)
      } else {
        const error = `Insufficient balance. Have: ${formatUnits(ethBalance, 18)} ETH + ${formatUnits(wethBalance, 18)} WETH. Need: ${formatUnits(configuredBuyAmount + gasBuffer, 18)} ETH (or ${formatUnits(configuredBuyAmount, 18)} WETH)`
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
        // Continue anyway, the sell was successful
      }

      // Record the trade
      await this.recordTrade("sell", sellAmount, minEthOutWithSlippage, sellTxHash, wallet.address)

      await this.logActivity(
        "sell_executed",
        `Sold ${formatUnits(sellAmount, 18)} ${TOKEN_SYMBOL} for ${formatUnits(minEthOutWithSlippage, 18)} ETH`,
        {
          wallet: wallet.address,
          txHash: sellTxHash,
          amountIn: formatUnits(sellAmount, 18),
          amountOut: formatUnits(minEthOutWithSlippage, 18),
        },
      )

      await this.updateLastSellTime()

      return { success: true, txHash: sellTxHash }
    } catch (error: any) {
      console.error("[MM Agent] Sell execution error:", error.message)
      await this.logActivity("error", `Sell failed: ${error.message}`, {
        wallet: wallet.address,
      })
      return { success: false, error: error.message || "Unknown error" }
    }
  }

  /**
   * Run a market making cycle (check and execute buy/sell if needed)
   */
  async runCycle(): Promise<MMCycleResult> {
    console.log(`[v0] [MM Agent] ========== Starting cycle for agent ${this.agentId} ==========`)
    console.log(`[MM Agent] Starting cycle for agent ${this.agentId}`)

    const result: MMCycleResult = {
      buyExecuted: false,
      sellExecuted: false,
      messages: [],
    }

    const supabase = await createClient()
    const { data: agent } = await supabase.from("mm_agents").select("*").eq("id", this.agentId).single()

    if (!agent) {
      const error = `Agent ${this.agentId} not found in database`
      console.error(`[v0] [MM Agent] ${error}`)
      throw new Error(error)
    }

    if (!agent.is_active) {
      console.log(`[v0] [MM Agent] Agent ${this.agentId} is inactive (is_active: false). Skipping cycle.`)
      throw new Error("Agent is inactive")
    }

    console.log(`[v0] [MM Agent] Agent config:`, {
      id: agent.id,
      is_active: agent.is_active,
      token_address: agent.token_address,
      token_symbol: agent.token_symbol,
      buy_interval: agent.buy_interval_minutes,
      sell_interval: agent.sell_interval_minutes,
      last_buy_at: agent.last_buy_at,
      last_sell_at: agent.last_sell_at,
    })

    const wallet = await this.selectRandomWallet()
    if (!wallet) {
      const error = `No wallets available for agent ${this.agentId}`
      console.error(`[v0] [MM Agent] ${error}`)
      await this.logActivity("error", error)
      throw new Error(error)
    }

    const walletAddress = wallet.address as `0x${string}`
    console.log(`[MM Agent] Running cycle with wallet ${walletAddress} (multi-wallet: ${agent.multi_wallet_mode})`)

    const { publicClient } = await this.createClients(wallet)
    const ethBalance = await publicClient.getBalance({ address: walletAddress })
    const wethBalance = (await publicClient.readContract({
      address: WETH_ADDRESS,
      abi: WETH_ABI,
      functionName: "balanceOf",
      args: [walletAddress],
    })) as bigint

    const minRequiredETH = parseEther("0.002") // Minimum 0.002 ETH for gas
    const hasEnoughBalance = ethBalance >= minRequiredETH || wethBalance > 0n

    console.log(
      `[v0] [MM Agent] Wallet balance check: ETH=${formatUnits(ethBalance, 18)}, WETH=${formatUnits(wethBalance, 18)}`,
    )

    if (!hasEnoughBalance) {
      const msg = `Insufficient wallet balance. ETH: ${formatUnits(ethBalance, 18)}, WETH: ${formatUnits(wethBalance, 18)}. Minimum required: 0.002 ETH for gas.`
      console.warn(`[v0] [MM Agent] ${msg}`)
      await this.logActivity("cycle_skipped", msg, { wallet: walletAddress })
      result.messages.push(msg)
      return result
    }

    const now = new Date()

    // Check if we should buy
    const shouldBuy =
      !agent.last_buy_at ||
      new Date(agent.last_buy_at).getTime() + agent.buy_interval_minutes * 60 * 1000 <= now.getTime()

    console.log(`[v0] [MM Agent] Should buy: ${shouldBuy}`, {
      last_buy_at: agent.last_buy_at,
      interval_minutes: agent.buy_interval_minutes,
      time_since_last: agent.last_buy_at ? now.getTime() - new Date(agent.last_buy_at).getTime() : "never",
    })

    if (shouldBuy) {
      try {
        console.log(`[v0] [MM Agent] Executing buy...`)
        const buyResult = await this.executeBuy(wallet)

        if (buyResult.success) {
          result.buyExecuted = true
          result.messages.push(`Buy executed successfully with wallet ${walletAddress}. TX: ${buyResult.txHash}`)
          await this.updateLastBuyTime()
        } else {
          result.messages.push(`Buy failed: ${buyResult.error}`)
          await this.logActivity("buy_failed", buyResult.error || "Unknown error", { wallet: walletAddress })
        }
      } catch (error: any) {
        console.error("[MM Agent] Buy failed:", error.message)
        console.error("[v0] [MM Agent] Buy error stack:", error.stack)
        await this.logActivity("error", `Buy failed: ${error.message}`, {
          wallet: walletAddress,
        })
        result.messages.push(`Buy failed: ${error.message}`)
      }
    }

    // Check if we should sell
    const shouldSell =
      !agent.last_sell_at ||
      new Date(agent.last_sell_at).getTime() + agent.sell_interval_minutes * 60 * 1000 <= now.getTime()

    console.log(`[v0] [MM Agent] Should sell: ${shouldSell}`, {
      last_sell_at: agent.last_sell_at,
      interval_minutes: agent.sell_interval_minutes,
      time_since_last: agent.last_sell_at ? now.getTime() - new Date(agent.last_sell_at).getTime() : "never",
    })

    if (shouldSell) {
      // Check if profitable mode is enabled
      if (agent.profitable_mode) {
        const isProfitable = await this.shouldSellInProfitableMode(wallet, agent)
        if (!isProfitable) {
          result.messages.push(`Skipping sell - not profitable yet (need >10% profit)`)
          return result
        }
      }

      try {
        console.log(`[v0] [MM Agent] Executing sell...`)
        const sellResult = await this.executeSell(wallet)

        if (sellResult.success) {
          result.sellExecuted = true
          result.messages.push(`Sell executed successfully with wallet ${walletAddress}. TX: ${sellResult.txHash}`)
          await this.updateLastSellTime()
        } else {
          result.messages.push(`Sell failed: ${sellResult.error}`)
          await this.logActivity("sell_failed", sellResult.error || "Unknown error", { wallet: walletAddress })
        }
      } catch (error: any) {
        console.error("[MM Agent] Sell failed:", error.message)
        console.error("[v0] [MM Agent] Sell error stack:", error.stack)
        await this.logActivity("error", `Sell failed: ${error.message}`, {
          wallet: walletAddress,
        })
        result.messages.push(`Sell failed: ${error.message}`)
      }
    }

    // Check if burst mode is enabled
    if (agent.burst_mode) {
      try {
        const burstResult = await this.executeBurst()
        result.messages.push(`Burst mode executed: ${burstResult.success ? "Success" : "Failure"}`)
      } catch (error: any) {
        console.error("[MM Agent] Burst mode failed:", error.message)
        console.error("[v0] [MM Agent] Burst mode error stack:", error.stack)
        await this.logActivity("error", `Burst mode failed: ${error.message}`, {
          wallet: walletAddress,
        })
        result.messages.push(`Burst mode failed: ${error.message}`)
      }
    }

    await this.logActivity("cycle_complete", "Market making cycle completed", {
      wallet: walletAddress,
    })
    result.messages.push("Cycle completed")

    console.log(`[v0] [MM Agent] ========== Cycle complete for agent ${this.agentId} ==========`)
    return result
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

    // Count all buy and sell activities for this agent in one query each
    const { count: totalBuys } = await supabase
      .from("mm_agent_activity")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", this.agentId)
      .in("activity_type", ["buy", "buy_executed"])

    const { count: totalSells } = await supabase
      .from("mm_agent_activity")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", this.agentId)
      .in("activity_type", ["sell", "sell_executed"])

    console.log(`[v0] [MM Agent] getStats - Total buys: ${totalBuys || 0}`)
    console.log(`[v0] [MM Agent] getStats - Total sells: ${totalSells || 0}`)

    let walletStats = undefined
    if (agent.multi_wallet_mode) {
      const { data: walletsWithDetails } = await supabase
        .from("mm_agent_wallets")
        .select("*")
        .eq("agent_id", this.agentId)
        .eq("is_active", true)
        .order("wallet_index")

      if (walletsWithDetails) {
        walletStats = await Promise.all(
          walletsWithDetails.map(async (wallet) => {
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

    const usiBalance = await this.getTokenBalance(undefined)

    return {
      totalBuys: totalBuys || 0,
      totalSells: totalSells || 0,
      volumeGenerated: agent.total_volume_generated?.toString() || "0",
      usiBalance: usiBalance.toString(),
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

  private async getBestPoolByLiquidity(
    publicClient: any,
    tokenAddress: Address,
    chainId: number,
  ): Promise<{ poolAddress: Address; fee: number; liquidity: bigint } | null> {
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

      // Check all fee tiers: 0.05%, 0.3%, 1%
      const feeTiers = [500, 3000, 10000]
      const pools: { poolAddress: Address; fee: number; liquidity: bigint }[] = []

      console.log(`[MM Agent] Checking liquidity across all fee tiers...`)

      for (const fee of feeTiers) {
        try {
          const poolAddress = (await publicClient.readContract({
            address: factoryAddress,
            abi: UNISWAP_V3_FACTORY_ABI,
            functionName: "getPool",
            args: [token0, token1, fee],
          })) as Address

          if (poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000") {
            // Query pool liquidity
            const liquidity = (await publicClient.readContract({
              address: poolAddress,
              abi: UNISWAP_V3_POOL_ABI,
              functionName: "liquidity",
            })) as bigint

            console.log(`[MM Agent] Pool ${poolAddress} (${fee / 10000}% fee): ${formatUnits(liquidity, 18)} liquidity`)

            pools.push({ poolAddress, fee, liquidity })
          }
        } catch (error) {
          console.log(`[MM Agent] No pool found for fee tier ${fee}`)
          continue
        }
      }

      if (pools.length === 0) {
        console.error(`[MM Agent] No pools found for token ${tokenAddress}`)
        return null
      }

      // Sort by liquidity (highest first) and select the best pool
      pools.sort((a, b) => (a.liquidity > b.liquidity ? -1 : 1))
      const bestPool = pools[0]

      console.log(
        `[MM Agent] Selected pool ${bestPool.poolAddress} with ${bestPool.fee / 10000}% fee and ${formatUnits(bestPool.liquidity, 18)} liquidity`,
      )

      return bestPool
    } catch (error) {
      console.error("[MM Agent] Error finding best pool:", error)
      return null
    }
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

      const feeTiers = [3000, 10000, 500]

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

      if (!quoterAddress) {
        throw new Error(`Quoter contract not available for chain ${base.id}`)
      }

      const feeTiers = [3000, 10000, 500]
      const errors: Record<number, string> = {}

      // First check if pool exists for any fee tier
      const rpcUrl = getRpcUrl()
      const publicClient = createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      })

      let poolExists = false
      for (const fee of feeTiers) {
        const poolCheck = await this.checkPoolExists(publicClient, tokenIn, base.id)
        if (poolCheck.exists) {
          poolExists = true
          break
        }
      }

      if (!poolExists) {
        throw new Error(`No Uniswap V3 pool found for token pair ${tokenIn}/${tokenOut}`)
      }

      for (const fee of feeTiers) {
        try {
          console.log(`[MM Agent] Attempting quote with fee tier: ${fee}`)

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
            console.log(`[MM Agent] Got quote with fee tier ${fee}: ${amountOut.toString()}`)
            return amountOut
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          errors[fee] = errorMsg
          console.warn(`[MM Agent] Quote failed for fee tier ${fee}: ${errorMsg}`)
          continue
        }
      }

      const errorDetails = Object.entries(errors)
        .map(([fee, err]) => `Fee ${fee}: ${err}`)
        .join("; ")
      throw new Error(`Failed to get quote from all fee tiers. Details: ${errorDetails}`)
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
    walletAddress?: string,
  ): Promise<void> {
    try {
      const supabase = await createClient()

      // Update volume in mm_agents table
      const { data: agent } = await supabase
        .from("mm_agents")
        .select("total_volume_generated, id, token_address, token_symbol")
        .eq("id", this.agentId)
        .single()

      if (agent) {
        // This properly tracks the total value traded (both sides of the swap)
        const inputEth = Number(formatUnits(amountIn, 18))
        const outputEth = Number(formatUnits(amountOut, 18))

        // For market maker volume, we want to track total value moved
        // Buy: ETH in + token out value, Sell: token in value + ETH out
        // Since tokens are priced in ETH, we use the ETH side as the volume
        const volumeEth = tradeType === "buy" ? inputEth : outputEth

        const newVolume = Number(agent.total_volume_generated || 0) + volumeEth

        await supabase
          .from("mm_agents")
          .update({
            total_volume_generated: newVolume,
            updated_at: new Date().toISOString(),
          })
          .eq("id", this.agentId)

        console.log(`[MM Agent] Recorded ${tradeType} trade: ${txHash}, volume: ${volumeEth.toFixed(6)} ETH`)

        await this.updateMMPortfolio(
          agent.id,
          agent.token_address,
          agent.token_symbol || "USI",
          tradeType,
          amountIn,
          amountOut,
        )
      }

      if (walletAddress) {
        const incrementField = tradeType === "buy" ? "total_buys" : "total_sells"

        // Get current count
        const { data: walletData } = await supabase
          .from("mm_agent_wallets")
          .select(incrementField)
          .eq("agent_id", this.agentId)
          .eq("wallet_address", walletAddress)
          .single()

        if (walletData) {
          const currentCount = walletData[incrementField] || 0
          await supabase
            .from("mm_agent_wallets")
            .update({
              [incrementField]: currentCount + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("agent_id", this.agentId)
            .eq("wallet_address", walletAddress)

          console.log(`[MM Agent] Updated ${incrementField} for wallet ${walletAddress}: ${currentCount + 1}`)
        }
      }

      console.log(`[MM Agent] Recorded ${tradeType} trade: ${txHash}`)
    } catch (error) {
      console.error("[MM Agent] Failed to record trade:", error)
    }
  }

  private async updateMMPortfolio(
    agentId: string,
    tokenAddress: string,
    tokenSymbol: string,
    tradeType: "buy" | "sell",
    amountIn: bigint,
    amountOut: bigint,
  ): Promise<void> {
    try {
      const supabase = await createClient()

      // Get current portfolio entry
      const { data: existing } = await supabase
        .from("mm_agent_portfolio")
        .select("*")
        .eq("agent_id", agentId)
        .eq("token_address", tokenAddress)
        .maybeSingle()

      if (tradeType === "buy") {
        const tokenAmount = Number(formatUnits(amountOut, 18))
        const ethSpent = Number(formatUnits(amountIn, 18))

        if (existing) {
          // Update existing position
          const newAmount = Number.parseFloat(existing.amount || "0") + tokenAmount
          const newTotalInvested = Number.parseFloat(existing.total_invested || "0") + ethSpent
          const newAvgPrice = newTotalInvested / newAmount

          // Get current token balance to calculate current_value
          const currentBalance = await this.getTokenBalance(tokenAddress as Address)
          const currentPrice = ethSpent / tokenAmount // Current price from this trade
          const currentValue = Number(formatUnits(currentBalance, 18)) * currentPrice
          const unrealizedPnl = currentValue - newTotalInvested // Calculate PnL based on current value

          await supabase
            .from("mm_agent_portfolio")
            .update({
              amount: newAmount,
              total_invested: newTotalInvested,
              avg_buy_price: newAvgPrice,
              current_value: currentValue,
              unrealized_pnl: unrealizedPnl,
              last_updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)

          console.log("[MM Agent] Updated portfolio:", {
            amount: newAmount,
            invested: newTotalInvested,
            currentValue,
            unrealizedPnl,
          })
        } else {
          // Create new position
          const avgPrice = ethSpent / tokenAmount
          const currentValue = tokenAmount * avgPrice

          await supabase.from("mm_agent_portfolio").insert({
            agent_id: agentId,
            token_address: tokenAddress,
            token_symbol: tokenSymbol,
            token_name: tokenSymbol,
            amount: tokenAmount,
            avg_buy_price: avgPrice,
            total_invested: ethSpent,
            current_value: currentValue,
            unrealized_pnl: 0,
            first_buy_at: new Date().toISOString(),
            last_updated_at: new Date().toISOString(),
          })

          console.log("[MM Agent] Created portfolio position:", {
            amount: tokenAmount,
            invested: ethSpent,
          })
        }
      } else if (tradeType === "sell" && existing) {
        // Sell: reduce position
        const tokensSold = Number(formatUnits(amountIn, 18))
        const ethReceived = Number(formatUnits(amountOut, 18))
        const newAmount = Number.parseFloat(existing.amount || "0") - tokensSold
        const costBasis = tokensSold * Number.parseFloat(existing.avg_buy_price || "0")
        const realizedPnl = ethReceived - costBasis
        const currentTotalInvested = Number.parseFloat(existing.total_invested || "0")
        const newTotalInvested = currentTotalInvested - costBasis // Reduce invested capital by the cost basis of sold tokens

        if (newAmount <= 0.0001) {
          // Position fully closed - but keep record with zero amount
          const currentRealizedPnl = Number.parseFloat(existing.realized_pnl || "0")
          await supabase
            .from("mm_agent_portfolio")
            .update({
              amount: 0,
              current_value: 0,
              total_invested: 0, // Reset invested capital
              realized_pnl: currentRealizedPnl + realizedPnl,
              unrealized_pnl: 0,
              last_updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)

          console.log("[MM Agent] Closed portfolio position, realized P&L:", realizedPnl)
        } else {
          // Get current balance and estimate current value
          const currentBalance = await this.getTokenBalance(tokenAddress as Address)
          const currentPrice = ethReceived / tokensSold // Price from this sell
          const currentValue = Number(formatUnits(currentBalance, 18)) * currentPrice
          const currentRealizedPnl = Number.parseFloat(existing.realized_pnl || "0")
          const unrealizedPnl = currentValue - newTotalInvested // Calculate new unrealized PnL

          await supabase
            .from("mm_agent_portfolio")
            .update({
              amount: newAmount,
              total_invested: newTotalInvested,
              current_value: currentValue,
              realized_pnl: currentRealizedPnl + realizedPnl,
              unrealized_pnl: unrealizedPnl,
              last_updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)

          console.log("[MM Agent] Reduced portfolio position:", {
            newAmount,
            currentValue,
            realizedPnl,
            unrealizedPnl,
          })
        }
      }
    } catch (error) {
      console.error("[MM Agent] Failed to update portfolio:", error)
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

      const rpcUrl = "https://mainnet.base.org"
      const publicClient = createPublicClient({
        chain: base,
        transport: http(rpcUrl),
      })

      let totalBalance = 0n
      for (const wallet of wallets) {
        // FIX: USI_TOKEN_ADDRESS was undeclared. It's defined in the agent config.
        const agent = await supabase.from("mm_agents").select("token_address").eq("id", this.agentId).single()
        const USI_TOKEN_ADDRESS = agent.data.token_address as Address

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

    // FIX: USI_TOKEN_ADDRESS was undeclared. It's defined in the agent config.
    const agent = await createClient().from("mm_agents").select("token_address").eq("id", this.agentId).single()
    const USI_TOKEN_ADDRESS = agent.data.token_address as Address

    const balance = await publicClient.readContract({
      address: USI_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address],
    })

    return formatUnits(balance as bigint, 18)
  }

  /**
   * Get or create MM agent for a user
   */
  static async getOrCreateByOwner(ownerAddress: string): Promise<MMAgentConfig> {
    const supabase = await createClient()

    const { data: agent, error } = await supabase
      .from("mm_agents")
      .select("*")
      .eq("owner_address", ownerAddress)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch MM agent: ${error.message}`)
    }

    if (agent) {
      return agent as MMAgentConfig
    }

    // Agent doesn't exist - user needs to create one via /api/agents/mm/create
    throw new Error("MM agent not found. Please create one first.")
  }

  private async createClients(wallet: any) {
    const rpcUrl = getRpcUrl()

    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl, {
        batch: {
          wait: 50, // Batch requests within 50ms
        },
        retryCount: 3,
        retryDelay: 1000,
      }),
      cacheTime: 4000, // Cache for 4 seconds
    })

    const walletClient = createWalletClient({
      chain: base,
      transport: http(rpcUrl, {
        batch: {
          wait: 50,
        },
        retryCount: 3,
        retryDelay: 1000,
      }),
      account: wallet,
    })

    return { publicClient, walletClient, rpcUrl }
  }

  private async initializeAgent(ownerAddress: Address, tokenAddress: Address, tokenSymbol: string) {
    const supabase = await createClient()

    const { data: existingWallet } = await supabase
      .from("server_wallets")
      .select("*")
      .eq("owner_address", ownerAddress)
      .single()

    let walletAddress: string

    if (existingWallet) {
      walletAddress = existingWallet.wallet_address
    } else {
      const newWallet = this.walletService.generateWallet()
      walletAddress = newWallet.address

      await supabase.from("server_wallets").insert({
        owner_address: ownerAddress,
        wallet_address: walletAddress,
        encrypted_private_key: this.walletService.encryptPrivateKey(newWallet.privateKey),
      })
    }

    const defaultBuyAmountEth = "0.0001"

    await supabase.from("mm_agents").insert({
      owner_address: ownerAddress,
      token_address: tokenAddress,
      token_symbol: tokenSymbol,
      wallet_address: walletAddress,
      is_active: false,
      buy_amount_eth: defaultBuyAmountEth,
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
  }

  private async selectRandomWallet(): Promise<any> {
    await this.loadWalletKeys()
    const walletKeys = Array.from(this._walletKeys.keys())
    const randomIndex = Math.floor(Math.random() * walletKeys.length)
    // Make sure there are wallets loaded before trying to get one
    if (walletKeys.length === 0) {
      return null
    }
    return this.getWallet(walletKeys[randomIndex])
  }

  private async shouldSellInProfitableMode(wallet: any, agent: MMAgentConfig): Promise<boolean> {
    try {
      const { publicClient } = await this.createClients(wallet)

      // Get current USI balance
      const USI_TOKEN_ADDRESS = agent.token_address as Address
      const usiBalance = await publicClient.readContract({
        address: USI_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [wallet.address],
      })

      if (usiBalance === 0n) {
        console.log("[MM Agent] No USI tokens to check profit on")
        return false
      }

      // Get wallet's last buy price from database
      const supabase = await createClient()
      const { data: walletData } = await supabase
        .from("mm_agent_wallets")
        .select("last_buy_price, last_buy_amount")
        .eq("agent_id", this.agentId)
        .eq("wallet_address", wallet.address)
        .single()

      if (!walletData || !walletData.last_buy_price || walletData.last_buy_price === 0) {
        console.log("[MM Agent] No buy price recorded yet, skipping sell")
        return false
      }

      const lastBuyPrice = Number(walletData.last_buy_price)

      // Get current price by simulating a sell quote
      const sellAmount = usiBalance / 2n // Check price for 50% of balance
      const currentEthForOneToken = await this.getQuote(USI_TOKEN_ADDRESS, WETH_ADDRESS, sellAmount)

      // Calculate current price in ETH per USI
      const currentPrice = Number(formatUnits(currentEthForOneToken, 18)) / Number(formatUnits(sellAmount, 18))

      // Calculate profit percentage
      const profitPercent = ((currentPrice - lastBuyPrice) / lastBuyPrice) * 100

      console.log(`[MM Agent] Profitable mode check:`)
      console.log(`  Last buy price: ${lastBuyPrice.toFixed(8)} ETH per USI`)
      console.log(`  Current price: ${currentPrice.toFixed(8)} ETH per USI`)
      console.log(`  Profit: ${profitPercent.toFixed(2)}%`)

      if (profitPercent > 10) {
        console.log(`[MM Agent] ✅ Profit > 10%, allowing sell`)
        return true
      } else {
        console.log(`[MM Agent] ❌ Profit < 10% (${profitPercent.toFixed(2)}%), skipping sell`)
        return false
      }
    } catch (error: any) {
      console.error("[MM Agent] Error checking profitable mode:", error.message)
      return false
    }
  }

  /**
   * Execute a burst trading sequence - rapid fire buys and sells
   */
  async executeBurst(): Promise<{ success: boolean; results: any[]; error?: string }> {
    console.log(`[v0] Starting burst mode...`)

    const supabase = await createClient()
    const { data: agent } = await supabase.from("mm_agents").select("*").eq("id", this.agentId).single()

    if (!agent) {
      throw new Error("Agent not found")
    }

    const burstCount = agent.burst_trades_count || 5
    const burstDelay = (agent.burst_delay_seconds || 3) * 1000 // Convert to ms

    const results: any[] = []

    console.log(`[v0] Executing ${burstCount} rapid trades with ${burstDelay}ms delay...`)

    for (let i = 0; i < burstCount; i++) {
      const wallet = await this.getNextWallet(agent)
      console.log(`[v0] Burst ${i + 1}/${burstCount} - Using wallet ${wallet.address}`)

      const isBuy = i % 2 === 0
      console.log(`[v0] Trade type for iteration ${i}: ${isBuy ? "BUY" : "SELL"}`)

      try {
        if (isBuy) {
          console.log(`[v0] Executing BUY for wallet ${wallet.address}`)
          const buyResult = await this.executeBuy(wallet)
          console.log(`[v0] Buy result:`, buyResult)
          results.push({
            trade: i + 1,
            type: "buy",
            wallet: wallet.address,
            ...buyResult,
          })
        } else {
          console.log(`[v0] Executing SELL for wallet ${wallet.address}`)
          const sellResult = await this.executeSell(wallet)
          console.log(`[v0] Sell result:`, sellResult)
          results.push({
            trade: i + 1,
            type: "sell",
            wallet: wallet.address,
            ...sellResult,
          })
        }

        // Wait before next trade (except on last iteration)
        if (i < burstCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, burstDelay))
        }
      } catch (error: any) {
        console.error(`[v0] Burst trade ${i + 1} failed:`, error.message)
        console.error(`[v0] Burst trade ${i + 1} error stack:`, error.stack)
        results.push({
          trade: i + 1,
          type: isBuy ? "buy" : "sell",
          wallet: wallet.address,
          success: false,
          error: error.message,
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const buyCount = results.filter((r) => r.type === "buy").length
    const sellCount = results.filter((r) => r.type === "sell").length
    const successfulBuys = results.filter((r) => r.type === "buy" && r.success).length
    const successfulSells = results.filter((r) => r.type === "sell" && r.success).length

    console.log(`[v0] Burst complete: ${successCount}/${burstCount} trades successful`)
    console.log(`[v0] Breakdown: ${successfulBuys}/${buyCount} buys, ${successfulSells}/${sellCount} sells`)

    await this.logActivity(
      "burst_complete",
      `Burst mode completed: ${successCount}/${burstCount} successful (${successfulBuys} buys, ${successfulSells} sells)`,
      {
        burstCount,
        successCount,
        buyCount,
        sellCount,
        successfulBuys,
        successfulSells,
        results,
      },
    )

    return {
      success: successCount > 0,
      results,
    }
  }
}

interface MMCycleResult {
  buyExecuted: boolean
  sellExecuted: boolean
  messages: string[]
}

const SELL_PERCENTAGE = 0.5 // Sell 50% of balance
