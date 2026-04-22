export const BUILTIN_COMMAND_ALIAS_MAP = {
  "compress-context": "ol-compress-context",
  checkpoint: "ol-checkpoint",
  "checkpoint-resume": "ol-checkpoint-resume",
  "init-deep": "ol-init-deep",
  "ralph-loop": "ol-ralph-loop",
  "cancel-ralph": "ol-cancel-ralph",
  "ulw-loop": "ol-ulw-loop",
  refactor: "ol-refactor",
  "start-work": "ol-start-work",
  "stop-continuation": "ol-stop-continuation",
  "remove-ai-slops": "ol-remove-ai-slops",
  "todo-clear": "ol-todo-clear",
  "workflow-reset": "ol-workflow-reset",
  "focus-chat": "ol-focus-chat",
  handoff: "ol-handoff",
  "swarm-start": "ol-swarm-start",
  "ol-settings": "ol-settings",
  "ol-settings-image-bus": "ol-settings-image-bus",
} as const

export type LegacyBuiltinCommandName = keyof typeof BUILTIN_COMMAND_ALIAS_MAP
export type CanonicalBuiltinCommandName = (typeof BUILTIN_COMMAND_ALIAS_MAP)[LegacyBuiltinCommandName]
export type SupportedBuiltinCommandName = LegacyBuiltinCommandName | CanonicalBuiltinCommandName

const CANONICAL_TO_LEGACY_MAP = Object.fromEntries(
  Object.entries(BUILTIN_COMMAND_ALIAS_MAP).map(([legacy, canonical]) => [canonical, legacy]),
) as Record<CanonicalBuiltinCommandName, LegacyBuiltinCommandName>

export function normalizeBuiltinCommandName(name: string | undefined): CanonicalBuiltinCommandName | undefined {
  if (!name) return undefined

  const trimmed = name.replace(/^\//, "").trim().toLowerCase() as SupportedBuiltinCommandName
  if (trimmed in BUILTIN_COMMAND_ALIAS_MAP) {
    return BUILTIN_COMMAND_ALIAS_MAP[trimmed as LegacyBuiltinCommandName]
  }

  const canonical = Object.values(BUILTIN_COMMAND_ALIAS_MAP).find((value) => value === trimmed)
  return canonical
}

export function getBuiltinCommandAliases(canonical: CanonicalBuiltinCommandName): string[] {
  const legacy = CANONICAL_TO_LEGACY_MAP[canonical]
  if (!legacy || legacy === canonical) {
    return [canonical]
  }
  return [canonical, legacy]
}

export function buildBuiltinCommandPattern(canonical: CanonicalBuiltinCommandName): RegExp {
  const aliases = getBuiltinCommandAliases(canonical)
    .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")
  return new RegExp(`^/?(?:${aliases})\\s*`, "i")
}
