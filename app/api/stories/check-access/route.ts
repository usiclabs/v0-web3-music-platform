import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { viewerAddress, tokenAddress, requiredAmount } = await request.json()

    if (!viewerAddress || !tokenAddress || !requiredAmount) {
      return NextResponse.json({ hasAccess: false, reason: "Missing parameters" })
    }

    // Check token balance
    const response = await fetch(
      `${request.headers.get("origin")}/api/tokens/balance?address=${viewerAddress}&tokenAddress=${tokenAddress}`,
    )

    if (!response.ok) {
      return NextResponse.json({ hasAccess: false, reason: "Failed to fetch balance" })
    }

    const { balance } = await response.json()
    const balanceNum = Number.parseFloat(balance)
    const requiredNum = Number.parseFloat(requiredAmount.toString())

    const hasAccess = balanceNum >= requiredNum

    return NextResponse.json({
      hasAccess,
      balance: balanceNum,
      required: requiredNum,
      reason: hasAccess ? "Access granted" : `Need ${requiredNum - balanceNum} more tokens`,
    })
  } catch (error) {
    console.error("[Story Access Check] Error:", error)
    return NextResponse.json({ hasAccess: false, reason: "Error checking access" })
  }
}
