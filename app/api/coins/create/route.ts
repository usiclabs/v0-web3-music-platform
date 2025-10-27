import { NextResponse } from "next/server"
import { createCoinCall, CreateConstants, setApiKey } from "@zoralabs/coins-sdk"
import { base } from "viem/chains"
import type { Address } from "viem"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { creator, name, symbol, metadata, coverImageUrl, trackId } = body

    const zoraApiKey = process.env.ZORA_API_KEY
    if (!zoraApiKey) {
      return NextResponse.json(
        {
          error:
            "Zora API key not configured. Please add ZORA_API_KEY environment variable. Get your API key at https://zora.co/settings/developer",
        },
        { status: 500 },
      )
    }

    setApiKey(zoraApiKey)

    const coinMetadata = {
      name: name,
      description: metadata.description,
      image: coverImageUrl || "/music-coin.jpg",
      external_url: `https://usi-platform.vercel.app/track/${trackId}`,
    }

    // For production, this should be uploaded to IPFS or a permanent storage
    const metadataJson = JSON.stringify(coinMetadata)
    const metadataUri = `data:application/json;base64,${Buffer.from(metadataJson).toString("base64")}`

    const coinArgs = {
      creator: creator as Address,
      name,
      symbol,
      metadata: { type: "RAW_URI" as const, uri: metadataUri },
      currency: CreateConstants.ContentCoinCurrencies.ETH,
      chainId: base.id,
      startingMarketCap: CreateConstants.StartingMarketCaps.LOW,
      skipMetadataValidation: true,
    }

    console.log("[v0] Creating coin with args:", coinArgs)

    let txCalls
    try {
      txCalls = await createCoinCall(coinArgs)
    } catch (sdkError) {
      console.error("[v0] Zora SDK error:", sdkError)
      return NextResponse.json(
        {
          error: `Zora API error: ${sdkError instanceof Error ? sdkError.message : "Unknown error"}. This may be because you need to create a creator coin on Zora first. Visit https://zora.co to create your creator profile.`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      to: txCalls.to,
      data: txCalls.data,
      value: txCalls.value.toString(),
    })
  } catch (error) {
    console.error("[v0] Coin creation error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create coin transaction",
      },
      { status: 500 },
    )
  }
}
