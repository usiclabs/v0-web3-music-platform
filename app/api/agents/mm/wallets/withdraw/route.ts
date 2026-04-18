import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAgentWalletKeys } from "@/lib/agents/wallet-generator"
import { createWalletClient, createPublicClient, http, formatEther } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { base } from "viem/chains"
import { ERC20_ABI } from "@/lib/web3/contracts"

const USI_TOKEN = "0xECE5d962d17901ef200Da050C7c74AB45C96Db07"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentId, walletIndex, recipientAddress, ownerAddress, withdrawType } = body

    const walletIndexNum = typeof walletIndex === "string" ? Number.parseInt(walletIndex, 10) : walletIndex

    if (!agentId || walletIndexNum === undefined || !recipientAddress || !ownerAddress || !withdrawType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify ownership
    const { data: agent } = await supabase.from("mm_agents").select("owner_address").eq("id", agentId).single()

    if (!agent || agent.owner_address.toLowerCase() !== ownerAddress.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get the wallet's private key
    const keyMap = await getAgentWalletKeys(agentId, ownerAddress)
    const privateKey = keyMap.get(walletIndexNum)

    if (!privateKey) {
      console.error("[v0] Wallet not found for index:", walletIndexNum, "available:", Array.from(keyMap.keys()))
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
    const account = privateKeyToAccount(formattedKey as `0x${string}`)

    const publicClient = createPublicClient({
      chain: base,
      transport: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`),
    })

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`),
    })

    let txHash: string

    if (withdrawType === "eth") {
      // Get ETH balance
      const balance = await publicClient.getBalance({ address: account.address })
      // Estimate gas
      const gasPrice = await publicClient.getGasPrice()
      const gasLimit = 21000n
      const gasCost = gasPrice * gasLimit

      // Withdraw all ETH minus gas
      const amountToSend = balance - gasCost

      if (amountToSend <= 0n) {
        return NextResponse.json({ error: "Insufficient balance to cover gas" }, { status: 400 })
      }

      txHash = await walletClient.sendTransaction({
        to: recipientAddress as `0x${string}`,
        value: amountToSend,
      })

      console.log(`[API] Withdrew ${formatEther(amountToSend)} ETH from wallet ${walletIndexNum}. TX: ${txHash}`)
    } else if (withdrawType === "token") {
      // Get USI balance
      const balance = (await publicClient.readContract({
        address: USI_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
      })) as bigint

      if (balance <= 0n) {
        return NextResponse.json({ error: "No token balance to withdraw" }, { status: 400 })
      }

      // Transfer all tokens
      txHash = await walletClient.writeContract({
        address: USI_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [recipientAddress as `0x${string}`, balance],
      })

      console.log(`[API] Withdrew ${formatEther(balance)} tokens from wallet ${walletIndexNum}. TX: ${txHash}`)
    } else {
      return NextResponse.json({ error: "Invalid withdraw type" }, { status: 400 })
    }

    return NextResponse.json({ success: true, txHash })
  } catch (error: any) {
    console.error("[API] Withdraw failed:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
