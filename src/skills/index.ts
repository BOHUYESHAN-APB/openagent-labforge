/**
 * Skills Registry
 *
 * Built-in skills for OpenAgent LabForge.
 * Based on KDCO skills.
 */

export interface SkillDefinition {
  name: string
  description: string
  path: string
}

export const BUILTIN_SKILLS: SkillDefinition[] = [
  {
    name: "plan-protocol",
    description: "Guidelines for creating implementation plans",
    path: "./skills/plan-protocol/SKILL.md",
  },
  {
    name: "plan-review",
    description: "Criteria for reviewing implementation plans",
    path: "./skills/plan-review/SKILL.md",
  },
  {
    name: "code-philosophy",
    description: "Code quality philosophy (5 Laws)",
    path: "./skills/code-philosophy/SKILL.md",
  },
  {
    name: "code-review",
    description: "Code review methodology",
    path: "./skills/code-review/SKILL.md",
  },
  {
    name: "frontend-philosophy",
    description: "Frontend design philosophy (5 Pillars)",
    path: "./skills/frontend-philosophy/SKILL.md",
  },
]

/**
 * Create all builtin skills
 */
export function createBuiltinSkills(): Record<string, SkillDefinition> {
  const skills: Record<string, SkillDefinition> = {}

  for (const skill of BUILTIN_SKILLS) {
    skills[skill.name] = skill
  }

  return skills
}
