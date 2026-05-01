import { NextRequest, NextResponse } from "next/server"
import { AGENT_SKILLS, getSkillById } from "@/lib/agents/skill-registry"

/**
 * GET /api/agents/skills
 * Returns list of all available agent skills
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")

  let skills = AGENT_SKILLS

  if (category) {
    skills = skills.filter((skill) => skill.category === category)
  }

  return NextResponse.json({
    success: true,
    data: skills,
    total: skills.length,
  })
}

/**
 * POST /api/agents/skills/[skillId]/execute
 * Execute a specific agent skill with provided parameters
 */
export async function POST(request: NextRequest, { params }: { params: { skillId: string } }) {
  try {
    const { skillId } = params
    const body = await request.json()
    const { parameters } = body

    const skill = getSkillById(skillId)
    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 })
    }

    // Validate required parameters
    const missingParams = skill.parameters
      .filter((p) => p.required && !(p.name in (parameters || {})))
      .map((p) => p.name)

    if (missingParams.length > 0) {
      return NextResponse.json(
        { error: "Missing required parameters", missing: missingParams },
        { status: 400 }
      )
    }

    // Simulate skill execution
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return NextResponse.json({
      success: true,
      taskId,
      skillId,
      status: "executing",
      startedAt: new Date().toISOString(),
      parameters,
      estimatedDuration: skill.metrics?.averageExecutionTime || 5000,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to execute skill" }, { status: 500 })
  }
}
