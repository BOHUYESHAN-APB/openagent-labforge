import { getAgentConfigKey, stripInvisibleAgentCharacters } from "./agent-display-names"

/**
 * Agent tool restrictions for session.prompt calls.
 * OpenCode SDK's session.prompt `tools` parameter expects boolean values.
 * true = tool allowed, false = tool denied.
 */

const EXPLORATION_AGENT_DENYLIST: Record<string, boolean> = {
  write: false,
  edit: false,
  task: false,
  call_omo_agent: false,
}

const WRITING_AGENT_DENYLIST: Record<string, boolean> = {
  task: false,
  call_omo_agent: false,
}

const AGENT_RESTRICTIONS: Record<string, Record<string, boolean>> = {
  explore: EXPLORATION_AGENT_DENYLIST,

  librarian: EXPLORATION_AGENT_DENYLIST,

  "github-scout": EXPLORATION_AGENT_DENYLIST,

  "tech-scout": EXPLORATION_AGENT_DENYLIST,

  "article-writer": WRITING_AGENT_DENYLIST,

  "scientific-writer": WRITING_AGENT_DENYLIST,

  "bio-orchestrator": {
    call_omo_agent: false,
  },

  "bio-methodologist": EXPLORATION_AGENT_DENYLIST,

  "wet-lab-designer": EXPLORATION_AGENT_DENYLIST,

  "bio-pipeline-operator": WRITING_AGENT_DENYLIST,

  "paper-evidence-synthesizer": EXPLORATION_AGENT_DENYLIST,

  oracle: {
    write: false,
    edit: false,
    task: false,
    call_omo_agent: false,
  },

  metis: {
    write: false,
    edit: false,
    task: false,
  },

  momus: {
    write: false,
    edit: false,
    task: false,
  },

  "multimodal-looker": {
    read: true,
  },

  "sisyphus-junior": {
    task: false,
  },

  wase: {
    call_omo_agent: false,
  },
}

export function getAgentToolRestrictions(agentName: string): Record<string, boolean> {
  const stripped = stripInvisibleAgentCharacters(agentName)
  const configKey = getAgentConfigKey(stripped)
  return AGENT_RESTRICTIONS[configKey]
    ?? Object.entries(AGENT_RESTRICTIONS).find(([key]) => key.toLowerCase() === configKey.toLowerCase())?.[1]
    ?? {}
}

export function hasAgentToolRestrictions(agentName: string): boolean {
  const stripped = stripInvisibleAgentCharacters(agentName)
  const configKey = getAgentConfigKey(stripped)
  const restrictions = AGENT_RESTRICTIONS[configKey]
    ?? Object.entries(AGENT_RESTRICTIONS).find(([key]) => key.toLowerCase() === configKey.toLowerCase())?.[1]
  return restrictions !== undefined && Object.keys(restrictions).length > 0
}
