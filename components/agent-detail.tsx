'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, TrendingUp, Activity, MessageSquare, ExternalLink, CheckCircle2, XCircle, Award, BarChart3 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AgentDetailProps {
  agent: any
  reputation: any
  feedback: any[]
  validations: any[]
  performance: any[]
}

export function AgentDetail({
  agent,
  reputation,
  feedback,
  validations,
  performance,
}: AgentDetailProps) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/agents/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_address: agent.agent_address,
          rating,
          comment,
        }),
      })

      if (!response.ok) throw new Error('Failed to submit feedback')

      toast({
        title: 'Feedback submitted',
        description: 'Thank you for rating this agent',
      })
      setComment('')
      setRating(5)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <Card className="p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{agent.name}</h1>
                <p className="text-muted-foreground">{agent.description}</p>
              </div>
              {agent.is_active && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  Active
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {agent.capabilities?.map((cap: string) => (
                <Badge key={cap} variant="secondary" className="capitalize">
                  {cap}
                </Badge>
              ))}
            </div>

            <div className="flex gap-4 text-sm">
              {agent.api_endpoint && (
                <a
                  href={agent.api_endpoint}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                  API Endpoint
                </a>
              )}
              {agent.websocket_endpoint && (
                <a
                  href={agent.websocket_endpoint}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Activity className="h-4 w-4" />
                  WebSocket
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 md:min-w-[200px]">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                <span className="text-2xl font-bold">
                  {reputation?.average_rating?.toFixed(1) || '0.0'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {reputation?.total_feedback_count || 0} reviews
              </p>
            </div>

            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Award className="h-5 w-5 text-[#FF5733]" />
                <span className="text-2xl font-bold">
                  {Math.round(reputation?.reputation_score || 0)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Trust Score</p>
            </div>

            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Activity className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">
                  {agent.total_actions?.toLocaleString() || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Total Actions</p>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="feedback" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="validations">Validations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Rate this agent</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRating(value)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        value <= rating
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Share your experience with this agent..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
              <Button
                onClick={handleSubmitFeedback}
                disabled={isSubmitting || !comment.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="font-semibold">Recent Reviews</h3>
            {feedback.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No reviews yet. Be the first to rate this agent!
              </Card>
            ) : (
              feedback.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < item.rating
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{item.comment}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {item.user_address.slice(0, 6)}...{item.user_address.slice(-4)}
                  </p>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="validations" className="space-y-4">
          <h3 className="font-semibold">Validation Records</h3>
          {validations.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No validations yet
            </Card>
          ) : (
            validations.map((validation) => (
              <Card key={validation.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {validation.result_code === 2 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : validation.result_code === 1 ? (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium capitalize">
                        {validation.validation_type.replace(/_/g, ' ')}
                      </p>
                      {validation.score && (
                        <p className="text-sm text-muted-foreground">
                          Score: {validation.score}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(validation.created_at).toLocaleDateString()}
                  </span>
                </div>
                {validation.evidence_uri && (
                  <a
                    href={validation.evidence_uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#FF5733] hover:underline flex items-center gap-1"
                  >
                    View Evidence
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <h3 className="font-semibold">Performance Metrics</h3>
          {performance.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No performance data yet
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performance.map((metric) => (
                <Card key={metric.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#FF5733]" />
                      <div>
                        <p className="font-medium capitalize">
                          {metric.metric_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-2xl font-bold">
                          {metric.metric_value.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {metric.time_period}
                  </Badge>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
