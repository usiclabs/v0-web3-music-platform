"use client"

import { useState, useCallback } from "react"
import type { Address, Hex } from "viem"
import { useWallet } from "./wallet-context"
import {
  createTransferAuthorization,
  createReceiveAuthorization,
  createCancelAuthorization,
  getEIP3009Domain,
  TRANSFER_WITH_AUTHORIZATION_TYPES,
  RECEIVE_WITH_AUTHORIZATION_TYPES,
  CANCEL_AUTHORIZATION_TYPES,
  parseSignature,
  type TransferAuthorization,
  type ReceiveAuthorization,
  type CancelAuthorization,
} from "./eip3009"

export interface SignedAuthorization {
  authorization: TransferAuthorization | ReceiveAuthorization
  signature: Hex
  v: number
  r: Hex
  s: Hex
}

export interface UseEIP3009Return {
  // Transfer authorization
  signTransferAuthorization: (
    to: Address,
    value: bigint,
    validAfter?: bigint,
    validBefore?: bigint,
    nonce?: Hex,
  ) => Promise<SignedAuthorization>

  // Receive authorization
  signReceiveAuthorization: (
    from: Address,
    value: bigint,
    validAfter?: bigint,
    validBefore?: bigint,
    nonce?: Hex,
  ) => Promise<SignedAuthorization>

  // Cancel authorization
  signCancelAuthorization: (nonce: Hex) => Promise<{
    authorization: CancelAuthorization
    signature: Hex
    v: number
    r: Hex
    s: Hex
  }>

  // State
  isSigning: boolean
  error: Error | null
}

/**
 * React hook for EIP-3009 authorization signing
 * Provides easy-to-use functions for signing transfer, receive, and cancel authorizations
 */
export function useEIP3009(): UseEIP3009Return {
  const { address, chainId, signTypedData, isConnected } = useWallet()
  const [isSigning, setIsSigning] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Sign a transfer authorization
   * User authorizes a transfer from their address to another address
   */
  const signTransferAuthorization = useCallback(
    async (
      to: Address,
      value: bigint,
      validAfter = 0n,
      validBefore: bigint = BigInt(Math.floor(Date.now() / 1000) + 3600),
      nonce?: Hex,
    ): Promise<SignedAuthorization> => {
      if (!isConnected || !address || !chainId) {
        throw new Error("Wallet not connected")
      }

      setIsSigning(true)
      setError(null)

      try {
        console.log("[v0] Creating transfer authorization...")
        const authorization = createTransferAuthorization(address, to, value, validAfter, validBefore, nonce)

        console.log("[v0] Authorization details:", {
          from: authorization.from,
          to: authorization.to,
          value: authorization.value.toString(),
          validAfter: authorization.validAfter.toString(),
          validBefore: authorization.validBefore.toString(),
          nonce: authorization.nonce,
        })

        const domain = getEIP3009Domain(chainId)
        console.log("[v0] EIP-712 domain:", domain)

        console.log("[v0] Requesting signature from wallet...")
        const signature = await signTypedData(domain, TRANSFER_WITH_AUTHORIZATION_TYPES, authorization)

        console.log("[v0] Signature received, parsing...")
        const { v, r, s } = parseSignature(signature)

        console.log("[v0] Transfer authorization signed successfully")
        return {
          authorization,
          signature,
          v,
          r,
          s,
        }
      } catch (err) {
        console.error("[v0] Failed to sign transfer authorization:", err)
        const error = err instanceof Error ? err : new Error("Failed to sign authorization")
        setError(error)
        throw error
      } finally {
        setIsSigning(false)
      }
    },
    [address, chainId, isConnected, signTypedData],
  )

  /**
   * Sign a receive authorization
   * User authorizes another address to pull tokens from their address
   */
  const signReceiveAuthorization = useCallback(
    async (
      from: Address,
      value: bigint,
      validAfter = 0n,
      validBefore: bigint = BigInt(Math.floor(Date.now() / 1000) + 3600),
      nonce?: Hex,
    ): Promise<SignedAuthorization> => {
      if (!isConnected || !address || !chainId) {
        throw new Error("Wallet not connected")
      }

      setIsSigning(true)
      setError(null)

      try {
        console.log("[v0] Creating receive authorization...")
        const authorization = createReceiveAuthorization(from, address, value, validAfter, validBefore, nonce)

        console.log("[v0] Authorization details:", {
          from: authorization.from,
          to: authorization.to,
          value: authorization.value.toString(),
          validAfter: authorization.validAfter.toString(),
          validBefore: authorization.validBefore.toString(),
          nonce: authorization.nonce,
        })

        const domain = getEIP3009Domain(chainId)
        console.log("[v0] EIP-712 domain:", domain)

        console.log("[v0] Requesting signature from wallet...")
        const signature = await signTypedData(domain, RECEIVE_WITH_AUTHORIZATION_TYPES, authorization)

        console.log("[v0] Signature received, parsing...")
        const { v, r, s } = parseSignature(signature)

        console.log("[v0] Receive authorization signed successfully")
        return {
          authorization,
          signature,
          v,
          r,
          s,
        }
      } catch (err) {
        console.error("[v0] Failed to sign receive authorization:", err)
        const error = err instanceof Error ? err : new Error("Failed to sign authorization")
        setError(error)
        throw error
      } finally {
        setIsSigning(false)
      }
    },
    [address, chainId, isConnected, signTypedData],
  )

  /**
   * Sign a cancel authorization
   * User cancels a previously created authorization
   */
  const signCancelAuthorization = useCallback(
    async (nonce: Hex) => {
      if (!isConnected || !address || !chainId) {
        throw new Error("Wallet not connected")
      }

      setIsSigning(true)
      setError(null)

      try {
        console.log("[v0] Creating cancel authorization...")
        const authorization = createCancelAuthorization(address, nonce)

        console.log("[v0] Cancel authorization details:", {
          authorizer: authorization.authorizer,
          nonce: authorization.nonce,
        })

        const domain = getEIP3009Domain(chainId)
        console.log("[v0] EIP-712 domain:", domain)

        console.log("[v0] Requesting signature from wallet...")
        const signature = await signTypedData(domain, CANCEL_AUTHORIZATION_TYPES, authorization)

        console.log("[v0] Signature received, parsing...")
        const { v, r, s } = parseSignature(signature)

        console.log("[v0] Cancel authorization signed successfully")
        return {
          authorization,
          signature,
          v,
          r,
          s,
        }
      } catch (err) {
        console.error("[v0] Failed to sign cancel authorization:", err)
        const error = err instanceof Error ? err : new Error("Failed to sign authorization")
        setError(error)
        throw error
      } finally {
        setIsSigning(false)
      }
    },
    [address, chainId, isConnected, signTypedData],
  )

  return {
    signTransferAuthorization,
    signReceiveAuthorization,
    signCancelAuthorization,
    isSigning,
    error,
  }
}

/**
 * Helper function to create a gasless payment authorization
 * This is a convenience wrapper around signTransferAuthorization for common use cases
 */
export async function createGaslessPayment(
  signTransferAuthorization: UseEIP3009Return["signTransferAuthorization"],
  recipient: Address,
  amountUsdc: number,
): Promise<SignedAuthorization> {
  // Convert USDC amount to smallest unit (6 decimals)
  const value = BigInt(Math.floor(amountUsdc * 1_000_000))

  // Set validity to 1 hour from now
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600)

  return signTransferAuthorization(recipient, value, 0n, validBefore)
}
