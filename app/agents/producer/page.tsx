'use client'

import Link from 'next/link'
import { Music, Sparkles, Zap, Radio, Waveform2, Code2, BookOpen, BarChart3, ArrowRight, Lightbulb, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccount } from 'wagmi'

export default function ProducerAgentPage() {
  const { isConnected } = useAccount()

  const benefits = [
    {
      icon: <Waveform2 className="h-8 w-8" />,
      title: "Trend-to-Beat Translation",
      description: "Receives research from trend, audience, and platform agents, then converts it into genre, tempo, mood, structure, and production direction."
    },
    {
      icon: <Radio className="h-8 w-8" />,
      title: "Suno-Ready Beat Briefs",
      description: "Builds clean instrumental prompts, style tags, titles, and negative tags for Suno API generation."
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "Short-Form Optimization",
      description: "Prioritizes strong first-second impact, loopable grooves, and hook-friendly sections for TikTok, Reels, and YouTube Shorts."
    },
    {
      icon: <Layers className="h-8 w-8" />,
      title: "Artist Pack Creation",
      description: "Creates beat concepts that can be packaged into producer packs, artist demos, or tokenized MyUSIC releases."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Agent-to-Agent Workflow",
      description: "Works downstream from research agents and upstream from publishing, monetization, and fan-engagement agents."
    },
    {
      icon: <Code2 className="h-8 w-8" />,
      title: "Clean Metadata Output",
      description: "Returns structured song metadata, creative rationale, generation payloads, and asset notes for MyUSIC workflows."
    },
  ]

  const workflow = [
    {
      step: 1,
      title: "Research Agents Identify Trend",
      description: "Other agents detect rising sounds, audience behavior, platform momentum, genre signals, and viral mechanics."
    },
    {
      step: 2,
      title: "Producer Agent Builds Direction",
      description: "The agent converts the research into a structured music brief with tempo, mood, genre, instrumentation, and arrangement notes."
    },
    {
      step: 3,
      title: "Suno Skill Generates Audio",
      description: "The agent prepares a Suno-compatible payload for beat, instrumental, hook-demo, or full-song generation."
    },
    {
      step: 4,
      title: "MyUSIC Stores The Asset",
      description: "The beat, metadata, and creative context can be routed into song pages, artist packs, tokenized releases, or fan campaigns."
    },
  ]

  const instructions = [
    "Default to instrumental beat creation unless vocals are explicitly requested.",
    "Preserve the trend research context from upstream agents.",
    "Convert vague trend signals into specific musical choices.",
    "Use genre, tempo, mood, structure, instrumentation, and platform context.",
    "Optimize for short-form impact and loopability.",
    "Add negative tags to avoid muddy mixes, generic stock music, distorted masters, and off-tempo drums.",
    "Never claim audio is complete until the generation task returns successful.",
    "Keep outputs commercially usable, clean, and brand-safe by default.",
    "Prepare metadata for downstream MyUSIC publishing and monetization flows."
  ]

  const capabilities = [
    {
      name: "create_trend_beat",
      description: "Creates a Suno-ready generation payload from upstream trend intelligence."
    },
    {
      name: "get_trend_beat_status",
      description: "Checks generation status and returns audio result metadata when complete."
    },
    {
      name: "build_instrumental_prompt",
      description: "Creates structured instrumental direction for beat generation."
    },
    {
      name: "build_song_prompt",
      description: "Creates hook-demo or full-song lyrics when vocals are explicitly requested."
    },
    {
      name: "generate_negative_tags",
      description: "Adds exclusion tags to reduce muddy, generic, distorted, or off-brand outputs."
    },
    {
      name: "normalize_trend_report",
      description: "Converts messy trend research into a clean music-production brief."
    },
    {
      name: "prepare_music_metadata",
      description: "Formats track title, style, mood, platform use case, and downstream publishing notes."
    },
  ]

  const useCases = [
    {
      title: "Artist Pack Generator",
      description: "Turn current genre trends into beat packs for independent artists."
    },
    {
      title: "TikTok Sound Lab",
      description: "Create short-form optimized instrumentals designed around platform momentum."
    },
    {
      title: "USIC Tokenized Song Pipeline",
      description: "Generate beats that can later be attached to tokenized songs, splits, or campaign pages."
    },
    {
      title: "Producer Research Assistant",
      description: "Help producers decide which sounds, moods, and arrangements are worth creating next."
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,30,30,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,30,30,0.03) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="pt-12 md:pt-16 lg:pt-20 px-4 md:px-6 lg:px-8 pb-12 md:pb-16">
          <div className="max-w-6xl mx-auto">
            {/* Eyebrow and Title */}
            <div className="mb-8 md:mb-12">
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">USIC Agent Skill</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
                Producer Agent
              </h1>
              <p className="text-base md:text-lg text-white/70 max-w-3xl">
                An autonomous music-production agent that transforms trend intelligence into beat concepts, Suno generation briefs, and release-ready audio direction.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Button className="bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-widest">
                Create Beat Brief
              </Button>
              <Button variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10">
                View Instructions
              </Button>
            </div>
          </div>
        </div>

        {/* What This Agent Does */}
        <div className="px-4 md:px-6 lg:px-8 py-12 md:py-16 border-t border-red-500/20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-8 md:mb-12">What This Agent Does</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, i) => (
                <div key={i} className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="text-red-400 flex-shrink-0">{benefit.icon}</div>
                    <div>
                      <h3 className="font-bold text-white mb-2">{benefit.title}</h3>
                      <p className="text-sm text-white/70">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How The Agent Works */}
        <div className="px-4 md:px-6 lg:px-8 py-12 md:py-16 border-t border-red-500/20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-8 md:mb-12">How The Agent Works</h2>
            <div className="space-y-6 md:space-y-8">
              {workflow.map((item, i) => (
                <div key={i}>
                  <div className="flex items-start gap-4 md:gap-6">
                    <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 border-red-500 bg-red-500/20 flex-shrink-0">
                      <span className="font-bold text-red-400">{item.step}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-sm md:text-base text-white/70">{item.description}</p>
                    </div>
                  </div>
                  {i < workflow.length - 1 && (
                    <div className="ml-5 md:ml-6 mt-4 pb-4 border-l-2 border-red-500/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Operating Instructions */}
        <div className="px-4 md:px-6 lg:px-8 py-12 md:py-16 border-t border-red-500/20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-8">Operating Instructions</h2>
            <div className="p-6 md:p-8 rounded-xl border-2 border-red-500/40 bg-black/60 backdrop-blur">
              <ul className="space-y-3 md:space-y-4">
                {instructions.map((instruction, i) => (
                  <li key={i} className="flex items-start gap-3 md:gap-4">
                    <span className="text-red-400 font-bold flex-shrink-0 mt-0.5">•</span>
                    <span className="text-sm md:text-base text-white/80">{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Example Input / Output */}
        <div className="px-4 md:px-6 lg:px-8 py-12 md:py-16 border-t border-red-500/20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-8">Example Input / Output</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input */}
              <div className="p-6 md:p-8 rounded-xl border border-red-500/20 bg-red-500/5 font-mono text-sm">
                <p className="text-red-400 font-bold mb-4">INPUT</p>
                <div className="space-y-2 text-white/80">
                  <div><span className="text-red-400">Trend:</span> Dark luxury producer flex</div>
                  <div><span className="text-red-400">Audience:</span> Independent rappers, crypto-native music fans, short-form creators</div>
                  <div><span className="text-red-400">Signals:</span> Dark trap, cinematic 808s, sparse bell melody, premium villain energy, 142 BPM</div>
                  <div><span className="text-red-400">Desired Output:</span> Instrumental beat for artist pack</div>
                </div>
              </div>

              {/* Output */}
              <div className="p-6 md:p-8 rounded-xl border border-red-500/20 bg-red-500/5 font-mono text-sm">
                <p className="text-red-400 font-bold mb-4">OUTPUT</p>
                <div className="space-y-2 text-white/80">
                  <div><span className="text-red-400">Title:</span> Dark Luxury Producer Flex Beat</div>
                  <div><span className="text-red-400">Style:</span> Dark trap, cinematic 808s, sparse bell melody, clean drums, strong low-end, 142 BPM, F minor, loopable hook section</div>
                  <div><span className="text-red-400">Negative Tags:</span> Muddy bass, generic EDM, happy pop, distorted master, off-tempo drums, overcrowded arrangement</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skill Capabilities */}
        <div className="px-4 md:px-6 lg:px-8 py-12 md:py-16 border-t border-red-500/20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-8">Skill Capabilities</h2>
            <div className="space-y-4">
              {capabilities.map((cap, i) => (
                <div key={i} className="p-4 md:p-6 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all">
                  <p className="font-mono text-red-400 font-bold text-sm mb-2">{cap.name}</p>
                  <p className="text-sm text-white/70">{cap.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended Use Cases */}
        <div className="px-4 md:px-6 lg:px-8 py-12 md:py-16 border-t border-red-500/20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-8">Recommended Use Cases</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {useCases.map((useCase, i) => (
                <div key={i} className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all">
                  <h3 className="font-bold text-white mb-2 text-lg">{useCase.title}</h3>
                  <p className="text-sm text-white/70">{useCase.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="px-4 md:px-6 lg:px-8 py-12 md:py-16 border-t border-red-500/20">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Turn trend intelligence into music assets.</h2>
            <p className="text-base md:text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Connect this agent to research, publishing, and monetization workflows to create a full autonomous music production pipeline.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-widest">
                Start Producer Workflow
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href="/agents">
                <Button variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10 w-full">
                  Back to Agents
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Spacing */}
        <div className="h-12" />
      </div>
    </div>
  )
}
