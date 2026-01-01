import type { AgentPlugin } from "../types"

/**
 * Music Creation Plugin for Eliza agents
 * Allows agents to generate music using the Suno API
 */
export const musicPlugin: AgentPlugin = {
  name: "music",
  description: "Generate and manage AI music",
  actions: [
    {
      name: "generate_music",
      similes: ["create_song", "make_music", "compose"],
      description: "Generate a new song using Suno AI",
      validate: (params) => {
        return typeof params.prompt === "string" && params.prompt.length > 0
      },
      handler: async (params, context) => {
        const { prompt, style = "electronic", instrumental = false } = params

        console.log(`[Music Plugin] Generating music for agent ${context.agentId}`)

        // Call Suno API
        const response = await fetch("/api/suno/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            style,
            instrumental,
            model: "V5",
            customMode: false,
          }),
        })

        if (!response.ok) {
          throw new Error("Music generation failed")
        }

        const data = await response.json()
        const track = data[0]

        return {
          trackId: track.id,
          title: track.title,
          audioUrl: track.audioUrl,
          imageUrl: track.imageUrl,
        }
      },
    },
  ],
  evaluators: [
    {
      name: "music_generation_opportunity",
      description: "Evaluate if it's a good time to generate music",
      evaluate: async (context) => {
        // Check if agent has music creation capability
        const supabase = await (await import("@/lib/supabase/server")).createClient()
        const { data: agent } = await supabase
          .from("eliza_agents")
          .select("capabilities")
          .eq("id", context.agentId)
          .single()

        if (!agent || !agent.capabilities.includes("music_creation")) {
          return 0
        }

        // Check recent music generation actions
        const recentMusic = context.recentActions.filter(
          (a) => a.action_type === "generate_music" && a.status === "completed",
        )

        // Don't generate too frequently (max once per hour)
        if (recentMusic.length > 0) {
          const lastGeneration = new Date(recentMusic[0].created_at)
          const hoursSince = (Date.now() - lastGeneration.getTime()) / (1000 * 60 * 60)

          if (hoursSince < 1) {
            return 0
          }
        }

        // Return moderate score for music generation
        return 0.6
      },
    },
  ],
  providers: [],
}
