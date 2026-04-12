import type { LoadedSkill } from "./types"

function readMetadataFlag(
  metadata: Record<string, unknown> | undefined,
  key: string,
): boolean {
  const value = metadata?.[key]
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return normalized === "true" || normalized === "1" || normalized === "yes"
  }
  return false
}

export function isSkillHiddenFromDiscovery(
  skill: Pick<LoadedSkill, "metadata">,
): boolean {
  return readMetadataFlag(
    skill.metadata as Record<string, unknown> | undefined,
    "discovery_hidden",
  )
}

export function filterDiscoveryVisibleSkills<
  T extends Pick<LoadedSkill, "metadata">,
>(skills: T[]): T[] {
  return skills.filter((skill) => !isSkillHiddenFromDiscovery(skill))
}
