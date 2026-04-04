import { getAgentConfigKey } from "../shared/agent-display-names"

const AGENT_PRIORITY_ORDER = [
  "sisyphus",
  "wase",
  "hephaestus",
  "prometheus",
  "atlas",
  "oracle",
  "librarian",
  "explore",
  "github-scout",
  "tech-scout",
  "bio-orchestrator",
  "bio-methodologist",
  "wet-lab-designer",
  "bio-pipeline-operator",
  "paper-evidence-synthesizer",
  "multimodal-looker",
  "article-writer",
  "scientific-writer",
  "metis",
  "momus",
  "sisyphus-junior",
  "build",
  "plan",
]

const AGENT_PRIORITY_INDEX = new Map(
  AGENT_PRIORITY_ORDER.map((name, index) => [name, index]),
)

export function reorderAgentsByPriority(
  agents: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(agents).sort(([aKey], [bKey]) => {
      const aPriority = AGENT_PRIORITY_INDEX.get(getAgentConfigKey(aKey)) ?? Number.MAX_SAFE_INTEGER
      const bPriority = AGENT_PRIORITY_INDEX.get(getAgentConfigKey(bKey)) ?? Number.MAX_SAFE_INTEGER

      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      return 0
    }),
  )
}
