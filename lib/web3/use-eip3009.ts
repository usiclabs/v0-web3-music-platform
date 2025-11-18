"use client"

import { useState, useCallback, useEffect } from "react"
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
  isBaseAppWallet,
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
  isSmartWallet: boolean
  supportsGaslessPayments: boolean
}

/**
 * React hook for EIP-3009 authorization signing
 * Provides easy-to-use functions for signing transfer, receive, and cancel authorizations
 * Note: EIP-3009 does NOT support smart contract wallets (ERC-4337)
 */
export function useEIP3009(): UseEIP3009Return {
  const { address, chainId, signTypedData, isConnected } = useWallet()
  const [isSigning, setIsSigning] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isSmartWallet, setIsSmartWallet] = useState<boolean>(false)
  const [supportsGaslessPayments, setSupportsGaslessPayments] = useState<boolean>(true)

  useEffect(() => {
    async function detectWalletType() {
      if (!address || !chainId) {
        // Reset to defaults when disconnected
        setIsSmartWallet(false)
        setSupportsGaslessPayments(true)
        return
      }
      
      try {
        const isSmart = await isBaseAppWallet(address, chainId)
        setIsSmartWallet(isSmart)
        
        // EIP-3009 does NOT support smart contract wallets
        const supportsEIP3009 = !isSmart
        setSupportsGaslessPayments(supportsEIP3009)
        
        if (isSmart) {
          console.log("[v0] ❌ Base App ERC-4337 smart wallet detected")
          console.log("[v0] EIP-3009 gasless payments NOT supported for smart wallets")
          console.log("[v0] Reason: transferWithAuthorization requires EOA signatures")
          console.log("[v0] Reference: https://eips.ethereum.org/EIPS/eip-3009")
        } else {
          console.log("[v0] ✅ Standard EOA wallet detected - EIP-3009 gasless payments supported")
        }
      } catch (err) {
        console.warn("[v0] Wallet type detection failed, defaulting to EOA:", err)
        // On error, default to EOA (safer to allow payments)
        setIsSmartWallet(false)
        setSupportsGaslessPayments(true)
      }
    }
    
    detectWalletType()
  }, [address, chainId])

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

      if (isSmartWallet) {
        throw new Error(
          "EIP-3009 gasless payments are not supported for smart contract wallets.\n\n" +
          "Your Base App wallet is an ERC-4337 smart wallet, which cannot use transferWithAuthorization.\n\n" +
          "The EIP-3009 specification explicitly states: 'This EIP does not apply to smart contract accounts.'\n\n" +
          "Please use the standard payment flow instead."
        )
      }

      setIsSigning(true)
      setError(null)

      try {
        console.log("[v0] Creating transfer authorization for", isSmartWallet ? "Base App ERC-4337 smart wallet" : "EOA wallet")
        
        // Due to relayer processing and UserOperation batching delays
        const validityPeriod = isSmartWallet ? 14400 : 3600 // 4 hours for Base App, 1 hour for EOA
        const calculatedValidBefore = validBefore || BigInt(Math.floor(Date.now() / 1000) + validityPeriod)
        
        const authorization = createTransferAuthorization(
          address, 
          to, 
          value, 
          validAfter, 
          calculatedValidBefore, 
          nonce, 
          isSmartWallet
        )

        console.log("[v0] Authorization details:", {
          from: authorization.from,
          to: authorization.to,
          value: authorization.value.toString(),
          validAfter: authorization.validAfter.toString(),
          validBefore: authorization.validBefore.toString(),
          nonce: authorization.nonce,
          walletType: isSmartWallet ? "Base App ERC-4337" : "EOA",
          validityHours: validityPeriod / 3600,
        })

        const domain = getEIP3009Domain(chainId)
        console.log("[v0] EIP-712 domain:", domain)

        console.log("[v0] Requesting signature from", isSmartWallet ? "Base App" : "wallet", "...")

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        
        // UserOperations go through bundlers/relayers which adds significant delay
        const baseTimeout = isMobile ? 300000 : 120000 // 5 min mobile, 2 min desktop
        const smartWalletMultiplier = isSmartWallet ? 3 : 1 // 3x longer for Base App
        const finalTimeout = baseTimeout * smartWalletMultiplier
        
        const timeoutMinutes = Math.floor(finalTimeout / 60000)

        console.log(`[v0] Using ${timeoutMinutes} minute timeout for ${isSmartWallet ? 'Base App ERC-4337' : 'standard'} wallet on ${isMobile ? 'mobile' : 'desktop'}`)

        if (isSmartWallet) {
          console.log("[v0] ⚠️ Base App signature may take longer due to ERC-4337 UserOperation processing")
          console.log("[v0] Please keep the Coinbase Wallet or Base App open and responsive")
        }

        const signaturePromise = signTypedData(
          domain,
          TRANSFER_WITH_AUTHORIZATION_TYPES,
          authorization,
          "TransferWithAuthorization",
        )

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            let timeoutMsg = "Signature request timeout"
            if (isSmartWallet) {
              timeoutMsg = 
                `Base App ERC-4337 signature timeout after ${timeoutMinutes} minutes.\n\n` +
                `This can happen when:\n` +
                `1. Your Base App wallet hasn't been deployed on-chain yet\n` +
                `2. The Coinbase Wallet or Base App is in the background\n` +
                `3. Network congestion is delaying the relayer\n\n` +
                `Please try:\n` +
                `• Keep the Base App open and in the foreground\n` +
                `• Make a small transaction first to deploy your wallet\n` +
                `• Check your wallet app for the signature request\n` +
                `• Wait a moment and try again`
            } else if (isMobile) {
              timeoutMsg = 
                `Mobile wallet signature timeout after ${timeoutMinutes} minutes.\n\n` +
                `Please ensure your wallet app is open and check for the signature request.`
            } else {
              timeoutMsg = `Signature request timeout after ${timeoutMinutes} minutes - please check your wallet`
            }
            reject(new Error(timeoutMsg))
          }, finalTimeout)
        })

        const signature = await Promise.race([signaturePromise, timeoutPromise])

        console.log("[v0] Signature received from", isSmartWallet ? "Base App" : "wallet", ", parsing with ERC-4337 support...")
        const { v, r, s } = parseSignature(signature, isSmartWallet)

        console.log("[v0] ✅ Transfer authorization signed successfully")
        return {
          authorization,
          signature,
          v,
          r,
          s,
        }
      } catch (err) {
        console.error("[v0] Failed to sign transfer authorization:", err)
        let errorMessage = "Failed to sign authorization"

        if (err instanceof Error) {
          if (err.message.includes("timeout") || err.message.includes("Timeout")) {
            errorMessage = isSmartWallet
              ? `Base App ERC-4337 signature timeout.\n\n` +
                `Smart wallet signatures require more time due to relayer processing.\n\n` +
                `Troubleshooting:\n` +
                `1. Ensure Coinbase Wallet or Base App is open and in the foreground\n` +
                `2. If this is a new wallet, make a small transaction first to deploy it\n` +
                `3. Check your app for the signature request notification\n` +
                `4. Try again with the wallet app already open\n\n` +
                `Tip: Base App wallets work best when the app stays open during signing.`
              : "Wallet signature timeout. On mobile, please ensure your wallet app is open and responsive. You may need to manually open your wallet to see the signature request."
          } else if (
            err.message.includes("rejected") ||
            err.message.includes("denied") ||
            err.message.includes("User rejected")
          ) {
            errorMessage = "Signature request was rejected. Please approve the signature in your wallet to continue."
          } else if (err.message.includes("Not Supported") || err.message.includes("not supported")) {
            errorMessage =
              "Your wallet doesn't support EIP-712 signing required for gasless payments.\n\n" +
              "Recommended wallets:\n" +
              "• Base App / Coinbase Wallet (best for Base)\n" +
              "• MetaMask\n" +
              "• Rainbow Wallet\n" +
              "• Trust Wallet"
          } else if (err.message.includes("parsing") || err.message.includes("Invalid signature")) {
            errorMessage = 
              `Signature format error. ${isSmartWallet ? 'Your Base App wallet may need initialization.' : ''}\n\n` +
              err.message
          } else {
            errorMessage = err.message
          }
        }

        const error = new Error(errorMessage)
        setError(error)
        throw error
      } finally {
        setIsSigning(false)
      }
    },
    [address, chainId, isConnected, signTypedData, isSmartWallet],
  )

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

      if (isSmartWallet) {
        throw new Error(
          "EIP-3009 gasless payments are not supported for smart contract wallets.\n\n" +
          "Your Base App wallet is an ERC-4337 smart wallet, which cannot use receiveWithAuthorization.\n\n" +
          "The EIP-3009 specification explicitly states: 'This EIP does not apply to smart contract accounts.'\n\n" +
          "Please use the standard payment flow instead."
        )
      }

      setIsSigning(true)
      setError(null)

      try {
        console.log("[v0] Creating receive authorization for", isSmartWallet ? "Base App ERC-4337 smart wallet" : "EOA wallet")
        const authorization = createReceiveAuthorization(from, address, value, validAfter, validBefore, nonce, isSmartWallet)

        console.log("[v0] Authorization details:", {
          from: authorization.from,
          to: authorization.to,
          value: authorization.value.toString(),
          validAfter: authorization.validAfter.toString(),
          validBefore: authorization.validBefore.toString(),
          nonce: authorization.nonce,
          isSmartWallet,
        })

        const domain = getEIP3009Domain(chainId)
        console.log("[v0] EIP-712 domain:", domain)

        console.log("[v0] Requesting signature from wallet...")

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        const baseTimeout = isMobile ? 300000 : 120000
        const smartWalletTimeout = isSmartWallet ? baseTimeout * 2 : baseTimeout

        const signaturePromise = signTypedData(
          domain,
          RECEIVE_WITH_AUTHORIZATION_TYPES,
          authorization,
          "ReceiveWithAuthorization",
        )

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            const timeoutMsg = isSmartWallet
              ? "Base App signature timeout. Please check your Coinbase Wallet or Base App for the signature request."
              : "Signature request timeout - please check your wallet"
            reject(new Error(timeoutMsg))
          }, smartWalletTimeout)
        })

        const signature = await Promise.race([signaturePromise, timeoutPromise])

        console.log("[v0] Signature received, parsing...")
        const { v, r, s } = parseSignature(signature, isSmartWallet)

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
        let errorMessage = "Failed to sign authorization"

        if (err instanceof Error) {
          if (err.message.includes("timeout") || err.message.includes("Timeout")) {
            errorMessage = isSmartWallet
              ? "Base App signature timeout. Please ensure your Coinbase Wallet or Base App is open and responsive."
              : "Wallet signature timeout. Please ensure your wallet app is open and responsive."
          } else if (
            err.message.includes("rejected") ||
            err.message.includes("denied") ||
            err.message.includes("User rejected")
          ) {
            errorMessage = "Signature request was rejected. Please approve the signature in your wallet."
          } else if (err.message.includes("Not Supported") || err.message.includes("not supported")) {
            errorMessage =
              "Your wallet doesn't support EIP-712 signing. Please try a different wallet (Base App, MetaMask, Rainbow, or Trust Wallet recommended)."
          } else {
            errorMessage = err.message
          }
        }

        const error = new Error(errorMessage)
        setError(error)
        throw error
      } finally {
        setIsSigning(false)
      }
    },
    [address, chainId, isConnected, signTypedData, isSmartWallet],
  )

  const signCancelAuthorization = useCallback(
    async (nonce: Hex) => {
      if (!isConnected || !address || !chainId) {
        throw new Error("Wallet not connected")
      }

      if (isSmartWallet) {
        throw new Error(
          "EIP-3009 gasless payments are not supported for smart contract wallets.\n\n" +
          "Your Base App wallet is an ERC-4337 smart wallet, which cannot use cancelAuthorization.\n\n" +
          "The EIP-3009 specification explicitly states: 'This EIP does not apply to smart contract accounts.'\n\n" +
          "Please use the standard payment flow instead."
        )
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

        const signaturePromise = signTypedData(domain, CANCEL_AUTHORIZATION_TYPES, authorization, "CancelAuthorization")

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Signature request timeout - please check your wallet")), 120000) // 2 minutes
        })

        const signature = await Promise.race([signaturePromise, timeoutPromise])

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
        let errorMessage = "Failed to sign authorization"

        if (err instanceof Error) {
          if (err.message.includes("timeout") || err.message.includes("Timeout")) {
            errorMessage = "Wallet signature timeout. Please ensure your wallet app is open and responsive."
          } else if (
            err.message.includes("rejected") ||
            err.message.includes("denied") ||
            err.message.includes("User rejected")
          ) {
            errorMessage = "Signature request was rejected. Please approve the signature in your wallet."
          } else if (err.message.includes("Not Supported") || err.message.includes("not supported")) {
            errorMessage =
              "Your wallet doesn't support EIP-712 signing. Please try a different wallet (MetaMask, Rainbow, or Trust Wallet recommended)."
          } else {
            errorMessage = err.message
          }
        }

        const error = new Error(errorMessage)
        setError(error)
        throw error
      } finally {
        setIsSigning(false)
      }
    },
    [address, chainId, isConnected, signTypedData, isSmartWallet],
  )

  return {
    signTransferAuthorization,
    signReceiveAuthorization,
    signCancelAuthorization,
    isSigning,
    error,
    isSmartWallet,
    supportsGaslessPayments,
  }
}

export async function createGaslessPayment(
  signTransferAuthorization: UseEIP3009Return["signTransferAuthorization"],
  recipient: Address,
  amountUsdc: number,
): Promise<SignedAuthorization> {
  const value = BigInt(Math.floor(amountUsdc * 1_000_000))
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600)
  return signTransferAuthorization(recipient, value, 0n, validBefore)
}
