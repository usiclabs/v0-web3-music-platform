"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, FileJson, FileText, CheckCircle, AlertCircle, Loader } from "lucide-react"

export function AirdropExportPanel() {
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [stats, setStats] = useState<{
    total_recipients: number
    total_tokens: string
    export_date: string
  } | null>(null)
  const [verificationStats, setVerificationStats] = useState<{
    total_checked: number
    eligible: number
    ineligible: number
  } | null>(null)

  const handleExport = async (format: "json" | "csv", includeStats: boolean) => {
    setLoading(true)
    try {
      const url = new URL("/api/admin/airdrop/export", window.location.origin)
      url.searchParams.set("format", format)
      url.searchParams.set("includeStats", String(includeStats))

      const response = await fetch(url.toString())
      const data = await response.blob()

      // Create download link
      const link = document.createElement("a")
      link.href = URL.createObjectURL(data)
      link.download = `airdrop-recipients-${new Date().toISOString().split("T")[0]}.${format === "csv" ? "csv" : "json"}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Fetch stats
      if (format === "json") {
        const jsonData = await response.json()
        setStats({
          total_recipients: jsonData.total_recipients,
          total_tokens: jsonData.total_tokens_to_distribute,
          export_date: jsonData.export_date,
        })
      }
    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to export airdrop recipients")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const response = await fetch("/api/admin/airdrop/verify-recipients", {
        method: "POST",
      })
      const data = await response.json()
      setVerificationStats({
        total_checked: data.total_checked,
        eligible: data.eligible,
        ineligible: data.ineligible,
      })
    } catch (error) {
      console.error("Verification error:", error)
      alert("Failed to verify airdrop recipients")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Airdrop Export & Verification</h2>
        <p className="text-muted-foreground">
          Export eligible airdrop recipients with their token allocations and verify eligibility criteria
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Export JSON
          </h3>
          <div className="space-y-2">
            <Button
              onClick={() => handleExport("json", false)}
              disabled={loading}
              className="w-full gap-2"
              variant="outline"
            >
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Basic Export (addresses & amounts)
            </Button>
            <Button
              onClick={() => handleExport("json", true)}
              disabled={loading}
              className="w-full gap-2"
              variant="outline"
            >
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Full Export (with detailed stats)
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export CSV
          </h3>
          <div className="space-y-2">
            <Button
              onClick={() => handleExport("csv", false)}
              disabled={loading}
              className="w-full gap-2"
              variant="outline"
            >
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Basic Export (addresses & amounts)
            </Button>
            <Button
              onClick={() => handleExport("csv", true)}
              disabled={loading}
              className="w-full gap-2"
              variant="outline"
            >
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Full Export (with detailed stats)
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-accent/5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Verify Recipients
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Run a verification check to ensure all recipients meet the minimum eligibility criteria (20+ streams or 1+
          uploaded track)
        </p>
        <Button onClick={handleVerify} disabled={verifying} className="w-full gap-2">
          {verifying ? <Loader className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
          {verifying ? "Verifying..." : "Run Eligibility Verification"}
        </Button>

        {verificationStats && (
          <div className="mt-6 space-y-2 p-4 bg-card rounded border border-border">
            <div className="text-sm">
              <span className="font-semibold">Total Checked:</span> {verificationStats.total_checked}
            </div>
            <div className="text-sm text-green-600">
              <span className="font-semibold">Eligible:</span> {verificationStats.eligible}
            </div>
            <div className="text-sm text-orange-600">
              <span className="font-semibold">Ineligible:</span> {verificationStats.ineligible}
            </div>
            <div className="text-sm text-muted-foreground pt-2">
              <span className="font-semibold">Eligibility Rate:</span>{" "}
              {verificationStats.total_checked > 0
                ? ((verificationStats.eligible / verificationStats.total_checked) * 100).toFixed(1)
                : 0}
              %
            </div>
          </div>
        )}
      </Card>

      {stats && (
        <Card className="p-6 bg-green-500/10 border-green-500/30">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Export Summary
          </h3>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-semibold">Recipients:</span> {stats.total_recipients.toLocaleString()}
            </div>
            <div className="text-sm">
              <span className="font-semibold">Total $USI to Distribute:</span>{" "}
              {BigInt(stats.total_tokens).toLocaleString()} $USI
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold">Export Date:</span> {new Date(stats.export_date).toLocaleString()}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
