'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface RegisterAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userAddress: string
}

const AVAILABLE_CAPABILITIES = [
  'curation',
  'trading',
  'discovery',
  'social',
  'analytics',
  'marketing',
]

export function RegisterAgentDialog({
  open,
  onOpenChange,
  userAddress,
}: RegisterAgentDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    api_endpoint: '',
    websocket_endpoint: '',
    capabilities: [] as string[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          owner_address: userAddress,
        }),
      })

      if (!response.ok) throw new Error('Failed to register agent')

      toast({
        title: 'Agent registered!',
        description: 'Your AI agent has been successfully registered',
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to register agent',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleCapability = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(capability)
        ? prev.capabilities.filter(c => c !== capability)
        : [...prev.capabilities, capability],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register AI Agent</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              placeholder="My Music Agent"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what your agent does..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_endpoint">API Endpoint (optional)</Label>
            <Input
              id="api_endpoint"
              type="url"
              placeholder="https://api.example.com/agent"
              value={formData.api_endpoint}
              onChange={(e) => setFormData(prev => ({ ...prev, api_endpoint: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="websocket_endpoint">WebSocket Endpoint (optional)</Label>
            <Input
              id="websocket_endpoint"
              type="url"
              placeholder="wss://api.example.com/ws"
              value={formData.websocket_endpoint}
              onChange={(e) => setFormData(prev => ({ ...prev, websocket_endpoint: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Capabilities</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_CAPABILITIES.map(capability => (
                <Badge
                  key={capability}
                  variant={formData.capabilities.includes(capability) ? 'default' : 'outline'}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleCapability(capability)}
                >
                  {capability}
                  {formData.capabilities.includes(capability) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Registering...' : 'Register Agent'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
