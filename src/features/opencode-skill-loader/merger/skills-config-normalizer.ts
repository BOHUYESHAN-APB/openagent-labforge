import type { SkillsConfig, SkillDefinition } from "../../../config/schema"

export function normalizeSkillsConfig(config: SkillsConfig | undefined): {
  bundle?: "full" | "paper"
  sources: Array<string | { path: string; recursive?: boolean; glob?: string }>
  enable: string[]
  disable: string[]
  entries: Record<string, boolean | SkillDefinition>
} {
  if (!config) {
    return { bundle: undefined, sources: [], enable: [], disable: [], entries: {} }
  }

  if (Array.isArray(config)) {
    return { bundle: undefined, sources: [], enable: config, disable: [], entries: {} }
  }

  const { bundle, sources = [], enable = [], disable = [], ...entries } = config
  return { bundle, sources, enable, disable, entries }
}
