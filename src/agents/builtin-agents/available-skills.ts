import type { AvailableSkill } from "../dynamic-agent-prompt-builder"
import type { BrowserAutomationProvider } from "../../config/schema"
import type { LoadedSkill, SkillScope } from "../../features/opencode-skill-loader/types"
import { createBuiltinSkills } from "../../features/builtin-skills"
import { isSkillHiddenFromDiscovery } from "../../features/opencode-skill-loader"

function mapScopeToLocation(scope: SkillScope): AvailableSkill["location"] {
  if (scope === "user" || scope === "opencode") return "user"
  if (scope === "project" || scope === "opencode-project") return "project"
  return "plugin"
}

export function buildAvailableSkills(
  discoveredSkills: LoadedSkill[],
  browserProvider?: BrowserAutomationProvider,
  disabledSkills?: Set<string>
): AvailableSkill[] {
  const builtinSkills = createBuiltinSkills({ browserProvider, disabledSkills })
  const builtinSkillNames = new Set(builtinSkills.map(s => s.name))

  const builtinAvailable: AvailableSkill[] = builtinSkills.map((skill) => ({
    name: skill.name,
    description: skill.description,
    location: "plugin" as const,
  }))

  const discoveredAvailable: AvailableSkill[] = discoveredSkills
    .filter(s => !builtinSkillNames.has(s.name) && !disabledSkills?.has(s.name))
    .filter((skill) => !isSkillHiddenFromDiscovery(skill))
    .map((skill) => ({
      name: skill.name,
      description: skill.definition.description ?? "",
      location: mapScopeToLocation(skill.scope),
    }))

  return [...builtinAvailable, ...discoveredAvailable]
}
