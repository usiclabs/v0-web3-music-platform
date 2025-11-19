"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { VinylRecord3D } from "./vinyl-record-3d"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle, ShoppingCart, Wallet } from 'lucide-react'
import { formatAddress } from "@/lib/utils"
import { USDC_ADDRESS, ERC20_ABI } from "@/lib/web3/contracts"
import { base } from "wagmi/chains"
import { parseUnits } from "viem"
import type { MusicNFT, NFTCollection } from "@/types/nft"

interface NFTPurchaseModalProps {
  nft: (MusicNFT & { collection?: NFTCollection }) | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function NFTPurchaseModal({
  nft,
  open,
  onOpenChange,
  onSuccess,
}: NFTPurchaseModalProps) {
  const { address } = useAccount()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [purchasing, setPurchasing] = useState(false)
  const [approving, setApproving] = useState(false)

  const { writeContract: approve, data: approvalHash } = useWriteContract()
  const { writeContract: purchase } = useWriteContract()

  const { isLoading: isApproving } = useWaitForTransactionReceipt({
    hash: approvalHash,
  })

  if (!nft) return null

  const metadata = nft.metadata as any
  const price = nft.current_price || 0
  const royaltyFee = nft.collection
    ? (price * nft.collection.royalty_percentage) / 100
    : 0
  const platformFee = price * 0.025 // 2.5% platform fee
  const totalPrice = price + royaltyFee + platformFee

  async function handleApprove() {
    if (!address) return

    setApproving(true)

    try {
      // Approve USDC spending
      const amount = parseUnits(totalPrice.toString(), 6) // USDC has 6 decimals

      approve({
        address: USDC_ADDRESS[base.id],
        abi: ERC20_ABI,
        functionName: "approve",
        args: [address, amount], // In real implementation, this would be the marketplace contract
      })

      toast({
        title: "Approval submitted",
        description: "Please wait for the transaction to confirm",
      })
    } catch (error) {
      console.error("Approval error:", error)
      toast({
        title: "Approval failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
      setApproving(false)
    }
  }

  async function handlePurchase() {
    if (!address) {
      toast({
        title: "Connect wallet",
        description: "Please connect your wallet to purchase NFTs",
        variant: "destructive",
      })
      return
    }

    setPurchasing(true)

    try {
      // In a real implementation, this would call the marketplace smart contract
      // For now, we'll simulate the purchase by updating the database

      // Create sale record
      const { data: sale, error: saleError } = await supabase
        .from("nft_sales")
        .insert({
          nft_id: nft.id,
          seller_address: nft.owner_address || nft.creator_address,
          buyer_address: address,
          price: nft.current_price,
          currency: "USDC",
          royalty_paid: royaltyFee,
          platform_fee: platformFee,
          sale_type: nft.owner_address ? "secondary" : "primary",
          tx_hash: "0x" + Math.random().toString(16).substring(2), // Mock tx hash
        })
        .select()
        .single()

      if (saleError) throw saleError

      // Update NFT ownership
      const { error: nftError } = await supabase
        .from("music_nfts")
        .update({
          owner_address: address,
          last_sale_price: nft.current_price,
          is_listed: false,
        })
        .eq("id", nft.id)

      if (nftError) throw nftError

      // Update collection stats
      if (nft.collection_id) {
        await supabase.rpc("update_collection_stats", {
          collection_id: nft.collection_id,
          sale_price: nft.current_price,
        })
      }

      toast({
        title: "Purchase successful!",
        description: `You now own ${metadata?.name || "this NFT"}`,
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Purchase error:", error)
      toast({
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Complete Purchase</DialogTitle>
          <DialogDescription>
            Review your purchase details before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* NFT Preview */}
          <div className="aspect-square bg-gradient-to-br from-black to-zinc-900 rounded-lg overflow-hidden">
            <VinylRecord3D
              coverImage={metadata?.image || nft.collection?.cover_image_url}
              rarity={nft.rarity_tier || "common"}
              className="w-full h-full"
            />
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              {nft.collection && (
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  {nft.collection.collection_name}
                </p>
              )}
              <h3 className="text-xl font-semibold">
                {metadata?.name || `Edition #${nft.edition_number}`}
              </h3>
              <Badge className="mt-2 capitalize">
                {nft.rarity_tier || "common"}
              </Badge>
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">NFT Price</span>
                <span className="font-medium">{price.toFixed(2)} USDC</span>
              </div>
              
              {royaltyFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Creator Royalty ({nft.collection?.royalty_percentage}%)
                  </span>
                  <span className="font-medium">{royaltyFee.toFixed(2)} USDC</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee (2.5%)</span>
                <span className="font-medium">{platformFee.toFixed(2)} USDC</span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{totalPrice.toFixed(2)} USDC</span>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Seller</span>
                <span className="font-mono">
                  {formatAddress(nft.owner_address || nft.creator_address)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Edition</span>
                <span>
                  {nft.edition_number} of {nft.total_editions}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          {!address ? (
            <Button disabled>
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          ) : isApproving || approving ? (
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Approving...
            </Button>
          ) : purchasing ? (
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </Button>
          ) : (
            <Button onClick={handlePurchase}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Purchase for {totalPrice.toFixed(2)} USDC
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
