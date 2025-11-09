import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createWalletClient, http, publicActions, hashTypedData, recoverAddress, isAddress } from "viem"
import { base } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { USDC_ADDRESS, USDC_TRANSFER_WITH_AUTHORIZATION_ABI } from "@/lib/web3/contracts"

// X402 payment settlement endpoint
// This endpoint executes the on-chain transfer and records the payment
export async function POST(request: NextRequest) {
  try {
    const { paymentPayload, trackId, listenerAddress, chunkIndex } = await request.json()

    console.log("[v0] Settling payment for track:", trackId, "chunk:", chunkIndex)

    if (!paymentPayload || !trackId || !listenerAddress || chunkIndex === undefined) {
      console.log("[v0] Settlement failed: Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields: paymentPayload, trackId, listenerAddress, or chunkIndex" },
        { status: 400 },
      )
    }

    const { scheme, network, authorization } = paymentPayload

    if (!scheme || !network || !authorization) {
      console.log("[v0] Settlement failed: Invalid payment payload")
      return NextResponse.json({ error: "Invalid payment payload structure" }, { status: 400 })
    }

    const { from, to, value, validAfter, validBefore, nonce, v, r, s } = authorization

    if (!from || !to || !value || validAfter === undefined || validBefore === undefined || !nonce || !v || !r || !s) {
      console.log("[v0] Settlement failed: Missing authorization fields")
      return NextResponse.json({ error: "Missing required authorization fields" }, { status: 400 })
    }

    // Validate authorization is still valid
    const now = Math.floor(Date.now() / 1000)
    if (now < validAfter || now > validBefore) {
      console.log("[v0] Settlement failed: Authorization expired or not yet valid")
      return NextResponse.json({ error: "Authorization expired or not yet valid" }, { status: 400 })
    }

    // Get track details from database
    const supabase = await createClient()
    const { data: track } = await supabase
      .from("tracks")
      .select("price_per_chunk, artist_id, royalty_splits(*)")
      .eq("id", trackId)
      .maybeSingle()

    if (!track) {
      console.log("[v0] Settlement failed: Track not found")
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    // Validate payment amount matches track price
    const expectedAmount = Math.floor(Number(track.price_per_chunk) * 1_000_000) // Convert to USDC smallest units (6 decimals)
    if (Number(value) !== expectedAmount) {
      console.log("[v0] Settlement failed: Payment amount mismatch. Expected:", expectedAmount, "Got:", value)
      return NextResponse.json(
        { error: "Payment amount mismatch", expected: expectedAmount, received: value },
        { status: 400 },
      )
    }

    const hasRoyaltySplits = track.royalty_splits && track.royalty_splits.length > 0
    const relayerAddress = process.env.NEXT_PUBLIC_RELAYER_ADDRESS
    const isRelayerValid = relayerAddress && isAddress(relayerAddress)

    const expectedRecipient = hasRoyaltySplits && isRelayerValid ? (relayerAddress as string) : track.artist_id

    if (hasRoyaltySplits && !isRelayerValid) {
      console.warn(
        "[v0] WARNING: Track has royalty splits but NEXT_PUBLIC_RELAYER_ADDRESS is not valid:",
        relayerAddress,
        "- Using artist address instead",
      )
    }

    if (to.toLowerCase() !== expectedRecipient.toLowerCase()) {
      console.log("[v0] Settlement failed: Payment recipient mismatch. Expected:", expectedRecipient, "Got:", to)
      return NextResponse.json({ error: "Payment recipient mismatch" }, { status: 400 })
    }

    try {
      // Reconstruct the EIP-712 message hash to verify signature
      const domain = {
        name: "USD Coin",
        version: "2",
        chainId: 8453,
        verifyingContract: USDC_ADDRESS[8453],
      } as const

      const types = {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      } as const

      const message = {
        from: from as `0x${string}`,
        to: to as `0x${string}`,
        value: Number(value),
        validAfter: Number(validAfter),
        validBefore: Number(validBefore),
        nonce: nonce as `0x${string}`,
      }

      // Combine v, r, s into signature with flexible format handling
      const rHex = r.startsWith("0x") ? r.slice(2) : r
      const sHex = s.startsWith("0x") ? s.slice(2) : s

      // Validate hex string lengths
      if (rHex.length !== 64 || sHex.length !== 64) {
        console.error("[v0] Invalid r or s length. r:", rHex.length, "s:", sHex.length)
        return NextResponse.json(
          {
            error: "Invalid signature format: r and s must be 32 bytes each",
            rLength: rHex.length,
            sLength: sHex.length,
          },
          { status: 400 },
        )
      }

      // Normalize v value
      let normalizedV = typeof v === "string" ? Number.parseInt(v, 16) : v
      if (normalizedV < 27) {
        normalizedV = normalizedV + 27
      }
      if (normalizedV !== 27 && normalizedV !== 28) {
        console.warn("[v0] Unusual v value:", normalizedV, "- normalizing to", normalizedV % 2 === 0 ? 28 : 27)
        normalizedV = normalizedV % 2 === 0 ? 28 : 27
      }

      const vHex = normalizedV.toString(16).padStart(2, "0")
      const signature = `0x${rHex}${sHex}${vHex}` as `0x${string}`

      console.log("[v0] Verifying signature locally...")
      console.log("[v0] Domain:", domain)
      console.log("[v0] Message for verification:", {
        from: message.from,
        to: message.to,
        value: message.value,
        validAfter: message.validAfter,
        validBefore: message.validBefore,
        nonce: message.nonce,
      })
      console.log("[v0] Signature components - r:", r, "s:", s, "v:", normalizedV)
      console.log("[v0] Reconstructed signature:", signature)
      console.log("[v0] Signature length:", signature.length, "(expected 132 with 0x prefix)")

      // Recover the signer address from the signature
      const messageHash = hashTypedData({
        domain,
        types,
        primaryType: "TransferWithAuthorization",
        message,
      })

      console.log("[v0] Message hash:", messageHash)

      let recoveredAddress: string
      try {
        recoveredAddress = await recoverAddress({
          hash: messageHash,
          signature,
        })
      } catch (recoverError) {
        console.error("[v0] Address recovery failed:", recoverError)
        return NextResponse.json(
          {
            error: "Failed to recover signer address from signature",
            details: recoverError instanceof Error ? recoverError.message : "Unknown error",
            signature,
            messageHash,
          },
          { status: 400 },
        )
      }

      console.log("[v0] Expected signer:", from)
      console.log("[v0] Recovered signer:", recoveredAddress)

      if (recoveredAddress.toLowerCase() !== from.toLowerCase()) {
        console.error("[v0] Signature verification failed: recovered address does not match")
        return NextResponse.json(
          {
            error: "Invalid signature: signer mismatch",
            expected: from.toLowerCase(),
            recovered: recoveredAddress.toLowerCase(),
            signature,
            messageHash,
            hint: "This may be due to wallet-specific signature format differences. Please try using Base Wallet, Trust Wallet, or MetaMask.",
          },
          { status: 400 },
        )
      }

      console.log("[v0] Signature verified successfully!")
    } catch (verifyError) {
      console.error("[v0] Signature verification error:", verifyError)
      return NextResponse.json(
        {
          error: "Signature verification failed",
          details: verifyError instanceof Error ? verifyError.message : "Unknown error",
          hint: "Please ensure you're using a compatible wallet (Base Wallet, Trust Wallet, MetaMask) and try again.",
        },
        { status: 400 },
      )
    }

    let txHash: string | undefined

    try {
      const serverPrivateKey = process.env.SERVER_WALLET_PRIVATE_KEY

      if (!serverPrivateKey || serverPrivateKey.trim() === "") {
        console.log("[v0] Warning: SERVER_WALLET_PRIVATE_KEY not configured, skipping on-chain settlement")
      } else {
        const formattedPrivateKey = serverPrivateKey.startsWith("0x") ? serverPrivateKey : `0x${serverPrivateKey}`

        const keyWithoutPrefix = formattedPrivateKey.slice(2)
        if (keyWithoutPrefix.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(keyWithoutPrefix)) {
          console.error("[v0] Invalid private key format. Expected 64 hex characters (with or without 0x prefix)")
          return NextResponse.json(
            { error: "Server wallet configuration error. Please contact support." },
            { status: 500 },
          )
        }

        console.log("[v0] Executing on-chain transfer...")

        const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`)

        const walletClient = createWalletClient({
          account,
          chain: base,
          transport: http(),
        }).extend(publicActions)

        const usdcAddress = USDC_ADDRESS[8453]

        const rHex = r.startsWith("0x") ? r.slice(2) : r
        const sHex = s.startsWith("0x") ? s.slice(2) : s
        let normalizedV = typeof v === "string" ? Number.parseInt(v, 16) : v
        if (normalizedV < 27) {
          normalizedV = normalizedV + 27
        }
        if (normalizedV !== 27 && normalizedV !== 28) {
          console.warn("[v0] Unusual v value:", normalizedV, "- normalizing to", normalizedV % 2 === 0 ? 28 : 27)
          normalizedV = normalizedV % 2 === 0 ? 28 : 27
        }
        const vHex = normalizedV.toString(16).padStart(2, "0")
        const signature = `0x${rHex}${sHex}${vHex}` as `0x${string}`

        const latestNonce = await walletClient.getTransactionCount({
          address: account.address,
          blockTag: "pending", // Include pending transactions
        })
        console.log("[v0] Using nonce:", latestNonce)

        const gasPrice = await walletClient.getGasPrice()
        const maxFeePerGas = (gasPrice * 120n) / 100n // 20% higher
        const maxPriorityFeePerGas = (gasPrice * 10n) / 100n // 10% of base fee as priority

        console.log(
          "[v0] Gas configuration - maxFeePerGas:",
          maxFeePerGas.toString(),
          "maxPriorityFeePerGas:",
          maxPriorityFeePerGas.toString(),
        )

        const submitPromise = walletClient.writeContract({
          address: usdcAddress,
          abi: USDC_TRANSFER_WITH_AUTHORIZATION_ABI,
          functionName: "transferWithAuthorization",
          args: [
            from as `0x${string}`,
            to as `0x${string}`,
            Number(value),
            Number(validAfter),
            Number(validBefore),
            nonce as `0x${string}`,
            signature,
          ],
          nonce: latestNonce,
          maxFeePerGas,
          maxPriorityFeePerGas,
          gas: 100000n, // Explicit gas limit for transferWithAuthorization
        })

        const hash = await Promise.race([
          submitPromise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Transaction submission timeout")), 30000),
          ),
        ])

        txHash = hash

        console.log("[v0] Transfer transaction submitted:", hash)

        const receiptPromise = walletClient.waitForTransactionReceipt({ hash })

        const receipt = await Promise.race([
          receiptPromise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Transaction confirmation timeout")), 60000),
          ),
        ])

        if (receipt.status === "reverted") {
          console.error("[v0] Transaction reverted:", receipt)
          return NextResponse.json({ error: "On-chain transfer failed", transactionHash: hash }, { status: 500 })
        }

        console.log("[v0] Transfer confirmed in block:", receipt.blockNumber)

        if (hasRoyaltySplits && isRelayerValid && track.royalty_splits.length > 0) {
          console.log("[v0] Distributing payment to", track.royalty_splits.length, "royalty split recipients")

          for (const split of track.royalty_splits) {
            const splitAmount = Math.floor((Number(value) * split.percentage) / 100)

            console.log("[v0] Sending", splitAmount, "USDC (", split.percentage, "%) to", split.wallet_address)

            try {
              const splitHash = await walletClient.writeContract({
                address: usdcAddress,
                abi: [
                  {
                    inputs: [
                      { name: "to", type: "address" },
                      { name: "amount", type: "uint256" },
                    ],
                    name: "transfer",
                    outputs: [{ name: "", type: "bool" }],
                    stateMutability: "nonpayable",
                    type: "function",
                  },
                ],
                functionName: "transfer",
                args: [split.wallet_address as `0x${string}`, splitAmount],
                maxFeePerGas,
                maxPriorityFeePerGas,
                gas: 100000n,
              })

              console.log("[v0] Split payment sent:", splitHash)

              const splitReceipt = await walletClient.waitForTransactionReceipt({ hash: splitHash })

              if (splitReceipt.status === "reverted") {
                console.error("[v0] Split payment reverted for", split.wallet_address)
              } else {
                console.log("[v0] Split payment confirmed for", split.wallet_address)
              }
            } catch (splitError) {
              console.error("[v0] Failed to send split payment to", split.wallet_address, ":", splitError)
              // Continue with other splits even if one fails
            }
          }

          console.log("[v0] Royalty split distribution complete")
        } else if (hasRoyaltySplits && !isRelayerValid) {
          console.warn(
            "[v0] Skipping royalty split distribution - relayer address not configured properly. Payment went directly to artist.",
          )
        }
      }
    } catch (onChainError) {
      console.error("[v0] On-chain settlement error:", onChainError)

      const errorMessage = onChainError instanceof Error ? onChainError.message : "Unknown error"

      if (errorMessage.includes("transfer amount exceeds balance") || errorMessage.includes("insufficient balance")) {
        const amountInUSDC = (Number(value) / 1_000_000).toFixed(6)
        return NextResponse.json(
          {
            error: "Insufficient USDC balance",
            details: `You need at least ${amountInUSDC} USDC in your wallet to play this track.`,
            hint: "You can buy USDC on Base using Coinbase, Uniswap, or bridge from another chain.",
            requiredAmount: amountInUSDC,
            userAddress: from,
          },
          { status: 402 },
        )
      }

      if (errorMessage.includes("timeout")) {
        return NextResponse.json(
          {
            error: "Transaction timeout",
            details:
              "The blockchain transaction is taking longer than expected. This is common on mobile networks. Your payment is likely still processing.",
            hint: "Please wait a few minutes and try playing the track again. If the payment went through, the chunk will be unlocked.",
          },
          { status: 504 },
        )
      }

      return NextResponse.json(
        {
          error: "On-chain transfer failed",
          details: errorMessage,
        },
        { status: 500 },
      )
    }

    // Record the stream in database
    const { data: existingStream } = await supabase
      .from("streams")
      .select("*")
      .eq("track_id", trackId)
      .eq("listener_address", listenerAddress)
      .maybeSingle()

    if (existingStream) {
      await supabase
        .from("streams")
        .update({
          chunks_played: existingStream.chunks_played + 1,
          total_paid: Number(existingStream.total_paid) + Number(track.price_per_chunk),
          last_played_at: new Date().toISOString(),
        })
        .eq("id", existingStream.id)
    } else {
      await supabase.from("streams").insert({
        track_id: trackId,
        listener_address: listenerAddress,
        chunks_played: 1,
        total_paid: track.price_per_chunk,
      })
    }

    try {
      const { data: trackData } = await supabase.from("tracks").select("title").eq("id", trackId).maybeSingle()

      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/earnings/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistAddress: track.artist_id,
          amount: Number(track.price_per_chunk),
          trackId,
          trackTitle: trackData?.title || null,
        }),
      })
    } catch (broadcastError) {
      console.error("[v0] Failed to broadcast earnings event:", broadcastError)
      // Don't fail the main transaction if broadcast fails
    }

    console.log("[v0] Payment settled successfully for chunk:", chunkIndex)

    return NextResponse.json({
      success: true,
      settled: true,
      chunkUnlocked: chunkIndex,
      txHash,
      message: "Payment executed and recorded successfully",
    })
  } catch (error) {
    console.error("[v0] X402 settle error:", error)
    return NextResponse.json(
      { error: "Settlement failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
