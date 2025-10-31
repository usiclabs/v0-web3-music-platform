"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, AlertCircle } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ReportTrackDialogProps {
  trackId: string
  trackTitle: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const REPORT_REASONS = [
  { value: "copyright", label: "Copyright Infringement" },
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "spam", label: "Spam or Misleading" },
  { value: "harassment", label: "Harassment or Hate Speech" },
  { value: "other", label: "Other" },
]

export function ReportTrackDialog({ trackId, trackTitle, open, onOpenChange }: ReportTrackDialogProps) {
  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { address } = useWallet()
  const { toast } = useToast()

  const handleSubmit = async () => {
    console.log("[v0] Report submission started - Track:", trackId, "Wallet:", address)

    if (!address) {
      console.log("[v0] Report blocked - No wallet connected")
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to report content",
        variant: "destructive",
      })
      return
    }

    if (!reason) {
      console.log("[v0] Report blocked - No reason selected")
      toast({
        title: "Reason required",
        description: "Please select a reason for reporting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    console.log("[v0] Submitting report to API...")

    try {
      const payload = {
        trackId,
        reporterAddress: address,
        reason,
        details,
      }
      console.log("[v0] Report payload:", payload)

      const response = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[v0] API response status:", response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error("[v0] Report submission failed:", error)
        throw new Error(error.error || "Failed to submit report")
      }

      const result = await response.json()
      console.log("[v0] Report submitted successfully:", result)

      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our platform safe. We'll review this report shortly.",
      })

      // Close dialog and reset form
      if (onOpenChange) {
        onOpenChange(false)
      }
      setReason("")
      setDetails("")
    } catch (error) {
      console.error("[v0] Report submission error:", error)
      toast({
        title: "Failed to submit report",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      console.log("[v0] Report submission completed")
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    console.log("[v0] Report dialog open state changed:", newOpen)
    if (onOpenChange) {
      onOpenChange(newOpen)
    }

    // Reset form when closing
    if (!newOpen) {
      setReason("")
      setDetails("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report Track</DialogTitle>
          <DialogDescription>
            Report "{trackTitle}" for violating community guidelines. All reports are reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>

        {!address && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please connect your wallet to submit a report.</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Reason for reporting</Label>
            <RadioGroup value={reason} onValueChange={setReason} disabled={!address}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} disabled={!address} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              placeholder="Provide any additional context that might help us review this report..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              disabled={!address}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason || !address}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
