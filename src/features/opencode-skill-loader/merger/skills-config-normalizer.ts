import type { SkillsConfig, SkillDefinition } from "../../../config/schema"

export function normalizeSkillsConfig(config: SkillsConfig | undefined): {
  bundle?: "full" | "paper" | "bio"
  sources: Array<string | { path: string; recursive?: boolean; glob?: string }>
  enable: string[]
  disable: string[]
  entries: Record<string, boolean | SkillDefinition>
} {
  if (!config) {
    return { bundle: "bio", sources: [], enable: [], disable: [], entries: {} }
  }

  if (Array.isArray(config)) {
    return { bundle: undefined, sources: [], enable: config, disable: [], entries: {} }
  }

  const { bundle, sources = [], enable = [], disable = [], ...entries } = config
  const shouldDefaultBioBundle =
    bundle === undefined &&
    sources.length === 0 &&
    enable.length === 0 &&
    disable.length === 0 &&
    Object.keys(entries).length === 0

  return {
    bundle: shouldDefaultBioBundle ? "bio" : bundle,
    sources,
    enable,
    disable,
    entries,
  }
}
