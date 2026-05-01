# Agent Skills Framework - Visual Navigation Guide

## User Journey Maps

### 🎯 Journey 1: Artist/Trader Discovers Agent Capabilities

\`\`\`
Entry Point: /agents (Agent Hub)
    ↓
    "Interested in what agents can do?"
    ↓
Browse 4 pre-built agent types → Still want more details?
    ↓
Click "Explore All Skills" → /agents/skills
    ↓
┌─────────────────────────────────────────┐
│ /agents/skills (Interactive Showcase)   │
│                                          │
│ • Browse 6 core skills                  │
│ • Search by category or name            │
│ • Read detailed descriptions            │
│ • View success metrics                  │
│ • See live agent activity               │
│ • Try demo buttons                      │
│ • Click "View API Docs"                 │
└─────────────────────────────────────────┘
    ↓
Ready to deploy? → /dashboard/agent
\`\`\`

### 💻 Journey 2: Developer Implements Custom Skill

\`\`\`
Entry Point: /agents (Agent Hub)
    ↓
    "I want to build custom workflows"
    ↓
Click "View Specifications" → /agents/documentation
    ↓
┌──────────────────────────────────────────────────┐
│ /agents/documentation (Technical Guide)          │
│                                                   │
│ • Read skill schema & concepts                   │
│ • Copy TypeScript example                        │
│ • Review API reference                           │
│ • Follow best practices                          │
│ • Deploy using REST API or SDK                   │
└──────────────────────────────────────────────────┘
    ↓
Implementation Complete → Monitor on /agents/skills
\`\`\`

### 🤖 Journey 3: Agent Autonomously Executes

\`\`\`
Skill Execution Flow
    ↓
┌─────────────────────────────────┐
│ 1. Agent initiates skill        │
│    POST /api/agents/skills/     │
│    [skillId]/execute            │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ 2. Skill registry validates     │
│    parameters and requirements  │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ 3. Skill executes on-chain      │
│    (discovery, trading, etc)    │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ 4. Activity logged to metrics   │
│    & feed updates real-time     │
└─────────────────────────────────┘
    ↓
Visible on /agents/skills live feed
\`\`\`

---

## Site Structure & Navigation

\`\`\`
/agents (HUB)
├── Purpose: Central overview & navigation
├── Content:
│   ├── 4 Pre-built Agent Types (Beat Scout, Market Maker, Auto Stream, Autonomous Artist)
│   ├── Stats (4 Agents, 6 Skills, 24/7 Uptime, ∞ Earning Potential)
│   ├── Quick Links to Skills & Docs (top section)
│   └── Skills Framework Overview (4 categories with descriptions)
│
├─ /agents/skills (SHOWCASE)
│  ├── Purpose: Interactive skill discovery & demonstration
│  ├── Content:
│  │   ├── Search & Filter Sidebar
│  │   ├── Skills Grid (6 skills as selectable cards)
│  │   ├── Skill Detail Panel
│  │   │   ├── Metrics (success %, execution time, total runs)
│  │   │   ├── Capabilities (checklist)
│  │   │   ├── Parameters (configurable options)
│  │   │   └── Tags & Actions (API docs, demo)
│  │   └── Live Activity Feed (real-time executions)
│  │
│  └── Features:
│      ├── Real-time updates
│      ├── Performance metrics
│      ├── Parameter exploration
│      └── Demo access
│
└─ /agents/documentation (SPECS)
   ├── Purpose: Technical reference & implementation guide
   ├── Content:
   │   ├── Overview (What are skills? Categories?)
   │   ├── Core Concepts (Schema, Parameters, Metrics)
   │   ├── Code Examples (TypeScript, Python, REST, JSON)
   │   ├── API Reference (4 endpoints)
   │   ├── Best Practices
   │   └── Integration Paths
   │
   └── Features:
       ├── Copy-to-clipboard code
       ├── Multiple language examples
       ├── Full API docs
       └── Developer CTA
\`\`\`

---

## Information Architecture

### What Goes Where?

| Content | Location | Audience |
|---------|----------|----------|
| "What can agents do?" | `/agents/skills` showcase | Non-technical users |
| "Show me live examples" | `/agents/skills` activity feed | Everyone |
| "How do I build this?" | `/agents/documentation` | Developers |
| "Which agent type should I use?" | `/agents` hub | Decision makers |
| "Give me code examples" | `/agents/documentation` | Developers |
| "What are the metrics?" | `/agents/skills` detail panel | Analytics-focused |
| "I want to deploy" | `/dashboard/agent` | Users (not on /agents) |
| "Show me the API" | `/agents/documentation` | Integrators |

---

## Skill Registry Integration

\`\`\`typescript
// Core Types (skill-registry.ts)
AgentSkill
├── id: string
├── name: string
├── category: "discovery" | "portfolio" | "trading" | "streaming"
├── description: string
├── capabilities: string[]
├── parameters: SkillParameter[]
├── complexity: "beginner" | "intermediate" | "advanced"
├── metrics: SkillMetrics
└── apiEndpoint: string

// Available Functions
- AGENT_SKILLS: AgentSkill[] (all 6 skills)
- getSkillById(id): AgentSkill | undefined
- getSkillsByCategory(category): AgentSkill[]
- getAllCategories(): string[]

// Used By
- /agents/skills (display & filter)
- /agents/documentation (examples)
- /api/agents/skills (validation)
\`\`\`

---

## Live Activity Feed Examples

\`\`\`
┌─────────────────────────────────────────────────────┐
│ Artist Discovery Engine: discovered SoundWave...    │ 2s ago
├─────────────────────────────────────────────────────┤
│ Portfolio Rebalancer: rebalanced $2,450             │ 12s ago
├─────────────────────────────────────────────────────┤
│ Market Maker Bot: quote BTC/USD                     │ 18s ago
├─────────────────────────────────────────────────────┤
│ Token Sniper: executed 1.2K tokens                  │ 34s ago
├─────────────────────────────────────────────────────┤
│ Streaming Optimizer: +8.3% revenue identified      │ 1m ago
├─────────────────────────────────────────────────────┤
│ Social Amplifier: 127 interactions                  │ 2m ago
├─────────────────────────────────────────────────────┤
│ Artist Discovery Engine: signals detected           │ 3m ago
└─────────────────────────────────────────────────────┘

Real-time updates showing agents working 24/7
\`\`\`

---

## API Endpoints

\`\`\`
GET /api/agents/skills
  └─ Returns: Array of all AgentSkill objects
  
GET /api/agents/skills?category=discovery
  └─ Returns: Filtered skills by category
  
POST /api/agents/skills/[skillId]/execute
  ├─ Body: { parameters: {...} }
  └─ Returns: { taskId, status, startedAt, estimatedDuration }

[Future] GET /api/agents/skills/[skillId]/metrics
  └─ Returns: Performance metrics for skill
\`\`\`

---

## Conversion Funnels

### Funnel 1: User → Agent Deployment
\`\`\`
Visit /agents (100%)
    ↓
Browse agents (85%)
    ↓
Click "Explore Skills" (60%)
    ↓
View /agents/skills (55%)
    ↓
Click skill details (45%)
    ↓
View metrics & activity (40%)
    ↓
Click "Try Demo" (25%)
    ↓
Deploy agent (15%)
\`\`\`

### Funnel 2: Developer → Integration
\`\`\`
Visit /agents/documentation (100%)
    ↓
Read concepts (90%)
    ↓
Copy code example (75%)
    ↓
Implement locally (40%)
    ↓
Deploy to production (15%)
    ↓
Monitor on /agents/skills (10%)
\`\`\`

---

## Key Features by Page

### /agents (Hub)
✅ Central navigation  
✅ 4 agent types  
✅ 6 skill overview  
✅ Quick links  
✅ Framework explanation  

### /agents/skills (Showcase)
✅ Browse all skills  
✅ Search & filter  
✅ View metrics  
✅ See parameters  
✅ Live activity feed  
✅ Try demo  

### /agents/documentation (Specs)
✅ Skill schema  
✅ Code examples (4 languages)  
✅ API reference  
✅ Best practices  
✅ Integration guides  
✅ Developer CTA  

### /api/agents/skills (API)
✅ List all skills  
✅ Filter by category  
✅ Execute skills  
✅ Return task IDs  

---

## Success Metrics

- **Discovery**: % of users who visit /agents/skills after /agents
- **Engagement**: Average time on /agents/skills (target: >2 min)
- **Integration**: # of skill executions via API per day
- **Adoption**: # of custom workflows created by developers
- **Activity**: Real-time feed updates (should be constant)
- **Confidence**: Success rates visible in metrics (78-92%)

---

## The Message

> **USIC is Agent-Native**
> 
> Discover 6 powerful skills. Build sophisticated workflows. Deploy autonomous agents that work 24/7. See real-time activity proving they work. Everything on USIC can be executed autonomously—making it the first truly agent-ready music platform.
