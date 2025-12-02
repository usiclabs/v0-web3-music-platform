"use client"

import { useState, useCallback, useEffect } from "react"
import type { Address, Hex } from "viem"
import { useWallet } from "./wallet-context"
import {
  createTransferAuthorization,
  getEIP3009Domain,
  TRANSFER_WITH_AUTHORIZATION_TYPES,
  parseSignature,
  isBaseAppWallet,
  supportsEIP3009,
  type TransferAuthorization,
} from "./eip3009"
import { base } from "wagmi/chains"

export interface SignedAuthorization {
  authorization: TransferAuthorization
  v: number
  r: Hex
  s: Hex
  signature: Hex
}

export function useEIP3009() {
  const [isSigning, setIsSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSmartWallet, setIsSmartWallet] = useState(false)
  const [supportsGaslessPayments, setSupportsGaslessPayments] = useState(true)
  const [isCoinbaseSmartWallet, setIsCoinbaseSmartWallet] = useState(false)

  const { address, signTypedData, chainId, connector } = useWallet()

  useEffect(() => {
    async function detectWalletType() {
      if (!address) {
        setIsSmartWallet(false)
        setSupportsGaslessPayments(true)
        setIsCoinbaseSmartWallet(false)
        return
      }

      try {
        const currentChainId = chainId || base.id
        const isSmart = await isBaseAppWallet(address as Address, currentChainId)
        setIsSmartWallet(isSmart)

        // Check if EIP-3009 is supported (it's NOT for smart wallets)
        const supports3009 = await supportsEIP3009(address as Address, currentChainId)
        setSupportsGaslessPayments(supports3009)

        // Detect Coinbase Smart Wallet specifically
        const connectorName = connector?.name?.toLowerCase() || ""
        const connectorId = connector?.id?.toLowerCase() || ""
        const isCoinbase =
          connectorName.includes("coinbase") ||
          connectorId.includes("coinbase") ||
          connectorName.includes("smart wallet") ||
          isSmart // Base App wallets are Coinbase Smart Wallets
        setIsCoinbaseSmartWallet(isCoinbase && isSmart)

        console.log("[v0] Wallet detection complete:", {
          address,
          isSmartWallet: isSmart,
          supportsGaslessPayments: supports3009,
          isCoinbaseSmartWallet: isCoinbase && isSmart,
        })
      } catch (err) {
        console.error("[v0] Wallet type detection failed:", err)
        // Default to EOA on error
        setIsSmartWallet(false)
        setSupportsGaslessPayments(true)
        setIsCoinbaseSmartWallet(false)
      }
    }

    detectWalletType()
  }, [address, chainId, connector])

  const signTransferAuthorization = useCallback(
    async (
      to: Address,
      value: bigint,
      validAfter?: bigint,
      validBefore?: bigint,
      nonce?: Hex,
      explicitChainId?: number,
    ): Promise<SignedAuthorization> => {
      if (!address) {
        throw new Error("Wallet not connected")
      }

      setIsSigning(true)
      setError(null)

      try {
        const currentChainId = explicitChainId || chainId || base.id

        console.log(
          "[v0] Signing on chain:",
          currentChainId,
          "(wallet chain:",
          chainId,
          "explicit:",
          explicitChainId,
          ")",
        )

        const authorization = createTransferAuthorization(
          address as Address,
          to,
          value,
          validAfter || 0n,
          validBefore,
          nonce,
          isSmartWallet,
        )

        console.log("[v0] Created authorization:", {
          from: authorization.from,
          to: authorization.to,
          value: authorization.value.toString(),
          validAfter: authorization.validAfter.toString(),
          validBefore: authorization.validBefore.toString(),
          nonce: authorization.nonce,
        })

        const domain = getEIP3009Domain(currentChainId)

        console.log("[v0] Signing with domain:", domain)

        const signature = await signTypedData(
          domain,
          TRANSFER_WITH_AUTHORIZATION_TYPES,
          {
            from: authorization.from,
            to: authorization.to,
            value: authorization.value,
            validAfter: authorization.validAfter,
            validBefore: authorization.validBefore,
            nonce: authorization.nonce,
          },
          "TransferWithAuthorization",
        )

        console.log("[v0] Signature received:", signature.slice(0, 20) + "...")

        const { v, r, s } = parseSignature(signature as Hex, isSmartWallet)

        console.log("[v0] Parsed signature components: v =", v)

        return {
          authorization,
          v,
          r,
          s,
          signature: signature as Hex,
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to sign authorization"
        console.error("[v0] Sign authorization error:", errorMessage)
        setError(errorMessage)
        throw err
      } finally {
        setIsSigning(false)
      }
    },
    [address, chainId, signTypedData, isSmartWallet],
  )

  return {
    signTransferAuthorization,
    isSigning,
    error,
    isSmartWallet,
    supportsGaslessPayments,
    isCoinbaseSmartWallet,
  }
}
