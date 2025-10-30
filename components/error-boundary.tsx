"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[v0] Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
          <Card className="w-full max-w-md border-destructive/20 shadow-2xl animate-in fade-in zoom-in duration-500">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription className="text-base">
                We encountered an unexpected error. Don't worry, your data is safe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs font-mono text-muted-foreground break-all">{this.state.error.message}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => window.location.reload()} className="flex-1 gap-2" variant="default">
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                <Button onClick={() => (window.location.href = "/landing")} className="flex-1 gap-2" variant="outline">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
