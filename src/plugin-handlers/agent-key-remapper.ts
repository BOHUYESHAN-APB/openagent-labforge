import { getAgentDisplayName } from "../shared/agent-display-names"

export function remapAgentKeysToDisplayNames(
  agents: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(agents)) {
    const displayName = getAgentDisplayName(key)
    const targetKey = displayName && displayName !== key
      ? displayName
      : key

    if (result[targetKey] === undefined) {
      result[targetKey] = value
      continue
    }

    // Collision guard: if a remapped display key already exists,
    // keep the existing entry and preserve this one under its original key.
    if (targetKey !== key && result[key] === undefined) {
      result[key] = value
    }
  }

  return result
}
