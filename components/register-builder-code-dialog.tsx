'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface RegisterBuilderCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userAddress: string
}

export function RegisterBuilderCodeDialog({
  open,
  onOpenChange,
  userAddress,
}: RegisterBuilderCodeDialogProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    website_url: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/builder-codes/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          owner_address: userAddress,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to register builder code')
      }

      toast({
        title: 'Builder code registered!',
        description: 'Your builder code has been successfully registered',
      })

      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Register Builder Code</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code">Builder Code</Label>
            <Input
              id="code"
              placeholder="myapp"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
              }))}
              required
              pattern="[a-z0-9-]+"
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">App Name</Label>
            <Input
              id="name"
              placeholder="My Music App"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your app and how it uses MyUSIC..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL (optional)</Label>
            <Input
              id="website_url"
              type="url"
              placeholder="https://example.com"
              value={formData.website_url}
              onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Registering...' : 'Register Builder Code'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
